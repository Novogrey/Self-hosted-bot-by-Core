const { logStickerCreate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'stickerCreate',
  async execute(sticker) {
    await logStickerCreate(sticker);
  }
};
