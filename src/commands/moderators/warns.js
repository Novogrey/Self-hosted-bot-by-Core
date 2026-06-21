const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  resolveColor
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
const warnSchema = require('../../schemas/warn');
require('dotenv').config({ quiet: true });
const {
  ADMIN_LOG_CHANNEL_ID,
  ADMIN_ROLES_LEVEL_4
} = process.env;
const allowedRoles = ADMIN_ROLES_LEVEL_4.split(',');
const logChannelId = ADMIN_LOG_CHANNEL_ID;
async function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  try {
    const data = await fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(data);
    return translations.warns ? translations : JSON.parse(await fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to load translations for ${language}: ${error.message}`));
    return JSON.parse(await fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('warns').setDescription('Shows warnings for a specified user or yourself.').addUserOption((option) => option.setName('target').setDescription('The user whose warnings you want to view').setRequired(false)),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Check database connection
    if (!client.connections.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: users_db connection is not available. Cannot process warns command.`));
      const translations = await loadTranslations('en');
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.warns.title || 'Warnings'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.warns.dbError || '❌ Warns command is currently unavailable due to database issues.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }

    // Create models
    const UserLanguage = client.connections.users.model('UserLanguage', userLanguageSchema);
    const Warn = client.connections.moderator.model('Warn', warnSchema);
    const user = interaction.user;
    const target = interaction.options.getUser('target') || user;
    const guildID = interaction.guild.id;

    // Get user language
    const userLanguage = await UserLanguage.findOne({
      userId: user.id
    }).catch(() => null);
    const language = userLanguage ? userLanguage.language : 'en';
    const translations = await loadTranslations(language);
    try {
      const userWarnings = await Warn.findOne({
        guildID,
        userID: target.id
      }).catch(() => null);

      // Log request if user is a moderator viewing another user's warnings
      const isModerator = interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id));
      if (isModerator && user.id !== target.id) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const translationsLog = await loadTranslations('ru'); // Load Russian translations for logs
          const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.warns.logmessage.replace('{user}', `<@${user.id}>`).replace('{target}', `<@${target.id}>`) ? new TextDisplayBuilder().setContent(translationsLog.warns.logmessage.replace('{user}', `<@${user.id}>`).replace('{target}', `<@${target.id}>`)) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: translationsLog.warns.moderator,
            value: `**${user.tag}** (<@${user.id}>)`,
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [{
            text: `ID: ${target.id}`,
            iconURL: target.displayAvatarURL() || null
          }?.text, `<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await logChannel.send({
            allowedMentions: { parse: [], repliedUser: false },
            flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
            components: [embed]
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log for warns request by ${user.tag} for ${target.tag}: ${error.message}`));
          });
          console.log(chalk.green(`[${new Date().toISOString()}] Warns request by ${user.tag} for ${target.tag} logged`));
        }
      }

      // Handle no warnings or deleted document
      if (!userWarnings || userWarnings.warnings.length === 0) {
        console.log(chalk.yellow(`[${new Date().toISOString()}] No warnings found for ${target.tag} in guild ${guildID}`));
        const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translations.warns.nowarnings.replace('{user}', `<@${target.id}>`) ? new TextDisplayBuilder().setContent(translations.warns.nowarnings.replace('{user}', `<@${target.id}>`)) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [{
          text: `ID: ${target.id}`,
          iconURL: target.displayAvatarURL() || null
        }?.text, `<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | (user.id !== target.id ? MessageFlags.Ephemeral : 0),
          components: [embed]
        });
      }
      const warningsPerPage = 5;
      const totalPages = Math.ceil(userWarnings.warnings.length / warningsPerPage);
      const generateEmbed = (page) => {
        const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translations.warns.title.replace('{user}', `<@${target.id}>`) ? new TextDisplayBuilder().setContent(translations.warns.title.replace('{user}', `<@${target.id}>`)) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [{
          text: translations.warns.footer.replace('{count}', userWarnings.warnings.length).replace('{page}', page).replace('{total}', totalPages),
          iconURL: target.displayAvatarURL() || null
        }?.text, `<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        const start = (page - 1) * warningsPerPage;
        const end = Math.min(start + warningsPerPage, userWarnings.warnings.length);
        const fields = userWarnings.warnings.slice(start, end).map((warn) => ({
          name: translations.warns.case.replace('{id}', warn.warnID).replace('{time}', `<t:${Math.floor(warn.timestamp.getTime() / 1000)}:F>`).replace('{mod}', interaction.guild.members.cache.get(warn.modID)?.displayName || translations.warns.unknownmod),
          value: translations.warns.reason.replace('{reason}', warn.reason) + '\n' + translations.warns.expires.replace('{expires}', warn.expires ? `<t:${Math.floor(warn.expires.getTime() / 1000)}:F>` : translations.warns.noexpires),
          inline: false
        }));
        embed.addTextDisplayComponents(...[fields].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`)));
        return embed;
      };
      let currentPage = 1;
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | (user.id !== target.id ? MessageFlags.Ephemeral : 0),
        components: [generateEmbed(currentPage).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('prev').setLabel(translations.warns.prev).setStyle(ButtonStyle.Primary).setDisabled(currentPage === 1), new ButtonBuilder().setCustomId('next').setLabel(translations.warns.next).setStyle(ButtonStyle.Primary).setDisabled(currentPage === totalPages)))]
      });
      const message = await interaction.fetchReply();
      console.log(chalk.green(`[${new Date().toISOString()}] Warns displayed for ${target.tag} (Page ${currentPage}/${totalPages})`));
      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60000
      });
      collector.on('collect', async (i) => {
        try {
          if (i.customId === 'next' && currentPage < totalPages) currentPage++;else if (i.customId === 'prev' && currentPage > 1) currentPage--;
          await i.update({
            flags: MessageFlags.IsComponentsV2,
            components: [generateEmbed(currentPage).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('prev').setLabel(translations.warns.prev).setStyle(ButtonStyle.Primary).setDisabled(currentPage === 1), new ButtonBuilder().setCustomId('next').setLabel(translations.warns.next).setStyle(ButtonStyle.Primary).setDisabled(currentPage === totalPages)))]
          });
          console.log(chalk.green(`[${new Date().toISOString()}] Page updated to ${currentPage} for ${target.tag}`));
        } catch (error) {
          if (error.code === 10008) {
            console.log(chalk.yellow(`[${new Date().toISOString()}] Message deleted, sending new reply for ${target.tag}`));
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | (user.id !== target.id ? MessageFlags.Ephemeral : 0),
              components: [generateEmbed(currentPage).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('prev').setLabel(translations.warns.prev).setStyle(ButtonStyle.Primary).setDisabled(currentPage === 1), new ButtonBuilder().setCustomId('next').setLabel(translations.warns.next).setStyle(ButtonStyle.Primary).setDisabled(currentPage === totalPages)))]
            });
            collector.stop();
          } else {
            console.error(chalk.red(`[${new Date().toISOString()}] Error in button collector for ${target.tag}: ${error.message}`));
          }
        }
      });
      collector.on('end', async () => {
        try {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: []
          });
          console.log(chalk.green(`[${new Date().toISOString()}] Button collector ended for ${target.tag}`));
        } catch (error) {
          if (error.code === 10008) {
            console.log(chalk.yellow(`[${new Date().toISOString()}] Original message deleted, skipping component disable for ${target.tag}`));
          } else {
            console.error(chalk.red(`[${new Date().toISOString()}] Error disabling buttons for ${target.tag}: ${error.message}`));
          }
        }
      });
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] Error displaying warnings for ${target.tag}: ${error.message}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.warns.error || '❌ An error occurred while fetching warnings.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }
  }
};
