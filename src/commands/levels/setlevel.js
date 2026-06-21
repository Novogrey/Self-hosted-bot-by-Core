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
  data: new SlashCommandBuilder().setName('level').setDescription('Управляет уровнями и опытом пользователей.').addSubcommand(subcommand => subcommand.setName('setlevel').setDescription('Устанавливает уровень для пользователя.').addUserOption(option => option.setName('target').setDescription('Пользователь, для которого устанавливается уровень.').setRequired(true)).addIntegerOption(option => option.setName('level').setDescription('Уровень для установки.').setRequired(true))).addSubcommand(subcommand => subcommand.setName('setexp').setDescription('Устанавливает очки опыта для пользователя.').addUserOption(option => option.setName('target').setDescription('Пользователь, для которого устанавливается опыт.').setRequired(true)).addIntegerOption(option => option.setName('experience').setDescription('Очки опыта для установки.').setRequired(true))),
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
      console.error(`[${new Date().toISOString()}] [Level] Ошибка: подключение к базе данных недоступно для ${interaction.user.tag}`);
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Произошла ошибка при выполнении команды.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target');
    try {
      // Create Level model
      const Level = client.connections.users.model('Level', levelSchema);
      if (subcommand === 'setlevel') {
        const level = interaction.options.getInteger('level');
        if (level < 1 || level > 100) {
          const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Уровень должен быть от 1 до 100.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
          return interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [embed]
          });
        }
        const user = await Level.findOneAndUpdate({
          userId: target.id,
          guildId: interaction.guild.id
        }, {
          $set: {
            level,
            experience: 0,
            voiceTime: 0
          }
        }, {
          upsert: true,
          new: true
        }).catch(error => {
          console.error(`[${new Date().toISOString()}] [Level] Ошибка при обновлении документа Level для пользователя ${target.id}: ${error.message}`);
          throw error;
        });
        console.log(`[${new Date().toISOString()}] [Level] Установлен уровень ${level} для пользователя ${target.id} на сервере ${interaction.guild.id}`);
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#00FF00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`✅ Установлен уровень ${level} для ${target.tag}.`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [embed]
        });
      } else if (subcommand === 'setexp') {
        const experience = interaction.options.getInteger('experience');
        const user = await Level.findOneAndUpdate({
          userId: target.id,
          guildId: interaction.guild.id
        }, {
          $set: {
            experience,
            level: 1,
            voiceTime: 0
          }
        }, {
          upsert: true,
          new: true
        }).catch(error => {
          console.error(`[${new Date().toISOString()}] [Level] Ошибка при обновлении документа Level для пользователя ${target.id}: ${error.message}`);
          throw error;
        });
        console.log(`[${new Date().toISOString()}] [Level] Установлено ${experience} очков опыта для пользователя ${target.id} на сервере ${interaction.guild.id}`);
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#00FF00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`✅ Установлено ${experience} очков опыта для ${target.tag}.`)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [embed]
        });
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Level] Ошибка при выполнении команды level: ${error.message}`);
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Произошла ошибка при выполнении команды.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }
  }
};
