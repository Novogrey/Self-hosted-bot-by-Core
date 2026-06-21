const { logInviteCreate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'inviteCreate',
  async execute(invite) {
    await logInviteCreate(invite);
  }
};
