const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const zlib = require('zlib');

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=192');

const appRoot = app.isPackaged ? app.getAppPath() : path.resolve(__dirname, '..');
const runtimeRoot = app.isPackaged ? app.getPath('userData') : appRoot;
const botProcessCwd = runtimeRoot;
const envPath = path.join(runtimeRoot, '.env');
const dataDir = path.join(runtimeRoot, 'data');
const defaultDisabledCommands = new Set();
const MAX_LOG_LINES = 300;
const SUPPORT_SERVER_URL = 'https://discord.gg/YF8krDPCZh';
const HOSTING_EXPORT_ENV_KEYS = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
  'DEV',
  'ADMIN_LOG_CHANNEL_ID',
  'LOG_CHANNEL_ID',
  'NOTIFICATION',
  'MUTE_ROLE',
  'ADMIN_ROLES_LEVEL_0',
  'ADMIN_ROLES_LEVEL_1',
  'ADMIN_ROLES_LEVEL_2',
  'ADMIN_ROLES_LEVEL_3',
  'ADMIN_ROLES_LEVEL_4',
  'SQLITE_DB_PATH',
  'DISABLED_COMMAND_CATEGORIES',
  'DISABLED_COMMANDS',
  'LEVELS_ENABLED',
  'VOICE_TRACKING_ENABLED',
  'LEVEL_ROLE_MAP',
  'MODERATION_SWEEP_INTERVAL_MS',
  'WARN_PUNISHMENTS',
  'AUTOMOD_ENABLED',
  'AUTOMOD_DELETE_MESSAGE',
  'AUTOMOD_WARN_USER',
  'AUTOMOD_IGNORE_ADMINISTRATORS',
  'AUTOMOD_LOG_CHANNEL_ID',
  'AUTOMOD_BYPASS_ROLE_IDS',
  'AUTOMOD_PING_ENABLED',
  'AUTOMOD_PING_MAX_MENTIONS',
  'AUTOMOD_BAD_WORDS_ENABLED',
  'AUTOMOD_BAD_WORDS',
  'AUTOMOD_LINKS_ENABLED',
  'AUTOMOD_LINKS_BLOCK_INVITES',
  'AUTOMOD_LINKS_BLOCK_ALL',
  'AUTOMOD_LINKS_ALLOWED_DOMAINS',
  'AUTOMOD_SPAM_ENABLED',
  'AUTOMOD_SPAM_MESSAGE_LIMIT',
  'AUTOMOD_SPAM_TIME_WINDOW_MS',
  'BOT_STATUS',
  'BOT_ACTIVITY_TYPE',
  'BOT_ACTIVITY_TEXT',
  'WELCOME_DM_ENABLED',
  'WELCOME_DM_JSON',
  'WELCOME_SERVER_ENABLED',
  'WELCOME_SERVER_CHANNEL_ID',
  'WELCOME_SERVER_JSON',
  'SQL_BACKUP_ENABLED',
  'SQL_BACKUP_CHANNEL_ID',
  'SQL_BACKUP_DEBOUNCE_MS'
];
const COMMAND_DESCRIPTIONS = {
  'bot-block': 'Глобальная блокировка доступа к публичным командам бота по Discord ID.',
  clear_databases: 'Очищает локальные SQLite-записи пользователей, которых уже нет на сервере.',
  refreshcommands: 'Перерегистрирует slash-команды Discord для выбранного сервера.',
  reload: 'Перезапускает runtime бота из Discord-команды разработчика.',
  say: 'Отправляет сообщение от имени бота в выбранный канал.',
  shutdown: 'Корректно останавливает процесс бота.',
  'welcome-preview': 'Показывает превью приветственного сообщения.',
  reset: 'Сбрасывает уровень, опыт или voice-время участника.',
  setlevel: 'Устанавливает уровень или опыт участника вручную.',
  top: 'Показывает лидерборд уровней или voice-активности.',
  ban: 'Выдаёт временный или постоянный бан участнику.',
  clear: 'Удаляет выбранное количество сообщений в канале.',
  clearwarns: 'Очищает предупреждения участника или всего сервера.',
  kick: 'Кикает участника с сервера.',
  mute: 'Выдаёт временный или постоянный мут.',
  remwarn: 'Удаляет конкретные предупреждения по ID.',
  slowmode: 'Настраивает медленный режим в канале.',
  unban: 'Снимает бан с пользователя.',
  unmute: 'Снимает мут с участника.',
  warn: 'Выдаёт предупреждение и применяет наказания по правилам варнов.',
  warns: 'Показывает предупреждения участника.',
  levels: 'Показывает карточку уровня участника.',
  help: 'Показывает список команд и памятку по уровням AdminRole.'
};

