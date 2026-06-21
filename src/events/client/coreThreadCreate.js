const { logThreadCreate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'threadCreate',
  async execute(thread) {
    await logThreadCreate(thread);
  }
};
