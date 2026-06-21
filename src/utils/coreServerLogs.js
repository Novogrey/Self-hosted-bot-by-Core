const {
  AttachmentBuilder,
  AuditLogEvent,
  ChannelType,
  ContainerBuilder,
  FileBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SeparatorBuilder,
  TextDisplayBuilder,
  resolveColor
} = require('discord.js');

const CORE_GUILD_ID = '1451626981803298890';
const LOG_CHANNELS = {
  moderation: '1452672917442662410',
  chat: '1452672979702911128',
  other: '1453450296054386699'
};

const LONG_TEXT_LIMIT = 900;
const FIELD_LIMIT = 950;
const DESCRIPTION_LIMIT = 1800;

const CHANNEL_TYPES = {
  [ChannelType.GuildText]: 'Text channel',
  [ChannelType.GuildVoice]: 'Voice channel',
  [ChannelType.GuildCategory]: 'Category',
  [ChannelType.GuildAnnouncement]: 'Announcement channel',
  [ChannelType.AnnouncementThread]: 'Announcement thread',
  [ChannelType.PublicThread]: 'Public thread',
  [ChannelType.PrivateThread]: 'Private thread',
  [ChannelType.GuildStageVoice]: 'Stage channel',
  [ChannelType.GuildForum]: 'Forum channel',
  [ChannelType.GuildMedia]: 'Media channel'
};

function isCoreGuild(guildOrId) {
  const id = typeof guildOrId === 'string' ? guildOrId : guildOrId?.id;
  return id === CORE_GUILD_ID;
}

function truncate(value, limit = FIELD_LIMIT) {
  const text = String(value ?? '');
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function safeInline(value) {
  return String(value ?? 'unknown').replace(/\n/g, ' ').trim() || 'unknown';
}

function formatUser(user) {
  if (!user) return 'Unknown';
  const tag = user.tag || user.username || user.displayName || 'Unknown user';
  return `${tag} (<@${user.id}>)\nID: ${user.id}`;
}

function formatMember(member) {
  if (!member) return 'Unknown';
  return `${member.user?.tag || member.displayName || member.id} (<@${member.id}>)\nID: ${member.id}`;
}

function formatChannel(channel) {
  if (!channel) return 'Unknown';
  const mention = channel.id ? `<#${channel.id}>` : safeInline(channel.name);
  const name = channel.name ? `#${channel.name}` : 'unknown';
  return `${mention} (${name})\nID: ${channel.id || 'unknown'}`;
}

function formatRole(role) {
  if (!role) return 'Unknown';
  return `${role} (${role.name || 'role'})\nID: ${role.id}`;
}

function channelTypeName(type) {
  return CHANNEL_TYPES[type] || `Type ${type}`;
}

function addField(fields, name, value) {
  if (value === undefined || value === null || value === '') return fields;
  fields.push({ name, value: truncate(value) });
  return fields;
}

function makeTextAttachment(name, content) {
  const safeName = String(name || 'core-log.txt')
    .replace(/[^a-z0-9_.-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'core-log.txt';

  return {
    name: safeName.endsWith('.txt') ? safeName : `${safeName}.txt`,
    content: String(content || '')
  };
}

function addLongText(fields, attachments, label, content, fileName) {
  const text = String(content || '');
  if (!text.trim()) {
    addField(fields, label, 'No text content.');
    return;
  }

  if (text.length <= LONG_TEXT_LIMIT) {
    addField(fields, label, text);
    return;
  }

  const attachment = makeTextAttachment(fileName, text);
  attachments.push(attachment);
  addField(fields, label, `Text is too large for a log card. Attached as \`${attachment.name}\`.`);
}

function buildLogPayload({ title, description, fields = [], color = '#44B8DE', footer, attachments = [] }) {
  const container = new ContainerBuilder()
    .setAccentColor(resolveColor(color))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${truncate(title || 'Core log', 200)}`));

  if (description) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(truncate(description, DESCRIPTION_LIMIT)));
  }

  const visibleFields = fields.filter((field) => field?.name && field?.value).slice(0, 10);
  if (visibleFields.length) {
    container.addSeparatorComponents(new SeparatorBuilder());
    for (const field of visibleFields) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${truncate(field.name, 100)}**\n${truncate(field.value)}`)
      );
    }
  }

  const files = attachments.map((attachment) => {
    return new AttachmentBuilder(Buffer.from(String(attachment.content || ''), 'utf8'), {
      name: attachment.name
    });
  });

  if (files.length) {
    container.addSeparatorComponents(new SeparatorBuilder());
    for (const attachment of attachments) {
      container.addFileComponents(new FileBuilder({ file: { url: `attachment://${attachment.name}` } }));
    }
  }

  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(footer || `-# Core logs | <t:${Math.floor(Date.now() / 1000)}:f>`)
  );

  return {
    flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
    components: [container],
    files,
    allowedMentions: { parse: [], users: [], roles: [], repliedUser: false }
  };
}

