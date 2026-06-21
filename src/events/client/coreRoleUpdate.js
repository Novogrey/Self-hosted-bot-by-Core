const { logRoleUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole) {
    await logRoleUpdate(oldRole, newRole);
  }
};
