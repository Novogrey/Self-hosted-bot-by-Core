const { CORE_GUILD_ID } = require('../../utils/coreServerLogs');
const { syncVoiceRolesForGuild } = require('../../utils/voiceRoleRewards');

module.exports = {
  name: 'clientReady',
  async execute(readyClient, client) {
    const botClient = client || readyClient;
    const guild = botClient.guilds.cache.get(CORE_GUILD_ID)
      || await botClient.guilds.fetch(CORE_GUILD_ID).catch(() => null);
    if (!guild) return;
    await syncVoiceRolesForGuild(botClient, guild);
  }
};
