const { logGuildMemberAdd } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    await logGuildMemberAdd(member);
  }
};
