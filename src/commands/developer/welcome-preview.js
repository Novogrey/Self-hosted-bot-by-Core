const {
  SlashCommandBuilder
} = require('discord.js');
const { buildStatusComponents, v2Flags } = require('../../utils/localizedComponents');
const { buildDmWelcomePayload, buildServerWelcomePayload } = require('../../utils/welcomeJsonMessages');

const DEV_ID = process.env.DEV || '';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-preview')
    .setDescription('Sends a preview of the configured welcome JSON.')
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('target')
        .setDescription('Which welcome message to preview.')
        .addChoices(
          { name: 'DM welcome', value: 'dm' },
          { name: 'Server welcome', value: 'server' }
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    if (DEV_ID && interaction.user.id !== DEV_ID) {
      return interaction.reply({
        flags: v2Flags(true),
        components: buildStatusComponents({
          title: 'Permission denied',
          description: 'Only the configured bot owner can preview welcome JSON.'
        })
      });
    }

    const target = interaction.options.getString('target') || 'dm';
    const payload = target === 'server'
      ? buildServerWelcomePayload(interaction.member)
      : buildDmWelcomePayload(interaction.member);

    if (!payload) {
      return interaction.reply({
        flags: v2Flags(true),
        components: buildStatusComponents({
          title: 'Welcome JSON is not configured',
          description: `Enable ${target === 'server' ? 'server' : 'DM'} welcome and add JSON in the desktop app first.`
        })
      });
    }

    try {
      await interaction.user.send(payload);
      return interaction.reply({
        flags: v2Flags(true),
        components: buildStatusComponents({
          title: 'Welcome preview sent',
          description: 'Check your DMs.',
          color: '#00A86B'
        })
      });
    } catch (error) {
      return interaction.reply({
        flags: v2Flags(true),
        components: buildStatusComponents({
          title: 'Welcome preview failed',
          description: error.message || 'Unable to send a DM.'
        })
      });
    }
  }
};
