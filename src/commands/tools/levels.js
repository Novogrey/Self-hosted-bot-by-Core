const {
  SlashCommandBuilder,
  AttachmentBuilder,
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
const {
  Font,
  RankCardBuilder
} = require('canvacord');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const chalk = require('chalk');
const levelSchema = require('../../schemas/levelSchema');
require('dotenv').config({ quiet: true });
function getExperienceForLevel(level) {
  if (level < 1) return 0;
  if (level <= 10) return 100 + (level - 1) * 50;
  if (level <= 20) return 500 + (level - 10) * 100;
  if (level <= 30) return 1500 + (level - 20) * 150;
  if (level <= 60) return 3000 + (level - 30) * 200;
  if (level <= 90) return 6000 + (level - 60) * 300;
  if (level <= 99) return 15000 + (level - 90) * 500;
  if (level <= 100) return 20000 + (level - 99) * 1000;
  return Infinity;
}
function secondsToTime(value) {
  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
Font.loadDefault();
module.exports = {
  data: new SlashCommandBuilder().setName('levels').setDescription('Показывает уровень пользователя').addUserOption(option => option.setName('target').setDescription('Выберите пользователя').setRequired(false)),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) return;

    // Check database connection
    if (!client.connections.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: users_db connection is not available. Cannot process levels command.`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Команда уровней недоступна из-за проблем с базой данных.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }

    // Create model
    const Level = client.connections.users.model('Level', levelSchema);
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const userId = targetUser.id;
    try {
      // Fetch GuildMember for presence status
      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!member) {
        console.log(chalk.yellow(`[${new Date().toISOString()}] User ${targetUser.tag} is not a member of the server`));
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Пользователь не является участником сервера.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [embed]
        });
      }

      // Fetch level data from SQLite
      const user = await Level.findOne({
        userId,
        guildID: interaction.guild.id
      }).catch(() => null);
      let level = 0;
      let experience = 0;
      let voiceTime = 0;
      let rank = 0;
      if (user) {
        ({
          level,
          experience,
          voiceTime
        } = user);
        const allUsers = await Level.find({
          guildID: interaction.guild.id
        }).sort({
          level: -1,
          experience: -1
        }).catch(() => []);
        rank = allUsers.findIndex(u => u.userId === userId) + 1;
      } else {
        console.log(chalk.yellow(`[${new Date().toISOString()}] No level record found for ${targetUser.tag}, using default values`));
      }
      const requiredXP = getExperienceForLevel(level);
      const userStatus = member.presence?.status || 'offline';
      const voiceTimeFormatted = secondsToTime(voiceTime);

      // Load and resize background image
      const backgroundPath = path.resolve(__dirname, '../../assets/images/profile1.png');
      try {
        await fs.accessSync(backgroundPath);
      } catch {
        console.error(chalk.red(`[${new Date().toISOString()}] Background image not found at: ${backgroundPath}`));
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Фоновое изображение не найдено.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [embed]
        });
      }
      const backgroundBuffer = await fs.readFileSync(backgroundPath);
      const resizedBackground = await sharp(backgroundBuffer).resize(800, 250).toBuffer();

      // Build rank card
      const rankCard = new RankCardBuilder().setDisplayName(targetUser.displayName).setUsername(targetUser.username).setAvatar(targetUser.displayAvatarURL({
        format: 'png',
        size: 256
      })).setCurrentXP(experience).setRequiredXP(requiredXP).setLevel(level).setRank(rank || 1).setOverlay(60).setBackground(resizedBackground).setStatus(userStatus);
      const image = await rankCard.build();
      const attachment = new AttachmentBuilder(image, {
        name: 'level.png'
      });
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [],
        files: [attachment]
      });
      console.log(chalk.green(`[${new Date().toISOString()}] Level card generated for ${targetUser.tag} (Level: ${level}, XP: ${experience}, Rank: ${rank})`));
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] Error generating level card for ${targetUser.tag}: ${error.message}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Произошла ошибка при генерации таблички уровня.')).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }
  }
};
