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
  ADMIN_ROLES_LEVEL_4
} = process.env;
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
const allowedRoles = typeof ADMIN_ROLES_LEVEL_4 === 'string' && ADMIN_ROLES_LEVEL_4 ? ADMIN_ROLES_LEVEL_4.split(',') : [];
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
  data: new SlashCommandBuilder().setName('clear').setDescription('Очистить сообщения в канале').addIntegerOption(option => option.setName('amount').setDescription('Количество сообщений для удаления').setRequired(true).setMinValue(1).setMaxValue(100)),
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

    // Проверяем, что пользователь имеет одну из разрешенных ролей
    if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.clear.permission || '❌ You do not have permission to use this command!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Получаем количество сообщений, которые нужно удалить
    const amount = interaction.options.getInteger('amount');
    const channelName = interaction.channel.name;
    const channelMention = interaction.channel.toString();
    try {
      // Удаляем сообщения
      const deletedMessages = await interaction.channel.bulkDelete(amount, true); // Второй параметр игнорирует сообщения старше 14 дней

      const embed1 = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.clear.deleted.replace('{size}', deletedMessages.size))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));

      // Отправляем подтверждение пользователю
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed1]
      });

      // Логируем удаление сообщений
      const logChannel = interaction.client.channels.cache.get(logChannelId);
      if (!logChannel) {
        console.error(chalk.red(`[${new Date().toISOString()}] Канал с ID ${logChannelId} не найден.`));
        return;
      }

      // Создаем эмбед для логов на русском
      const translationsLog = await loadTranslations('ru');
      const embed = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(translationsLog.clear.logmessage.replace('{size}', deletedMessages.size))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(...[{
        name: translationsLog.clear.channel,
        value: `**${channelName}** (${channelMention})`,
        inline: false
      }, {
        name: translationsLog.clear.moderator,
        value: `**${targetUser.tag}** (<@${targetUser.id}>)`,
        inline: true
      }].flat().map(field => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));

      // Отправляем эмбед в указанный канал для логов
      await logChannel.send({
        allowedMentions: { parse: [], repliedUser: false },
        flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
        components: [embed]
      }).catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] Failed to send log to channel ${logChannelId}: ${error.message}`));
      });
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] Ошибка при очистке сообщений: ${error.message}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.clear.error || '❌ Error deleting messages.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
  }
};
