const { logStickerDelete } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'stickerDelete',
  async execute(sticker) {
    await logStickerDelete(sticker);
  }
};
