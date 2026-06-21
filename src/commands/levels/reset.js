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
const levelSchema = require('../../schemas/levelSchema');
const {
  ADMIN_ROLES_LEVEL_0
} = process.env;
const ALLOWED_ROLES = ADMIN_ROLES_LEVEL_0 ? ADMIN_ROLES_LEVEL_0.split(',') : [];
const DEV = process.env.DEV;
module.exports = {
  data: new SlashCommandBuilder().setName('reset').setDescription('Удаляет данные об уровнях, опыте и времени.').addSubcommand(subcommand => subcommand.setName('all').setDescription('Удаляет данные об уровнях, опыте и времени.')).addSubcommand(subcommand => subcommand.setName('user').setDescription('Удаляет данные об уровнях, опыте и времени.').addUserOption(option => option.setName('target').setDescription('Пользователь, чьи данные нужно удалить.').setRequired(true))),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Check if user has one of the allowed roles
    const hasPermission = interaction.user.id === DEV || interaction.member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
    if (!hasPermission) {
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ У вас нет прав для использования этой команды!')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }

    // Check database connection
    if (!client.connections?.users) {
      console.error(`[${new Date().toISOString()}] [Reset] Ошибка: подключение к базе данных недоступно для ${interaction.user.tag}`);
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Произошла ошибка при удалении данных.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }
    const subcommand = interaction.options.getSubcommand();
    try {
      // Create Level model
      const Level = client.connections.users.model('Level', levelSchema);
      if (subcommand === 'all') {
        // Delete all users' data for the current guild
        const result = await Level.deleteMany({
          guildId: interaction.guild.id
        }).catch(error => {
          console.error(`[${new Date().toISOString()}] [Reset] Ошибка при удалении документов Level: ${error.message}`);
          throw error;
        });
        console.log(`[${new Date().toISOString()}] [Reset] Удалено ${result.deletedCount} записей уровней, опыта и времени в голосовых каналах для сервера ${interaction.guild.id}`);
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#00FF00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('✅ Все данные об уровнях, опыте и времени в голосовых каналах удалены для сервера.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        await interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [embed]
        });
      } else if (subcommand === 'user') {
        // Delete specific user's data
        const target = interaction.options.getUser('target');
        const result = await Level.deleteOne({
          userId: target.id,
          guildId: interaction.guild.id
        }).catch(error => {
          console.error(`[${new Date().toISOString()}] [Reset] Ошибка при удалении документа Level для пользователя ${target.id}: ${error.message}`);
          throw error;
        });
        if (result.deletedCount > 0) {
          console.log(`[${new Date().toISOString()}] [Reset] Удалены данные об уровнях, опыте и времени в голосовых каналах для пользователя ${target.id} на сервере ${interaction.guild.id}`);
          const embed = new ContainerBuilder().setAccentColor(resolveColor('#00FF00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`✅ Данные об уровнях, опыте и времени в голосовых каналах пользователя ${target.tag} удалены.`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [embed]
          });
        } else {
          const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ Пользователь ${target.tag} не найден в базе данных.`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [embed]
          });
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Reset] Ошибка при выполнении команды reset: ${error.message}`);
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Произошла ошибка при удалении данных.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }
  }
};
