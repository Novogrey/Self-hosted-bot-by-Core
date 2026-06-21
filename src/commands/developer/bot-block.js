const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { buildStatusComponents, v2Flags } = require('../../utils/localizedComponents');
const { getDiscordUserLanguage } = require('../../utils/appTranslations');
const {
  blockExpiresText,
  getActiveBotAccessBlock,
  getModel,
  labelsFor,
  listActiveBotAccessBlocks,
  parseDuration,
  parseUserIds,
  removeBotAccessBlocks,
  upsertBotAccessBlocks
} = require('../../utils/botAccessBlocks');

function hasAccess(interaction) {
  return Boolean(process.env.DEV && interaction.user?.id === process.env.DEV);
}

function statusPayload(labels, title, description, fields = [], color = '#44B8DE') {
  return {
    flags: MessageFlags.IsComponentsV2,
    components: buildStatusComponents({
      title,
      description,
      fields,
      color
    }),
    allowedMentions: { parse: [], repliedUser: false }
  };
}

function userList(userIds) {
  return userIds.map((userId) => `- <@${userId}> (${userId})`).join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-block')
    .setDescription('Manages users blocked from public Core bot access.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Blocks one or more user IDs from public bot commands and features.')
        .addStringOption((option) =>
          option
            .setName('user_ids')
            .setDescription('User IDs or mentions, separated by spaces or commas.')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('reason')
            .setDescription('Reason shown to the blocked user.')
            .setMaxLength(500)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('duration')
            .setDescription('Optional duration, for example 30m, 2h, 7d, 1w, 1y. Empty means permanent.')
            .setMaxLength(32)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Removes bot access blocks from one or more user IDs.')
        .addStringOption((option) =>
          option
            .setName('user_ids')
            .setDescription('User IDs or mentions, separated by spaces or commas.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('check')
        .setDescription('Checks whether a user ID is blocked from public bot access.')
        .addStringOption((option) =>
          option
            .setName('user_ids')
            .setDescription('One Discord user ID or mention.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('Shows recent active bot access blocks.')
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: v2Flags(true) });

    const language = await getDiscordUserLanguage(client, interaction.user?.id, 'en');
    const labels = labelsFor(language);

    if (!hasAccess(interaction)) {
      return interaction.editReply(statusPayload(
        labels,
        labels.noPermissionTitle,
        labels.noPermissionDescription,
        [],
        '#ED4245'
      ));
    }

    if (!getModel(client)) {
      return interaction.editReply(statusPayload(
        labels,
        labels.noPermissionTitle,
        labels.notConfigured,
        [],
        '#ED4245'
      ));
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const blocks = await listActiveBotAccessBlocks(client, 20);
      const description = blocks.length
        ? blocks.map((block) => {
          const reason = block.reason || labels.unknownReason;
          return `- <@${block.userId}> (${block.userId})\n  ${labels.reason}: ${reason}\n  ${labels.duration}: ${blockExpiresText(block, labels)}`;
        }).join('\n')
        : labels.emptyList;

      return interaction.editReply(statusPayload(
        labels,
        labels.blockListTitle,
        description,
        [],
        '#44B8DE'
      ));
    }

    const userIds = parseUserIds(interaction.options.getString('user_ids', true));
    if (!userIds.length) {
      return interaction.editReply(statusPayload(
        labels,
        labels.invalidUsersTitle,
        labels.invalidUsersDescription,
        [],
        '#ED4245'
      ));
    }

    if (subcommand === 'check') {
      const block = await getActiveBotAccessBlock(client, userIds[0]);
      const fields = block
        ? [
          { name: labels.reason, value: block.reason || labels.unknownReason },
          { name: labels.duration, value: blockExpiresText(block, labels) }
        ]
        : [];

      return interaction.editReply(statusPayload(
        labels,
        labels.blockCheckTitle,
        block ? `${labels.active}: <@${userIds[0]}> (${userIds[0]})` : `${labels.inactive}: <@${userIds[0]}> (${userIds[0]})`,
        fields,
        block ? '#ED4245' : '#00A86B'
      ));
    }

    if (subcommand === 'remove') {
      const result = await removeBotAccessBlocks(client, userIds);
      return interaction.editReply(statusPayload(
        labels,
        labels.blockRemovedTitle,
        userList(userIds),
        [{ name: labels.removedCount, value: String(result.deletedCount || 0) }],
        '#00A86B'
      ));
    }

    const parsedDuration = parseDuration(interaction.options.getString('duration'));
    if (!parsedDuration.ok) {
      return interaction.editReply(statusPayload(
        labels,
        labels.invalidDurationTitle,
        labels.invalidDurationDescription,
        [],
        '#ED4245'
      ));
    }

    const reason = interaction.options.getString('reason', true).trim() || labels.unknownReason;
    const blocks = await upsertBotAccessBlocks(client, userIds, reason, parsedDuration.durationMs);
    const firstBlock = blocks[0] || { expiresAt: null };

    return interaction.editReply(statusPayload(
      labels,
      labels.blockCreatedTitle,
      userList(userIds),
      [
        { name: labels.reason, value: reason },
        { name: labels.duration, value: blockExpiresText(firstBlock, labels) }
      ],
      '#00A86B'
    ));
  }
};
