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
  ADMIN_ROLES_LEVEL_2
} = process.env;
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
const warnSchema = require('../../schemas/warn');
const allowedRoles = typeof ADMIN_ROLES_LEVEL_2 === 'string' && ADMIN_ROLES_LEVEL_2 ? ADMIN_ROLES_LEVEL_2.split(',') : [];
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
  data: new SlashCommandBuilder().setName('remwarn').setDescription('Removes specific warning(s) from one or more users.').addStringOption((option) => option.setName('targets').setDescription('Comma-separated user IDs or mentions (e.g., <@id1>,<@id2>)').setRequired(true)).addStringOption((option) => option.setName('warnids').setDescription('Warning ID or comma-separated IDs (e.g., 1 or 1,2,3) if one user is specified').setRequired(true)),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Defer reply to handle long processing
    await interaction.deferReply({
      ephemeral: true
    });

    // Check database connection
    if (!client.connections.moderator) {
      const translations = loadTranslations('en');
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: moderator_db connection is not available. Cannot process remwarn command.`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.remwarn.resultsTitle || 'Remove Warning Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.remwarn.dbError || '❌ Remwarn command is currently unavailable due to database issues.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
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
    const Warn = client.connections.moderator.model('Warn', warnSchema);

    // Get moderator language
    const moderatorLanguage = await UserLanguage.findOne({
      userId: interaction.user.id
    }).catch(() => null);
    const languagemoderator = moderatorLanguage ? moderatorLanguage.language : 'en';
    const translationsmoderator = loadTranslations(languagemoderator);
    const translationsLog = loadTranslations('ru'); // Load Russian translations for logs

    // Check if moderator has one of the allowed roles
    if (!interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id))) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] User ${interaction.user.tag} lacks permission to use /remwarn`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translationsmoderator.remwarn.resultsTitle || 'Remove Warning Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.remwarn.permission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Find the highest role position of the moderator among ADMIN_ROLES_LEVEL_2
    let moderatorHighestRolePosition = -1;
    for (const roleId of allowedRoles) {
      const role = interaction.guild.roles.cache.get(roleId);
      if (role && interaction.member.roles.cache.has(roleId)) {
        moderatorHighestRolePosition = Math.max(moderatorHighestRolePosition, role.position);
      }
    }
    const targetsString = interaction.options.getString('targets');
    const warnIdsString = interaction.options.getString('warnids');
    const guildID = interaction.guild.id;
    const userIds = targetsString.split(',').map((id) => id.trim().replace(/[<@!>]/g, ''));
    let warnIds = warnIdsString.split(',').map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
    if (userIds.length === 0) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] No valid user IDs provided in targets: ${targetsString}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translationsmoderator.remwarn.resultsTitle || 'Remove Warning Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.remwarn.invalidUsers || '❌ Users specified incorrectly!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Если указано несколько пользователей, обрабатываем только первый warnID
    if (userIds.length > 1 && warnIds.length > 1) {
      warnIds = [warnIds[0]];
    }
    const results = [];
    for (const id of userIds) {
      // Проверка существования пользователя
      const target = await interaction.client.users.fetch(id).catch(() => null);
      if (!target) {
        console.log(chalk.yellow(`[${new Date().toISOString()}] User ID ${id} not found`));
        results.push(translationsmoderator.remwarn.usernotfound.replace('{id}', `<@${id}>`));
        continue;
      }

      // Проверка, является ли пользователь участником сервера
      const targetMember = await interaction.guild.members.fetch(id).catch(() => null);
      if (!targetMember) {
        console.log(chalk.yellow(`[${new Date().toISOString()}] User ${target.tag} is not a member of the server`));
        results.push(translationsmoderator.remwarn.usernotserver?.replace('{id}', `<@${id}>`) || `❌ User <@${id}> is not a member of the server.`);
        continue;
      }

      // Check role hierarchy based only on allowedRoles
      if (interaction.member.id !== interaction.guild.ownerId) {
        let targetHighestRolePosition = -1;
        for (const roleId of allowedRoles) {
          if (targetMember.roles.cache.has(roleId)) {
            const role = interaction.guild.roles.cache.get(roleId);
            if (role) {
              targetHighestRolePosition = Math.max(targetHighestRolePosition, role.position);
            }
          }
        }
        if (targetHighestRolePosition >= moderatorHighestRolePosition) {
          console.log(chalk.yellow(`[${new Date().toISOString()}] Hierarchy error: Moderator cannot remove warning for ${target.tag} due to role position`));
          results.push(translationsmoderator.remwarn.hierarchyError.replace('{id}', `<@${id}>`));
          continue;
        }
      }
      try {
        // Найти предупреждения для указанного пользователя
        let userWarnings = await Warn.findOne({
          guildID,
          userID: id
        });
        if (!userWarnings || userWarnings.warnings.length === 0) {
          results.push(translationsmoderator.remwarn.nowarnings.replace('{id}', `<@${id}>`));
          continue;
        }

        // Обработка предупреждений
        const targetWarnIds = userIds.length === 1 ? warnIds : [warnIds[0]];
        for (const warnID of targetWarnIds) {
          const warnIndex = userWarnings.warnings.findIndex((warn) => warn.warnID === warnID);
          if (warnIndex === -1) {
            results.push(translationsmoderator.remwarn.warnnotfound.replace('{warnid}', warnID).replace('{id}', `<@${id}>`));
            continue;
          }

          // Удалить предупреждение
          const removedWarn = userWarnings.warnings.splice(warnIndex, 1)[0];
          results.push(translationsmoderator.remwarn.success.replace('{warnid}', warnID).replace('{id}', `<@${id}>`));

          // Логирование в канал на русском
          const logChannel = interaction.guild.channels.cache.get(logChannelId);
          if (logChannel) {
            const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.remwarn.logmessage.replace('{id}', `<@${id}>`).replace('{warnid}', warnID) ? new TextDisplayBuilder().setContent(translationsLog.remwarn.logmessage.replace('{id}', `<@${id}>`).replace('{warnid}', warnID)) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: translationsLog.remwarn.reason,
              value: `${removedWarn.reason}`,
              inline: true
            }, {
              name: translationsLog.remwarn.moderator,
              value: `**${interaction.user.tag}** (<@${interaction.user.id}>)`,
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
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log for warning ${warnID} removal for ${target.tag}: ${error.message}`));
            });
          }
        }

        // Сохранить изменения или удалить документ
        if (userWarnings.warnings.length === 0) {
          await Warn.deleteOne({
            guildID,
            userID: id
          });
        } else {
          await userWarnings.save();
        }
      } catch (error) {
        console.error(chalk.red(`[${new Date().toISOString()}] Error processing warning removal for ${target.tag}: ${error.message}`));
        results.push(translationsmoderator.remwarn.error.replace('{id}', `<@${id}>`));
      }
    }

    // Ответ модератору с результатами
    const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translationsmoderator.remwarn.resultsTitle || `Remove Warning Results for ${userIds.length} User${userIds.length === 1 ? '' : 's'}`}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(results.length > 0 ? results.join('\n\n') : translationsmoderator.remwarn.noresults || '❌ No valid users were processed.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [embed]
    }).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Failed to send final reply: ${error.message}`));
      if (error.code === 10062) return;
    });
  }
};