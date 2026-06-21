const { logThreadDelete } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'threadDelete',
  async execute(thread) {
    await logThreadDelete(thread);
  }
};
