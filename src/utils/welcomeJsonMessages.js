const { MessageFlags } = require('discord.js');

const V2_COMPONENT_TYPES = new Set([9, 10, 11, 12, 13, 14, 17]);

function envEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function avatarUrl(user) {
  return user?.displayAvatarURL?.({ size: 512, extension: 'png' }) || user?.avatarURL?.() || '';
}

function guildAssetUrl(guild, method) {
  return guild?.[method]?.({ size: 1024, extension: 'png' }) || '';
}

function discordTimestamp(value, style = 'f') {
  const time = value ? new Date(value).getTime() : Date.now();
  return `<t:${Math.floor(time / 1000)}:${style}>`;
}

function welcomeTags(member) {
  const user = member?.user || {};
  const guild = member?.guild || {};
  return {
    username: user.username || '',
    displayname: member?.displayName || user.globalName || user.username || '',
    globalname: user.globalName || user.username || '',
    userid: user.id || member?.id || '',
    mention: user.id || member?.id ? `<@${user.id || member.id}>` : '',
    tag: user.tag || user.username || '',
    avatar: avatarUrl(user),
    server: guild.name || '',
    serverid: guild.id || '',
    membercount: guild.memberCount || '',
    joindate: discordTimestamp(member?.joinedTimestamp || Date.now(), 'f'),
    joinedrelative: discordTimestamp(member?.joinedTimestamp || Date.now(), 'R'),
    createdat: discordTimestamp(user.createdTimestamp || Date.now(), 'f'),
    createdrelative: discordTimestamp(user.createdTimestamp || Date.now(), 'R'),
    guildicon: guildAssetUrl(guild, 'iconURL'),
    guildbanner: guildAssetUrl(guild, 'bannerURL')
  };
}

function applyTags(value, tags) {
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (match, key) => (
      Object.prototype.hasOwnProperty.call(tags, key) ? String(tags[key]) : match
    ));
  }

  if (Array.isArray(value)) return value.map((entry) => applyTags(entry, tags));

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, applyTags(entry, tags)])
    );
  }

  return value;
}

function hasV2Component(components = []) {
  return components.some((component) => {
    if (!component || typeof component !== 'object') return false;
    if (V2_COMPONENT_TYPES.has(Number(component.type))) return true;
    return Array.isArray(component.components) && hasV2Component(component.components);
  });
}

function normalizePayload(payload, member) {
  const next = Array.isArray(payload) ? { components: payload } : { ...payload };
  const flags = Number(next.flags || 0);
  if (Array.isArray(next.components) && hasV2Component(next.components)) {
    next.flags = flags | MessageFlags.IsComponentsV2;
  }

  if (!next.allowedMentions) {
    next.allowedMentions = {
      users: [member.id],
      roles: [],
      repliedUser: false
    };
  }

  return next;
}

function buildWelcomePayload(json, member) {
  const source = String(json || '').trim();
  if (!source) return null;

  const parsed = JSON.parse(source);
  const templated = applyTags(parsed, welcomeTags(member));
  return normalizePayload(templated, member);
}

function buildDmWelcomePayload(member) {
  if (!envEnabled(process.env.WELCOME_DM_ENABLED)) return null;
  return buildWelcomePayload(process.env.WELCOME_DM_JSON, member);
}

function buildServerWelcomePayload(member) {
  if (!envEnabled(process.env.WELCOME_SERVER_ENABLED)) return null;
  return buildWelcomePayload(process.env.WELCOME_SERVER_JSON, member);
}

module.exports = {
  buildDmWelcomePayload,
  buildServerWelcomePayload,
  buildWelcomePayload,
  envEnabled,
  welcomeTags
};