async function sendCoreLog(guild, category, payload) {
  if (!isCoreGuild(guild)) return false;

  const channelId = LOG_CHANNELS[category] || LOG_CHANNELS.other;
  const channel = guild.channels.cache.get(channelId) || await guild.client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased?.()) return false;

  return channel.send(buildLogPayload(payload)).then(() => true).catch((error) => {
    console.error(`[${new Date().toISOString()}] Failed to send Core ${category} log: ${error.message}`);
    return false;
  });
}

async function fetchRecentAuditLog(guild, type, { targetId, channelId, maxAgeMs = 12_000 } = {}) {
  if (!isCoreGuild(guild)) return null;

  const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
  if (!me?.permissions?.has(PermissionFlagsBits.ViewAuditLog)) return null;

  const logs = await guild.fetchAuditLogs({ type, limit: 6 }).catch(() => null);
  if (!logs?.entries?.size) return null;

  const now = Date.now();
  return logs.entries.find((entry) => {
    if (now - entry.createdTimestamp > maxAgeMs) return false;
    if (targetId && entry.target?.id !== targetId && entry.targetId !== targetId) return false;
    if (channelId) {
      const extraChannelId = entry.extra?.channel?.id || entry.extra?.channelId;
      if (extraChannelId && extraChannelId !== channelId) return false;
    }
    return true;
  }) || null;
}

function auditExecutorField(entry) {
  return entry?.executor ? formatUser(entry.executor) : 'Not found in audit log.';
}

function auditReason(entry) {
  return entry?.reason || 'No reason in audit log.';
}

function roleDiff(oldMember, newMember) {
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;
  const added = newRoles.filter((role) => !oldRoles.has(role.id));
  const removed = oldRoles.filter((role) => !newRoles.has(role.id));
  return { added, removed };
}

function optionToText(option, depth = 0) {
  const prefix = depth ? '  '.repeat(depth) : '';
  if (Array.isArray(option.options) && option.options.length) {
    return [
      `${prefix}${option.name}:`,
      ...option.options.map((child) => optionToText(child, depth + 1))
    ].join('\n');
  }

  const value = option.attachment?.url || option.channel?.id || option.role?.id || option.user?.id || option.member?.id || option.value;
  return `${prefix}${option.name}: ${safeInline(value)}`;
}

function serializeInteractionOptions(interaction) {
  const options = interaction.options?.data || [];
  if (!options.length) return 'No options.';
  return options.map((option) => optionToText(option)).join('\n');
}

async function logCoreModeratorCommand(interaction, command, status = 'completed') {
  if (!isCoreGuild(interaction.guild) || command?.category !== 'moderators') return false;

  const fields = [];
  addField(fields, 'Moderator', formatUser(interaction.user));
  addField(fields, 'Channel', formatChannel(interaction.channel));
  addField(fields, 'Command', `/${interaction.commandName}`);
  addField(fields, 'Status', status);
  addField(fields, 'Options', serializeInteractionOptions(interaction));

  return sendCoreLog(interaction.guild, 'moderation', {
    title: 'Moderation command used',
    description: `A moderator command was ${status}.`,
    fields,
    color: status === 'failed' ? '#FF5D00' : '#FFB000'
  });
}

