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
  MUTE_ROLE,
  ADMIN_ROLES_LEVEL_3
} = process.env;
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
const tempMuteSchema = require('../../schemas/mute');
const allowedRoles = typeof ADMIN_ROLES_LEVEL_3 === 'string' && ADMIN_ROLES_LEVEL_3 ? ADMIN_ROLES_LEVEL_3.split(',') : [];
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
  data: new SlashCommandBuilder().setName('unmute').setDescription('Remove temporary mute from one or more members.').addStringOption((option) => option.setName('targets').setDescription('User IDs or mentions to unmute, separated by commas.').setRequired(true)),
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
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: moderator_db connection is not available. Cannot process unmute command.`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.unmute.resultsTitle || 'Unmute Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.unmute.dbError || '❌ Unmute command is currently unavailable due to database issues.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
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
    const TempMute = client.connections.moderator.model('TempMute', tempMuteSchema);

    // Get moderator language
    const moderator = interaction.user;
    const moderatorLanguage = await UserLanguage.findOne({
      userId: moderator.id
    }).catch(() => null);
    const language = moderatorLanguage ? moderatorLanguage.language : 'en';
    const translations = await loadTranslations(language);
    const translationsLog = await loadTranslations('ru'); // Load Russian translations for logs

    // Проверка на наличие разрешенных ролей
    if (!interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id))) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.unmute.resultsTitle || 'Unmute Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.unmute.noPermission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    const targetsString = interaction.options.getString('targets');
    const targets = targetsString.split(',').map((target) => target.trim());
    const results = [];
    if (targets.length === 0) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.unmute.resultsTitle || 'Unmute Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.unmute.invalidUsers || '❌ Users specified incorrectly!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Найти позицию высшей роли модератора среди ADMIN_ROLES_LEVEL_3
    let moderatorHighestRolePosition = -1;
    for (const roleId of allowedRoles) {
      const role = interaction.guild.roles.cache.get(roleId);
      if (role && interaction.member.roles.cache.has(roleId)) {
        moderatorHighestRolePosition = Math.max(moderatorHighestRolePosition, role.position);
      }
    }
    for (const target of targets) {
      // Проверка, является ли элемент упоминанием
      const idMatch = target.match(/^<@!?(\d+)>$/);
      const userID = idMatch ? idMatch[1] : target;
      try {
        const member = await interaction.guild.members.fetch(userID).catch(() => null);
        if (!member) {
          results.push(translations.unmute.userNotFound.replace('{id}', `<@${userID}>`));
          continue;
        }
        if (member.id === interaction.user.id) {
          results.push(translations.unmute.cannotUnmuteSelf.replace('{id}', `<@${userID}>`));
          continue;
        }
        if (member.id === interaction.client.user.id) {
          results.push(translations.unmute.cannotUnmuteBot.replace('{id}', `<@${userID}>`));
          continue;
        }

        // Проверка иерархии ролей из ADMIN_ROLES_LEVEL_3
        if (interaction.member.id !== interaction.guild.ownerId) {
          let targetHighestRolePosition = -1;
          for (const roleId of allowedRoles) {
            if (member.roles.cache.has(roleId)) {
              const role = interaction.guild.roles.cache.get(roleId);
              if (role) {
                targetHighestRolePosition = Math.max(targetHighestRolePosition, role.position);
              }
            }
          }
          if (targetHighestRolePosition >= moderatorHighestRolePosition) {
            results.push(translations.unmute.hierarchyError.replace('{id}', `<@${userID}>`));
            continue;
          }
        }
        const muteRole = interaction.guild.roles.cache.get(MUTE_ROLE);
        if (!muteRole) {
          results.push(translations.unmute.muteRoleNotFound || '❌ Mute role not found!');
          continue;
        }

        // Проверяем, находится ли пользователь в муте
        if (!member.roles.cache.has(muteRole.id) && !member.communicationDisabledUntilTimestamp) {
          results.push(translations.unmute.notMuted.replace('{id}', `<@${member.id}>`));
          continue;
        }

        // Находим запись о муте для получения причины (если есть)
        const muteRecord = await TempMute.findOne({
          userID: member.id,
          guildID: interaction.guild.id
        });

        // Удаляем роль мута
        if (member.roles.cache.has(muteRole.id)) {
          await member.roles.remove(muteRole).catch((error) => {
            throw new Error(`Failed to remove mute role: ${error.message}`);
          });
        }

        // Снимаем таймаут, если он был установлен
        if (member.communicationDisabledUntilTimestamp) {
          await member.timeout(null).catch((error) => {
            throw new Error(`Failed to remove timeout: ${error.message}`);
          });
        }

        // Удаляем запись о муте из базы данных
        if (muteRecord) {
          await TempMute.deleteOne({
            _id: muteRecord._id
          });
          console.log(chalk.green(`[${new Date().toISOString()}] User with ID ${member.id} was removed from temporary mutes database.`));
        }

        // Получаем язык пользователя
        const userLanguage = await UserLanguage.findOne({
          userId: member.id
        }).catch(() => null);
        const userLang = userLanguage ? userLanguage.language : 'en';
        const userTranslations = await loadTranslations(userLang);

        // Отправка сообщения в ЛС пользователю
        try {
          const embed = new ContainerBuilder().setAccentColor(resolveColor('#00FF00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.unmute.userMessage.replace('{guildname}', `__**${interaction.guild.name}**__`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: userTranslations.unmute.reason,
            value: muteRecord?.reason || userTranslations.unmute.noReason,
            inline: true
          }, {
            name: userTranslations.unmute.moderator,
            value: `**${moderator.tag}** (<@${moderator.id}>)`,
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await member.user.send({
            flags: MessageFlags.IsComponentsV2,
            components: [embed]
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${member.user.tag}: ${error.message}`));
          });
        } catch (err) {
          console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${member.user.tag}: ${err.message}`));
        }

        // Логирование снятия мута на русском
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.unmute.logMessage.replace('{id}', `<@${member.id}>`).replace('{guildname}', interaction.guild.name) ? new TextDisplayBuilder().setContent(translationsLog.unmute.logMessage.replace('{id}', `<@${member.id}>`).replace('{guildname}', interaction.guild.name)) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof member.user.displayAvatarURL() === 'string' ? member.user.displayAvatarURL() : member.user.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: translationsLog.unmute.reason,
            value: muteRecord?.reason || translationsLog.unmute.noReason,
            inline: true
          }, {
            name: translationsLog.unmute.moderator,
            value: `**${moderator.tag}** (<@${moderator.id}>)`,
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [{
            text: `ID: ${member.id}`,
            iconURL: member.user.displayAvatarURL() || null
          }?.text, `<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await logChannel.send({
            allowedMentions: { parse: [], repliedUser: false },
            flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
            components: [embed]
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log for unmuting ${member.user.tag}: ${error.message}`));
          });
        }

        // Добавляем успешный результат
        results.push(translations.unmute.success.replace('{id}', `<@${member.id}>`));
      } catch (error) {
        console.error(chalk.red(`[${new Date().toISOString()}] Error processing unmute for user ${userID}: ${error.message}`));
        results.push(translations.unmute.error.replace('{id}', `<@${userID}>`));
      }
    }

    // Ответ модератору с результатами
    const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.unmute.resultsTitle || `Unmute Results for ${targets.length} User${targets.length === 1 ? '' : 's'}`}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(results.length > 0 ? results.join('\n\n') : translations.unmute.noresults || '❌ No valid users were processed.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [embed]
    }).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Failed to send final reply: ${error.message}`));
      if (error.code === 10062) return; // Suppress Unknown interaction
    });
  }
};