let mainWindow = null;
let botProcess = null;
let botStatus = 'stopped';
let logBuffer = [];

function ensureRuntimeFiles() {
  fs.mkdirSync(runtimeRoot, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(envPath)) {
    const examplePath = path.join(appRoot, '.env.example');
    const example = fs.existsSync(examplePath) ? fs.readFileSync(examplePath, 'utf8') : '';
    fs.writeFileSync(envPath, example, 'utf8');
  }
}

function parseEnv(content) {
  const env = {};
  for (const line of String(content || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function serializeEnv(nextEnv) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = existing.split(/\r?\n/);
  const seen = new Set();
  const output = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      if (trimmed) output.push(line);
      continue;
    }

    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    if (Object.prototype.hasOwnProperty.call(nextEnv, key)) {
      output.push(`${key}=${nextEnv[key] ?? ''}`);
      seen.add(key);
    } else {
      output.push(line);
    }
  }

  for (const [key, value] of Object.entries(nextEnv)) {
    if (!seen.has(key)) output.push(`${key}=${value ?? ''}`);
  }

  return `${output.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
}

function loadEnv() {
  ensureRuntimeFiles();
  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  return {
    SQLITE_DB_PATH: 'data/core.sqlite',
    DISABLED_COMMAND_CATEGORIES: 'global',
    DISABLED_COMMANDS: '',
    LEVELS_ENABLED: 'true',
    VOICE_TRACKING_ENABLED: 'true',
    SQL_BACKUP_ENABLED: 'true',
    SQL_BACKUP_DEBOUNCE_MS: '1500',
    MODERATION_SWEEP_INTERVAL_MS: '60000',
    WARN_PUNISHMENTS: '2:mute:30m,4:mute:2h,6:mute:5h,7:mute:10h,8:ban:1d,10:ban:10d,12:ban:31d,14:ban:183d,16:ban:365d',
    AUTOMOD_ENABLED: 'true',
    AUTOMOD_DELETE_MESSAGE: 'true',
    AUTOMOD_WARN_USER: 'true',
    AUTOMOD_IGNORE_ADMINISTRATORS: 'true',
    AUTOMOD_LOG_CHANNEL_ID: '',
    AUTOMOD_BYPASS_ROLE_IDS: '',
    AUTOMOD_PING_ENABLED: 'true',
    AUTOMOD_PING_MAX_MENTIONS: '5',
    AUTOMOD_BAD_WORDS_ENABLED: 'false',
    AUTOMOD_BAD_WORDS: '',
    AUTOMOD_LINKS_ENABLED: 'true',
    AUTOMOD_LINKS_BLOCK_INVITES: 'true',
    AUTOMOD_LINKS_BLOCK_ALL: 'false',
    AUTOMOD_LINKS_ALLOWED_DOMAINS: '',
    AUTOMOD_SPAM_ENABLED: 'true',
    AUTOMOD_SPAM_MESSAGE_LIMIT: '5',
    AUTOMOD_SPAM_TIME_WINDOW_MS: '60000',
    BOT_STATUS: 'online',
    BOT_ACTIVITY_TYPE: 'Watching',
    BOT_ACTIVITY_TEXT: 'self-hosted moderation',
    WELCOME_DM_ENABLED: 'false',
    WELCOME_DM_JSON: '',
    WELCOME_SERVER_ENABLED: 'false',
    WELCOME_SERVER_CHANNEL_ID: '',
    WELCOME_SERVER_JSON: '',
    ...env
  };
}

function compactJsonEnvValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    return JSON.stringify(JSON.parse(raw));
  } catch {
    return raw.replace(/\r?\n/g, '\\n');
  }
}

function saveEnv(env) {
  ensureRuntimeFiles();
  const nextEnv = { ...(env || {}) };
  nextEnv.WELCOME_DM_JSON = compactJsonEnvValue(nextEnv.WELCOME_DM_JSON);
  nextEnv.WELCOME_SERVER_JSON = compactJsonEnvValue(nextEnv.WELCOME_SERVER_JSON);
  for (const key of ['AUTOMOD_BAD_WORDS', 'AUTOMOD_LINKS_ALLOWED_DOMAINS', 'AUTOMOD_BYPASS_ROLE_IDS']) {
    if (Object.prototype.hasOwnProperty.call(nextEnv, key)) {
      nextEnv[key] = String(nextEnv[key] || '')
        .split(/[\r\n,;]/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .join(',');
    }
  }
  const existing = parseEnv(fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '');
  if (Object.prototype.hasOwnProperty.call(existing, 'token') && Object.prototype.hasOwnProperty.call(nextEnv, 'DISCORD_TOKEN')) {
    nextEnv.token = '';
  } else {
    delete nextEnv.token;
  }
  fs.writeFileSync(envPath, serializeEnv(nextEnv), 'utf8');
  return loadEnv();
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const safeDate = date.getFullYear() < 1980 ? new Date('1980-01-01T00:00:00Z') : date;
  const time = (safeDate.getHours() << 11) | (safeDate.getMinutes() << 5) | Math.floor(safeDate.getSeconds() / 2);
  const dosDate = ((safeDate.getFullYear() - 1980) << 9) | ((safeDate.getMonth() + 1) << 5) | safeDate.getDate();
  return { time, date: dosDate };
}

function zipLocalHeader(entry, nameBuffer, compressed) {
  const header = Buffer.alloc(30);
  const stamp = dosDateTime(entry.date);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(stamp.time, 10);
  header.writeUInt16LE(stamp.date, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(entry.data.length, 22);
  header.writeUInt16LE(nameBuffer.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}

function zipCentralHeader(entry, nameBuffer, compressed, offset) {
  const header = Buffer.alloc(46);
  const stamp = dosDateTime(entry.date);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(8, 10);
  header.writeUInt16LE(stamp.time, 12);
  header.writeUInt16LE(stamp.date, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(compressed.length, 20);
  header.writeUInt32LE(entry.data.length, 24);
  header.writeUInt16LE(nameBuffer.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  return header;
}

function writeZipArchive(entries, archivePath) {
  const files = entries
    .filter((entry) => entry?.name && Buffer.isBuffer(entry.data))
    .map((entry) => ({
      ...entry,
      name: entry.name.replace(/\\/g, '/').replace(/^\/+/, ''),
      crc: crc32(entry.data)
    }));

  let offset = 0;
  const localParts = [];
  const centralParts = [];

  for (const entry of files) {
    const nameBuffer = Buffer.from(entry.name, 'utf8');
    const compressed = zlib.deflateRawSync(entry.data);
    localParts.push(zipLocalHeader(entry, nameBuffer, compressed), nameBuffer, compressed);
    centralParts.push(zipCentralHeader(entry, nameBuffer, compressed, offset), nameBuffer);
    offset += 30 + nameBuffer.length + compressed.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  fs.writeFileSync(archivePath, Buffer.concat([...localParts, ...centralParts, end]));
  return files.length;
}

function addFileEntry(entries, sourcePath, archiveName) {
  entries.push({
    name: archiveName,
    data: fs.readFileSync(sourcePath),
    date: fs.statSync(sourcePath).mtime
  });
}

function addDirectoryEntries(entries, sourceDir, archiveRoot) {
  if (!fs.existsSync(sourceDir)) return;

  for (const item of fs.readdirSync(sourceDir)) {
    const fullPath = path.join(sourceDir, item);
    const relativeName = `${archiveRoot}/${item}`;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirectoryEntries(entries, fullPath, relativeName);
    } else if (stat.isFile()) {
      addFileEntry(entries, fullPath, relativeName);
    }
  }
}

function runtimePackageJson() {
  const source = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
  const runtimeDependencyNames = [
    '@discordjs/rest',
    'better-sqlite3',
    'canvacord',
    'chalk',
    'cheerio',
    'discord-api-types',
    'discord.js',
    'dotenv',
    'sharp'
  ];
  const dependencies = {};
  for (const name of runtimeDependencyNames) {
    if (source.dependencies?.[name]) dependencies[name] = source.dependencies[name];
  }

  return {
    name: source.name,
    version: source.version,
    description: 'Runtime-only export of Self-hosted bot by Core.',
    main: 'bot.js',
    license: 'SEE LICENSE IN LICENSE.md',
    scripts: {
      start: 'node bot.js',
      bot: 'node bot.js'
    },
    dependencies
  };
}

function serializeHostingEnv(env) {
  const lines = [];
  for (const key of HOSTING_EXPORT_ENV_KEYS) {
    lines.push(`${key}=${env[key] ?? ''}`);
  }
  return `${lines.join('\n')}\n`;
}

function hostingReadme() {
  return [
    '# Self-hosted bot by Core - hosting export',
    '',
    'Upload this archive to a Node.js hosting panel, extract it, then run:',
    '',
    '```bash',
    'npm install',
    'npm start',
    '```',
    '',
    'The `.env` file inside this archive was generated from the desktop app settings.',
    'Do not publish this archive publicly if it contains a real Discord token.',
    '',
    'Support server: https://discord.gg/YF8krDPCZh',
    ''
  ].join('\n');
}

