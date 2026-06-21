const {
  SlashCommandBuilder,
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
require('dotenv').config({ quiet: true });
const {
  ADMIN_LOG_CHANNEL_ID,
  ADMIN_ROLES_LEVEL_1
} = process.env;
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
const tempBanSchema = require('../../schemas/ban');
const allowedRoles = typeof ADMIN_ROLES_LEVEL_1 === 'string' && ADMIN_ROLES_LEVEL_1 ? ADMIN_ROLES_LEVEL_1.split(',') : [];
const logChannelId = ADMIN_LOG_CHANNEL_ID;
async function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  try {
    const data = await fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to load translations for ${language}: ${error.message}`));
    return JSON.parse(await fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('unban').setDescription('Unbans one or more members by their IDs or mentions.').addStringOption((option) => option.setName('userids_or_mentions').setDescription('Comma-separated IDs or mentions of the members to unban').setRequired(true)),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Defer reply to handle long processing
    await interaction.deferReply({
      ephemeral: true
    });

    // Check database connections
    if (!client.connections.moderator) {
      const translations = await loadTranslations('en');
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: moderator_db connection is not available. Cannot process unban command.`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.unban.resultsTitle || 'Unban Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.unban.dbError || '❌ Unban command is currently unavailable due to database issues.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    if (!client.connections.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: users_db connection is not available. Using default language (en).`));
    }

    // Create models
    const UserLanguage = client.connections.users?.model('UserLanguage', userLanguageSchema);
    const TempBan = client.connections.moderator.model('TempBan', tempBanSchema);

    // Get moderator language
    const moderatorUser = interaction.user;
    const moderatorLanguage = await UserLanguage.findOne({
      userId: moderatorUser.id
    }).catch(() => null);
    const language = moderatorLanguage ? moderatorLanguage.language : 'en';
    const translations = await loadTranslations(language);
    const translationsLog = await loadTranslations('ru'); // Load Russian translations for logs

    // Проверка на наличие одной из разрешенных ролей
    if (!interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id))) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.unban.resultsTitle || 'Unban Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.unban.permission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    const input = interaction.options.getString('userids_or_mentions');
    const idsOrMentions = input.split(',').map((item) => item.trim());
    const results = [];
    if (idsOrMentions.length === 0) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.unban.resultsTitle || 'Unban Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.unban.invalidUsers || '❌ Users specified incorrectly!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    for (const item of idsOrMentions) {
      // Проверка, является ли элемент упоминанием
      const idMatch = item.match(/^<@!?(\d+)>$/);
      const userID = idMatch ? idMatch[1] : item;
      try {
        // Получение информации о пользователе
        const user = await interaction.client.users.fetch(userID).catch(() => null);
        if (!user) {
          results.push(translations.unban.usernotfound.replace('{id}', `<@${userID}>`));
          continue;
        }

        // Попытка разбанить пользователя по ID
        await interaction.guild.members.unban(userID).catch((error) => {
          throw new Error(`Failed to unban: ${error.message}`);
        });

        // Проверяем, был ли пользователь временно забанен
        const tempBan = await TempBan.findOne({
          userID,
          guildID: interaction.guild.id
        });
        if (tempBan) {
          await TempBan.deleteOne({
            userID,
            guildID: interaction.guild.id
          });
          console.log(chalk.green(`[${new Date().toISOString()}] User with ID ${userID} was removed from temporary bans database.`));
        }

        // Добавляем успешный результат
        results.push(translations.unban.successunban.replace('{id}', `<@${userID}>`));

        // Логирование успешного разбана на русском
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.unban.logmessage.replace('{id}', `<@${userID}>`) ? new TextDisplayBuilder().setContent(translationsLog.unban.logmessage.replace('{id}', `<@${userID}>`)) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof user.displayAvatarURL() === 'string' ? user.displayAvatarURL() : user.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: translationsLog.unban.moderator,
            value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [{
            text: `ID: ${userID}`,
            iconURL: user.displayAvatarURL() || null
          }?.text, `<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await logChannel.send({
            allowedMentions: { parse: [], repliedUser: false },
            flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
            components: [embed]
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log for unbanning ${user.tag}: ${error.message}`));
          });
        }
      } catch (error) {
        console.error(chalk.red(`[${new Date().toISOString()}] Error unbanning user with ID ${userID}: ${error.message}`));
        results.push(translations.unban.errorunban.replace('{id}', `<@${userID}>`));
      }
    }

    // Ответ модератору с результатами
    const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.unban.resultsTitle || `Unban Results for ${idsOrMentions.length} User${idsOrMentions.length === 1 ? '' : 's'}`}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(results.length > 0 ? results.join('\n\n') : translations.unban.noresults || '❌ No valid users were processed.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [embed]
    }).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Failed to send final reply: ${error.message}`));
      if (error.code === 10062) return; // Suppress Unknown interaction
    });
  }
};