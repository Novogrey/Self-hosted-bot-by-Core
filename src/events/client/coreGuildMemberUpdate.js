const { logMemberRoleOrTimeoutUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    await logMemberRoleOrTimeoutUpdate(oldMember, newMember);
  }
};
