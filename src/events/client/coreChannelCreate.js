const { logChannelCreate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'channelCreate',
  async execute(channel) {
    await logChannelCreate(channel);
  }
};
