const DEFAULT_DISABLED_CATEGORIES = new Set(['global']);
const DEFAULT_DISABLED_COMMANDS = new Set();

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function disabledCategorySet() {
  const categories = new Set(parseList(process.env.DISABLED_COMMAND_CATEGORIES));
  for (const category of DEFAULT_DISABLED_CATEGORIES) categories.add(category);
  return categories;
}

function disabledCommandSet() {
  const commands = new Set(parseList(process.env.DISABLED_COMMANDS));
  for (const command of DEFAULT_DISABLED_COMMANDS) commands.add(command);
  return commands;
}

function isCommandDisabled(category, commandName) {
  return disabledCategorySet().has(String(category || '').trim())
    || disabledCommandSet().has(String(commandName || '').trim());
}

function getDefaultDisabledCommands() {
  return [...DEFAULT_DISABLED_COMMANDS].sort();
}

function getDefaultDisabledCategories() {
  return [...DEFAULT_DISABLED_CATEGORIES].sort();
}

module.exports = {
  getDefaultDisabledCategories,
  getDefaultDisabledCommands,
  isCommandDisabled,
  parseList
};