async function exportHostingArchive(env) {
  const savedEnv = saveEnv(env || loadEnv());
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export hosting ZIP',
    defaultPath: path.join(app.getPath('downloads'), `Self-hosted-bot-by-Core-hosting-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`),
    filters: [{ name: 'ZIP archive', extensions: ['zip'] }]
  });

  if (result.canceled || !result.filePath) return { canceled: true };

  const entries = [];
  addFileEntry(entries, path.join(appRoot, 'bot.js'), 'bot.js');
  addDirectoryEntries(entries, path.join(appRoot, 'src'), 'src');
  addDirectoryEntries(entries, path.join(appRoot, 'config'), 'config');
  entries.push({
    name: '.env',
    data: Buffer.from(serializeHostingEnv(savedEnv), 'utf8'),
    date: new Date()
  });
  entries.push({
    name: '.env.example',
    data: fs.readFileSync(path.join(appRoot, '.env.example')),
    date: fs.statSync(path.join(appRoot, '.env.example')).mtime
  });
  entries.push({
    name: 'LICENSE.md',
    data: fs.readFileSync(path.join(appRoot, 'LICENSE.md')),
    date: fs.statSync(path.join(appRoot, 'LICENSE.md')).mtime
  });
  entries.push({
    name: 'package.json',
    data: Buffer.from(`${JSON.stringify(runtimePackageJson(), null, 2)}\n`, 'utf8'),
    date: new Date()
  });
  entries.push({
    name: 'README_HOSTING.md',
    data: Buffer.from(hostingReadme(), 'utf8'),
    date: new Date()
  });

  const fileCount = writeZipArchive(entries, result.filePath);
  pushLog(`Hosting ZIP exported: ${result.filePath}`, 'system');
  return { path: result.filePath, files: fileCount };
}