async function logMessageDelete(message) {
  const guild = message.guild;
  if (!isCoreGuild(guild)) return false;

  const author = message.author || message.partial ? message.author : null;
  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.MessageDelete, {
    targetId: author?.id,
    channelId: message.channelId
  });

  const fields = [];
  const attachments = [];
  addField(fields, 'Author', author ? formatUser(author) : 'Unknown or uncached.');
  addField(fields, 'Channel', formatChannel(message.channel));
  addField(fields, 'Message ID', message.id);
  addField(fields, 'Deleted by', audit?.executor ? auditExecutorField(audit) : 'Likely the author or an uncached action.');
  addLongText(fields, attachments, 'Deleted text', message.content || '', `deleted-message-${message.id}.txt`);

  const attachmentUrls = [...(message.attachments?.values?.() || [])].map((attachment) => attachment.url);
  if (attachmentUrls.length) addField(fields, 'Attachments', attachmentUrls.join('\n'));

  return sendCoreLog(guild, 'chat', {
    title: audit?.executor ? 'Message deleted by moderator' : 'Message deleted',
    description: 'A message was removed from a chat channel.',
    fields,
    attachments,
    color: '#FF5D00'
  });
}

async function logMessageBulkDelete(messages, channel) {
  const guild = channel?.guild;
  if (!isCoreGuild(guild)) return false;

  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.MessageBulkDelete, {
    channelId: channel.id
  });
  const lines = [...messages.values()]
    .sort((a, b) => (a.createdTimestamp || 0) - (b.createdTimestamp || 0))
    .map((message) => {
      const author = message.author ? `${message.author.tag || message.author.id} (${message.author.id})` : 'Unknown author';
      return [
        `Message: ${message.id}`,
        `Author: ${author}`,
        `Created: ${message.createdTimestamp ? new Date(message.createdTimestamp).toISOString() : 'unknown'}`,
        `Content: ${message.content || '[no text content]'}`,
        ''
      ].join('\n');
    });

  const fields = [];
  const attachments = [makeTextAttachment(`bulk-delete-${Date.now()}.txt`, lines.join('\n'))];
  addField(fields, 'Channel', formatChannel(channel));
  addField(fields, 'Deleted messages', String(messages.size));
  addField(fields, 'Deleted by', auditExecutorField(audit));
  addField(fields, 'Reason', auditReason(audit));

  return sendCoreLog(guild, 'chat', {
    title: 'Bulk message delete',
    description: 'Multiple messages were deleted. Full cached content is attached as a txt file.',
    fields,
    attachments,
    color: '#FF5D00'
  });
}

async function logMessageUpdate(oldMessage, newMessage) {
  const guild = newMessage.guild || oldMessage.guild;
  if (!isCoreGuild(guild)) return false;
  if (oldMessage.partial || newMessage.partial) return false;
  if ((oldMessage.content || '') === (newMessage.content || '')) return false;

  const fields = [];
  const attachments = [];
  addField(fields, 'Author', newMessage.author ? formatUser(newMessage.author) : 'Unknown.');
  addField(fields, 'Channel', formatChannel(newMessage.channel));
  addField(fields, 'Message', `[Jump to message](${newMessage.url})\nID: ${newMessage.id}`);
  addLongText(fields, attachments, 'Before', oldMessage.content || '', `message-before-${newMessage.id}.txt`);
  addLongText(fields, attachments, 'After', newMessage.content || '', `message-after-${newMessage.id}.txt`);

  return sendCoreLog(guild, 'chat', {
    title: 'Message edited',
    description: 'A message was edited in a chat channel.',
    fields,
    attachments,
    color: '#44B8DE'
  });
}

async function logVoiceStateUpdate(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  if (!isCoreGuild(guild)) return false;
  if (oldState.channelId === newState.channelId) return false;

  const action = !oldState.channelId
    ? 'joined a voice channel'
      : !newState.channelId
        ? 'left a voice channel'
        : 'moved voice channels';
  const movedBetweenChannels = Boolean(oldState.channelId && newState.channelId);
  const disconnectedFromChannel = Boolean(oldState.channelId && !newState.channelId);
  const moveAudit = movedBetweenChannels && AuditLogEvent.MemberMove
    ? await fetchRecentAuditLog(guild, AuditLogEvent.MemberMove, { channelId: newState.channelId, maxAgeMs: 12_000 })
    : null;
  const disconnectAudit = disconnectedFromChannel && AuditLogEvent.MemberDisconnect
    ? await fetchRecentAuditLog(guild, AuditLogEvent.MemberDisconnect, { channelId: oldState.channelId, maxAgeMs: 12_000 })
    : null;

  const fields = [];
  addField(fields, 'Member', formatMember(newState.member || oldState.member));
  addField(fields, 'Before', oldState.channel ? formatChannel(oldState.channel) : 'Not in voice.');
  addField(fields, 'After', newState.channel ? formatChannel(newState.channel) : 'Not in voice.');
  if (movedBetweenChannels) {
    addField(fields, 'Moved by', auditExecutorField(moveAudit));
  }
  if (disconnectedFromChannel) {
    addField(fields, 'Disconnected by', auditExecutorField(disconnectAudit));
  }

  return sendCoreLog(guild, 'chat', {
    title: 'Voice channel transition',
    description: `A member ${action}.`,
    fields,
    color: '#5865F2'
  });
}

