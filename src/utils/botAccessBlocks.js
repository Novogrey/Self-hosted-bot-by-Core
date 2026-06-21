const { MessageFlags } = require('discord.js');
const botAccessBlockSchema = require('../schemas/botAccessBlock');
const { getDiscordUserLanguage, normalizeLanguageCode } = require('./appTranslations');
const { buildStatusComponents, v2Flags } = require('./localizedComponents');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const LABELS = {
  en: {
    blockedTitle: 'Core access limited',
    blockedDescription: 'You cannot use public Core commands and interactive features while this restriction is active.',
    reason: 'Reason',
    duration: 'Duration',
    expires: 'Expires',
    permanent: 'Permanent',
    unknownReason: 'No reason provided',
    footer: 'This notice does not show who applied the restriction.',
    noPermissionTitle: 'No access',
    noPermissionDescription: 'Only the bot developer can manage Core access blocks.',
    invalidUsersTitle: 'User ID not found',
    invalidUsersDescription: 'Provide one or more Discord user IDs or mentions.',
    invalidDurationTitle: 'Invalid duration',
    invalidDurationDescription: 'Use formats like 30m, 2h, 7d, 1w, 1y, or leave it empty for a permanent block.',
    blockCreatedTitle: 'Bot access block saved',
    blockRemovedTitle: 'Bot access block removed',
    blockCheckTitle: 'Bot access block status',
    blockListTitle: 'Recent bot access blocks',
    active: 'Active',
    inactive: 'Not blocked',
    users: 'Users',
    emptyList: 'There are no active bot access blocks.',
    removedCount: 'Removed',
    notConfigured: 'The database connection is not available.'
  },
  ru: {
    blockedTitle: '\u0414\u043e\u0441\u0442\u0443\u043f \u043a Core \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d',
    blockedDescription: '\u0412\u044b \u043d\u0435 \u043c\u043e\u0436\u0435\u0442\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u043f\u0443\u0431\u043b\u0438\u0447\u043d\u044b\u0435 \u043a\u043e\u043c\u0430\u043d\u0434\u044b \u0438 \u0438\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0444\u0443\u043d\u043a\u0446\u0438\u0438 Core, \u043f\u043e\u043a\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u044d\u0442\u043e \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0435.',
    reason: '\u041f\u0440\u0438\u0447\u0438\u043d\u0430',
    duration: '\u0421\u0440\u043e\u043a',
    expires: '\u0418\u0441\u0442\u0435\u043a\u0430\u0435\u0442',
    permanent: '\u0411\u0435\u0441\u0441\u0440\u043e\u0447\u043d\u043e',
    unknownReason: '\u041f\u0440\u0438\u0447\u0438\u043d\u0430 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430',
    footer: '\u0412 \u044d\u0442\u043e\u043c \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0438 \u043d\u0435 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442\u0441\u044f, \u043a\u0442\u043e \u0432\u044b\u0434\u0430\u043b \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0435.',
    noPermissionTitle: '\u041d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0430',
    noPermissionDescription: '\u0422\u043e\u043b\u044c\u043a\u043e \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a \u0431\u043e\u0442\u0430 \u043c\u043e\u0436\u0435\u0442 \u0443\u043f\u0440\u0430\u0432\u043b\u044f\u0442\u044c \u0433\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u044b\u043c\u0438 \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0430\u043c\u0438 Core.',
    invalidUsersTitle: 'ID \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b',
    invalidUsersDescription: '\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043e\u0434\u0438\u043d \u0438\u043b\u0438 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e Discord ID \u0438\u043b\u0438 \u0443\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0439.',
    invalidDurationTitle: '\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0441\u0440\u043e\u043a',
    invalidDurationDescription: '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u0444\u043e\u0440\u043c\u0430\u0442\u044b 30m, 2h, 7d, 1w, 1y \u0438\u043b\u0438 \u043e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u043f\u0443\u0441\u0442\u044b\u043c \u0434\u043b\u044f \u0431\u0435\u0441\u0441\u0440\u043e\u0447\u043d\u043e\u0439 \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0438.',
    blockCreatedTitle: '\u0411\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430',
    blockRemovedTitle: '\u0411\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u0441\u043d\u044f\u0442\u0430',
    blockCheckTitle: '\u0421\u0442\u0430\u0442\u0443\u0441 \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0438',
    blockListTitle: '\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0438 Core',
    active: '\u0410\u043a\u0442\u0438\u0432\u043d\u0430',
    inactive: '\u041d\u0435 \u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u043d',
    users: '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438',
    emptyList: '\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043e\u043a \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u043a \u0431\u043e\u0442\u0443 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.',
    removedCount: '\u0421\u043d\u044f\u0442\u043e',
    notConfigured: '\u041d\u0435\u0442 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f \u043a \u0431\u0430\u0437\u0435 \u0434\u0430\u043d\u043d\u044b\u0445.'
  },
  ua: {
    blockedTitle: '\u0414\u043e\u0441\u0442\u0443\u043f \u0434\u043e Core \u043e\u0431\u043c\u0435\u0436\u0435\u043d\u043e',
    blockedDescription: '\u0412\u0438 \u043d\u0435 \u043c\u043e\u0436\u0435\u0442\u0435 \u0432\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u043e\u0432\u0443\u0432\u0430\u0442\u0438 \u043f\u0443\u0431\u043b\u0456\u0447\u043d\u0456 \u043a\u043e\u043c\u0430\u043d\u0434\u0438 \u0442\u0430 \u0456\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432\u043d\u0456 \u0444\u0443\u043d\u043a\u0446\u0456\u0457 Core, \u0434\u043e\u043a\u0438 \u0434\u0456\u0454 \u0446\u0435 \u043e\u0431\u043c\u0435\u0436\u0435\u043d\u043d\u044f.',
    reason: '\u041f\u0440\u0438\u0447\u0438\u043d\u0430',
    duration: '\u0421\u0442\u0440\u043e\u043a',
    expires: '\u0417\u0430\u043a\u0456\u043d\u0447\u0443\u0454\u0442\u044c\u0441\u044f',
    permanent: '\u0411\u0435\u0437\u0441\u0442\u0440\u043e\u043a\u043e\u0432\u043e',
    unknownReason: '\u041f\u0440\u0438\u0447\u0438\u043d\u0443 \u043d\u0435 \u0432\u043a\u0430\u0437\u0430\u043d\u043e',
    footer: '\u0423 \u0446\u044c\u043e\u043c\u0443 \u043f\u043e\u0432\u0456\u0434\u043e\u043c\u043b\u0435\u043d\u043d\u0456 \u043d\u0435 \u043f\u043e\u043a\u0430\u0437\u0443\u0454\u0442\u044c\u0441\u044f, \u0445\u0442\u043e \u0432\u0438\u0434\u0430\u0432 \u043e\u0431\u043c\u0435\u0436\u0435\u043d\u043d\u044f.'
  },
  de: {
    blockedTitle: 'Core-Zugriff eingeschraenkt',
    blockedDescription: 'Du kannst oeffentliche Core-Befehle und interaktive Funktionen nicht verwenden, solange diese Einschraenkung aktiv ist.',
    reason: 'Grund',
    duration: 'Dauer',
    expires: 'Laeuft ab',
    permanent: 'Permanent',
    unknownReason: 'Kein Grund angegeben',
    footer: 'Diese Mitteilung zeigt nicht, wer die Einschraenkung gesetzt hat.'
  }
};