function commandNameFromSource(source) {
  return source.match(/\.setName\(['"`]([^'"`]+)['"`]\)/)?.[1] || '';
}

function commandDescriptionFromSource(source) {
  return source.match(/\.setDescription\(['"`]([^'"`]+)['"`]\)/)?.[1] || '';
}

function commandDescription(name, source) {
  return COMMAND_DESCRIPTIONS[name] || commandDescriptionFromSource(source);
}

function scanCommands(env = loadEnv()) {
  const commandRoot = path.join(appRoot, 'src', 'commands');
  if (!fs.existsSync(commandRoot)) return [];

  const disabledCommands = new Set([...splitList(env.DISABLED_COMMANDS), ...defaultDisabledCommands]);
  const disabledCategories = new Set(splitList(env.DISABLED_COMMAND_CATEGORIES));
  disabledCategories.add('global');

  const commands = [];
  for (const category of fs.readdirSync(commandRoot)) {
    const categoryPath = path.join(commandRoot, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const file of fs.readdirSync(categoryPath).filter((entry) => entry.endsWith('.js'))) {
      const filePath = path.join(categoryPath, file);
      const source = fs.readFileSync(filePath, 'utf8');
      const name = commandNameFromSource(source) || path.basename(file, '.js');
      const disabledByCategory = disabledCategories.has(category);
      const disabledByCommand = disabledCommands.has(name);
      commands.push({
        name,
        category,
        file,
        description: commandDescription(name, source),
        scope: category === 'global' ? 'global' : 'guild',
        disabled: disabledByCategory || disabledByCommand,
        disabledByCategory,
        disabledByCommand,
        protectedDefault: defaultDisabledCommands.has(name)
      });
    }
  }

  return commands.sort((left, right) => `${left.category}/${left.name}`.localeCompare(`${right.category}/${right.name}`));
}

function broadcast(channel, payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

function pushLog(line, stream = 'info') {
  const entry = {
    at: new Date().toISOString(),
    stream,
    line: String(line || '')
  };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_LINES) logBuffer = logBuffer.slice(-MAX_LOG_LINES);
  broadcast('log:line', entry);
}

function setStatus(status) {
  botStatus = status;
  broadcast('bot:status', { status: botStatus, pid: botProcess?.pid || null });
}

function pipeOutput(stream, name) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.trim()) pushLog(line, name);
    }
  });
  stream.on('end', () => {
    if (buffer.trim()) pushLog(buffer, name);
  });
}

