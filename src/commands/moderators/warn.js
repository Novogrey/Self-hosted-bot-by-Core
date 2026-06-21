const {
  SlashCommandBuilder,
  PermissionFlagsBits,
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
const tempMuteSchema = require('../../schemas/mute');
const tempBanSchema = require('../../schemas/ban');
const { getWarnPunishment } = require('../../utils/warnPunishments');
require('dotenv').config({ quiet: true });
const {
  ADMIN_LOG_CHANNEL_ID,
  ADMIN_ROLES_LEVEL_4,
  MUTE_ROLE
} = process.env;
const allowedRoles = ADMIN_ROLES_LEVEL_4.split(',');
const logChannelId = ADMIN_LOG_CHANNEL_ID;
async function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  try {
    const data = await fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(data);
    return translations.warn ? translations : JSON.parse(await fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to load translations for ${language}: ${error.message}`));
    return JSON.parse(await fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('warn').setDescription('Issues a warning to one or more users.').addStringOption((option) => option.setName('targets').setDescription('Mention users or provide their IDs, separated by commas.').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Reason for the warning').setRequired(true)).addStringOption((option) => option.setName('duration').setDescription('Optional duration for the warning (e.g., 1h, 2d). Leave empty for permanent warning')),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Defer reply to handle long processing
    await interaction.deferReply({
      ephemeral: true
    });

    // Check database connection
    if (!client.connections.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: users_db connection is not available. Cannot process warn command.`));
      const translations = await loadTranslations('en');
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.warn?.resultsTitle || 'Warn Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.warn?.dbError || '❌ Warn command is currently unavailable due to database issues.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Create models
    const UserLanguage = client.connections.users.model('UserLanguage', userLanguageSchema);
    const Warn = client.connections.moderator.model('Warn', warnSchema);
    const TempMute = client.connections.moderator.model('TempMute', tempMuteSchema);
    const TempBan = client.connections.moderator.model('TempBan', tempBanSchema);

    // Get moderator language
    const moderatorUser = interaction.user;
    const moderatorLanguage = await UserLanguage.findOne({
      userId: moderatorUser.id
    }).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Error fetching moderator language: ${error.message}`));
      return null;
    });
    const language = moderatorLanguage ? moderatorLanguage.language : 'en';
    console.log(chalk.blue(`[${new Date().toISOString()}] Loading translations for moderator ${moderatorUser.id} with language: ${language}`));
    const translations = await loadTranslations(language);
    const translationsLog = await loadTranslations('ru'); // Load Russian translations for logs

    // Check if moderator has one of the allowed roles
    if (!interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id))) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] User ${moderatorUser.tag} lacks permission to use /warn`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.warn?.resultsTitle || 'Warn Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.warn?.permission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    const targetsString = interaction.options.getString('targets');
    const reason = interaction.options.getString('reason');
    const duration = interaction.options.getString('duration');
    const muteRole = interaction.guild.roles.cache.get(MUTE_ROLE);
    const userIds = targetsString.split(',').map((id) => id.trim().replace(/[<@!>]/g, ''));
    const results = [];
    if (userIds.length === 0) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] No valid user IDs provided in targets: ${targetsString}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.warn?.resultsTitle || 'Warn Results'}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.warn?.users || '❌ Users specified incorrectly!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Find the highest role position of the moderator among ADMIN_ROLES_LEVEL_4
    let moderatorHighestRolePosition = -1;
    for (const roleId of allowedRoles) {
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
          results.push(translations.warn?.usernotfound?.replace('{id}', `<@${id}>`) || `❌ User <@${id}> not found!`);
          continue;
        }
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) {
          console.log(chalk.yellow(`[${new Date().toISOString()}] User ${target.tag} is not a member of the server`));
          results.push(translations.warn?.usernotserver?.replace('{id}', `<@${id}>`) || `❌ Member <@${id}> not found on the server!`);
          continue;
        }

        // Check role hierarchy
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
            console.log(chalk.yellow(`[${new Date().toISOString()}] Hierarchy error: Moderator cannot warn ${target.tag} due to role position`));
            results.push(translations.warn?.hierarchyError?.replace('{id}', `<@${id}>`) || `❌ You cannot warn <@${id}> because their highest role is equal to or higher than yours!`);
            continue;
          }
        }
        const userLanguage = await UserLanguage.findOne({
          userId: id
        }).catch((error) => {
          console.error(chalk.red(`[${new Date().toISOString()}] Error fetching user language for ${id}: ${error.message}`));
          return null;
        });
        const userLang = userLanguage ? userLanguage.language : 'en';
        console.log(chalk.blue(`[${new Date().toISOString()}] Loading translations for user ${id} with language: ${userLang}`));
        const userTranslations = await loadTranslations(userLang);
        let userWarnings = await Warn.findOne({
          guildID: interaction.guild.id,
          userID: target.id
        }).catch(() => null);
        if (!userWarnings) {
          userWarnings = new Warn({
            guildID: interaction.guild.id,
            userID: target.id,
            warnings: []
          });
        }
        const nextWarnID = userWarnings.warnings.length > 0 ? Math.max(...userWarnings.warnings.map((w) => w.warnID)) + 1 : 1;
        let expirationDate = null;
        let milliseconds = null;
        if (duration) {
          const timeRegex = /^(\d+)([smhdwyM])$/;
          const match = duration.match(timeRegex);
          if (!match) {
            console.log(chalk.yellow(`[${new Date().toISOString()}] Invalid duration format for user ${target.tag}: ${duration}`));
            results.push(translations.warn?.invalidduration?.replace('{id}', `<@${id}>`) || `❌ Invalid duration format for <@${id}>!`);
            continue;
          }
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
            case 'M':
              milliseconds = value * 30 * 24 * 60 * 60 * 1000;
              break;
            case 'y':
              milliseconds = value * 365 * 24 * 60 * 60 * 1000;
              break;
          }
          expirationDate = new Date(Date.now() + milliseconds);
        }

        // Send DM to user before issuing the warning
        try {
          const expirationTimestamp = expirationDate ? Math.floor(expirationDate.getTime() / 1000) : null;
          const expirationMessage = expirationDate ? userTranslations.warn?.temporary?.replace('{time}', `<t:${expirationTimestamp}:R>`) || `Temporary warning, expires <t:${expirationTimestamp}:R>` : userTranslations.warn?.permanent || 'Permanent';
          const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.warn?.warnmessage?.replace('{guildname}', `__**${interaction.guild.name}**__`) || `:warning: You have been warned on the server __**${interaction.guild.name}**__!`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: userTranslations.warn?.warnid || 'Warn ID',
            value: `${nextWarnID}`,
            inline: true
          }, {
            name: userTranslations.warn?.reason || 'Reason',
            value: `${reason}`,
            inline: true
          }, {
            name: userTranslations.warn?.moderator || 'Moderator',
            value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
            inline: true
          }, {
            name: userTranslations.warn?.duration || 'Duration',
            value: expirationMessage,
            inline: true
          }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await target.send({
            flags: MessageFlags.IsComponentsV2,
            components: [embed]
          }).catch((error) => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${target.tag}: ${error.message}`));
          });
        } catch (error) {
          console.error(chalk.red(`[${new Date().toISOString()}] Failed to send DM to ${target.tag}: ${error.message}`));
        }

        // Save the warning
        userWarnings.warnings.push({
          warnID: nextWarnID,
          modID: interaction.user.id,
          reason,
          timestamp: new Date(),
          expires: expirationDate
        });
        await userWarnings.save();
        console.log(chalk.green(`[${new Date().toISOString()}] Warning saved for ${target.tag} (Warn ID: ${nextWarnID})`));

        // Add successful result
        const expirationTimestamp = expirationDate ? Math.floor(expirationDate.getTime() / 1000) : null;
        const expirationMessageMod = expirationDate ? translations.warn?.temporary?.replace('{time}', `<t:${expirationTimestamp}:R>`) || `Temporary warning, expires <t:${expirationTimestamp}:R>` : translations.warn?.permanent || 'Permanent';
        results.push(translations.warn?.success?.replace('{id}', `<@${target.id}>`)?.replace('{warnid}', nextWarnID) || `✅ Successfully warned <@${target.id}> (Warn ID: ${nextWarnID})`);

        // Log warning in Russian
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.warn?.logmessage?.replace('{id}', `<@${target.id}>`)?.replace('{warnid}', nextWarnID) || `Member <@${target.id}> was warned (Warn ID: ${nextWarnID})` ? new TextDisplayBuilder().setContent(translationsLog.warn?.logmessage?.replace('{id}', `<@${target.id}>`)?.replace('{warnid}', nextWarnID) || `Member <@${target.id}> was warned (Warn ID: ${nextWarnID})`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: translationsLog.warn?.reason || 'Reason',
            value: `${reason}`,
            inline: true
          }, {
            name: translationsLog.warn?.moderator || 'Moderator',
            value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
            inline: true
          }, {
            name: translationsLog.warn?.duration || 'Duration',
            value: expirationMessageMod,
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
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log for warning ${nextWarnID} for ${target.tag}: ${error.message}`));
          });
        }

        // Check warning count and apply punishment
        const warningCount = userWarnings.warnings.length;
        const punishment = getWarnPunishment(warningCount);
        const muteDuration = punishment?.type === 'mute' ? punishment.durationMs : null;
        const banDuration = punishment?.type === 'ban' ? punishment.durationMs : null;

        if (muteDuration) {
          try {
            // Check if mute role exists
            if (!muteRole) {
              console.log(chalk.yellow(`[${new Date().toISOString()}] Mute role not found for ${target.tag}`));
              results.push(translations.warn?.muteRoleNotFound?.replace('{id}', `<@${target.id}>`) || `❌ Mute role not found for <@${target.id}>!`);
              continue;
            }

            // Send DM about mute
            const unmuteTimestamp = Math.floor((Date.now() + muteDuration) / 1000);
            const embedMute = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.warn?.mutemessage?.replace('{guildname}', `__**${interaction.guild.name}**__`) || `:warning: You have been muted on the server __**${interaction.guild.name}**__!`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: userTranslations.warn?.reason || 'Reason',
              value: `${reason}`,
              inline: true
            }, {
              name: userTranslations.warn?.moderator || 'Moderator',
              value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
              inline: true
            }, {
              name: userTranslations.warn?.duration || 'Duration',
              value: `<t:${unmuteTimestamp}:R>`,
              inline: true
            }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
            await target.send({
              flags: MessageFlags.IsComponentsV2,
              components: [embedMute]
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send mute DM to ${target.tag}: ${error.message}`));
            });
            await member.roles.add(muteRole).catch((error) => {
              throw new Error(`Failed to add mute role: ${error.message}`);
            });
            const unmuteTime = new Date(Date.now() + muteDuration);
            const tempMute = new TempMute({
              userID: target.id,
              guildID: interaction.guild.id,
              moderatorID: interaction.user.id,
              reason,
              unmuteTime,
              totalDuration: muteDuration // Added to fix validation error
            });
            await tempMute.save();
            console.log(chalk.green(`[${new Date().toISOString()}] Mute applied to ${target.tag} for ${muteDuration / 60000} minutes`));

            // Log mute in Russian
            if (logChannel) {
              const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.warn?.logmutemessage?.replace('{id}', `<@${target.id}>`)?.replace('{duration}', `${muteDuration / 60000}`) || `Member <@${target.id}> was muted for ${muteDuration / 60000} minutes!` ? new TextDisplayBuilder().setContent(translationsLog.warn?.logmutemessage?.replace('{id}', `<@${target.id}>`)?.replace('{duration}', `${muteDuration / 60000}`) || `Member <@${target.id}> was muted for ${muteDuration / 60000} minutes!`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: translationsLog.warn?.reason || 'Reason',
                value: `${reason}`,
                inline: true
              }, {
                name: translationsLog.warn?.moderator || 'Moderator',
                value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
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
                console.error(chalk.red(`[${new Date().toISOString()}] Failed to send mute log for ${target.tag}: ${error.message}`));
              });
            }
          } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] Error muting ${target.tag}: ${error.message}`));
            results.push(translations.warn?.muteerror?.replace('{id}', `<@${target.id}>`) || `❌ Error muting <@${target.id}>!`);
          }
        } else if (banDuration) {
          try {
            // Send DM about temporary ban
            const unbanTimestamp = Math.floor((Date.now() + banDuration) / 1000);
            const embedBan = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.warn?.banmessage?.replace('{guildname}', `__**${interaction.guild.name}**__`) || `:warning: You have been temporarily banned from the server __**${interaction.guild.name}**__!`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: userTranslations.warn?.reason || 'Reason',
              value: `${reason}`,
              inline: true
            }, {
              name: userTranslations.warn?.moderator || 'Moderator',
              value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
              inline: true
            }, {
              name: userTranslations.warn?.unban || 'Unban Time',
              value: `<t:${unbanTimestamp}:R>`,
              inline: true
            }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
            await target.send({
              flags: MessageFlags.IsComponentsV2,
              components: [embedBan]
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send ban DM to ${target.tag}: ${error.message}`));
            });
            await member.ban({
              reason: `Exceeded warning limit`
            }).catch((error) => {
              throw new Error(`Failed to ban: ${error.message}`);
            });
            const unbanTime = new Date(Date.now() + banDuration);
            const tempBan = new TempBan({
              userID: target.id,
              guildID: interaction.guild.id,
              moderatorID: interaction.user.id,
              reason,
              unbanTime
            });
            await tempBan.save();
            console.log(chalk.green(`[${new Date().toISOString()}] Temporary ban applied to ${target.tag} for ${banDuration / (1000 * 60 * 60 * 24)} days`));

            // Log temporary ban in Russian
            if (logChannel) {
              const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.warn?.logbanmessage?.replace('{id}', `<@${target.id}>`)?.replace('{duration}', `${banDuration / (1000 * 60 * 60 * 24)}`) || `Member <@${target.id}> was banned for ${banDuration / (1000 * 60 * 60 * 24)} days!` ? new TextDisplayBuilder().setContent(translationsLog.warn?.logbanmessage?.replace('{id}', `<@${target.id}>`)?.replace('{duration}', `${banDuration / (1000 * 60 * 60 * 24)}`) || `Member <@${target.id}> was banned for ${banDuration / (1000 * 60 * 60 * 24)} days!`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: translationsLog.warn?.reason || 'Reason',
                value: `${reason}`,
                inline: true
              }, {
                name: translationsLog.warn?.moderator || 'Moderator',
                value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
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
                console.error(chalk.red(`[${new Date().toISOString()}] Failed to send ban log for ${target.tag}: ${error.message}`));
              });
            }
          } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] Error banning ${target.tag}: ${error.message}`));
            results.push(translations.warn?.banerror?.replace('{id}', `<@${target.id}>`) || `❌ Error banning <@${target.id}>!`);
          }
        } else if (punishment?.type === 'permanentBan') {
          try {
            // Send DM about permanent ban
            const embedBan = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(userTranslations.warn?.permbanmessage?.replace('{guildname}', `__**${interaction.guild.name}**__`) || `:warning: You have been permanently banned from the server __**${interaction.guild.name}**__!`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
              name: userTranslations.warn?.reason || 'Reason',
              value: `${reason}`,
              inline: true
            }, {
              name: userTranslations.warn?.moderator || 'Moderator',
              value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
              inline: true
            }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
            await target.send({
              flags: MessageFlags.IsComponentsV2,
              components: [embedBan]
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send permanent ban DM to ${target.tag}: ${error.message}`));
            });
            await member.ban({
              reason: `Exceeded warning limit`
            }).catch((error) => {
              throw new Error(`Failed to ban: ${error.message}`);
            });
            console.log(chalk.green(`[${new Date().toISOString()}] Permanent ban applied to ${target.tag}`));

            // Delete the Warn document
            await Warn.deleteOne({
              guildID: interaction.guild.id,
              userID: target.id
            }).catch((error) => {
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to delete Warn document for ${target.tag}: ${error.message}`));
            });
            console.log(chalk.green(`[${new Date().toISOString()}] Warn document deleted for ${target.tag}`));

            // Add document deletion to results
            results.push(translations.warn?.documentDeleted?.replace('{id}', `<@${target.id}>`) || `✅ Warn document deleted for <@${target.id}>`);

            // Log permanent ban in Russian
            if (logChannel) {
              const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.warn?.logpermbanmessage?.replace('{id}', `<@${target.id}>`) || `Member <@${target.id}> was permanently banned!` ? new TextDisplayBuilder().setContent(translationsLog.warn?.logpermbanmessage?.replace('{id}', `<@${target.id}>`) || `Member <@${target.id}> was permanently banned!`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
                name: translationsLog.warn?.reason || 'Reason',
                value: `${reason}`,
                inline: true
              }, {
                name: translationsLog.warn?.moderator || 'Moderator',
                value: `**${moderatorUser.tag}** (<@${moderatorUser.id}>)`,
                inline: true
              }, {
                name: translationsLog.warn?.documentDeleted || 'Warn Document',
                value: translationsLog.warn?.documentDeletedStatus || 'Deleted',
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
                console.error(chalk.red(`[${new Date().toISOString()}] Failed to send permanent ban log for ${target.tag}: ${error.message}`));
              });
            }
          } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] Error banning ${target.tag}: ${error.message}`));
            results.push(translations.warn?.banerror?.replace('{id}', `<@${target.id}>`) || `❌ Error banning <@${target.id}>!`);
          }
        }
      } catch (error) {
        console.error(chalk.red(`[${new Date().toISOString()}] Error processing user ${target ? target.tag : id}: ${error.message}`));
        results.push(translations.warn?.error?.replace('{id}', `<@${id}>`) || `❌ Error processing user <@${id}>!`);
      }
    }

    // Reply to moderator with results
    const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.warn?.resultsTitle?.replace('{count}', userIds.length) || `Warn Results for ${userIds.length} User${userIds.length === 1 ? '' : 's'}`}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(results.length > 0 ? results.join('\n\n') : translations.warn?.noresults || '❌ No valid users were processed.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [embed]
    }).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Failed to send final reply: ${error.message}`));
      if (error.code === 10062) return; // Suppress Unknown interaction
    });
    console.log(chalk.green(`[${new Date().toISOString()}] Warn command completed: ${results.length} users processed`));
  }
};