function labelsFor(language) {
  const normalized = normalizeLanguageCode(language, 'en');
  return {
    ...LABELS.en,
    ...(LABELS[normalized] || {})
  };
}

function getModel(client) {
  const connection = client?.connections?.core || client?.connections?.users;
  if (!connection) return null;
  return connection.models.BotAccessBlock || connection.model('BotAccessBlock', botAccessBlockSchema);
}

function parseUserIds(value) {
  return [...new Set(String(value || '').match(/\d{15,25}/g) || [])];
}

function parseDuration(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || ['permanent', 'perm', 'forever', 'never', '0'].includes(raw)) {
    return { ok: true, durationMs: null };
  }

  const match = raw.match(/^(\d+)\s*(s|sec|secs|m|min|mins|h|hr|hrs|d|day|days|w|week|weeks|y|year|years)$/);
  if (!match) return { ok: false, durationMs: null };

  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, durationMs: null };

  const multiplier = unit.startsWith('s') ? SECOND
    : unit.startsWith('m') ? MINUTE
      : unit.startsWith('h') ? HOUR
        : unit.startsWith('d') ? DAY
          : unit.startsWith('w') ? WEEK
            : unit.startsWith('y') ? 365 * DAY
              : 0;

  return multiplier ? { ok: true, durationMs: amount * multiplier } : { ok: false, durationMs: null };
}

