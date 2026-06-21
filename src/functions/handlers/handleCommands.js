const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { applyCommandLocalizations } = require('../../utils/commandLocalizations');
const { isCommandDisabled } = require('../../utils/commandVisibility');
const {
  getTargetGuildEnvName,
  getTargetGuildId,
  isDiscordAccessError
} = require('../../utils/botRuntimeConfig');
require('dotenv').config({ quiet: true });

function clientIdFromToken(value) {
  try {
    return Buffer.from(String(value || '').split('.')[0], 'base64').toString('utf8').replace(/\D/g, '');
  } catch {
    return '';
  }
}

const token = process.env.DISCORD_TOKEN || process.env.token;
const clientId = process.env.CLIENT_ID || clientIdFromToken(token);
const targetGuildId = getTargetGuildId();

module.exports = (client) => {
  client.handleCommands = async (options = {}) => {
    client.commands.clear();
    client.commandArray.length = 0;
    client.guildCommandArray = [];
    client.globalCommandArray = [];

    const commandsPath = path.join(client.rootDir || process.cwd(), 'src', 'commands');
    const commandFolders = fs.existsSync(commandsPath)
      ? fs.readdirSync(commandsPath).filter((entry) => fs.statSync(path.join(commandsPath, entry)).isDirectory())
      : [];

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        try {
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);
          if (!command?.data?.name || typeof command.execute !== 'function') {
            console.warn(`Skipped command ${folder}/${file}: missing data or execute.`);
            continue;
          }

          if (isCommandDisabled(folder, command.data.name)) {
            console.log(`Skipped disabled command: ${command.data.name} (${folder})`);
            continue;
          }

          command.category = folder;
          const payload = applyCommandLocalizations(command.data.toJSON());
          client.commands.set(command.data.name, command);
          client.commandArray.push(payload);

          if (command.scope === 'global') {
            client.globalCommandArray.push(payload);
          } else {
            client.guildCommandArray.push(payload);
          }

          console.log(`Loaded command: ${command.data.name} (${command.scope === 'global' ? 'global' : 'guild'})`);
        } catch (error) {
          console.error(`Failed to load command ${folder}/${file}:`, error);
        }
      }
    }

    await client.syncCommandRegistrations(options);
  };

  client.syncCommandRegistrations = async ({ includeAllGuilds = false } = {}) => {
    if (!token || !clientId) {
      console.warn('Slash command registration skipped: token or client id is missing.');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationCommands(clientId), {
      body: client.globalCommandArray
    });
    console.log(`Registered ${client.globalCommandArray.length} global slash commands.`);

    if (!targetGuildId) {
      console.warn(`Guild-only slash command registration skipped: ${getTargetGuildEnvName()} is missing.`);
      return;
    }

    try {
      await rest.put(Routes.applicationGuildCommands(clientId, targetGuildId), {
        body: client.guildCommandArray
      });
      console.log(`Registered ${client.guildCommandArray.length} guild-only slash commands for target guild ${targetGuildId}.`);
    } catch (error) {
      if (!isDiscordAccessError(error)) throw error;

      console.warn(`Guild-only slash command registration skipped for ${targetGuildId}: ${error.message}.`);
      console.warn(`Invite this bot to that guild or set ${getTargetGuildEnvName()} to a guild the bot can access.`);
      return;
    }

    if (!includeAllGuilds || !client.guilds?.cache?.size) {
      return;
    }

    let cleanedGuilds = 0;
    for (const guild of client.guilds.cache.values()) {
      if (guild.id === targetGuildId) continue;

      await rest.put(Routes.applicationGuildCommands(clientId, guild.id), {
        body: []
      }).then(() => {
        cleanedGuilds += 1;
      }).catch((error) => {
        console.error(`Failed to clear duplicated guild commands for guild ${guild.id}:`, error);
      });
    }

    console.log(`Cleared duplicated guild command copies from ${cleanedGuilds} non-target guilds.`);
  };
};
