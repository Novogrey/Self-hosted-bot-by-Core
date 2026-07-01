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
  ADMIN_ROLES_LEVEL_1,
  ADMIN_ROLES_LEVEL_2
} = process.env;
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
const tempBanSchema = require('../../schemas/ban');
const warnSchema = require('../../schemas/warn');
const { moderationDmTags, sendModerationDm } = require('../../utils/moderationDmMessages');
const allowedRolesLevel1 = typeof ADMIN_ROLES_LEVEL_2 === 'string' && ADMIN_ROLES_LEVEL_2 ? ADMIN_ROLES_LEVEL_2.split(',') : []; // Разрешение на временный бан
const allowedRolesLevel2 = typeof ADMIN_ROLES_LEVEL_1 === 'string' && ADMIN_ROLES_LEVEL_1 ? ADMIN_ROLES_LEVEL_1.split(',') : []; // Разрешение на перманентный бан
const logChannelId = ADMIN_LOG_CHANNEL_ID;
function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      return JSON.parse(fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
    }
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to load translations for ${language}: ${error.message}`));
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('ban').setDescription('Temporarily or permanently bans one or more members.').addStringOption((option) => option.setName('targets').setDescription('Mention users or provide their IDs, separated by commas.').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Reason for the ban').setRequired(true)).addStringOption((option) => option.setName('time').setDescription('Ban duration (e.g., 1h, 10m, 1d, 1w, 1y, or leave empty for permanent ban)').setRequired(false)),
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
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: moderation_db connection is not available. Cannot process bans.`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.ban.dbError || '❌ Ban command is currently unavailable due to database issues.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
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
    const TempBan = client.connections.moderator.model('TempBan', tempBanSchema);
    const Warn = client.connections.moderator.model('Warn', warnSchema);

    // Получаем язык модератора
    let moderatorLanguage = 'en';
    if (UserLanguage && client.connections.users) {
      const modLangData = await UserLanguage.findOne({
        userId: interaction.user.id
      }).catch(() => null);
      moderatorLanguage = modLangData ? modLangData.language : 'en';
    }
    const translationsModerator = loadTranslations(moderatorLanguage);
    const logTranslations = loadTranslations('ru'); // Логи на русском

    // Проверка ролей модератора
    const hasLevel1Role = interaction.member.roles.cache.some((role) => allowedRolesLevel1.includes(role.id));
    const hasLevel2Role = interaction.member.roles.cache.some((role) => allowedRolesLevel2.includes(role.id));
    if (!hasLevel1Role && !hasLevel2Role) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsModerator.ban.permission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    const targetsString = interaction.options.getString('targets');
    const reason = interaction.options.getString('reason');
    const time = interaction.options.getString('time');
    const executor = interaction.user;
    const userIds = targetsString.split(',').map((id) => id.trim().replace(/[<@!>]/g, ''));
    if (userIds.length === 0) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsModerator.ban.users || '❌ Users specified incorrectly!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    const results = [];
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    for (const id of userIds) {
      const target = await interaction.client.users.fetch(id).catch(() => null);
      if (!target) {
        results.push(`${translationsModerator.ban.usernotfound?.replace('{id}', id) || `❌ User with ID ${id} not found!`}`);
        continue;
      }
      const member = await interaction.guild.members.fetch(id).catch(() => null);
      if (!member) {
        results.push(`${translationsModerator.ban.usernotserver?.replace('{id}', id) || `❌ User with ID ${id} is not on this server!`}`);
        continue;
      }

      // Проверка иерархии ролей
      const executorAdminRoles = interaction.member.roles.cache.filter((role) => allowedRolesLevel1.includes(role.id) || allowedRolesLevel2.includes(role.id));
      const targetAdminRoles = member.roles.cache.filter((role) => allowedRolesLevel1.includes(role.id) || allowedRolesLevel2.includes(role.id));
      let canBan = true;
      if (targetAdminRoles.size > 0) {
        const executorHighestAdminRole = executorAdminRoles.reduce((highest, role) => !highest || role.position > highest.position ? role : highest, null);
        const targetHighestAdminRole = targetAdminRoles.reduce((highest, role) => !highest || role.position > highest.position ? role : highest, null);
        if (executorHighestAdminRole && targetHighestAdminRole && targetHighestAdminRole.position >= executorHighestAdminRole.position) {
          canBan = false;
        }
      }
      if (!canBan) {
        results.push(`${translationsModerator.ban.hierarchy?.replace('{id}', id) || `❌ You cannot ban <@${id}> because their highest admin role is equal to or higher than yours!`}`);
        continue;
      }

      // Получаем язык пользователя
      let userLanguage = 'en';
      if (UserLanguage && client.connections.users) {
        const userLangData = await UserLanguage.findOne({
          userId: target.id
        }).catch(() => null);
        userLanguage = userLangData ? userLangData.language : 'en';
      }
      const userTranslations = loadTranslations(userLanguage);
      let milliseconds;
      let durationText;
      if (!time || time.toLowerCase() === 'permanent') {
        // Проверка прав на перманентный бан
        if (!hasLevel2Role) {
          results.push(`${translationsModerator.ban.noPermBanPermission?.replace('{id}', id) || `❌ You do not have permission to issue a permanent ban for <@${id}>!`}`);
          continue;
        }
        try {
          const embedBan = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.ban.permbandm?.replace('{guildname}', `__**${interaction.guild.name}**__`) || `You have been permanently banned from __**${interaction.guild.name}**__!`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: userTranslations.ban.reason || 'Reason',
            value: `${reason}`,
            inline: true
          }, {
            name: userTranslations.ban.moderator || 'Moderator',
            value: `**${executor.tag}** (<@${executor.id}>)`,
            inline: true
          }, {
            name: userTranslations.ban.unban || 'Unban',
            value: userTranslations.ban.permanent || 'Permanent',
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await sendModerationDm(target, 'moderation.ban.dm', moderationDmTags({
            guild: interaction.guild,
            target,
            moderator: executor,
            reason,
            duration: userTranslations.ban.permanent || 'Permanent',
            expires: userTranslations.ban.permanent || 'Permanent',
            action: 'ban'
          }), {
            flags: MessageFlags.IsComponentsV2,
            components: [embedBan]
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${target.tag}: ${error.message}`));
          });
          await member.ban({
            reason
          });

          // Удаление всей записи предупреждений пользователя при перманентном бане
          await Warn.deleteOne({
            userID: target.id,
            guildID: interaction.guild.id
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to delete warn record for ${target.tag}: ${error.message}`));
          });
          results.push(`✅ ${translationsModerator.ban.success?.replace('{id}', id)?.replace('{duration}', translationsModerator.ban.permanent || 'Permanent') || `Successfully banned <@${id}> (Permanent)`}`);

          // Логирование перманентного бана (на русском)
          if (logChannel) {
            const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[logTranslations.ban.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id) || `User ${target.tag} (<@${id}>) has been banned` ? new TextDisplayBuilder().setContent(logTranslations.ban.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id) || `User ${target.tag} (<@${id}>) has been banned`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: logTranslations.ban.moderator || 'Модератор',
              value: `**${executor.tag}** (<@${executor.id}>)`,
              inline: true
            }, {
              name: logTranslations.ban.reason || 'Причина',
              value: `${reason}`,
              inline: true
            }, {
              name: logTranslations.ban.unban || 'Разбан',
              value: logTranslations.ban.permanent || 'Перманентный',
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
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log for ${target.tag}: ${error.message}`));
            });
          }
        } catch (error) {
          console.error(chalk.red(`[${new Date().toISOString()}] Error banning ${target.tag}: ${error.message}`));
          results.push(`❌ ${translationsModerator.ban.error?.replace('{id}', id) || `Failed to ban <@${id}>`}`);
        }
      } else {
        // Проверка прав на временный бан
        if (!hasLevel1Role) {
          results.push(`${translationsModerator.ban.noTempBanPermission?.replace('{id}', id) || `❌ You do not have permission to issue a temporary ban for <@${id}>!`}`);
          continue;
        }
        const timeRegex = /^(\d+)([smhdwy])$/;
        const match = time.match(timeRegex);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2];
          switch (unit) {
            case 's':
              milliseconds = value * 1000;
              break;
            case 'm':
              milliseconds = value * 60 * 1000;
              break;
            case 'h':
              milliseconds = value * 60 * 60 * 1000;
              break;
            case 'd':
              milliseconds = value * 24 * 60 * 60 * 1000;
              break;
            case 'w':
              milliseconds = value * 7 * 24 * 60 * 60 * 1000;
              break;
            case 'y':
              milliseconds = value * 365 * 24 * 60 * 60 * 1000;
              break;
            default:
              results.push(`❌ ${translationsModerator.ban.invalidduration || 'Invalid duration format'} (ID: <@${id}>)`);
              continue;
          }
        } else {
          results.push(`❌ ${translationsModerator.ban.invalidduration || 'Invalid duration format'} (ID: <@${id}>)`);
          continue;
        }
        const unbanTimestamp = Math.floor((Date.now() + milliseconds) / 1000);
        durationText = `${Math.floor(milliseconds / (1000 * 60 * 60 * 24))} day(s)`;
        try {
          const embedBan = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.ban.timebandm?.replace('{guildname}', `__**${interaction.guild.name}**__`) || `You have been temporarily banned from __**${interaction.guild.name}**__!`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: userTranslations.ban.reason || 'Reason',
            value: `${reason}`,
            inline: true
          }, {
            name: userTranslations.ban.moderator || 'Moderator',
            value: `**${executor.tag}** (<@${executor.id}>)`,
            inline: true
          }, {
            name: userTranslations.ban.unban || 'Unban',
            value: `<t:${unbanTimestamp}:R>`,
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await sendModerationDm(target, 'moderation.ban.dm', moderationDmTags({
            guild: interaction.guild,
            target,
            moderator: executor,
            reason,
            duration: durationText,
            expires: `<t:${unbanTimestamp}:R>`,
            action: 'ban'
          }), {
            flags: MessageFlags.IsComponentsV2,
            components: [embedBan]
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${target.tag}: ${error.message}`));
          });
          await member.ban({
            reason
          });
          results.push(`✅ ${translationsModerator.ban.success?.replace('{id}', id)?.replace('{duration}', durationText) || `Successfully banned <@${id}> (${durationText})`}`);

          // Логирование временного бана (на русском)
          if (logChannel) {
            const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[logTranslations.ban.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id) || `User ${target.tag} (<@${id}>) has been banned` ? new TextDisplayBuilder().setContent(logTranslations.ban.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id) || `User ${target.tag} (<@${id}>) has been banned`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: logTranslations.ban.moderator || 'Модератор',
              value: `**${executor.tag}** (<@${executor.id}>)`,
              inline: true
            }, {
              name: logTranslations.ban.reason || 'Причина',
              value: `${reason}`,
              inline: true
            }, {
              name: logTranslations.ban.unban || 'Разбан',
              value: `<t:${unbanTimestamp}:R>`,
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
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log for ${target.tag}: ${error.message}`));
            });
          }

          // Сохранение временного бана в базе данных
          const tempBan = new TempBan({
            userID: target.id,
            guildID: interaction.guild.id,
            moderatorID: executor.id,
            reason: reason,
            unbanTime: new Date(Date.now() + milliseconds)
          });
          await tempBan.save();

          // Планирование автоматического разбана
          setTimeout(async () => {
            try {
              await interaction.guild.members.unban(target.id);
              await TempBan.deleteOne({
                userID: target.id,
                guildID: interaction.guild.id
              });

              // Логирование разбана (на русском)
              if (logChannel) {
                const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[logTranslations.ban.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id)?.replace('был забанен', 'был разбанен') || `User ${target.tag} (<@${id}>) has been unbanned` ? new TextDisplayBuilder().setContent(logTranslations.ban.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id)?.replace('был забанен', 'был разбанен') || `User ${target.tag} (<@${id}>) has been unbanned`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                  name: logTranslations.ban.reason || 'Причина',
                  value: 'Срок бана истёк.',
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
                  console.error(chalk.red(`[${new Date().toISOString()}] Failed to send unban log for ${target.tag}: ${error.message}`));
                });
              }
            } catch (error) {
              console.error(chalk.red(`[${new Date().toISOString()}] Error during unban of ${target.tag}: ${error.message}`));
            }
          }, milliseconds);
        } catch (error) {
          console.error(chalk.red(`[${new Date().toISOString()}] Error banning ${target.tag}: ${error.message}`));
          results.push(`❌ ${translationsModerator.ban.error?.replace('{id}', id) || `Failed to ban <@${id}>`}`);
        }
      }
    }

    // Отправка итогового ответа
    const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translationsModerator.ban.resultsTitle || `Ban Results for ${userIds.length} User${userIds.length === 1 ? '' : 's'}`}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(results.length > 0 ? results.join('\n\n') : translationsModerator.ban.noresults || '❌ No valid users were processed.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [embed]
    }).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Failed to send final reply: ${error.message}`));
      if (error.code === 10062) return; // Suppress Unknown interaction
    });
  }
};
