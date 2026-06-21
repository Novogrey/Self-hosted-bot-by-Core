const { ChannelType, MessageFlags, PermissionFlagsBits } = require('discord.js');

function isUnknownMessageError(error) {
  return error?.code === 10008 || error?.rawError?.code === 10008;
}

function isComponentsV2EditError(error) {
  const code = Number(error?.code ?? error?.rawError?.code);
  if (code !== 50035) return false;

  const details = JSON.stringify(error?.rawError?.errors || error?.errors || {});
  return details.includes('UNION_TYPE_CHOICES');
}

function getComponentType(component) {
  return Number(component?.type ?? component?.data?.type ?? component?.toJSON?.()?.type);
}

function hasComponentsV2(payload) {
  return Array.isArray(payload?.components)
    && payload.components.some((component) => getComponentType(component) === 17);
}

function normalizeMessagePayload(payload, { stripEphemeral = false } = {}) {
  const normalized = { ...payload };
  if (hasComponentsV2(normalized)) {
    normalized.flags = Number(normalized.flags || 0) | MessageFlags.IsComponentsV2;
  }

  if (stripEphemeral && normalized.flags !== undefined) {
    normalized.flags = Number(normalized.flags) & ~MessageFlags.Ephemeral;
  }

  return normalized;
}

async function safeEditReply(interaction, payload) {
  return interaction.editReply(normalizeMessagePayload(payload)).catch((error) => {
    if (isUnknownMessageError(error) || isComponentsV2EditError(error)) return null;
    throw error;
  });
}

async function findGuildNoticeChannel(guild) {
  await guild.channels.fetch().catch(() => null);
  const botMember = await guild.members.fetchMe().catch(() => guild.members.me || null);
  if (!botMember) return null;

  const channels = guild.channels.cache
    .filter((channel) => {
      if (!channel?.isTextBased?.()) return false;
      if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) return false;

      const permissions = channel.permissionsFor(botMember);
      return permissions?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages
      ]);
    })
    .sort((a, b) => (a.rawPosition ?? a.position ?? 0) - (b.rawPosition ?? b.position ?? 0));

  return channels.first() || null;
}

async function deliverInteractionResult(interaction, payload) {
  const messagePayload = {
    ...payload,
    allowedMentions: { parse: [], repliedUser: false }
  };
  const publicMessagePayload = normalizeMessagePayload(messagePayload, { stripEphemeral: true });

  const edited = await safeEditReply(interaction, messagePayload).catch(() => null);
  if (edited) return true;

  const dmSent = await interaction.user.send(publicMessagePayload).then(() => true).catch(() => false);
  if (dmSent) return true;

  const channel = await findGuildNoticeChannel(interaction.guild).catch(() => null);
  if (!channel) return false;

  return channel.send(publicMessagePayload).then(() => true).catch(() => false);
}

module.exports = {
  deliverInteractionResult,
  isComponentsV2EditError,
  isUnknownMessageError,
  normalizeMessagePayload,
  safeEditReply
};
