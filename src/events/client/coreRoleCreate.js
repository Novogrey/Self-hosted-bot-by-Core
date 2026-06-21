const { logRoleCreate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'roleCreate',
  async execute(role) {
    await logRoleCreate(role);
  }
};
