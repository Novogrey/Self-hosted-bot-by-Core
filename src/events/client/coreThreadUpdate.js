const { logThreadUpdate } = require('../../utils/coreServerLogs');

module.exports = {
  name: 'threadUpdate',
  async execute(oldThread, newThread) {
    await logThreadUpdate(oldThread, newThread);
  }
};
