const { EventEmitter } = require('events');
const crypto = require('crypto');
const { getDatabase } = require('./sqliteDatabase');

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

let initialized = false;
let backingDatabase = null;

function createId() {
  return crypto.randomBytes(12).toString('hex');
}

function looksLikeDateKey(key) {
  return /(?:At|Time|Date|expires|timestamp)$/i.test(String(key || ''));
}

function reviveDocumentValue(key, value) {
  if (typeof value === 'string' && ISO_DATE_RE.test(value) && looksLikeDateKey(key)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return value;
}

function parseDocument(json) {
  return JSON.parse(json || '{}', reviveDocumentValue);
}

function toPlainObject(value) {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(toPlainObject);

  const output = {};
  for (const key of Object.keys(value)) {
    if (key.startsWith('__')) continue;
    if (typeof value[key] === 'function') continue;
    output[key] = toPlainObject(value[key]);
  }
  return output;
}

function clonePlain(value) {
  return parseDocument(JSON.stringify(toPlainObject(value)));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function hasOperatorObject(value) {
  return isPlainObject(value) && Object.keys(value).some((key) => key.startsWith('$'));
}

function comparable(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return value;
}

function valuesAtPath(source, path) {
  const parts = String(path || '').split('.').filter(Boolean);

  function walk(value, index) {
    if (index >= parts.length) return [value];
    if (Array.isArray(value)) return value.flatMap((item) => walk(item, index));
    if (!value || typeof value !== 'object') return [undefined];
    return walk(value[parts[index]], index + 1);
  }

  return walk(source, 0);
}

function valueEquals(left, right) {
  const a = comparable(left);
  const b = comparable(right);

  if (a instanceof Date || b instanceof Date) {
    return comparable(a) === comparable(b);
  }

  if (isPlainObject(a) || Array.isArray(a) || isPlainObject(b) || Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return a === b;
}

function compareValues(left, right) {
  const a = comparable(left);
  const b = comparable(right);
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  return a > b ? 1 : -1;
}

function matchesOperator(values, operator, expected) {
  if (operator === '$exists') {
    const exists = values.some((value) => value !== undefined);
    return Boolean(expected) ? exists : !exists;
  }

  if (operator === '$ne') {
    return !values.some((value) => valueEquals(value, expected));
  }

  if (operator === '$in') {
    const expectedValues = Array.isArray(expected) ? expected : [expected];
    return values.some((value) => expectedValues.some((item) => valueEquals(value, item)));
  }

  if (operator === '$nin') {
    const expectedValues = Array.isArray(expected) ? expected : [expected];
    return !values.some((value) => expectedValues.some((item) => valueEquals(value, item)));
  }

  if (operator === '$lte') return values.some((value) => compareValues(value, expected) <= 0);
  if (operator === '$lt') return values.some((value) => compareValues(value, expected) < 0);
  if (operator === '$gte') return values.some((value) => compareValues(value, expected) >= 0);
  if (operator === '$gt') return values.some((value) => compareValues(value, expected) > 0);

  if (operator === '$regex') {
    const pattern = expected instanceof RegExp ? expected : new RegExp(String(expected), 'i');
    return values.some((value) => pattern.test(String(value || '')));
  }

  if (operator === '$eq') {
    return values.some((value) => valueEquals(value, expected));
  }

  return false;
}

function matchesCondition(values, condition) {
  if (hasOperatorObject(condition)) {
    return Object.entries(condition).every(([operator, expected]) => matchesOperator(values, operator, expected));
  }

  return values.some((value) => valueEquals(value, condition));
}

function matchesFilter(document, filter = {}) {
  if (!filter || !Object.keys(filter).length) return true;

  for (const [key, condition] of Object.entries(filter)) {
    if (key === '$or') {
      const filters = Array.isArray(condition) ? condition : [];
      if (!filters.some((entry) => matchesFilter(document, entry))) return false;
      continue;
    }

    if (key === '$and') {
      const filters = Array.isArray(condition) ? condition : [];
      if (!filters.every((entry) => matchesFilter(document, entry))) return false;
      continue;
    }

    if (!matchesCondition(valuesAtPath(document, key), condition)) return false;
  }

  return true;
}

function setPath(target, path, value) {
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length) return;

  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!isPlainObject(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }

  cursor[parts[parts.length - 1]] = value;
}

function unsetPath(target, path) {
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length) return;

  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    cursor = cursor?.[parts[index]];
    if (!cursor || typeof cursor !== 'object') return;
  }

  delete cursor[parts[parts.length - 1]];
}

