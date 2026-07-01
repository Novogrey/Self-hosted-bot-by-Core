const {
  ContainerBuilder,
  MessageFlags,
  PermissionsBitField,
  SeparatorBuilder,
  TextDisplayBuilder,
  resolveColor
} = require('discord.js');
const chalk = require('chalk');
const { getWarnPunishment } = require('../../utils/warnPunishments');
const { buildCustomPayload, userTags } = require('../../utils/customMessages');
const warnSchema = require('../../schemas/warn');
const tempMuteSchema = require('../../schemas/mute');
const tempBanSchema = require('../../schemas/ban');

require('dotenv').config({ quiet: true });

const spamCache = new Map();
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>()]+/gi;
const INVITE_RE = /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i;
const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

function truthy(value, fallback = false) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(raw);
}

function numberEnv(key, fallback, min = 0) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value >= min ? value : fallback;
}

function listEnv(key) {
  return String(process.env[key] || '')
    .split(/[\n,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getConfig() {
  return {
    enabled: truthy(process.env.AUTOMOD_ENABLED, true),
    deleteMessage: truthy(process.env.AUTOMOD_DELETE_MESSAGE, true),
    warnUser: truthy(process.env.AUTOMOD_WARN_USER, true),
    ignoreAdministrators: truthy(process.env.AUTOMOD_IGNORE_ADMINISTRATORS, true),
    logChannelId: process.env.AUTOMOD_LOG_CHANNEL_ID || process.env.ADMIN_LOG_CHANNEL_ID || '',
    bypassRoleIds: new Set([...listEnv('ADMIN_ROLES_LEVEL_0'), ...listEnv('AUTOMOD_BYPASS_ROLE_IDS')]),
    ping: {
      enabled: truthy(process.env.AUTOMOD_PING_ENABLED, true),
      maxMentions: numberEnv('AUTOMOD_PING_MAX_MENTIONS', 5, 1)
    },
    badWords: {
      enabled: truthy(process.env.AUTOMOD_BAD_WORDS_ENABLED, false),
      words: listEnv('AUTOMOD_BAD_WORDS')
    },
    links: {
      enabled: truthy(process.env.AUTOMOD_LINKS_ENABLED, true),
      blockInvites: truthy(process.env.AUTOMOD_LINKS_BLOCK_INVITES, true),
      blockAll: truthy(process.env.AUTOMOD_LINKS_BLOCK_ALL, false),
      allowedDomains: listEnv('AUTOMOD_LINKS_ALLOWED_DOMAINS').map((domain) => domain.toLowerCase())
    },
    spam: {
      enabled: truthy(process.env.AUTOMOD_SPAM_ENABLED, true),
      messageLimit: numberEnv('AUTOMOD_SPAM_MESSAGE_LIMIT', 5, 2),
      windowMs: numberEnv('AUTOMOD_SPAM_TIME_WINDOW_MS', 60000, 5000)
    }
  };
}

function scamTrapChannelId() {
  return process.env.SCAM_AD_CHANNEL_ID || process.env.SCAM_AD_CHANNEL || '';
}

function getModel(connection, name, schema) {
  return connection.models[name] || connection.model(name, schema);
}

function cleanContent(content) {
  return String(content || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function previewContent(content) {
  const preview = cleanContent(content);
  return preview.length > 260 ? `${preview.slice(0, 260)}...` : preview || '(empty message)';
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsBadWord(content, words) {
  const text = String(content || '').toLowerCase();
  return words.find((word) => {
    const normalized = String(word || '').trim().toLowerCase();
    if (!normalized) return false;
    if (/^[a-z0-9_ -]+$/i.test(normalized)) {
      const pattern = new RegExp(`(^|[^a-z0-9_])${escapeRegex(normalized)}($|[^a-z0-9_])`, 'i');
      return pattern.test(text);
    }
    return text.includes(normalized);
  }) || null;
}

function extractLinks(content) {
  return String(content || '').match(URL_RE) || [];
}

function normalizedHostname(rawLink) {
  const withProtocol = /^https?:\/\//i.test(rawLink) ? rawLink : `https://${rawLink}`;
  try {
    return new URL(withProtocol).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function isAllowedDomain(hostname, allowedDomains) {
  return allowedDomains.some((domain) => {
    const normalized = domain.replace(/^www\./i, '').toLowerCase();
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  });
}

function getSpamHit(message, config) {
  const normalizedContent = cleanContent(message.content).toLowerCase();
  if (!normalizedContent) return null;

  const now = Date.now();
  const key = `${message.guild.id}:${message.author.id}`;
  const previousEntries = spamCache.get(key) || [];
  const entries = previousEntries.filter((entry) => now - entry.timestamp <= config.spam.windowMs);
  entries.push({ content: normalizedContent, timestamp: now });
  spamCache.set(key, entries);

  const duplicateCount = entries.filter((entry) => entry.content === normalizedContent).length;
  const duplicateLimit = Math.max(3, Math.ceil(config.spam.messageLimit / 2));

  if (entries.length >= config.spam.messageLimit) {
    return {
      label: 'Spam',
      detail: `${entries.length} messages in ${Math.round(config.spam.windowMs / 1000)} seconds`
    };
  }

  if (duplicateCount >= duplicateLimit) {
    return {
      label: 'Repeated messages',
      detail: `${duplicateCount} repeated messages in ${Math.round(config.spam.windowMs / 1000)} seconds`
    };
  }

  return null;
}

function clearSpamState(message) {
  spamCache.delete(`${message.guild.id}:${message.author.id}`);
}

function findViolations(message, config) {
  const violations = [];
  const content = String(message.content || '');

  if (config.ping.enabled) {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
    if (mentionCount > config.ping.maxMentions) {
      violations.push({
        label: 'Mass ping',
        detail: `${mentionCount} mentions, limit ${config.ping.maxMentions}`
      });
    }
  }

  if (config.badWords.enabled && config.badWords.words.length) {
    const matchedWord = containsBadWord(content, config.badWords.words);
    if (matchedWord) {
      violations.push({
        label: 'Forbidden word',
        detail: `Matched configured word: ${matchedWord}`
      });
    }
  }

  if (config.links.enabled) {
    const links = extractLinks(content);
    const inviteLink = links.find((link) => INVITE_RE.test(link)) || content.match(INVITE_RE)?.[0];
    if (config.links.blockInvites && inviteLink) {
      violations.push({
        label: 'Discord invite',
        detail: previewContent(inviteLink)
      });
    }

    if (config.links.blockAll && links.length) {
      const blockedLink = links.find((link) => {
        const hostname = normalizedHostname(link);
        return !hostname || !isAllowedDomain(hostname, config.links.allowedDomains);
      });
      if (blockedLink) {
        violations.push({
          label: 'Blocked link',
          detail: previewContent(blockedLink)
        });
      }
    }
  }

  if (config.spam.enabled) {
    const spamHit = getSpamHit(message, config);
    if (spamHit) violations.push(spamHit);
  }

  return violations;
}

function shouldBypass(member, config) {
  if (!member) return false;
  if (member.id === member.guild.ownerId) return true;
  if (config.ignoreAdministrators && member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  return [...config.bypassRoleIds].some((roleId) => member.roles.cache.has(roleId));
}

function reasonFromViolations(violations) {
  return `Automoderation: ${violations.map((violation) => `${violation.label} (${violation.detail})`).join('; ')}`;
}

function durationText(durationMs) {
  if (!durationMs) return 'permanent';
  const minutes = Math.round(durationMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(durationMs / 3600000);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(durationMs / 86400000)} d`;
}

function moderationContainer(title, lines, color = '#ff8a4c') {
  const container = new ContainerBuilder()
    .setAccentColor(resolveColor(color))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));

  for (const line of lines.filter(Boolean)) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(String(line).slice(0, 3900)));
  }

  container
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:f>`));

  return container;
}

async function sendUserNotice(message, reason, warningResult) {
  const lines = [
    `A message you sent on **${message.guild.name}** was handled by automoderation.`,
    `**Reason**\n${reason}`,
    warningResult?.warnId ? `**Warning ID**\n${warningResult.warnId}` : null,
    warningResult?.punishmentLabel ? `**Applied action**\n${warningResult.punishmentLabel}` : null
  ];

  const fallbackPayload = {
    flags: MessageFlags.IsComponentsV2,
    components: [moderationContainer('Moderation notice', lines)],
    allowedMentions: { parse: [], repliedUser: false }
  };

  await message.author.send(buildCustomPayload('automod.dm.notice', {
    server: message.guild.name,
    serverid: message.guild.id,
    reason,
    warnid: warningResult?.warnId || '',
    punishment: warningResult?.punishmentLabel || '',
    ...userTags(message.author)
  }, fallbackPayload)).catch(() => null);
}

async function sendLog(message, config, violations, warningResult, deleted) {
  if (!config.logChannelId) return;

  const channel = message.guild.channels.cache.get(config.logChannelId)
    || await message.guild.channels.fetch(config.logChannelId).catch(() => null);
  if (!channel?.isTextBased?.()) return;

  const lines = [
    `**User**\n<@${message.author.id}> (${message.author.tag || message.author.id})`,
    `**Channel**\n<#${message.channelId}>`,
    `**Violations**\n${violations.map((violation) => `- ${violation.label}: ${violation.detail}`).join('\n')}`,
    `**Deleted**\n${deleted ? 'Yes' : 'No'}`,
    warningResult?.warnId ? `**Warning**\nID ${warningResult.warnId}, total ${warningResult.warningCount}` : `**Warning**\n${config.warnUser ? 'Not saved' : 'Disabled in settings'}`,
    warningResult?.punishmentLabel ? `**Applied action**\n${warningResult.punishmentLabel}` : null,
    `**Message preview**\n${previewContent(message.content)}`
  ];

  const fallbackPayload = {
    flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
    components: [moderationContainer('Automoderation action', lines, '#43c7b2')],
    allowedMentions: { parse: [], repliedUser: false }
  };

  await channel.send(buildCustomPayload('automod.log', {
    server: message.guild.name,
    serverid: message.guild.id,
    channel: `<#${message.channelId}>`,
    channelid: message.channelId,
    violations: violations.map((violation) => `- ${violation.label}: ${violation.detail}`).join('\n'),
    deleted: deleted ? 'Yes' : 'No',
    warnid: warningResult?.warnId || '',
    punishment: warningResult?.punishmentLabel || '',
    preview: previewContent(message.content),
    ...userTags(message.author)
  }, fallbackPayload)).catch((error) => {
    console.error(chalk.red(`[${new Date().toISOString()}] [AutoModeration] Failed to send log: ${error.message}`));
  });
}

async function deleteMessage(message, config) {
  if (!config.deleteMessage) return false;

  const botMember = message.guild.members.me;
  if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    console.log(chalk.yellow(`[${new Date().toISOString()}] [AutoModeration] Missing ManageMessages permission in ${message.guild.name}`));
    return false;
  }

  await message.delete();
  return true;
}

async function applyPunishment(message, member, reason, punishment, models) {
  if (!punishment || !member) return null;

  if (punishment.type === 'mute') {
    const duration = punishment.durationMs;
    const unmuteTime = new Date(Date.now() + duration);
    const muteRoleId = process.env.MUTE_ROLE;
    const muteRole = muteRoleId ? message.guild.roles.cache.get(muteRoleId) : null;
    const actions = [];

    if (muteRole) {
      await member.roles.add(muteRole, reason).catch((error) => {
        console.error(chalk.red(`[${new Date().toISOString()}] [AutoModeration] Failed to add mute role: ${error.message}`));
      });
      actions.push('mute role');
    }

    if (member.moderatable) {
      await member.timeout(Math.min(duration, MAX_TIMEOUT_MS), reason).catch((error) => {
        console.error(chalk.red(`[${new Date().toISOString()}] [AutoModeration] Failed to timeout member: ${error.message}`));
      });
      actions.push('Discord timeout');
    }

    await new models.TempMute({
      userID: member.id,
      guildID: message.guild.id,
      moderatorID: 'Automoderation',
      reason,
      unmuteTime,
      totalDuration: duration
    }).save();

    return actions.length
      ? `Temporary mute (${durationText(duration)}), ${actions.join(' + ')}`
      : `Temporary mute saved (${durationText(duration)}), no Discord action was applied`;
  }

  if (punishment.type === 'ban') {
    const duration = punishment.durationMs;
    await member.ban({ reason }).catch((error) => {
      throw new Error(`Failed to ban member: ${error.message}`);
    });

    await new models.TempBan({
      userID: member.id,
      guildID: message.guild.id,
      moderatorID: 'Automoderation',
      reason,
      unbanTime: new Date(Date.now() + duration)
    }).save();

    return `Temporary ban (${durationText(duration)})`;
  }

  if (punishment.type === 'permanentBan') {
    await member.ban({ reason }).catch((error) => {
      throw new Error(`Failed to permanently ban member: ${error.message}`);
    });
    await models.Warn.deleteOne({ guildID: message.guild.id, userID: member.id }).catch(() => null);
    return 'Permanent ban';
  }

  return null;
}

async function issueWarning(message, member, reason, client) {
  const connection = client.connections?.moderator;
  if (!connection) return null;

  const models = {
    Warn: getModel(connection, 'Warn', warnSchema),
    TempMute: getModel(connection, 'TempMute', tempMuteSchema),
    TempBan: getModel(connection, 'TempBan', tempBanSchema)
  };

  let warnDocument = await models.Warn.findOne({
    guildID: message.guild.id,
    userID: message.author.id
  }).catch(() => null);

  if (!warnDocument) {
    warnDocument = new models.Warn({
      guildID: message.guild.id,
      userID: message.author.id,
      warnings: []
    });
  }

  const nextWarnId = warnDocument.warnings.length
    ? Math.max(...warnDocument.warnings.map((warning) => Number(warning.warnID) || 0)) + 1
    : 1;

  warnDocument.warnings.push({
    warnID: nextWarnId,
    modID: 'Automoderation',
    reason,
    timestamp: new Date(),
    expires: null
  });

  await warnDocument.save();

  const warningCount = warnDocument.warnings.length;
  const punishment = getWarnPunishment(warningCount);
  const punishmentLabel = await applyPunishment(message, member, reason, punishment, models).catch((error) => {
    console.error(chalk.red(`[${new Date().toISOString()}] [AutoModeration] Failed to apply punishment: ${error.message}`));
    return null;
  });

  return {
    warnId: nextWarnId,
    warningCount,
    punishmentLabel
  };
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  const maxAge = numberEnv('AUTOMOD_SPAM_TIME_WINDOW_MS', 60000, 5000) * 2;
  for (const [key, entries] of spamCache) {
    const fresh = entries.filter((entry) => now - entry.timestamp <= maxAge);
    if (fresh.length) spamCache.set(key, fresh);
    else spamCache.delete(key);
  }
}, 120000);
cleanupTimer.unref?.();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    const config = getConfig();
    if (!config.enabled || message.author.bot || !message.guild) return;
    if (scamTrapChannelId() && message.channelId === scamTrapChannelId()) return;

    const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
    if (shouldBypass(member, config)) return;

    const violations = findViolations(message, config);
    if (!violations.length) return;

    clearSpamState(message);

    const reason = reasonFromViolations(violations);
    let deleted = false;
    try {
      deleted = await deleteMessage(message, config);
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] [AutoModeration] Failed to delete message: ${error.message}`));
    }

    let warningResult = null;
    if (config.warnUser) {
      warningResult = await issueWarning(message, member, reason, client).catch((error) => {
        console.error(chalk.red(`[${new Date().toISOString()}] [AutoModeration] Failed to save warning: ${error.message}`));
        return null;
      });
    }

    await sendUserNotice(message, reason, warningResult);
    await sendLog(message, config, violations, warningResult, deleted);
    console.log(chalk.yellow(`[${new Date().toISOString()}] [AutoModeration] ${message.author.tag || message.author.id}: ${reason}`));
  }
};
