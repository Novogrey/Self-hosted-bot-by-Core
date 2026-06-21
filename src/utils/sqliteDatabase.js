const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const {
  AttachmentBuilder,
  ContainerBuilder,
  FileBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
  resolveColor
} = require('discord.js');

function resolvePath(value, fallbackBase = process.cwd()) {
  if (!value) return '';
  return path.isAbsolute(value) ? value : path.resolve(fallbackBase, value);
}

const DEFAULT_DB_DIR = process.env.CORE_DATA_DIR
  ? resolvePath(process.env.CORE_DATA_DIR)
  : path.join(__dirname, '..', '..', 'data');
const DB_PATH = process.env.SQLITE_DB_PATH
  ? resolvePath(process.env.SQLITE_DB_PATH)
  : path.join(DEFAULT_DB_DIR, 'core.sqlite');
const DB_DIR = path.dirname(DB_PATH);
const SQL_BACKUP_CHANNEL_ID = process.env.SQL_BACKUP_CHANNEL_ID || '1500201054539878553';
const SQL_BACKUP_DEBOUNCE_MS = Math.max(250, Number(process.env.SQL_BACKUP_DEBOUNCE_MS || 1500));
const SQL_BACKUP_ENABLED = !['0', 'false', 'no', 'off'].includes(
  String(process.env.SQL_BACKUP_ENABLED ?? 'true').trim().toLowerCase()
);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let sqlBackupClient = null;
let sqlBackupTimer = null;
let sqlBackupRunning = false;
let sqlBackupQueued = false;
let sqlBackupReadyHookInstalled = false;

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(value) {
  const date = new Date(value || Date.now());
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function createZipArchive(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const data = fs.readFileSync(entry.path);
    const checksum = crc32(data);
    const stamp = dosDateTime(entry.mtime);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(stamp.time, 10);
    localHeader.writeUInt16LE(stamp.date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(stamp.time, 12);
    centralHeader.writeUInt16LE(stamp.date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function collectSqlBackupEntries() {
  const allowed = /\.(?:db|sqlite|sqlite3|sql)(?:-(?:wal|shm))?$/i;
  return fs.readdirSync(DB_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && allowed.test(entry.name))
    .map((entry) => {
      const filePath = path.join(DB_DIR, entry.name);
      const stat = fs.statSync(filePath);
      return {
        path: filePath,
        name: `data/${entry.name}`,
        size: stat.size,
        mtime: stat.mtime
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function archiveFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `core-sql-${stamp}.zip`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
}

function buildSqlBackupComponents(fileName, entries, reason) {
  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
  const fileList = entries
    .map((entry) => `- ${entry.name} (${formatBytes(entry.size)})`)
    .join('\n');

  const container = new ContainerBuilder()
    .setAccentColor(resolveColor('#44B8DE'))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('# SQLite backup'))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `Reason: ${reason}`,
      `Files: ${entries.length}`,
      `Size: ${formatBytes(totalSize)}`,
      `Created: <t:${Math.floor(Date.now() / 1000)}:f>`
    ].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(fileList || '- No SQL files found.'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addFileComponents(new FileBuilder({ file: { url: `attachment://${fileName}` } }));

  return [container];
}

async function sendSqlBackupArchive(reason = 'sql-change') {
  if (!SQL_BACKUP_ENABLED || !sqlBackupClient) return false;

  if (!sqlBackupClient.isReady?.()) {
    sqlBackupQueued = true;
    return false;
  }

  if (sqlBackupRunning) {
    sqlBackupQueued = true;
    return false;
  }

  sqlBackupRunning = true;
  try {
    if (dbInstance?.db) {
      dbInstance.db.pragma('wal_checkpoint(FULL)');
    }

    const entries = collectSqlBackupEntries();
    if (!entries.length) return false;

    const fileName = archiveFileName();
    const archive = createZipArchive(entries);
    const channel = await sqlBackupClient.channels.fetch(SQL_BACKUP_CHANNEL_ID).catch((error) => {
      console.warn(`[${new Date().toISOString()}] Failed to fetch SQL backup channel ${SQL_BACKUP_CHANNEL_ID}: ${error.message}`);
      return null;
    });

    if (!channel?.isTextBased?.()) return false;

    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      files: [new AttachmentBuilder(archive, { name: fileName })],
      allowedMentions: { parse: [] },
      components: buildSqlBackupComponents(fileName, entries, reason)
    });

    return true;
  } catch (error) {
    console.warn(`[${new Date().toISOString()}] Failed to send SQL backup archive: ${error.message}`);
    return false;
  } finally {
    sqlBackupRunning = false;
    if (sqlBackupQueued) {
      sqlBackupQueued = false;
      scheduleSqlBackup('queued-sql-change');
    }
  }
}

function scheduleSqlBackup(reason = 'sql-change') {
  if (!SQL_BACKUP_ENABLED || !sqlBackupClient) return;

  if (sqlBackupTimer) {
    clearTimeout(sqlBackupTimer);
  }

  sqlBackupTimer = setTimeout(() => {
    sqlBackupTimer = null;
    void sendSqlBackupArchive(reason);
  }, SQL_BACKUP_DEBOUNCE_MS);
}

function configureSqlBackupClient(client) {
  sqlBackupClient = client;
  if (!sqlBackupReadyHookInstalled && client?.once) {
    sqlBackupReadyHookInstalled = true;
    client.once('clientReady', () => {
      if (sqlBackupQueued) {
        sqlBackupQueued = false;
        scheduleSqlBackup('queued-before-ready');
      }
    });
  }
}

class CoreDatabase {
  constructor() {
    this.db = null;
    this.ready = false;
    this.transactionDepth = 0;
    this.transactionChanged = false;
  }

  /**
   * Initialize database connection and create tables if needed
   */
  async initialize() {
    try {
      this.db = new Database(DB_PATH);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('busy_timeout = 5000');
      
      await this.createTables();
      this.ready = true;
    } catch (error) {
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Create tables if they don't exist
   */
  async createTables() {
    try {
      this.db.exec('PRAGMA user_version = 1');
    } catch (error) {
      throw new Error(`Failed to create tables: ${error.message}`);
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }

  /**
   * Run SQL statement with parameters
   */
  async run(sql, params = []) {
    try {
      if (!this.db) throw new Error('Database not initialized');
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      if (result.changes > 0) {
        if (this.transactionDepth > 0) {
          this.transactionChanged = true;
        } else {
          scheduleSqlBackup('sql-change');
        }
      }
      return { id: result.lastInsertRowid, changes: result.changes };
    } catch (error) {
      throw new Error(`Database run error: ${error.message}`);
    }
  }

  /**
   * Get single row
   */
  async get(sql, params = []) {
    try {
      if (!this.db) throw new Error('Database not initialized');
      const stmt = this.db.prepare(sql);
      return stmt.get(...params) || null;
    } catch (error) {
      throw new Error(`Database get error: ${error.message}`);
    }
  }

  /**
   * Get all rows
   */
  async all(sql, params = []) {
    try {
      if (!this.db) throw new Error('Database not initialized');
      const stmt = this.db.prepare(sql);
      return stmt.all(...params) || [];
    } catch (error) {
      throw new Error(`Database all error: ${error.message}`);
    }
  }

  /**
   * Execute multiple statements in transaction
   */
  async transaction(fn) {
    try {
      this.transactionDepth += 1;
      this.db.exec('BEGIN TRANSACTION');
      const result = await fn(this);
      this.db.exec('COMMIT');
      this.transactionDepth = Math.max(0, this.transactionDepth - 1);
      if (this.transactionDepth === 0 && this.transactionChanged) {
        this.transactionChanged = false;
        scheduleSqlBackup('sql-transaction');
      }
      return result;
    } catch (error) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        // Ignore rollback failures and rethrow the original error.
      }
      this.transactionDepth = Math.max(0, this.transactionDepth - 1);
      if (this.transactionDepth === 0) {
        this.transactionChanged = false;
      }
      throw error;
    }
  }
}

// Singleton instance
let dbInstance = null;

async function getDatabase() {
  if (!dbInstance) {
    dbInstance = new CoreDatabase();
    await dbInstance.initialize();
  }
  return dbInstance;
}

module.exports = {
  configureSqlBackupClient,
  getDatabase,
  CoreDatabase,
  DB_PATH
};
