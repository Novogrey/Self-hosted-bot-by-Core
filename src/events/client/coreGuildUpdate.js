const { logGuildUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild) {
    await logGuildUpdate(oldGuild, newGuild);
  }
};
