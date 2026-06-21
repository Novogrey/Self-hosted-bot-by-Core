const { logGuildBanRemove } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban) {
    await logGuildBanRemove(ban);
  }
};
