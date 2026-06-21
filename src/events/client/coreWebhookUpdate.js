const { logWebhookUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'webhookUpdate',
  async execute(channel) {
    await logWebhookUpdate(channel);
  }
};
