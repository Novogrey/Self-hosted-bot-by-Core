const { logGuildMemberRemove } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    await logGuildMemberRemove(member);
  }
};
