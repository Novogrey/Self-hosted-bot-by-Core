const { logEmojiCreate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'emojiCreate',
  async execute(emoji) {
    await logEmojiCreate(emoji);
  }
};
