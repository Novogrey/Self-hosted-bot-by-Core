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
const userLanguageSchema = require('../../schemas/userLanguage');
const { moderationDmTags, sendModerationDm } = require('../../utils/moderationDmMessages');
const allowedRoles = typeof ADMIN_ROLES_LEVEL_1 === 'string' && ADMIN_ROLES_LEVEL_1 ? ADMIN_ROLES_LEVEL_1.split(',') : [];
const logChannelId = ADMIN_LOG_CHANNEL_ID;
function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('kick').setDescription('Kicks one or more members from the server.').addStringOption((option) => option.setName('targets').setDescription('Mention users or provide their IDs, separated by commas.').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Reason for the kick').setRequired(true)),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Defer reply to handle long processing
    await interaction.deferReply({
      ephemeral: true
    });
    const UserLanguage = client.connections.users.model('UserLanguage', userLanguageSchema);

    // Check if user has one of the allowed roles
    const moderatorLanguage = await UserLanguage.findOne({
      userId: interaction.user.id
    }).catch(() => null);
    const languagemoderator = moderatorLanguage ? moderatorLanguage.language : 'en';
    const translationsmoderator = loadTranslations(languagemoderator);
    if (!interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id))) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.kick.permission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      try {
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [embed]
        });
      } catch (error) {
        console.error('Error responding to permission check:', error);
        if (error.code === 10062) return;
        throw error;
      }
      return;
    }
    const targetsString = interaction.options.getString('targets');
    const reason = interaction.options.getString('reason');
    const executor = interaction.user;
    const userIds = targetsString.split(',').map((id) => id.trim().replace(/[<@!>]/g, ''));
    if (userIds.length === 0) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsmoderator.kick.users || '❌ Users specified incorrectly!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      try {
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [embed]
        });
      } catch (error) {
        console.error('Error responding to invalid users:', error);
        if (error.code === 10062) return;
        throw error;
      }
      return;
    }
    const results = [];
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    const translationsLog = loadTranslations('ru'); // Load Russian translations for logs

    for (const id of userIds) {
      const target = await interaction.client.users.fetch(id).catch(() => null);
      if (!target) {
        results.push(`${translationsmoderator.kick.usernotfound.replace('{id}', `<@${id}>`)}`);
        continue;
      }
      const member = await interaction.guild.members.fetch(id).catch(() => null);
      if (!member) {
        results.push(`${translationsmoderator.kick.usernotserver.replace('{id}', `<@${id}>`)}`);
        continue;
      }

      // Check role hierarchy
      const executorAdminRoles = interaction.member.roles.cache.filter((role) => allowedRoles.includes(role.id));
      const targetAdminRoles = member.roles.cache.filter((role) => allowedRoles.includes(role.id));
      let canKick = true;
      if (targetAdminRoles.size > 0) {
        const executorHighestAdminRole = executorAdminRoles.reduce((highest, role) => !highest || role.position > highest.position ? role : highest, null);
        const targetHighestAdminRole = targetAdminRoles.reduce((highest, role) => !highest || role.position > highest.position ? role : highest, null);
        if (executorHighestAdminRole && targetHighestAdminRole && targetHighestAdminRole.position >= executorHighestAdminRole.position) {
          canKick = false;
        }
      }
      if (!canKick) {
        results.push(`${translationsmoderator.kick.hierarchy?.replace('{id}', `<@${id}>`) || `❌ You cannot kick <@${id}> because their highest admin role is equal to or higher than yours!`}`);
        continue;
      }
      if (!member.kickable) {
        results.push(`${translationsmoderator.kick.notcankick.replace('{id}', `<@${id}>`)}`);
        continue;
      }

      // Send DM to the user
      const userLanguage = await UserLanguage.findOne({
        userId: id
      }).catch(() => null);
      const language = userLanguage ? userLanguage.language : 'en';
      const translationsuser = loadTranslations(language);
      try {
        const embedkick = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsuser.kick.kickmessage.replace('{guildname}', `__**${interaction.guild.name}**__`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
          name: translationsuser.kick.reason,
          value: `${reason}`,
          inline: true
        }, {
          name: translationsuser.kick.moderator,
          value: `${executor.tag}`,
          inline: true
        }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        await sendModerationDm(target, 'moderation.kick.dm', moderationDmTags({
          guild: interaction.guild,
          target,
          moderator: executor,
          reason,
          duration: 'Not applicable',
          expires: 'Not applicable',
          action: 'kick'
        }), {
          flags: MessageFlags.IsComponentsV2,
          components: [embedkick]
        }).catch((error) => {
          console.error(`Failed to send DM to ${target.tag}:`, error);
        });
      } catch (error) {
        console.error(`Failed to send DM to ${target.tag}:`, error);
      }

      // Perform the kick
      try {
        await member.kick(reason);
        results.push(`${translationsmoderator.kick.success.replace('{id}', `<@${id}>`)}`);

        // Log the kick in Russian
        if (logChannel) {
          const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[translationsLog.kick.logmessage.replace('{tag}', target.tag).replace('{id}', id) ? new TextDisplayBuilder().setContent(translationsLog.kick.logmessage.replace('{tag}', target.tag).replace('{id}', id)) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof target.displayAvatarURL() === 'string' ? target.displayAvatarURL() : target.displayAvatarURL()?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: translationsLog.kick.moderator,
            value: `**${executor.tag}** (<@${executor.id}>)`,
            inline: true
          }, {
            name: translationsLog.kick.reason,
            value: `${reason}`,
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
            console.error(`Failed to send log for ${target.tag}:`, error);
          });
        }
      } catch (error) {
        console.error(`Error kicking ${target.tag}:`, error);
        results.push(`${translationsmoderator.kick.error.replace('{id}', `<@${id}>`)}`);
      }
    }

    // Send a single reply with all results
    const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translationsmoderator.kick.resultsTitle || `Kick Results for ${userIds.length} User${userIds.length === 1 ? '' : 's'}`}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(results.length > 0 ? results.join('\n\n') : translationsmoderator.kick.noresults || '❌ No valid users were processed.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
    try {
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    } catch (error) {
      console.error('Failed to send final reply:', error);
      if (error.code === 10062) return; // Suppress Unknown interaction
    }
  }
};
