const { logMessageDelete } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    await logMessageDelete(message);
  }
};