async function logMemberRoleOrTimeoutUpdate(oldMember, newMember) {
  const guild = newMember.guild || oldMember.guild;
  if (!isCoreGuild(guild)) return false;

  const oldTimeout = oldMember.communicationDisabledUntilTimestamp || 0;
  const newTimeout = newMember.communicationDisabledUntilTimestamp || 0;
  if (oldTimeout !== newTimeout) {
    const audit = await fetchRecentAuditLog(guild, AuditLogEvent.MemberUpdate, { targetId: newMember.id });
    const fields = [];
    addField(fields, 'Member', formatMember(newMember));
    addField(fields, 'Moderator', auditExecutorField(audit));
    addField(fields, 'Reason', auditReason(audit));
    addField(fields, 'Timeout before', oldTimeout ? `<t:${Math.floor(oldTimeout / 1000)}:F>` : 'No timeout.');
    addField(fields, 'Timeout after', newTimeout ? `<t:${Math.floor(newTimeout / 1000)}:F>` : 'No timeout.');

    await sendCoreLog(guild, 'moderation', {
      title: newTimeout ? 'Timeout applied or changed' : 'Timeout removed',
      description: 'A member timeout was changed.',
      fields,
      color: newTimeout ? '#FFB000' : '#00A86B'
    });
  }

  if (oldMember.nickname !== newMember.nickname) {
    const audit = await fetchRecentAuditLog(guild, AuditLogEvent.MemberUpdate, { targetId: newMember.id });
    const fields = [];
    addField(fields, 'Member', formatMember(newMember));
    addField(fields, 'Changed by', auditExecutorField(audit));
    addField(fields, 'Nickname before', oldMember.nickname || 'No nickname.');
    addField(fields, 'Nickname after', newMember.nickname || 'No nickname.');

    await sendCoreLog(guild, 'other', {
      title: 'Member nickname changed',
      description: 'A member nickname was changed.',
      fields,
      color: '#44B8DE'
    });
  }

  const { added, removed } = roleDiff(oldMember, newMember);
  if (!added.size && !removed.size) return false;

  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.MemberRoleUpdate, { targetId: newMember.id });
  const fields = [];
  addField(fields, 'Member', formatMember(newMember));
  addField(fields, 'Changed by', auditExecutorField(audit));
  if (added.size) addField(fields, 'Roles added', added.map(formatRole).join('\n'));
  if (removed.size) addField(fields, 'Roles removed', removed.map(formatRole).join('\n'));

  return sendCoreLog(guild, 'other', {
    title: 'Member roles changed',
    description: 'A member received or lost roles.',
    fields,
    color: '#44B8DE'
  });
}

async function logGuildBanAdd(ban) {
  const guild = ban.guild;
  if (!isCoreGuild(guild)) return false;
  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.MemberBanAdd, { targetId: ban.user.id });
  const fields = [];
  addField(fields, 'User', formatUser(ban.user));
  addField(fields, 'Moderator', auditExecutorField(audit));
  addField(fields, 'Reason', auditReason(audit));

  return sendCoreLog(guild, 'moderation', {
    title: 'User banned',
    description: 'A user was banned from the server.',
    fields,
    color: '#FF5D00'
  });
}

async function logGuildBanRemove(ban) {
  const guild = ban.guild;
  if (!isCoreGuild(guild)) return false;
  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.MemberBanRemove, { targetId: ban.user.id });
  const fields = [];
  addField(fields, 'User', formatUser(ban.user));
  addField(fields, 'Moderator', auditExecutorField(audit));
  addField(fields, 'Reason', auditReason(audit));

  return sendCoreLog(guild, 'moderation', {
    title: 'User unbanned',
    description: 'A user was unbanned.',
    fields,
    color: '#00A86B'
  });
}

