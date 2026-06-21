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
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
const tempMuteSchema = require('../../schemas/mute');
require('dotenv').config({ quiet: true });
const {
  ADMIN_LOG_CHANNEL_ID,
  MUTE_ROLE,
  ADMIN_ROLES_LEVEL_3,
  ADMIN_ROLES_LEVEL_1
} = process.env;
const allowedRolesLevel3 = typeof ADMIN_ROLES_LEVEL_3 === 'string' && ADMIN_ROLES_LEVEL_3 ? ADMIN_ROLES_LEVEL_3.split(',') : []; // Временный мут
const allowedRolesLevel4 = typeof ADMIN_ROLES_LEVEL_1 === 'string' && ADMIN_ROLES_LEVEL_1 ? ADMIN_ROLES_LEVEL_1.split(',') : []; // Перманентный мут
const logChannelId = ADMIN_LOG_CHANNEL_ID;
const MAX_TIMEOUT_DURATION = 28 * 24 * 60 * 60 * 1000; // 28 дней в миллисекундах
const PERMANENT_MUTE = 'permanent';
async function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  try {
    const data = await fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(data);
    return translations.mute ? translations : JSON.parse(await fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to load translations for ${language}: ${error.message}`));
    return JSON.parse(await fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('mute').setDescription('Mutes one or more members for a specific duration or permanently.').addStringOption((option) => option.setName('targets').setDescription('Comma-separated user IDs or mentions of the members to mute').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Reason for the mute').setRequired(true)).addStringOption((option) => option.setName('time').setDescription('Mute duration (e.g., 1h, 10m, 1d, 1w, 1y, or leave empty for permanent mute)').setRequired(false)),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Defer reply to handle long processing
    await interaction.deferReply({
      ephemeral: true
    });

    // Check database connection
    if (!client.connections.moderator) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: moderator_db connection is not available. Cannot process mute command.`));
      const translations = await loadTranslations('en');
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.mute?.resultsTitle || 'Mute Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.mute?.dbError || '❌ Mute command is currently unavailable due to database issues.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
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
    const moderatorLanguage = await UserLanguage?.findOne({
      userId: interaction.user.id
    }).catch(() => null);
    const language = moderatorLanguage ? moderatorLanguage.language : 'en';
    const translations = await loadTranslations(language);
    const translationsLog = await loadTranslations('ru'); // Load Russian translations for logs

    // Check if user has one of the allowed roles
    const hasLevel3Role = interaction.member.roles.cache.some((role) => allowedRolesLevel3.includes(role.id));
    const hasLevel4Role = interaction.member.roles.cache.some((role) => allowedRolesLevel4.includes(role.id));
    if (!hasLevel3Role && !hasLevel4Role) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] User ${interaction.user.tag} lacks permission to use /mute`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.mute?.resultsTitle || 'Mute Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.mute?.permission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
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
    const results = [];
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    const muteRole = interaction.guild.roles.cache.get(MUTE_ROLE);
    if (userIds.length === 0) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] No valid user IDs provided in targets: ${targetsString}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.mute?.resultsTitle || 'Mute Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.mute?.users || '❌ Users specified incorrectly!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    if (!muteRole) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Mute role not found`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.mute?.resultsTitle || 'Mute Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.mute?.noMuteRole || '❌ Mute role not found on the server!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Find the highest role position of the moderator among allowed roles
    let moderatorHighestRolePosition = -1;
    for (const roleId of [...allowedRolesLevel3, ...allowedRolesLevel4]) {
      const role = interaction.guild.roles.cache.get(roleId);
      if (role && interaction.member.roles.cache.has(roleId)) {
        moderatorHighestRolePosition = Math.max(moderatorHighestRolePosition, role.position);
      }
    }
    for (const id of userIds) {
      try {
        const target = await interaction.client.users.fetch(id).catch(() => null);
        if (!target) {
          console.log(chalk.yellow(`[${new Date().toISOString()}] User ID ${id} not found`));
          results.push(translations.mute?.usernotfound?.replace('{id}', `<@${id}>`) || `❌ User <@${id}> not found!`);
          continue;
        }
        const member = await interaction.guild.members.fetch(id).catch(() => null);
        if (!member) {
          console.log(chalk.yellow(`[${new Date().toISOString()}] User ${target.tag} is not a member of the server`));
          results.push(translations.mute?.usernotserver?.replace('{id}', `<@${id}>`) || `❌ Member <@${id}> not found on the server!`);
          continue;
        }
        if (member.id === interaction.user.id) {
          console.log(chalk.yellow(`[${new Date().toISOString()}] User ${target.tag} attempted to mute themselves`));
          results.push(translations.mute?.selfMute?.replace('{id}', `<@${id}>`) || `❌ You cannot mute yourself!`);
          continue;
        }
        if (member.id === interaction.client.user.id) {
          console.log(chalk.yellow(`[${new Date().toISOString()}] Attempted to mute the bot`));
          results.push(translations.mute?.botMute?.replace('{id}', `<@${id}>`) || `❌ You cannot mute the bot!`);
          continue;
        }

        // Check role hierarchy
        if (interaction.member.id !== interaction.guild.ownerId) {
          let targetHighestRolePosition = -1;
          for (const roleId of [...allowedRolesLevel3, ...allowedRolesLevel4]) {
            if (member.roles.cache.has(roleId)) {
              const role = interaction.guild.roles.cache.get(roleId);
              if (role) {
                targetHighestRolePosition = Math.max(targetHighestRolePosition, role.position);
              }
            }
          }
          if (targetHighestRolePosition >= moderatorHighestRolePosition) {
            console.log(chalk.yellow(`[${new Date().toISOString()}] Hierarchy error: Moderator cannot mute ${target.tag} due to role position`));
            results.push(translations.mute?.hierarchy?.replace('{id}', `<@${id}>`) || `❌ You cannot mute <@${id}> because their highest role is equal to or higher than yours!`);
            continue;
          }
        }
        if (!member.manageable) {
          console.log(chalk.yellow(`[${new Date().toISOString()}] Cannot mute ${target.tag} due to permissions`));
          results.push(translations.mute?.notcanmute?.replace('{id}', `<@${id}>`) || `❌ Unable to mute <@${id}>!`);
          continue;
        }
        const userLanguage = await UserLanguage?.findOne({
          userId: id
        }).catch((error) => {
          console.error(chalk.red(`[${new Date().toISOString()}] Error fetching user language for ${id}: ${error.message}`));
          return null;
        });
        const userLang = userLanguage ? userLanguage.language : 'en';
        console.log(chalk.blue(`[${new Date().toISOString()}] Loading translations for user ${id} with language: ${userLang}`));
        const userTranslations = await loadTranslations(userLang);
        if (!time || time.toLowerCase() === PERMANENT_MUTE) {
          // Check permission for permanent mute
          if (!hasLevel4Role) {
            console.log(chalk.yellow(`[${new Date().toISOString()}] User ${interaction.user.tag} lacks permission for permanent mute`));
            results.push(translations.mute?.noPermMutePermission?.replace('{id}', `<@${id}>`) || `❌ You do not have permission to issue a permanent mute for <@${id}>!`);
            continue;
          }
          try {
            await member.roles.add(muteRole);
            results.push(translations.mute?.successpermanent?.replace('{id}', `<@${id}>`) || `✅ Successfully muted <@${id}> permanently!`);

            // Send DM to user
            try {
              const embedmute = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.mute?.permmutedm?.replace('{guildname}', `__**${interaction.guild.name}**__`) || `:warning: You have been permanently muted on the server __**${interaction.guild.name}**__!`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: userTranslations.mute?.reason || 'Reason',
                value: `${reason}`,
                inline: true
              }, {
                name: userTranslations.mute?.moderator || 'Moderator',
                value: `${executor.tag}`,
                inline: true
              }, {
                name: userTranslations.mute?.unmute || 'Unmute Time',
                value: userTranslations.mute?.permmute || 'Permanent',
                inline: true
              }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
              await target.send({
                flags: MessageFlags.IsComponentsV2,
                components: [embedmute]
              });
            } catch (error) {
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${target.tag}: ${error.message}`));
            }

            // Log permanent mute in Russian
            if (logChannel) {
              const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.mute?.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id) || `Member **${target.tag}** (<@${id}>) was muted!` ? new TextDisplayBuilder().setContent(translationsLog.mute?.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id) || `Member **${target.tag}** (<@${id}>) was muted!`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: translationsLog.mute?.moderator || 'Moderator',
                value: `**${executor.tag}** (<@${executor.id}>)`,
                inline: true
              }, {
                name: translationsLog.mute?.reason || 'Reason',
                value: `${reason}`,
                inline: true
              }, {
                name: translationsLog.mute?.unmute || 'Unmute Time',
                value: translationsLog.mute?.permmute || 'Permanent',
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
            console.error(chalk.red(`[${new Date().toISOString()}] Error muting ${target.tag}: ${error.message}`));
            results.push(translations.mute?.error?.replace('{id}', `<@${id}>`) || `❌ An error occurred while muting user <@${id}>.`);
          }
        } else {
          // Check permission for temporary mute
          if (!hasLevel3Role) {
            console.log(chalk.yellow(`[${new Date().toISOString()}] User ${interaction.user.tag} lacks permission for temporary mute`));
            results.push(translations.mute?.noTempMutePermission?.replace('{id}', `<@${id}>`) || `❌ You do not have permission to issue a temporary mute for <@${id}>!`);
            continue;
          }
          const timeRegex = /^(\d+)([smhdwy])$/;
          const match = time.match(timeRegex);
          let muteDuration = null;
          let durationText = time;
          if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            switch (unit) {
              case 's':
                muteDuration = value * 1000;
                break;
              case 'm':
                muteDuration = value * 60 * 1000;
                break;
              case 'h':
                muteDuration = value * 60 * 60 * 1000;
                break;
              case 'd':
                muteDuration = value * 24 * 60 * 60 * 1000;
                break;
              case 'w':
                muteDuration = value * 7 * 24 * 60 * 60 * 1000;
                break;
              case 'y':
                muteDuration = value * 365 * 24 * 60 * 60 * 1000;
                break;
              default:
                console.log(chalk.yellow(`[${new Date().toISOString()}] Invalid duration format for user ${target.tag}: ${time}`));
                results.push(translations.mute?.invalidtime?.replace('{id}', `<@${id}>`) || `❌ Invalid time format for <@${id}>. Use formats: 1h, 2d, 1w, etc.`);
                continue;
            }
          } else {
            console.log(chalk.yellow(`[${new Date().toISOString()}] Invalid duration format for user ${target.tag}: ${time}`));
            results.push(translations.mute?.invalidtime?.replace('{id}', `<@${id}>`) || `❌ Invalid time format for <@${id}>. Use formats: 1h, 2d, 1w, etc.`);
            continue;
          }
          const totalDuration = muteDuration;
          let timeoutDuration = muteDuration;
          let remainingExtensions = 0;
          if (muteDuration > MAX_TIMEOUT_DURATION) {
            timeoutDuration = MAX_TIMEOUT_DURATION;
            remainingExtensions = Math.ceil((muteDuration - MAX_TIMEOUT_DURATION) / MAX_TIMEOUT_DURATION);
          }
          const unmuteTimestamp = Math.floor((Date.now() + totalDuration) / 1000);
          try {
            await member.timeout(timeoutDuration, reason);
            if (!member.communicationDisabledUntilTimestamp) {
              await member.roles.add(muteRole);
            }
            const tempMute = new TempMute({
              userID: member.id,
              guildID: interaction.guild.id,
              moderatorID: executor.id,
              reason,
              unmuteTime: new Date(Date.now() + totalDuration),
              totalDuration,
              remainingExtensions
            });
            await tempMute.save();
            results.push(translations.mute?.mutetime?.replace('{time}', durationText)?.replace('{id}', `<@${id}>`) || `✅ Successfully muted <@${id}> for ${durationText}!`);

            // Send DM to user
            try {
              const embedmute = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.mute?.timemutedm?.replace('{guildname}', `__**${interaction.guild.name}**__`) || `:warning: You have been temporarily muted on the server __**${interaction.guild.name}**__!`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: userTranslations.mute?.reason || 'Reason',
                value: `${reason}`,
                inline: true
              }, {
                name: userTranslations.mute?.moderator || 'Moderator',
                value: `${executor.tag}`,
                inline: true
              }, {
                name: userTranslations.mute?.unmute || 'Unmute Time',
                value: `<t:${unmuteTimestamp}:R>`,
                inline: true
              }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
              await target.send({
                flags: MessageFlags.IsComponentsV2,
                components: [embedmute]
              });
            } catch (error) {
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${target.tag}: ${error.message}`));
            }

            // Log temporary mute in Russian
            if (logChannel) {
              const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.mute?.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id) || `Member **${target.tag}** (<@${id}>) was muted!` ? new TextDisplayBuilder().setContent(translationsLog.mute?.logmessage?.replace('{tag}', target.tag)?.replace('{id}', id) || `Member **${target.tag}** (<@${id}>) was muted!`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: translationsLog.mute?.moderator || 'Moderator',
                value: `**${executor.tag}** (<@${executor.id}>)`,
                inline: true
              }, {
                name: translationsLog.mute?.reason || 'Reason',
                value: `${reason}`,
                inline: true
              }, {
                name: translationsLog.mute?.unmute || 'Unmute Time',
                value: `<t:${unmuteTimestamp}:R>`,
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
            console.error(chalk.red(`[${new Date().toISOString()}] Error muting ${target.tag}: ${error.message}`));
            results.push(translations.mute?.error?.replace('{id}', `<@${id}>`) || `❌ An error occurred while muting user <@${id}>.`);
          }
        }
      } catch (error) {
        console.error(chalk.red(`[${new Date().toISOString()}] Error processing user ${id}: ${error.message}`));
        results.push(translations.mute?.error?.replace('{id}', `<@${id}>`) || `❌ An error occurred while muting user <@${id}>.`);
      }
    }

    // Reply to moderator with results
    const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.mute?.resultsTitle?.replace('{count}', userIds.length) || `Mute Results for ${userIds.length} User${userIds.length === 1 ? '' : 's'}`}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(results.length > 0 ? results.join('\n\n') : translations.mute?.noresults || '❌ No valid users were processed.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [embed]
    }).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Failed to send final reply: ${error.message}`));
      if (error.code === 10062) return; // Suppress Unknown interaction
    });
    console.log(chalk.green(`[${new Date().toISOString()}] Mute command completed: ${results.length} users processed`));
  }
};