function startBot() {
  if (botProcess) return { status: botStatus, pid: botProcess.pid };

  const env = loadEnv();
  const entry = path.join(appRoot, 'bot.js');
  const childEnv = {
    ...process.env,
    ...env,
    CORE_ENV_PATH: envPath,
    CORE_DATA_DIR: dataDir,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --max-old-space-size=256`.trim(),
    ELECTRON_RUN_AS_NODE: '1'
  };

  botProcess = spawn(process.execPath, [entry], {
    cwd: botProcessCwd,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  setStatus('starting');
  pushLog(`Starting bot process PID ${botProcess.pid}`, 'system');
  pipeOutput(botProcess.stdout, 'stdout');
  pipeOutput(botProcess.stderr, 'stderr');

  botProcess.once('error', (error) => {
    pushLog(error.message, 'stderr');
    botProcess = null;
    setStatus('stopped');
  });

  botProcess.once('exit', (code, signal) => {
    pushLog(`Bot process exited with code ${code ?? 'null'} and signal ${signal ?? 'null'}`, 'system');
    botProcess = null;
    setStatus('stopped');
  });

  setStatus('running');
  return { status: botStatus, pid: botProcess.pid };
}

function stopBot(force = false) {
  if (!botProcess) return { status: botStatus, pid: null };

  const pid = botProcess.pid;
  pushLog(force ? `Emergency stop for PID ${pid}` : `Stopping bot process PID ${pid}`, 'system');
  if (force && process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
  } else {
    botProcess.kill(force ? 'SIGKILL' : 'SIGTERM');
  }
  setStatus(force ? 'emergency-stop' : 'stopping');
  return { status: botStatus, pid };
}

async function restartBot() {
  if (botProcess) {
    stopBot(false);
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  return startBot();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 680,
    title: 'Self-hosted bot by Core',
    backgroundColor: '#101317',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  ensureRuntimeFiles();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (botProcess) stopBot(false);
});

function registerIpc(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...args);
    } catch (error) {
      pushLog(`${channel} failed: ${error.stack || error.message || error}`, 'stderr');
      throw error;
    }
  });
}

registerIpc('config:load', () => ({
  env: loadEnv(),
  envPath,
  dataDir,
  commands: scanCommands(),
  status: { status: botStatus, pid: botProcess?.pid || null },
  logs: logBuffer
}));

registerIpc('config:save', (_event, env) => {
  const saved = saveEnv(env || {});
  pushLog('Settings saved from UI', 'system');
  return {
    env: saved,
    commands: scanCommands(saved)
  };
});

registerIpc('commands:load', () => scanCommands());
registerIpc('bot:start', () => {
  pushLog('Start requested from UI', 'system');
  return startBot();
});
registerIpc('bot:stop', () => {
  pushLog('Stop requested from UI', 'system');
  return stopBot(false);
});
registerIpc('bot:emergencyStop', () => {
  pushLog('Emergency stop requested from UI', 'system');
  return stopBot(true);
});
registerIpc('bot:restart', () => {
  pushLog('Restart requested from UI', 'system');
  return restartBot();
});
registerIpc('bot:status', () => ({ status: botStatus, pid: botProcess?.pid || null }));
registerIpc('shell:openExternal', (_event, url) => shell.openExternal(url));
registerIpc('hosting:export', (_event, env) => exportHostingArchive(env || loadEnv()));
registerIpc('dialog:chooseDatabase', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'SQLite database',
    defaultPath: path.join(dataDir, 'core.sqlite'),
    filters: [{ name: 'SQLite database', extensions: ['sqlite', 'sqlite3', 'db'] }]
  });

  return result.canceled ? '' : result.filePath;
});

registerIpc('dialog:chooseJson', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Load welcome JSON',
    properties: ['openFile'],
    filters: [{ name: 'JSON message', extensions: ['json'] }]
  });

  if (result.canceled || !result.filePaths?.[0]) return '';
  return fs.readFileSync(result.filePaths[0], 'utf8');
});