async function logGuildMemberRemove(member) {
  const guild = member.guild;
  if (!isCoreGuild(guild)) return false;
  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.MemberKick, { targetId: member.id });
  const isKick = Boolean(audit?.executor);
  const fields = [];
  addField(fields, 'Member', formatMember(member));
  if (isKick) {
    addField(fields, 'Moderator', auditExecutorField(audit));
    addField(fields, 'Reason', auditReason(audit));
  }

  return sendCoreLog(guild, isKick ? 'moderation' : 'other', {
    title: isKick ? 'Member kicked' : 'Member left',
    description: isKick ? 'A member was kicked from the server.' : 'A member left the server.',
    fields,
    color: isKick ? '#FF5D00' : '#80848E'
  });
}

async function logGuildMemberAdd(member) {
  if (!isCoreGuild(member.guild)) return false;
  const fields = [];
  addField(fields, 'Member', formatMember(member));
  addField(fields, 'Account created', member.user?.createdTimestamp ? `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>` : 'Unknown.');

  return sendCoreLog(member.guild, 'other', {
    title: 'Member joined',
    description: 'A new member joined the server.',
    fields,
    color: '#00A86B'
  });
}

function channelUpdateFields(oldChannel, newChannel) {
  const fields = [];
  const changes = [];
  if (oldChannel.name !== newChannel.name) changes.push(`Name: ${oldChannel.name} -> ${newChannel.name}`);
  if (oldChannel.parentId !== newChannel.parentId) changes.push(`Parent: ${oldChannel.parentId || 'none'} -> ${newChannel.parentId || 'none'}`);
  if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) changes.push(`Slowmode: ${oldChannel.rateLimitPerUser || 0}s -> ${newChannel.rateLimitPerUser || 0}s`);
  if (oldChannel.nsfw !== newChannel.nsfw) changes.push(`NSFW: ${Boolean(oldChannel.nsfw)} -> ${Boolean(newChannel.nsfw)}`);
  addField(fields, 'Channel', formatChannel(newChannel));
  addField(fields, 'Type', channelTypeName(newChannel.type));
  addField(fields, 'Changes', changes.length ? changes.join('\n') : 'Settings changed.');
  return fields;
}

async function logChannelCreate(channel) {
  const guild = channel.guild;
  if (!isCoreGuild(guild)) return false;
  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.ChannelCreate, { targetId: channel.id });
  const fields = [];
  addField(fields, 'Channel', formatChannel(channel));
  addField(fields, 'Type', channelTypeName(channel.type));
  addField(fields, 'Created by', auditExecutorField(audit));

  return sendCoreLog(guild, 'other', {
    title: 'Channel created',
    description: 'A server channel was created.',
    fields,
    color: '#00A86B'
  });
}

async function logChannelDelete(channel) {
  const guild = channel.guild;
  if (!isCoreGuild(guild)) return false;
  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.ChannelDelete, { targetId: channel.id });
  const fields = [];
  addField(fields, 'Channel', `${channel.name || 'unknown'}\nID: ${channel.id}`);
  addField(fields, 'Type', channelTypeName(channel.type));
  addField(fields, 'Deleted by', auditExecutorField(audit));

  return sendCoreLog(guild, 'other', {
    title: 'Channel deleted',
    description: 'A server channel was deleted.',
    fields,
    color: '#FF5D00'
  });
}

async function logChannelUpdate(oldChannel, newChannel) {
  const guild = newChannel.guild || oldChannel.guild;
  if (!isCoreGuild(guild)) return false;
  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.ChannelUpdate, { targetId: newChannel.id });
  const fields = channelUpdateFields(oldChannel, newChannel);
  addField(fields, 'Changed by', auditExecutorField(audit));

  return sendCoreLog(guild, 'other', {
    title: 'Channel updated',
    description: 'A server channel was changed.',
    fields,
    color: '#FFB000'
  });
}

function roleUpdateFields(oldRole, newRole) {
  const fields = [];
  const changes = [];
  if (oldRole.name !== newRole.name) changes.push(`Name: ${oldRole.name} -> ${newRole.name}`);
  if (oldRole.hexColor !== newRole.hexColor) changes.push(`Color: ${oldRole.hexColor} -> ${newRole.hexColor}`);
  if (oldRole.hoist !== newRole.hoist) changes.push(`Hoist: ${oldRole.hoist} -> ${newRole.hoist}`);
  if (oldRole.mentionable !== newRole.mentionable) changes.push(`Mentionable: ${oldRole.mentionable} -> ${newRole.mentionable}`);
  if (oldRole.position !== newRole.position) changes.push(`Position: ${oldRole.position} -> ${newRole.position}`);
  if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) changes.push('Permissions changed.');
  addField(fields, 'Role', formatRole(newRole));
  addField(fields, 'Changes', changes.length ? changes.join('\n') : 'Role settings changed.');
  return fields;
}

