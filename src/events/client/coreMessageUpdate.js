const { logMessageUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    await logMessageUpdate(oldMessage, newMessage);
  }
};
