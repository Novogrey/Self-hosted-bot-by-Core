const { logChannelUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    await logChannelUpdate(oldChannel, newChannel);
  }
};