async function logRoleCreate(role) {
  if (!isCoreGuild(role.guild)) return false;
  const audit = await fetchRecentAuditLog(role.guild, AuditLogEvent.RoleCreate, { targetId: role.id });
  const fields = [];
  addField(fields, 'Role', formatRole(role));
  addField(fields, 'Created by', auditExecutorField(audit));

  return sendCoreLog(role.guild, 'other', {
    title: 'Role created',
    description: 'A server role was created.',
    fields,
    color: '#00A86B'
  });
}

async function logRoleDelete(role) {
  if (!isCoreGuild(role.guild)) return false;
  const audit = await fetchRecentAuditLog(role.guild, AuditLogEvent.RoleDelete, { targetId: role.id });
  const fields = [];
  addField(fields, 'Role', `${role.name || 'role'}\nID: ${role.id}`);
  addField(fields, 'Deleted by', auditExecutorField(audit));

  return sendCoreLog(role.guild, 'other', {
    title: 'Role deleted',
    description: 'A server role was deleted.',
    fields,
    color: '#FF5D00'
  });
}

async function logRoleUpdate(oldRole, newRole) {
  if (!isCoreGuild(newRole.guild)) return false;
  const audit = await fetchRecentAuditLog(newRole.guild, AuditLogEvent.RoleUpdate, { targetId: newRole.id });
  const fields = roleUpdateFields(oldRole, newRole);
  addField(fields, 'Changed by', auditExecutorField(audit));

  return sendCoreLog(newRole.guild, 'other', {
    title: 'Role updated',
    description: 'A server role was changed.',
    fields,
    color: '#FFB000'
  });
}

async function logGuildUpdate(oldGuild, newGuild) {
  if (!isCoreGuild(newGuild)) return false;
  const audit = await fetchRecentAuditLog(newGuild, AuditLogEvent.GuildUpdate);
  const changes = [];
  if (oldGuild.name !== newGuild.name) changes.push(`Name: ${oldGuild.name} -> ${newGuild.name}`);
  if (oldGuild.description !== newGuild.description) changes.push(`Description changed.`);
  if (oldGuild.verificationLevel !== newGuild.verificationLevel) changes.push(`Verification level: ${oldGuild.verificationLevel} -> ${newGuild.verificationLevel}`);
  if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) changes.push(`Content filter: ${oldGuild.explicitContentFilter} -> ${newGuild.explicitContentFilter}`);
  if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) changes.push(`Default notifications: ${oldGuild.defaultMessageNotifications} -> ${newGuild.defaultMessageNotifications}`);

  const fields = [];
  addField(fields, 'Changed by', auditExecutorField(audit));
  addField(fields, 'Changes', changes.length ? changes.join('\n') : 'Server settings changed.');

  return sendCoreLog(newGuild, 'other', {
    title: 'Server settings changed',
    description: 'Guild settings were updated.',
    fields,
    color: '#FFB000'
  });
}

async function logInviteCreate(invite) {
  if (!isCoreGuild(invite.guild)) return false;
  const audit = await fetchRecentAuditLog(invite.guild, AuditLogEvent.InviteCreate);
  const fields = [];
  addField(fields, 'Invite', invite.code ? `https://discord.gg/${invite.code}` : 'Unknown invite code.');
  addField(fields, 'Channel', formatChannel(invite.channel));
  addField(fields, 'Created by', invite.inviter ? formatUser(invite.inviter) : auditExecutorField(audit));
  addField(fields, 'Max uses', invite.maxUses ? String(invite.maxUses) : 'Unlimited or unknown.');

  return sendCoreLog(invite.guild, 'other', {
    title: 'Invite created',
    description: 'A server invite was created.',
    fields,
    color: '#00A86B'
  });
}

async function logInviteDelete(invite) {
  if (!isCoreGuild(invite.guild)) return false;
  const audit = await fetchRecentAuditLog(invite.guild, AuditLogEvent.InviteDelete);
  const fields = [];
  addField(fields, 'Invite code', invite.code || 'Unknown.');
  addField(fields, 'Channel', formatChannel(invite.channel));
  addField(fields, 'Deleted by', auditExecutorField(audit));

  return sendCoreLog(invite.guild, 'other', {
    title: 'Invite deleted',
    description: 'A server invite was deleted.',
    fields,
    color: '#FF5D00'
  });
}

