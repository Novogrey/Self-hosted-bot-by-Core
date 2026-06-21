const { logStickerUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'stickerUpdate',
  async execute(oldSticker, newSticker) {
    await logStickerUpdate(oldSticker, newSticker);
  }
};
