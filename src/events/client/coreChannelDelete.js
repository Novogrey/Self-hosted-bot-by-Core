const { logChannelDelete } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    await logChannelDelete(channel);
  }
};
