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
const warnSchema = require('../../schemas/warn');

// Массив ID ролей, которые могут использовать команду
const allowedRoles = typeof ADMIN_ROLES_LEVEL_1 === 'string' && ADMIN_ROLES_LEVEL_1 ? ADMIN_ROLES_LEVEL_1.split(',') : [];

// ID канала для логирования
const logChannelId = ADMIN_LOG_CHANNEL_ID;
function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      return JSON.parse(fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8')); // Загрузите язык по умолчанию
    }
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to load translations for ${language}: ${error.message}`));
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('clearwarns').setDescription('Clears warnings for users or the entire server.').addSubcommand((subcommand) => subcommand.setName('user').setDescription('Clears all warnings for specified users.').addStringOption((option) => option.setName('targets').setDescription('Comma-separated IDs or mentions of users to clear warnings for').setRequired(true))).addSubcommand((subcommand) => subcommand.setName('server').setDescription('Clears all warnings on the server.')),
  async execute(interaction, client) {
    // Проверка, что команда выполняется в гильдии
    if (!interaction.guild) return;

    // Откладываем ответ для длительной обработки
    await interaction.deferReply({
      ephemeral: true
    });

    // Проверка подключения к базам данных
    if (!client.connections.moderator) {
      const translations = loadTranslations('en');
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: moderator_db connection is not available. Cannot process clearwarns command.`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.clearwarns.dbError || '❌ Clearwarns command is currently unavailable due to database issues.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    if (!client.connections.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: users_db connection is not available. Using default language (en).`));
    }

    // Создаём модели
    const UserLanguage = client.connections.users?.model('UserLanguage', userLanguageSchema);
    const Warn = client.connections.moderator.model('Warn', warnSchema);
    const moderatorUser = interaction.user;
    const moderatorLanguage = await UserLanguage.findOne({
      userId: moderatorUser.id
    });
    const languagemoderator = moderatorLanguage ? moderatorLanguage.language : 'en';
    const translationsmoderator = loadTranslations(languagemoderator);
    const translationsLog = loadTranslations('ru'); // Load Russian translations for logs

    // Проверка на наличие одной из разрешенных ролей у пользователя
    if (!interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id))) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.clearwarns.permission));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    const subcommand = interaction.options.getSubcommand();
    const guildID = interaction.guild.id;
    try {
      if (subcommand === 'user') {
        const targetsString = interaction.options.getString('targets');
        const targets = targetsString.split(',').map((target) => target.trim());
        for (const target of targets) {
          // Проверка, является ли элемент упоминанием
          const idMatch = target.match(/^<@!?(\d+)>$/);
          const userID = idMatch ? idMatch[1] : target;
          const user = await interaction.client.users.fetch(userID).catch(() => null);
          const userLanguage = await UserLanguage.findOne({
            userId: userID
          });
          const language = userLanguage ? userLanguage.language : 'en';
          const translationsuser = loadTranslations(language);
          if (!user) {
            const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.clearwarns.usernotfound.replace('{id}', userID)));
            await interaction.editReply({
              flags: MessageFlags.IsComponentsV2,
              components: [embed]
            });
            continue;
          }
          const userWarnings = await Warn.findOne({
            guildID,
            userID
          });
          if (!userWarnings || userWarnings.warnings.length === 0) {
            const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.clearwarns.nowarnings.replace('{id}', `<@${userID}>`)));
            await interaction.editReply({
              flags: MessageFlags.IsComponentsV2,
              components: [embed]
            });
            continue;
          }

          // Отправляем DM пользователю перед удалением предупреждений
          try {
            const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsuser.clearwarns.clearedmessage.replace('{guildname}', `__**${interaction.guild.name}**__`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: translationsuser.clearwarns.moderator,
              value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
              inline: true
            }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
            await user.send({
              flags: MessageFlags.IsComponentsV2,
              components: [embed]
            });
          } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${user.tag}: ${error.message}`));
          }

          // Удаляем всю запись предупреждений пользователя
          await Warn.deleteOne({
            guildID,
            userID
          });

          // Ответ модератору
          const embed = new ContainerBuilder().setAccentColor(resolveColor('#00FF00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.clearwarns.successuser.replace('{id}', `<@${userID}>`)));
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [embed]
          });

          // Логирование действия на русском
          const logChannel = interaction.guild.channels.cache.get(logChannelId);
          if (logChannel) {
            const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.clearwarns.logmessageuser.replace('{id}', `<@${userID}>`) ? new TextDisplayBuilder().setContent(translationsLog.clearwarns.logmessageuser.replace('{id}', `<@${userID}>`)) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof user.displayAvatarURL() === 'string' ? user.displayAvatarURL() : user.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: translationsLog.clearwarns.moderator,
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
            });
          }
        }
      } else if (subcommand === 'server') {
        // Находим все предупреждения на сервере
        const allWarnings = await Warn.find({
          guildID
        });
        if (allWarnings.length === 0) {
          const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.clearwarns.noserverwarnings));
          return interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [embed]
          });
        }

        // Отправляем DM каждому пользователю перед удалением
        for (const warning of allWarnings) {
          const user = await interaction.client.users.fetch(warning.userID).catch(() => null);
          if (!user) continue;
          const userLanguage = await UserLanguage.findOne({
            userId: warning.userID
          });
          const language = userLanguage ? userLanguage.language : 'en';
          const translationsuser = loadTranslations(language);
          try {
            const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsuser.clearwarns.clearedmessage.replace('{guildname}', `__**${interaction.guild.name}**__`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: translationsuser.clearwarns.moderator,
              value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
              inline: true
            }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
            await user.send({
              flags: MessageFlags.IsComponentsV2,
              components: [embed]
            });
          } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${warning.userID}: ${error.message}`));
          }
        }

        // Удаляем все предупреждения
        await Warn.deleteMany({
          guildID
        });

        // Ответ модератору
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#00FF00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.clearwarns.successserver));
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [embed]
        });

        // Логирование действия на русском
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsLog.clearwarns.logmessageserver)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: translationsLog.clearwarns.moderator,
            value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [{
            text: `Guild ID: ${guildID}`
          }?.text, `<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await logChannel.send({
            allowedMentions: { parse: [], repliedUser: false },
            flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
            components: [embed]
          });
        }
      }
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] Error executing clearwarns command: ${error.message}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.clearwarns.error));
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
  }
};