async function logWebhookUpdate(channel) {
  const guild = channel.guild;
  if (!isCoreGuild(guild)) return false;
  const audit = await fetchRecentAuditLog(guild, AuditLogEvent.WebhookUpdate, { channelId: channel.id });
  const fields = [];
  addField(fields, 'Channel', formatChannel(channel));
  addField(fields, 'Changed by', auditExecutorField(audit));

  return sendCoreLog(guild, 'other', {
    title: 'Webhook updated',
    description: 'A channel webhook was created, changed or deleted.',
    fields,
    color: '#FFB000'
  });
}

async function logEmojiCreate(emoji) {
  if (!isCoreGuild(emoji.guild)) return false;
  const audit = await fetchRecentAuditLog(emoji.guild, AuditLogEvent.EmojiCreate, { targetId: emoji.id });
  const fields = [];
  addField(fields, 'Emoji', `${emoji} ${emoji.name}\nID: ${emoji.id}`);
  addField(fields, 'Created by', auditExecutorField(audit));

  return sendCoreLog(emoji.guild, 'other', {
    title: 'Emoji created',
    description: 'A server emoji was created.',
    fields,
    color: '#00A86B'
  });
}

async function logEmojiDelete(emoji) {
  if (!isCoreGuild(emoji.guild)) return false;
  const audit = await fetchRecentAuditLog(emoji.guild, AuditLogEvent.EmojiDelete, { targetId: emoji.id });
  const fields = [];
  addField(fields, 'Emoji', `${emoji.name}\nID: ${emoji.id}`);
  addField(fields, 'Deleted by', auditExecutorField(audit));

  return sendCoreLog(emoji.guild, 'other', {
    title: 'Emoji deleted',
    description: 'A server emoji was deleted.',
    fields,
    color: '#FF5D00'
  });
}

async function logEmojiUpdate(oldEmoji, newEmoji) {
  if (!isCoreGuild(newEmoji.guild)) return false;
  const audit = await fetchRecentAuditLog(newEmoji.guild, AuditLogEvent.EmojiUpdate, { targetId: newEmoji.id });
  const fields = [];
  addField(fields, 'Emoji', `${newEmoji} ${newEmoji.name}\nID: ${newEmoji.id}`);
  addField(fields, 'Changed by', auditExecutorField(audit));
  addField(fields, 'Changes', oldEmoji.name !== newEmoji.name ? `Name: ${oldEmoji.name} -> ${newEmoji.name}` : 'Emoji settings changed.');

  return sendCoreLog(newEmoji.guild, 'other', {
    title: 'Emoji updated',
    description: 'A server emoji was changed.',
    fields,
    color: '#FFB000'
  });
}

async function logStickerCreate(sticker) {
  if (!isCoreGuild(sticker.guild)) return false;
  const audit = await fetchRecentAuditLog(sticker.guild, AuditLogEvent.StickerCreate, { targetId: sticker.id });
  const fields = [];
  addField(fields, 'Sticker', `${sticker.name}\nID: ${sticker.id}`);
  addField(fields, 'Created by', auditExecutorField(audit));

  return sendCoreLog(sticker.guild, 'other', {
    title: 'Sticker created',
    description: 'A server sticker was created.',
    fields,
    color: '#00A86B'
  });
}

async function logStickerDelete(sticker) {
  if (!isCoreGuild(sticker.guild)) return false;
  const audit = await fetchRecentAuditLog(sticker.guild, AuditLogEvent.StickerDelete, { targetId: sticker.id });
  const fields = [];
  addField(fields, 'Sticker', `${sticker.name}\nID: ${sticker.id}`);
  addField(fields, 'Deleted by', auditExecutorField(audit));

  return sendCoreLog(sticker.guild, 'other', {
    title: 'Sticker deleted',
    description: 'A server sticker was deleted.',
    fields,
    color: '#FF5D00'
  });
}

