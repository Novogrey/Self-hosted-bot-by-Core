const {
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  resolveColor
} = require('discord.js');
const chalk = require('chalk');

const JOIN_LOG_CHANNEL_ID = process.env.BOT_GUILD_JOIN_LOG_CHANNEL_ID || '1500201054539878553';

const TEXT = {
  unknown: '\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u043e',
  title: '\u0411\u043e\u0442 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440',
  server: '\u0421\u0435\u0440\u0432\u0435\u0440',
  owner: '\u0412\u043b\u0430\u0434\u0435\u043b\u0435\u0446',
  members: '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432',
  guilds: '\u0421\u0435\u0440\u0432\u0435\u0440\u043e\u0432 \u0443 \u0431\u043e\u0442\u0430',
  created: '\u0421\u0435\u0440\u0432\u0435\u0440 \u0441\u043e\u0437\u0434\u0430\u043d',
  added: '\u0411\u043e\u0442 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d'
};

function safeText(value, fallback = TEXT.unknown, maxLength = 300) {
  const text = String(value || fallback)
    .replace(/@/g, '@\u200b')
    .replace(/([\\`*_~>|[\]()])/g, '\\$1')
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0));
}

function formatTimestamp(timestamp) {
  return timestamp ? `<t:${Math.floor(timestamp / 1000)}:f>` : TEXT.unknown;
}

async function fetchLogChannel(client) {
  const channel = client.channels.cache.get(JOIN_LOG_CHANNEL_ID)
    || await client.channels.fetch(JOIN_LOG_CHANNEL_ID).catch(() => null);

  return channel?.isTextBased?.() ? channel : null;
}

async function fetchOwnerLabel(guild) {
  const owner = await guild.fetchOwner().catch(() => null);
  if (!owner) {
    return guild.ownerId
      ? `[${TEXT.unknown}](https://discord.com/users/${guild.ownerId}) (ID: \`${guild.ownerId}\`)`
      : TEXT.unknown;
  }

  const label = safeText(owner.user?.tag || owner.displayName || owner.id, owner.id, 80);
  return `[${label}](https://discord.com/users/${owner.id}) (ID: \`${owner.id}\`)`;
}

function buildGuildJoinContent(guild, ownerLabel, client) {
  const totalGuilds = client.guilds.cache.size;
  const addedAt = Math.floor(Date.now() / 1000);

  return [
    `## ${TEXT.title}`,
    `${TEXT.server}: ${safeText(guild.name, TEXT.unknown, 160)} (ID: \`${guild.id}\`)`,
    `- ${TEXT.members}: ${formatNumber(guild.memberCount)}`,
    `- ${TEXT.guilds}: ${formatNumber(totalGuilds)}`,
    `- ${TEXT.owner}: ${ownerLabel}`,
    `- ${TEXT.created}: ${formatTimestamp(guild.createdTimestamp)}`,
    `- ${TEXT.added}: <t:${addedAt}:f>`
  ].join('\n');
}

function buildGuildJoinComponents(guild, ownerLabel, client) {
  const iconUrl = guild.iconURL({ extension: 'png', size: 128 });
  const content = buildGuildJoinContent(guild, ownerLabel, client);
  const container = new ContainerBuilder().setAccentColor(resolveColor('#00A86B'));

  if (!iconUrl) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    return [container];
  }

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconUrl))
  );

  return [container];
}

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    const channel = await fetchLogChannel(client);
    if (!channel) {
      console.warn(chalk.yellow(`[${new Date().toISOString()}] Guild join log channel was not found: ${JOIN_LOG_CHANNEL_ID}`));
      return;
    }

    const ownerLabel = await fetchOwnerLabel(guild);

    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: buildGuildJoinComponents(guild, ownerLabel, client),
      allowedMentions: { parse: [], repliedUser: false }
    }).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Failed to send guild join log for ${guild.id}: ${error.message}`));
    });
  }
};
