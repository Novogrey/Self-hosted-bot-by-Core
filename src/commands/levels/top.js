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
const levelSchema = require('../../schemas/levelSchema');
const userLanguageSchema = require('../../schemas/userLanguage');
function loadTranslations(language) {
  const filePath = path.join(__dirname, `../../translations/${language}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../../translations/en.json'), 'utf8'));
}
function formatVoiceTime(seconds, translations) {
  if (seconds === 0) return translations.top.stats.zeroTime;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = seconds % 60;
  let result = '';
  if (hours > 0) result += `${hours}${translations.top.stats.timeUnits.hours} `;
  if (minutes > 0 || hours > 0) result += `${minutes}${translations.top.stats.timeUnits.minutes} `;
  result += `${secs}${translations.top.stats.timeUnits.seconds}`;
  return result.trim();
}
module.exports = {
  data: new SlashCommandBuilder().setName('top').setDescription('Показывает топ пользователей.').addSubcommand((subcommand) => subcommand.setName('level').setDescription('Топ по уровню')).addSubcommand((subcommand) => subcommand.setName('voice').setDescription('Топ по голосовому времени')),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.inGuild()) {
      const userLanguage = await client.connections.users.model('UserLanguage', userLanguageSchema).findOne({
        userId: interaction.user.id
      }).catch(() => null);
      const language = userLanguage ? userLanguage.language : 'en';
      const translations = loadTranslations(language);
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.top.guildOnly)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }

    // Check database connection
    if (!client.connections?.users) {
      console.error(`[${new Date().toISOString()}] [Top] Ошибка: подключение к базе данных недоступно для ${interaction.user.tag}`);
      const userLanguage = await client.connections.users.model('UserLanguage', userLanguageSchema).findOne({
        userId: interaction.user.id
      }).catch(() => null);
      const language = userLanguage ? userLanguage.language : 'en';
      const translations = loadTranslations(language);
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.top.noData)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    try {
      // Load translations based on user language
      const userLanguage = await client.connections.users.model('UserLanguage', userLanguageSchema).findOne({
        userId
      }).catch(() => null);
      const language = userLanguage ? userLanguage.language : 'en';
      const translations = loadTranslations(language);

      // Create Level model
      const Level = client.connections.users.model('Level', levelSchema);

      // Fetch users from SQLite
      let topUsers = await Level.find({
        guildID: interaction.guild.id
      }).sort(subcommand === 'level' ? {
        level: -1,
        experience: -1
      } : {
        voiceTime: -1
      }).limit(10).catch((error) => {
        console.error(`[${new Date().toISOString()}] [Top] Ошибка при получении документов Level: ${error.message}`);
        throw error;
      });
      if (!topUsers.length) {
        const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.top.noData)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [embed]
        });
      }

      // Find user data and position
      const userData = await Level.findOne({
        userId,
        guildId: interaction.guild.id
      }).catch(() => null);
      const userPosition = userData ? (await Level.countDocuments({
        guildId: interaction.guild.id,
        ...(subcommand === 'level' ? {
          $or: [{
            level: {
              $gt: userData.level
            }
          }, {
            level: userData.level,
            experience: {
              $gt: userData.experience
            }
          }]
        } : {
          voiceTime: {
            $gt: userData.voiceTime
          }
        })
      }).catch(() => null)) + 1 : null;

      // Create embed
      const embed = new ContainerBuilder().addSectionComponents(new SectionBuilder().addTextDisplayComponents(...[`${translations.top.title.replace('{type}', subcommand === 'level' ? translations.top.level : translations.top.voice)} 🏆` ? new TextDisplayBuilder().setContent(`## ${`${translations.top.title.replace('{type}', subcommand === 'level' ? translations.top.level : translations.top.voice)} 🏆`}`) : null].filter(Boolean)).setThumbnailAccessory(new ThumbnailBuilder().setURL(typeof interaction.guild.iconURL({
        dynamic: true
      }) === 'string' ? interaction.guild.iconURL({
        dynamic: true
      }) : interaction.guild.iconURL({
        dynamic: true
      })?.url))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [{
        text: translations.top.footer.replace('{server}', interaction.guild.name),
        iconURL: interaction.guild.iconURL({
          dynamic: true
        })
      }?.text, `<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));

      // Add top users to embed
      topUsers.forEach((user, index) => {
        const displayName = interaction.guild.members.cache.get(user.userId)?.displayName || translations.top.unknownUser;
        const level = user.level || 0;
        const experience = user.experience || 0;
        const voiceTime = formatVoiceTime(user.voiceTime || 0, translations);
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**#${index + 1}**`;
        embed.addTextDisplayComponents(...[{
          name: `${rankEmoji} ${displayName}`,
          value: `${translations.top.stats.level}${level}\n${translations.top.stats.experience}${experience}\n${translations.top.stats.voice}${voiceTime}`,
          inline: true
        }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`)));
      });

      // Add empty field for alignment if odd number of users
      if (topUsers.length % 2 === 1) {
        embed.addTextDisplayComponents(...[{
          name: '\u200B',
          value: '\u200B',
          inline: true
        }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`)));
      }

      // Add user position if not in top 10
      if (userData && userPosition > 10) {
        const userVoiceTime = formatVoiceTime(userData.voiceTime || 0, translations);
        embed.addTextDisplayComponents(...[{
          name: `${translations.top.yourRank} 🎯`,
          value: translations.top.notInTop.replace('{position}', userPosition).replace('{level}', userData.level || 0).replace('{experience}', userData.experience || 0).replace('{voiceTime}', userVoiceTime),
          inline: false
        }].flat().map((field) => new TextDisplayBuilder().setContent(field?.value !== undefined && field?.value !== null ? `**${field?.name ?? 'Details'}**\n${String(field.value)}` : `**${field?.name ?? 'Details'}**`)));
      }
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
      console.log(`[${new Date().toISOString()}] [Top] Выведен топ ${subcommand} для сервера ${interaction.guild.id} пользователем ${interaction.user.tag}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Top] Ошибка при выполнении команды top: ${error.message}`);
      const userLanguage = await client.connections.users.model('UserLanguage', userLanguageSchema).findOne({
        userId
      }).catch(() => null);
      const language = userLanguage ? userLanguage.language : 'en';
      const translations = loadTranslations(language);
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.top.noData)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [embed]
      });
    }
  }
};
