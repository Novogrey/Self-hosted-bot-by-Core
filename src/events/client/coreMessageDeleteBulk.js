const { logMessageBulkDelete } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'messageDeleteBulk',
  async execute(messages, channel) {
    await logMessageBulkDelete(messages, channel);
  }
};
