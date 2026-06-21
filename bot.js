const fs = require('fs');
const path = require('path');
require('dotenv').config({
  path: process.env.CORE_ENV_PATH || path.join(__dirname, '.env'),
  quiet: true
});

const chalk = require('chalk');
const { Client, Collection, GatewayIntentBits, Partials, Options } = require('discord.js');
const { installMessageBranding } = require('./src/utils/messageBranding');

const token = process.env.DISCORD_TOKEN || process.env.token;
const LOG_DIR = process.env.CORE_DATA_DIR ? path.resolve(process.env.CORE_DATA_DIR) : __dirname;
const LOG_FILE = path.join(LOG_DIR, 'bot.log');

try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch {
  // If the log directory cannot be created, console logging still keeps the app usable.
}

function logErrorToFile(error, type = 'Error') {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [${type}] ${error?.stack || error?.message || error}\n`;
  try {
    fs.appendFileSync(LOG_FILE, message);
  } catch (fsError) {
    console.error(chalk.red(`[${timestamp}] Failed to write bot.log: ${fsError.message}`));
  }
}

if (!token) {
  throw new Error('Discord token is missing. Set DISCORD_TOKEN in .env.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember],
  makeCache: Options.cacheWithLimits({
    MessageManager: 100,
    PresenceManager: 0
  })
});

client.commands = new Collection();
client.commandArray = [];
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();
client.connections = {};
client.discordUserLocales = new Map();
client.rootDir = __dirname;
installMessageBranding(client);

process.on('uncaughtException', (error) => {
  console.error(chalk.red(`[${new Date().toISOString()}] Uncaught exception: ${error.message}`));
  logErrorToFile(error, 'UncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`[${new Date().toISOString()}] Unhandled rejection: ${reason?.message || reason}`));
  logErrorToFile(reason, 'UnhandledRejection');
});

function shutdown(signal) {
  console.log(chalk.yellow(`[${new Date().toISOString()}] Shutting down Core bot (${signal})`));
  client.destroy();
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

async function connectDatabase() {
  const { createSqlConnection } = require('./src/utils/sqlDocumentStore');
  const connection = await createSqlConnection();

  client.connections.core = connection;
  client.connections.users = connection;
  client.connections.moderator = connection;
  client.connections.economy = connection;

  console.log(chalk.green(`[${new Date().toISOString()}] Connected to Core SQLite document store`));
}

async function main() {
  const { configureSqlBackupClient, getDatabase } = require('./src/utils/sqliteDatabase');
  configureSqlBackupClient(client);
  
  // Initialize SQL database
  try {
    await getDatabase();
    console.log(chalk.green(`[${new Date().toISOString()}] SQL database initialized`));
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to initialize SQL database: ${error.message}`));
    // Don't exit - the system can still work with file-based fallback
  }

  await connectDatabase();

  const handlersPath = path.join(__dirname, 'src', 'functions', 'handlers');
  for (const file of fs.readdirSync(handlersPath).filter((entry) => entry.endsWith('.js'))) {
    require(path.join(handlersPath, file))(client);
  }

  await client.handleEvents();
  await client.handleComponents();
  await client.handleCommands();
  console.log(chalk.cyan(`[${new Date().toISOString()}] Discord bot mode: self-host`));
  await client.login(token);
}

main().catch((error) => {
  console.error(chalk.red(`[${new Date().toISOString()}] Startup failed: ${error.message}`));
  logErrorToFile(error, 'Startup');
  process.exit(1);
});
