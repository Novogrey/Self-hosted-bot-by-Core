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
  ADMIN_ROLES_LEVEL_3
} = process.env;
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
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
  data: new SlashCommandBuilder().setName('slowmode').setDescription('Set the slowmode for the channel.').addStringOption(option => option.setName('time').setDescription('The time duration for slowmode (e.g., 5s, 1m, 1h, or 0 to disable)').setRequired(true)),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Defer reply to handle long processing
    await interaction.deferReply({
      ephemeral: true
    });

    // Check database connection
    if (!client.connections.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: users_db connection is not available. Using default language (en).`));
    }

    // Create model
    const UserLanguage = client.connections.users?.model('UserLanguage', userLanguageSchema);

    // Get moderator language
    const targetUser = interaction.user;
    const userLanguage = await UserLanguage.findOne({
      userId: targetUser.id
    }).catch(() => null);
    const language = userLanguage ? userLanguage.language : 'en';
    const translations = await loadTranslations(language);
    const translationsLog = await loadTranslations('ru'); // Load Russian translations for logs

    // Проверка на наличие одной из разрешенных ролей
    if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.slowmode.permission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    const time = interaction.options.getString('time');
    const channelName = interaction.channel.name;
    const channelMention = interaction.channel.toString();

    // Проверка на отключение слоумода (time = "0")
    if (time === '0') {
      try {
        await interaction.channel.setRateLimitPerUser(0);
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.slowmode.disabled || 'Slowmode has been disabled.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [embed]
        });

        // Логирование отключения слоумода
        const logChannel = interaction.client.channels.cache.get(logChannelId);
        if (logChannel) {
          const embedLog = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsLog.slowmode.logmessage_disabled || 'Слоумод отключен')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
            name: translationsLog.slowmode.channel || 'Канал',
            value: `**${channelName}** (${channelMention})`,
            inline: false
          }, {
            name: translationsLog.slowmode.moderator || 'Модератор',
            value: `**${targetUser.tag}** (<@${targetUser.id}>)`,
            inline: true
          }].flat().map(field => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await logChannel.send({
            allowedMentions: { parse: [], repliedUser: false },
            flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
            components: [embedLog]
          }).catch(error => {
            console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log to channel ${logChannelId}: ${error.message}`));
          });
        }
        return;
      } catch (error) {
        console.error(chalk.red(`[${new Date().toISOString()}] Error disabling slowmode: ${error.message}`));
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.slowmode.error || '❌ An error occurred while disabling slowmode.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        return interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [embed]
        });
      }
    }

    // Проверка формата времени
    const value = parseInt(time.slice(0, -1));
    const unit = time.slice(-1);
    let milliseconds;
    if (isNaN(value) || value < 0) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.slowmode.invalidtime || 'Invalid time format. Use a positive number followed by s, m, or h (e.g., 5s, 1m, 1h).')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
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
      default:
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.slowmode.notime || 'Invalid time unit. Use s, m, or h.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        return interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [embed]
        });
    }

    // Проверка максимального значения слоумода (6 часов в Discord)
    if (milliseconds / 1000 > 21600) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.slowmode.tooLong || 'Slowmode cannot exceed 6 hours.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Установка слоумода
    try {
      await interaction.channel.setRateLimitPerUser(milliseconds / 1000);
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.slowmode.settime.replace('{time}', time))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });

      // Логирование установки слоумода
      const logChannel = interaction.client.channels.cache.get(logChannelId);
      if (logChannel) {
        const embedLog = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsLog.slowmode.logmessage.replace('{time}', time))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
          name: translationsLog.slowmode.channel || 'Канал',
          value: `**${channelName}** (${channelMention})`,
          inline: false
        }, {
          name: translationsLog.slowmode.moderator || 'Модератор',
          value: `**${targetUser.tag}** (<@${targetUser.id}>)`,
          inline: true
        }].flat().map(field => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        await logChannel.send({
          allowedMentions: { parse: [], repliedUser: false },
          flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
          components: [embedLog]
        }).catch(error => {
          console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log to channel ${logChannelId}: ${error.message}`));
        });
      }
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] Error setting slowmode: ${error.message}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.slowmode.error || '❌ An error occurred while setting slowmode.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
  }
};
