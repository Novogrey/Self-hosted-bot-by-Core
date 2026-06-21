const { logInviteDelete } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'inviteDelete',
  async execute(invite) {
    await logInviteDelete(invite);
  }
};
