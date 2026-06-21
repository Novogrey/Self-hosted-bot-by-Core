const DEFAULT_GUILD_ID = '1451626981803298890';

function getTargetGuildId() {
  return process.env.GUILD_ID || DEFAULT_GUILD_ID;
}

function getTargetGuildEnvName() {
  return 'GUILD_ID';
}

function isDiscordAccessError(error) {
  const code = Number(error?.code || error?.rawError?.code || 0);
  return code === 50001 || code === 50013 || /Missing (Access|Permissions)/i.test(String(error?.message || ''));
}

module.exports = {
  DEFAULT_GUILD_ID,
  getTargetGuildEnvName,
  getTargetGuildId,
  isDiscordAccessError
};
