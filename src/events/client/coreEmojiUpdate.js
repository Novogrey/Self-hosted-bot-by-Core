const { logEmojiUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'emojiUpdate',
  async execute(oldEmoji, newEmoji) {
    await logEmojiUpdate(oldEmoji, newEmoji);
  }
};