async function logStickerUpdate(oldSticker, newSticker) {
  if (!isCoreGuild(newSticker.guild)) return false;
  const audit = await fetchRecentAuditLog(newSticker.guild, AuditLogEvent.StickerUpdate, { targetId: newSticker.id });
  const changes = [];
  if (oldSticker.name !== newSticker.name) changes.push(`Name: ${oldSticker.name} -> ${newSticker.name}`);
  if (oldSticker.description !== newSticker.description) changes.push('Description changed.');
  if (oldSticker.tags !== newSticker.tags) changes.push(`Tags: ${oldSticker.tags || 'none'} -> ${newSticker.tags || 'none'}`);

  const fields = [];
  addField(fields, 'Sticker', `${newSticker.name}\nID: ${newSticker.id}`);
  addField(fields, 'Changed by', auditExecutorField(audit));
  addField(fields, 'Changes', changes.length ? changes.join('\n') : 'Sticker settings changed.');

  return sendCoreLog(newSticker.guild, 'other', {
    title: 'Sticker updated',
    description: 'A server sticker was changed.',
    fields,
    color: '#FFB000'
  });
}

async function logThreadCreate(thread) {
  if (!isCoreGuild(thread.guild)) return false;
  const audit = await fetchRecentAuditLog(thread.guild, AuditLogEvent.ThreadCreate, { targetId: thread.id });
  const fields = [];
  addField(fields, 'Thread', formatChannel(thread));
  addField(fields, 'Parent', thread.parent ? formatChannel(thread.parent) : 'Unknown.');
  addField(fields, 'Created by', auditExecutorField(audit));

  return sendCoreLog(thread.guild, 'other', {
    title: 'Thread created',
    description: 'A thread was created.',
    fields,
    color: '#00A86B'
  });
}

async function logThreadDelete(thread) {
  if (!isCoreGuild(thread.guild)) return false;
  const audit = await fetchRecentAuditLog(thread.guild, AuditLogEvent.ThreadDelete, { targetId: thread.id });
  const fields = [];
  addField(fields, 'Thread', `${thread.name || 'thread'}\nID: ${thread.id}`);
  addField(fields, 'Parent', thread.parent ? formatChannel(thread.parent) : 'Unknown.');
  addField(fields, 'Deleted by', auditExecutorField(audit));

  return sendCoreLog(thread.guild, 'other', {
    title: 'Thread deleted',
    description: 'A thread was deleted.',
    fields,
    color: '#FF5D00'
  });
}

async function logThreadUpdate(oldThread, newThread) {
  if (!isCoreGuild(newThread.guild)) return false;
  const audit = await fetchRecentAuditLog(newThread.guild, AuditLogEvent.ThreadUpdate, { targetId: newThread.id });
  const changes = [];
  if (oldThread.name !== newThread.name) changes.push(`Name: ${oldThread.name} -> ${newThread.name}`);
  if (oldThread.archived !== newThread.archived) changes.push(`Archived: ${oldThread.archived} -> ${newThread.archived}`);
  if (oldThread.locked !== newThread.locked) changes.push(`Locked: ${oldThread.locked} -> ${newThread.locked}`);

  const fields = [];
  addField(fields, 'Thread', formatChannel(newThread));
  addField(fields, 'Changed by', auditExecutorField(audit));
  addField(fields, 'Changes', changes.length ? changes.join('\n') : 'Thread settings changed.');

  return sendCoreLog(newThread.guild, 'other', {
    title: 'Thread updated',
    description: 'A thread was changed.',
    fields,
    color: '#FFB000'
  });
}

module.exports = {
  CORE_GUILD_ID,
  LOG_CHANNELS,
  addLongText,
  buildLogPayload,
  fetchRecentAuditLog,
  isCoreGuild,
  logChannelCreate,
  logChannelDelete,
  logChannelUpdate,
  logCoreModeratorCommand,
  logEmojiCreate,
  logEmojiDelete,
  logEmojiUpdate,
  logGuildBanAdd,
  logGuildBanRemove,
  logGuildMemberAdd,
  logGuildMemberRemove,
  logGuildUpdate,
  logInviteCreate,
  logInviteDelete,
  logMemberRoleOrTimeoutUpdate,
  logMessageBulkDelete,
  logMessageDelete,
  logMessageUpdate,
  logRoleCreate,
  logRoleDelete,
  logRoleUpdate,
  logStickerCreate,
  logStickerDelete,
  logStickerUpdate,
  logThreadCreate,
  logThreadDelete,
  logThreadUpdate,
  logVoiceStateUpdate,
  logWebhookUpdate,
  sendCoreLog
};
