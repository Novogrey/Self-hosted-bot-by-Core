const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { getTargetGuildId } = require('../../utils/botRuntimeConfig');
require('dotenv').config({ quiet: true });

const {
  DEV,
  ADMIN_ROLES_LEVEL_0,
  ADMIN_LOG_CHANNEL_ID
} = process.env;

const TARGET_GUILD_ID = getTargetGuildId();
const allowedRoles = ADMIN_ROLES_LEVEL_0 ? ADMIN_ROLES_LEVEL_0.split(',').map((id) => id.trim()).filter(Boolean) : [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refreshcommands')
    .setDescription('Refreshes bot commands.'),

  async execute(interaction, client) {
    if (!interaction.guild) return;

    if (!TARGET_GUILD_ID || interaction.guild.id !== TARGET_GUILD_ID) {
      return interaction.reply({
        content: TARGET_GUILD_ID
          ? `This command set is only available on server ${TARGET_GUILD_ID}.`
          : 'Guild-only command target is not configured for this bot.',
        ephemeral: true
      });
    }

    const hasRole = interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id));
    if (interaction.user.id !== DEV && !hasRole) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await client.handleCommands({ includeAllGuilds: true });

      const globalCount = client.globalCommandArray?.length || 0;
      const targetCount = client.guildCommandArray?.length || 0;

      const logChannel = interaction.guild.channels.cache.get(ADMIN_LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({
          content: `Slash commands refreshed by ${interaction.user.tag}. Target guild-only commands: ${targetCount}. Global commands: ${globalCount}.`,
          flags: MessageFlags.SuppressNotifications,
          allowedMentions: { parse: [], repliedUser: false }
        }).catch(() => null);
      }

      await interaction.editReply(`Commands refreshed. ${globalCount} global command(s), ${targetCount} guild-only command(s) on ${TARGET_GUILD_ID}.`);
    } catch (error) {
      console.error('Failed to refresh slash commands:', error);
      await interaction.editReply('Failed to refresh commands. Check the console logs.');
    }
  }
};
