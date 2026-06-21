const { logEmojiDelete } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'emojiDelete',
  async execute(emoji) {
    await logEmojiDelete(emoji);
  }
};