function blockExpiresText(block, labels) {
  if (!block?.expiresAt) return labels.permanent;
  const timestamp = Math.floor(new Date(block.expiresAt).getTime() / 1000);
  return `<t:${timestamp}:F>\n<t:${timestamp}:R>`;
}

function buildBotAccessBlockComponents(block, language) {
  const labels = labelsFor(language);
  return buildStatusComponents({
    title: labels.blockedTitle,
    description: labels.blockedDescription,
    fields: [
      {
        name: labels.reason,
        value: block?.reason || labels.unknownReason
      },
      {
        name: labels.duration,
        value: blockExpiresText(block, labels)
      }
    ],
    footer: `-# ${labels.footer}`,
    color: '#ED4245'
  });
}

async function getActiveBotAccessBlock(client, userId) {
  const Block = getModel(client);
  if (!Block || !userId) return null;

  const block = await Block.findOne({ userId: String(userId) }).lean().catch(() => null);
  if (!block) return null;

  if (block.expiresAt && new Date(block.expiresAt).getTime() <= Date.now()) {
    await Block.deleteOne({ userId: String(userId) }).catch(() => null);
    return null;
  }

  return block;
}

async function replyWithBotAccessBlock(interaction, client, block, language) {
  const resolvedLanguage = language || await getDiscordUserLanguage(client, interaction.user?.id, 'en');
  const payload = {
    flags: v2Flags(true),
    components: buildBotAccessBlockComponents(block, resolvedLanguage),
    allowedMentions: { parse: [], repliedUser: false }
  };

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(payload).catch(() => null);
  }

  return interaction.reply(payload).catch(() => null);
}

async function sendBotAccessBlockDm(user, client, block) {
  if (!user?.send) return null;
  const language = await getDiscordUserLanguage(client, user.id, 'en');
  return user.send({
    flags: MessageFlags.IsComponentsV2,
    components: buildBotAccessBlockComponents(block, language),
    allowedMentions: { parse: [], repliedUser: false }
  }).catch(() => null);
}

async function upsertBotAccessBlocks(client, userIds, reason, durationMs) {
  const Block = getModel(client);
  if (!Block) throw new Error('BotAccessBlock model is not available.');

  const now = new Date();
  const expiresAt = durationMs ? new Date(now.getTime() + durationMs) : null;
  return Promise.all(userIds.map((userId) =>
    Block.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          reason,
          expiresAt,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()
  ));
}

async function removeBotAccessBlocks(client, userIds) {
  const Block = getModel(client);
  if (!Block) throw new Error('BotAccessBlock model is not available.');
  return Block.deleteMany({ userId: { $in: userIds } });
}

async function listActiveBotAccessBlocks(client, limit = 20) {
  const Block = getModel(client);
  if (!Block) return [];
  await Block.deleteMany({ expiresAt: { $ne: null, $lte: new Date() } }).catch(() => null);
  return Block.find({}).sort({ updatedAt: -1 }).limit(limit).lean().catch(() => []);
}

module.exports = {
  blockExpiresText,
  buildBotAccessBlockComponents,
  getActiveBotAccessBlock,
  getModel,
  labelsFor,
  listActiveBotAccessBlocks,
  parseDuration,
  parseUserIds,
  removeBotAccessBlocks,
  replyWithBotAccessBlock,
  sendBotAccessBlockDm,
  upsertBotAccessBlocks
};
