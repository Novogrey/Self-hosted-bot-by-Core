const { buildCustomPayload, userTags } = require('./customMessages');

function formatUser(user) {
  if (!user) return '';
  return user.tag || user.username || user.id || '';
}

function moderationDmTags({
  guild,
  target,
  moderator,
  reason = '',
  duration = '',
  expires = '',
  warnId = '',
  count = '',
  action = ''
} = {}) {
  return {
    server: guild?.name || '',
    serverid: guild?.id || '',
    reason,
    duration,
    expires,
    warnid: warnId,
    count,
    action,
    target: target?.id ? `<@${target.id}>` : formatUser(target),
    targetid: target?.id || '',
    targets: target?.id ? `<@${target.id}>` : formatUser(target),
    moderator: formatUser(moderator),
    moderatorid: moderator?.id || '',
    moderatormention: moderator?.id ? `<@${moderator.id}>` : '',
    ...userTags(target)
  };
}

async function sendModerationDm(target, keys, tags, fallbackPayload) {
  const payload = buildCustomPayload(keys, tags, fallbackPayload);
  return target.send(payload);
}

module.exports = {
  moderationDmTags,
  sendModerationDm
};
