const { logGuildBanAdd } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    await logGuildBanAdd(ban);
  }
};
