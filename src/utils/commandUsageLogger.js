function cleanLogText(value, fallback = 'unknown') {
  const text = String(value || fallback)
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
  return text || fallback;
}

function formatUser(user) {
  if (!user) return 'unknown';
  const tag = user.tag || user.username || user.id;
  return `${cleanLogText(tag)}(${user.id || 'unknown'})`;
}

function formatGuild(guild, guildId) {
  if (!guild && !guildId) return 'dm';
  const name = guild?.name || 'unknown';
  return `${cleanLogText(name)}(${guild?.id || guildId})`;
}

function collectOptionNames(options = []) {
  const names = [];

  for (const option of options) {
    if (!option?.name) continue;
    names.push(option.name);
    if (Array.isArray(option.options)) {
      names.push(...collectOptionNames(option.options).map((name) => `${option.name}.${name}`));
    }
  }

  return names;
}

function getCommandType(interaction) {
  if (interaction.isContextMenuCommand?.()) return 'context-menu';
  if (interaction.isChatInputCommand?.()) return 'chat-input';
  return 'command';
}

function logPublicCommandUsage(interaction, command) {
  if (command?.scope !== 'global') return;

  const optionNames = collectOptionNames(interaction.options?.data || []);
  const optionText = optionNames.length ? optionNames.join(',') : 'none';
  const commandName = interaction.commandName || 'unknown';

  console.log(
    `[CommandUsage] ${new Date().toISOString()} command=/${cleanLogText(commandName)} type=${getCommandType(interaction)} user=${formatUser(interaction.user)} guild=${formatGuild(interaction.guild, interaction.guildId)} channel=${interaction.channelId || 'unknown'} options=${cleanLogText(optionText, 'none')}`
  );
}

module.exports = {
  logPublicCommandUsage
};