function getPath(target, path) {
  return valuesAtPath(target, path)[0];
}

function seedFromFilter(filter = {}) {
  const seed = {};
  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith('$') || hasOperatorObject(value)) continue;
    setPath(seed, key, value);
  }
  return seed;
}

function applyUpdate(document, update = {}, { isInsert = false } = {}) {
  const hasOperators = Object.keys(update || {}).some((key) => key.startsWith('$'));

  if (!hasOperators) {
    Object.assign(document, clonePlain(update));
  } else {
    for (const [key, value] of Object.entries(update.$set || {})) {
      setPath(document, key, clonePlain(value));
    }

    if (isInsert) {
      for (const [key, value] of Object.entries(update.$setOnInsert || {})) {
        setPath(document, key, clonePlain(value));
      }
    }

    for (const [key, value] of Object.entries(update.$inc || {})) {
      setPath(document, key, Number(getPath(document, key) || 0) + Number(value || 0));
    }

    for (const [key, value] of Object.entries(update.$push || {})) {
      const list = Array.isArray(getPath(document, key)) ? getPath(document, key) : [];
      list.push(clonePlain(value));
      setPath(document, key, list);
    }

    for (const [key, value] of Object.entries(update.$addToSet || {})) {
      const list = Array.isArray(getPath(document, key)) ? getPath(document, key) : [];
      if (!list.some((item) => valueEquals(item, value))) list.push(clonePlain(value));
      setPath(document, key, list);
    }

    for (const [key, value] of Object.entries(update.$pull || {})) {
      const list = Array.isArray(getPath(document, key)) ? getPath(document, key) : [];
      setPath(document, key, list.filter((item) => !matchesCondition([item], value)));
    }

    for (const key of Object.keys(update.$unset || {})) {
      unsetPath(document, key);
    }
  }

  return document;
}

async function ensureDocumentStore() {
  const db = await getDatabase();
  if (!initialized) {
    db.db.exec(`
      CREATE TABLE IF NOT EXISTS bot_documents (
        model TEXT NOT NULL,
        id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (model, id)
      );
      CREATE INDEX IF NOT EXISTS idx_bot_documents_model_updated ON bot_documents(model, updated_at);
    `);
    initialized = true;
  }

  backingDatabase = db;
  return db;
}

class SqlQuery {
  constructor(executor, { single = false, model = null } = {}) {
    this.executor = executor;
    this.single = single;
    this.model = model;
    this.sortSpec = null;
    this.limitValue = null;
    this.leanMode = false;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  limit(value) {
    this.limitValue = Number(value);
    return this;
  }

  lean() {
    this.leanMode = true;
    return this;
  }

  async exec() {
    let result = await this.executor();
    if (!Array.isArray(result)) result = result ? [result] : [];

    if (this.sortSpec) {
      const entries = Object.entries(this.sortSpec);
      result = result.slice().sort((left, right) => {
        for (const [path, direction] of entries) {
          const comparison = compareValues(getPath(left, path), getPath(right, path));
          if (comparison !== 0) return comparison * (Number(direction) < 0 ? -1 : 1);
        }
        return 0;
      });
    }

    if (Number.isFinite(this.limitValue) && this.limitValue >= 0) {
      result = result.slice(0, this.limitValue);
    }

    const hydrate = (item) => (this.leanMode || !this.model ? clonePlain(item) : new this.model(item));
    if (this.single) return result[0] ? hydrate(result[0]) : null;
    return result.map(hydrate);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }

  finally(callback) {
    return this.exec().finally(callback);
  }
}

class SqlConnection extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    this.models = {};
    this.readyState = 1;
  }

  model(name) {
    if (!this.models[name]) {
      this.models[name] = createSqlModel(name, this);
    }

    return this.models[name];
  }

  async close() {
    this.readyState = 0;
    this.removeAllListeners();
  }
}

class SqlDocument {
  constructor(model, data = {}) {
    Object.defineProperty(this, '__model', {
      value: model,
      enumerable: false,
      writable: false
    });

    Object.assign(this, clonePlain(data));
    if (!this._id) this._id = createId();
    if (!this.createdAt) this.createdAt = new Date();
  }

  async save() {
    await this.__model.saveDocument(this);
    return this;
  }

  toObject() {
    return clonePlain(this);
  }

  toJSON() {
    return this.toObject();
  }
}

