const {
  PermissionsBitField,
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
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { getWarnPunishment } = require('../../utils/warnPunishments');
require('dotenv').config({ quiet: true });
const {
  ADMIN_LOG_CHANNEL_ID,
  MUTE_ROLE,
  ADMIN_ROLES_LEVEL_0
} = process.env;
const messageDebugLogs = ['1', 'true', 'yes', 'on'].includes(String(process.env.MESSAGE_DEBUG_LOGS || '').trim().toLowerCase());

function debugLog(message) {
  if (messageDebugLogs) console.log(message);
}

// Переключатель для включения/выключения модерации
const MODERATION_ENABLED = true;

// Хранилище сообщений пользователей
const messageCache = new Map();
const TIME_WINDOW = 5 * 60 * 1000; // 5 минут
const MESSAGE_LIMIT = 5; // Порог для одинаковых сообщений

// Очистка устаревших записей в messageCache каждые 10 минут
setInterval(() => {
  const now = Date.now();
  for (const [userId, userMessages] of messageCache) {
    for (const [msgContent, messages] of userMessages) {
      userMessages.set(msgContent, messages.filter((msg) => now - msg.timestamp < TIME_WINDOW));
      if (userMessages.get(msgContent).length === 0) {
        userMessages.delete(msgContent);
      }
    }
    if (userMessages.size === 0) {
      messageCache.delete(userId);
    }
  }
}, 10 * 60 * 1000);
async function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  let defaultTranslations = {};
  try {
    defaultTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  } catch (_) {
    defaultTranslations = {};
  }
  try {
    const data = await fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(data);
    return translations.warn ? translations : {
      warn: defaultTranslations.warn || {}
    };
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to load translations for ${language}: ${error.message}`));
    return {
      warn: defaultTranslations.warn || {}
    };
  }
}
module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Skip if moderation is disabled
    if (!MODERATION_ENABLED) {
      debugLog(chalk.yellow(`[${new Date().toISOString()}] [Moderation] Moderation is disabled, skipping messageCreate for ${message.author.tag}`));
      return;
    }

    // Ignore bots and DMs
    if (message.author.bot || !message.guild) {
      debugLog(chalk.yellow(`[${new Date().toISOString()}] [Moderation] MessageCreate ignored from ${message.author.bot ? 'bot' : 'DM'} ${message.author.tag}`));
      return;
    }

    // Check if user has any admin roles from ADMIN_ROLES_LEVEL_0
    const adminRoles = ADMIN_ROLES_LEVEL_0 ? ADMIN_ROLES_LEVEL_0.split(',').map((id) => id.trim()) : [];
    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (member && adminRoles.length > 0 && adminRoles.some((roleId) => member.roles.cache.has(roleId))) {
      debugLog(chalk.yellow(`[${new Date().toISOString()}] [Moderation] MessageCreate ignored for ${message.author.tag} due to admin role`));
      return;
    }

    // Check database connection
    if (!client.connections?.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] [Moderation] Warning: users_db connection is not available. Cannot process messageCreate for ${message.author.tag}`));
      return;
    }

    // Create models
    let Warn, TempMute, TempBan, UserLanguage;
    try {
      Warn = client.connections.moderator.model('Warn', require('../../schemas/warn'));
      TempMute = client.connections.moderator.model('TempMute', require('../../schemas/mute'));
      TempBan = client.connections.moderator.model('TempBan', require('../../schemas/ban'));
      UserLanguage = client.connections.users.model('UserLanguage', require('../../schemas/userLanguage'));
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error creating models: ${error.message}`));
      return;
    }
    const userId = message.author.id;
    const guildId = message.guild.id;
    const content = message.content.trim().toLowerCase(); // Игнорируем регистр и пробелы
    const timestamp = Date.now();

    // Инициализируем кэш для пользователя
    if (!messageCache.has(userId)) {
      messageCache.set(userId, new Map());
    }
    const userMessages = messageCache.get(userId);

    // Очищаем старые сообщения (старше 5 минут)
    for (const [msgContent, messages] of userMessages) {
      userMessages.set(msgContent, messages.filter((msg) => timestamp - msg.timestamp < TIME_WINDOW));
      if (userMessages.get(msgContent).length === 0) {
        userMessages.delete(msgContent);
      }
    }

    // Добавляем новое сообщение
    if (!userMessages.has(content)) {
      userMessages.set(content, []);
    }
    userMessages.get(content).push({
      timestamp
    });

    // Проверяем количество одинаковых сообщений
    if (userMessages.get(content).length >= MESSAGE_LIMIT) {
      try {
        const target = message.author;
        const guild = message.guild;
        const reason = 'Автомодерация: спам одинаковыми сообщениями';

        // Проверяем права бота
        const botMember = guild.members.me;
        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles) || !botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Bot lacks ManageRoles or BanMembers permissions in guild ${guild.name}`));
          return;
        }

        // Проверяем канал логов
        const logChannel = guild.channels.cache.get(ADMIN_LOG_CHANNEL_ID);
        if (!logChannel) {
          console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Log channel ${ADMIN_LOG_CHANNEL_ID} not found in guild ${guild.name}`));
        } else if (!logChannel.permissionsFor(botMember).has(PermissionsBitField.Flags.SendMessages)) {
          console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Bot lacks SendMessages permission in log channel ${ADMIN_LOG_CHANNEL_ID}`));
        }

        // Получаем язык пользователя для DM
        const userLanguage = await UserLanguage.findOne({
          userId: target.id
        }).catch((error) => {
          console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error fetching user language for ${target.tag}: ${error.message}`));
          return null;
        });
        const language = userLanguage ? userLanguage.language : 'en';
        const translations = await loadTranslations(language);

        // Проверяем или создаем запись предупреждений
        let userWarnings = await Warn.findOne({
          guildID: guild.id,
          userID: target.id
        }).catch((error) => {
          console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error fetching warnings for ${target.tag}: ${error.message}`));
          return null;
        });
        if (!userWarnings) {
          userWarnings = new Warn({
            guildID: guild.id,
            userID: target.id,
            warnings: []
          });
          console.log(chalk.yellow(`[${new Date().toISOString()}] [Moderation] Created new Warn document for ${target.tag}`));
        }
        const nextWarnID = userWarnings.warnings.length > 0 ? Math.max(...userWarnings.warnings.map((w) => w.warnID)) + 1 : 1;

        // Сохраняем предупреждение (без срока действия)
        userWarnings.warnings.push({
          warnID: nextWarnID,
          modID: 'System',
          reason,
          timestamp: new Date(),
          expires: null
        });
        await userWarnings.save().catch((error) => {
          console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error saving warning for ${target.tag}: ${error.message}`));
          throw error;
        });
        console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Warning issued to ${target.tag} (Warn ID: ${nextWarnID}) for spamming`));

        // Отправляем DM пользователю
        try {
          const embed = new ContainerBuilder().addTextDisplayComponents(...[translations.warn?.warnmessage?.replace('{guildname}', `__**${guild.name}**__`) || `Вы получили предупреждение на сервере **${guild.name}**.` ? new TextDisplayBuilder().setContent(translations.warn?.warnmessage?.replace('{guildname}', `__**${guild.name}**__`) || `Вы получили предупреждение на сервере **${guild.name}**.`) : null].filter(Boolean)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: translations.warn?.warnid || 'ID предупреждения',
            value: `${nextWarnID}`,
            inline: true
          }, {
            name: translations.warn?.reason || 'Причина',
            value: reason,
            inline: true
          }, {
            name: translations.warn?.moderator || 'Модератор',
            value: 'System',
            inline: true
          }, {
            name: translations.warn?.duration || 'Длительность',
            value: translations.warn?.permanent || 'Постоянно',
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await target.send({
            flags: MessageFlags.IsComponentsV2,
            components: [embed]
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Failed to send DM to ${target.tag}: ${error.message}`));
          });
          console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] DM sent to ${target.tag} for warning ${nextWarnID}`));
        } catch (error) {
          console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error sending DM to ${target.tag}: ${error.message}`));
        }

        // Логирование предупреждения (на русском)
        if (logChannel) {
          const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[`Предупреждение выдано <@${target.id}> (ID: ${nextWarnID})` ? new TextDisplayBuilder().setContent(`Предупреждение выдано <@${target.id}> (ID: ${nextWarnID})`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: 'Причина',
            value: reason,
            inline: true
          }, {
            name: 'Модератор',
            value: 'System',
            inline: true
          }, {
            name: 'Длительность',
            value: 'Постоянно',
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
            console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Failed to send warning log to channel ${ADMIN_LOG_CHANNEL_ID}: ${error.message}`));
          });
          console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Warning log sent for ${target.tag} (Warn ID: ${nextWarnID})`));
        }

        // Сбрасываем кэш сообщений пользователя после предупреждения
        userMessages.clear();

        // Проверяем количество предупреждений и применяем наказание
        const warningCount = userWarnings.warnings.length;
        const punishment = getWarnPunishment(warningCount);
        const muteDuration = punishment?.type === 'mute' ? punishment.durationMs : null;
        const banDuration = punishment?.type === 'ban' ? punishment.durationMs : null;

        if (muteDuration) {
          try {
            // Проверяем роль мута
            const muteRole = guild.roles.cache.get(MUTE_ROLE);
            if (!muteRole) {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Mute role ${MUTE_ROLE} not found in guild ${guild.name}`));
              return;
            }

            // Отправляем DM о мьюте
            const unmuteTimestamp = Math.floor((Date.now() + muteDuration) / 1000);
            const embedMute = new ContainerBuilder().addTextDisplayComponents(...[translations.warn?.mutemessage?.replace('{guildname}', `__**${guild.name}**__`) || `Вы замьючены на сервере **${guild.name}**.` ? new TextDisplayBuilder().setContent(translations.warn?.mutemessage?.replace('{guildname}', `__**${guild.name}**__`) || `Вы замьючены на сервере **${guild.name}**.`) : null].filter(Boolean)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: translations.warn?.reason || 'Причина',
              value: reason,
              inline: true
            }, {
              name: translations.warn?.moderator || 'Модератор',
              value: 'System',
              inline: true
            }, {
              name: translations.warn?.duration || 'Длительность',
              value: `<t:${unmuteTimestamp}:R>`,
              inline: true
            }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
            await target.send({
              flags: MessageFlags.IsComponentsV2,
              components: [embedMute]
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Failed to send mute DM to ${target.tag}: ${error.message}`));
            });

            // Применяем мьют
            await member.roles.add(muteRole).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error adding mute role to ${target.tag}: ${error.message}`));
              throw error;
            });
            const unmuteTime = new Date(Date.now() + muteDuration);
            const tempMute = new TempMute({
              userID: target.id,
              guildID: guild.id,
              moderatorID: 'System',
              reason,
              unmuteTime
            });
            await tempMute.save().catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error saving TempMute for ${target.tag}: ${error.message}`));
              throw error;
            });
            console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Mute applied to ${target.tag} for ${muteDuration / 60000} minutes`));

            // Логирование мута (на русском)
            if (logChannel) {
              const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[`Мьют выдан <@${target.id}> на ${muteDuration / 60000} минут` ? new TextDisplayBuilder().setContent(`Мьют выдан <@${target.id}> на ${muteDuration / 60000} минут`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: 'Причина',
                value: reason,
                inline: true
              }, {
                name: 'Модератор',
                value: 'System',
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
                console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Failed to send mute log to channel ${ADMIN_LOG_CHANNEL_ID}: ${error.message}`));
              });
              console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Mute log sent for ${target.tag}`));
            }
          } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error muting ${target.tag}: ${error.message}`));
          }
        } else if (banDuration) {
          try {
            // Отправляем DM о временном бане
            const unbanTimestamp = Math.floor((Date.now() + banDuration) / 1000);
            const embedBan = new ContainerBuilder().addTextDisplayComponents(...[translations.warn?.banmessage?.replace('{guildname}', `__**${guild.name}**__`) || `Вы забанены на сервере **${guild.name}**.` ? new TextDisplayBuilder().setContent(translations.warn?.banmessage?.replace('{guildname}', `__**${guild.name}**__`) || `Вы забанены на сервере **${guild.name}**.`) : null].filter(Boolean)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: translations.warn?.reason || 'Причина',
              value: reason,
              inline: true
            }, {
              name: translations.warn?.moderator || 'Модератор',
              value: 'System',
              inline: true
            }, {
              name: translations.warn?.unban || 'Разбан через',
              value: `<t:${unbanTimestamp}:R>`,
              inline: true
            }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
            await target.send({
              flags: MessageFlags.IsComponentsV2,
              components: [embedBan]
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Failed to send ban DM to ${target.tag}: ${error.message}`));
            });

            // Применяем временный бан
            await member.ban({
              reason: 'Превышен лимит предупреждений'
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error banning ${target.tag}: ${error.message}`));
              throw error;
            });
            const unbanTime = new Date(Date.now() + banDuration);
            const tempBan = new TempBan({
              userID: target.id,
              guildID: guild.id,
              moderatorID: 'System',
              reason,
              unbanTime
            });
            await tempBan.save().catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error saving TempBan for ${target.tag}: ${error.message}`));
              throw error;
            });
            console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Temporary ban applied to ${target.tag} for ${banDuration / (1000 * 60 * 60 * 24)} days`));

            // Логирование бана (на русском)
            if (logChannel) {
              const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[`Временный бан выдан <@${target.id}> на ${banDuration / (1000 * 60 * 60 * 24)} дней` ? new TextDisplayBuilder().setContent(`Временный бан выдан <@${target.id}> на ${banDuration / (1000 * 60 * 60 * 24)} дней`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: 'Причина',
                value: reason,
                inline: true
              }, {
                name: 'Модератор',
                value: 'System',
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
                console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Failed to send ban log to channel ${ADMIN_LOG_CHANNEL_ID}: ${error.message}`));
              });
              console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Ban log sent for ${target.tag}`));
            }
          } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error banning ${target.tag}: ${error.message}`));
          }
        } else if (punishment?.type === 'permanentBan') {
          try {
            // Отправляем DM о перманентном бане
            const embedBan = new ContainerBuilder().addTextDisplayComponents(...[translations.warn?.permbanmessage?.replace('{guildname}', `__**${guild.name}**__`) || `Вы получили бессрочный бан на сервере **${guild.name}**.` ? new TextDisplayBuilder().setContent(translations.warn?.permbanmessage?.replace('{guildname}', `__**${guild.name}**__`) || `Вы получили бессрочный бан на сервере **${guild.name}**.`) : null].filter(Boolean)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: translations.warn?.reason || 'Причина',
              value: reason,
              inline: true
            }, {
              name: translations.warn?.moderator || 'Модератор',
              value: 'System',
              inline: true
            }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
            await target.send({
              flags: MessageFlags.IsComponentsV2,
              components: [embedBan]
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Failed to send permanent ban DM to ${target.tag}: ${error.message}`));
            });

            // Применяем перманентный бан
            await member.ban({
              reason: 'Превышен лимит предупреждений'
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error banning ${target.tag}: ${error.message}`));
              throw error;
            });
            console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Permanent ban applied to ${target.tag}`));

            // Удаляем документ предупреждений
            await Warn.deleteOne({
              guildID: guild.id,
              userID: target.id
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error deleting Warn document for ${target.tag}: ${error.message}`));
              throw error;
            });
            console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Warn document deleted for ${target.tag}`));

            // Логирование перманентного бана (на русском)
            if (logChannel) {
              const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[`Бессрочный бан выдан <@${target.id}>` ? new TextDisplayBuilder().setContent(`Бессрочный бан выдан <@${target.id}>`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: 'Причина',
                value: reason,
                inline: true
              }, {
                name: 'Модератор',
                value: 'System',
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
                console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Failed to send permanent ban log to channel ${ADMIN_LOG_CHANNEL_ID}: ${error.message}`));
              });
              console.log(chalk.green(`[${new Date().toISOString()}] [Moderation] Permanent ban log sent for ${target.tag}`));
            }
          } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error banning ${target.tag}: ${error.message}`));
          }
        }
      } catch (error) {
        console.error(chalk.red(`[${new Date().toISOString()}] [Moderation] Error processing automoderation for ${message.author.tag}: ${error.message}`));
      }
    }
  }
};
