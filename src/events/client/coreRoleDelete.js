const { logRoleDelete } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    await logRoleDelete(role);
  }
};