function createSqlModel(modelName, connection) {
  return class Model extends SqlDocument {
    constructor(data = {}) {
      super(Model, data);
    }

    static get modelName() {
      return modelName;
    }

    static async allPlain() {
      const rows = await connection.db.all(
        'SELECT data_json FROM bot_documents WHERE model = ?',
        [modelName]
      );
      return rows.map((row) => parseDocument(row.data_json));
    }

    static async savePlain(document) {
      const now = new Date();
      const plain = clonePlain(document);
      if (!plain._id) plain._id = createId();
      if (!plain.createdAt) plain.createdAt = now;
      plain.updatedAt = now;

      await connection.db.run(
        `INSERT INTO bot_documents (model, id, data_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(model, id) DO UPDATE SET
           data_json = excluded.data_json,
           updated_at = excluded.updated_at`,
        [
          modelName,
          String(plain._id),
          JSON.stringify(plain),
          new Date(plain.createdAt).toISOString(),
          now.toISOString()
        ]
      );

      return plain;
    }

    static async saveDocument(document) {
      const saved = await Model.savePlain(document);
      Object.assign(document, saved);
      return document;
    }

    static find(filter = {}) {
      return new SqlQuery(async () => {
        const docs = await Model.allPlain();
        return docs.filter((document) => matchesFilter(document, filter));
      }, { model: Model });
    }

    static findOne(filter = {}) {
      return new SqlQuery(async () => {
        const docs = await Model.allPlain();
        return docs.filter((document) => matchesFilter(document, filter));
      }, { single: true, model: Model });
    }

    static findById(id) {
      return Model.findOne({ _id: String(id) });
    }

    static async create(data) {
      if (Array.isArray(data)) {
        const documents = [];
        for (const item of data) documents.push(await Model.create(item));
        return documents;
      }

      const document = new Model(data);
      await document.save();
      return document;
    }

    static async deleteOne(filter = {}) {
      const doc = await Model.findOne(filter).lean();
      if (!doc?._id) return { acknowledged: true, deletedCount: 0 };

      await connection.db.run(
        'DELETE FROM bot_documents WHERE model = ? AND id = ?',
        [modelName, String(doc._id)]
      );
      return { acknowledged: true, deletedCount: 1 };
    }

    static async deleteMany(filter = {}) {
      const docs = await Model.find(filter).lean();
      for (const doc of docs) {
        await connection.db.run(
          'DELETE FROM bot_documents WHERE model = ? AND id = ?',
          [modelName, String(doc._id)]
        );
      }
      return { acknowledged: true, deletedCount: docs.length };
    }

    static async updateOne(filter = {}, update = {}, options = {}) {
      const result = await Model.findOneAndUpdate(filter, update, options);
      return {
        acknowledged: true,
        matchedCount: result ? 1 : 0,
        modifiedCount: result ? 1 : 0,
        upsertedCount: result && options.upsert ? 1 : 0
      };
    }

    static async updateMany(filter = {}, update = {}) {
      const docs = await Model.find(filter).lean();
      for (const doc of docs) {
        const updated = applyUpdate(doc, update);
        await Model.savePlain(updated);
      }
      return { acknowledged: true, matchedCount: docs.length, modifiedCount: docs.length };
    }

    static findOneAndUpdate(filter = {}, update = {}, options = {}) {
      return new SqlQuery(async () => {
        const docs = await Model.allPlain();
        let document = docs.find((entry) => matchesFilter(entry, filter));
        const isInsert = !document;

        if (!document) {
          if (!options.upsert) return null;
          document = seedFromFilter(filter);
        }

        applyUpdate(document, update, { isInsert });
        if (!document._id) document._id = createId();
        const saved = await Model.savePlain(document);
        return saved;
      }, { single: true, model: Model });
    }

    static async findOneAndDelete(filter = {}) {
      const doc = await Model.findOne(filter);
      if (!doc) return null;
      await Model.deleteOne({ _id: doc._id });
      return doc;
    }

    static async countDocuments(filter = {}) {
      const docs = await Model.find(filter).lean();
      return docs.length;
    }

    static async estimatedDocumentCount() {
      const row = await connection.db.get(
        'SELECT COUNT(*) AS count FROM bot_documents WHERE model = ?',
        [modelName]
      );
      return Number(row?.count || 0);
    }

    static async exists(filter = {}) {
      const doc = await Model.findOne(filter).lean();
      return doc ? { _id: doc._id } : null;
    }
  };
}

async function createSqlConnection() {
  const db = await ensureDocumentStore();
  return new SqlConnection(db);
}

module.exports = {
  createSqlConnection,
  ensureDocumentStore,
  matchesFilter,
  backingDatabase: () => backingDatabase
};
