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
  DEV
} = process.env;
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const userLanguageSchema = require('../../schemas/userLanguage');
const levelSchema = require('../../schemas/levelSchema');
async function loadTranslations() {
  const filePath = path.join(__dirname, '../../translations/ru.json');
  const defaultTranslations = {
    clearDatabases: {
      resultsTitle: "РћС‡РёСЃС‚РєР° Р±Р°Р· РґР°РЅРЅС‹С…",
      noPermission: "вќЊ РЈ РІР°СЃ РЅРµС‚ РїСЂР°РІ РґР»СЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ СЌС‚РѕР№ РєРѕРјР°РЅРґС‹!",
      success: "вњ… Р‘Р°Р·С‹ РґР°РЅРЅС‹С… СѓСЃРїРµС€РЅРѕ РѕС‡РёС‰РµРЅС‹.\nРЈРґР°Р»РµРЅРѕ Р·Р°РїРёСЃРµР№:\nSQLite (User [Economy]): {sqlUserCount}\nSQLite (UserLanguage): {sqlLanguageCount}\nSQLite (Level): {usersCount}",
      error: "вќЊ РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё РѕС‡РёСЃС‚РєРµ Р±Р°Р· РґР°РЅРЅС‹С…."
    }
  };
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(data);
    return translations.clearDatabases ? translations : defaultTranslations;
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error loading translations: ${error.message}`));
    return defaultTranslations;
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('clear_databases').setDescription('РћС‡РёСЃС‚РёС‚СЊ Р±Р°Р·С‹ РґР°РЅРЅС‹С… РѕС‚ СѓСЃС‚Р°СЂРµРІС€РёС… Р·Р°РїРёСЃРµР№.'),
  async execute(interaction, client) {
    // Block command in DMs
    if (!interaction.guild) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] [ClearDatabases] Command blocked in DMs for user ${interaction.user.tag}`));
      return;
    }

    // Defer reply to handle processing
    await interaction.deferReply({
      ephemeral: true
    });
    const translations = await loadTranslations();
    const userId = interaction.user.id;

    // Check if user is the developer
    if (userId !== DEV) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] [ClearDatabases] User ${interaction.user.tag} lacks DEV permission`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.clearDatabases.resultsTitle}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.clearDatabases.noPermission)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }

    // Check database connection
    if (!client.connections?.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] [ClearDatabases] Warning: users_db connection is not available for ${interaction.user.tag}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.clearDatabases.resultsTitle}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.clearDatabases.error)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
    try {
      // Create models
      let User, UserLanguage, Level;
      try {
        User = client.connections.economy.model('User');
        UserLanguage = client.connections.users.model('UserLanguage', userLanguageSchema);
        Level = client.connections.users.model('Level', levelSchema);
      } catch (error) {
        console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error creating models: ${error.message}`));
        throw error;
      }

      // Get guild members
      const members = await interaction.guild.members.fetch().catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error fetching guild members: ${error.message}`));
        return new Map();
      });
      const memberIds = new Set(members.map(m => m.id));

      // Calculate time thresholds and convert to ISO strings for comparison
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 3 months
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(); // 6 months

      // SQLite: Clean User collection
      let sqlUserCount = 0;
      const usersToDelete = await User.find({
        $or: [{
          points: 0,
          fine: 0
        }, {
          lastOperationDate: {
            $lt: threeMonthsAgo
          },
          userId: {
            $nin: Array.from(memberIds)
          }
        }, {
          lastOperationDate: {
            $lt: sixMonthsAgo
          }
        }]
      }).catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error fetching User documents: ${error.message}`));
        return [];
      });
      if (usersToDelete.length > 0) {
        const userIdsToDelete = usersToDelete.map(u => u.userId);
        const result = await User.deleteMany({
          userId: {
            $in: userIdsToDelete
          }
        }).catch(error => {
          console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error deleting User documents: ${error.message}`));
          throw error;
        });
        sqlUserCount = result.deletedCount;
        console.log(chalk.green(`[${new Date().toISOString()}] [ClearDatabases] Deleted ${sqlUserCount} users from SQLite User collection`));
      }

      // SQLite: Clean UserLanguage collection (only for users not on server)
      let sqlLanguageCount = 0;
      const languagesToDelete = await UserLanguage.find({
        userId: {
          $nin: Array.from(memberIds)
        }
      }).catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error fetching UserLanguage documents: ${error.message}`));
        return [];
      });
      if (languagesToDelete.length > 0) {
        const languageUserIds = languagesToDelete.map(l => l.userId);
        const result = await UserLanguage.deleteMany({
          userId: {
            $in: languageUserIds
          }
        }).catch(error => {
          console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error deleting UserLanguage documents: ${error.message}`));
          throw error;
        });
        sqlLanguageCount = result.deletedCount;
        console.log(chalk.green(`[${new Date().toISOString()}] [ClearDatabases] Deleted ${sqlLanguageCount} users from SQLite UserLanguage collection`));
      }

      // SQLite: Clean Level collection (only for users not on server)
      let usersCount = 0;
      const levelsToDelete = await Level.find({
        userId: {
          $nin: Array.from(memberIds)
        }
      }).catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error fetching Level documents: ${error.message}`));
        return [];
      });
      if (levelsToDelete.length > 0) {
        const levelUserIds = levelsToDelete.map(l => l.userId);
        const result = await Level.deleteMany({
          userId: {
            $in: levelUserIds
          }
        }).catch(error => {
          console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error deleting Level documents: ${error.message}`));
          throw error;
        });
        usersCount = result.deletedCount;
        console.log(chalk.green(`[${new Date().toISOString()}] [ClearDatabases] Deleted ${usersCount} users from SQLite Level collection`));
      }

      // Send response
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#00FF00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.clearDatabases.resultsTitle}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.clearDatabases.success.replace('{sqlUserCount}', sqlUserCount).replace('{sqlLanguageCount}', sqlLanguageCount).replace('{mongoUserCount}', sqlUserCount).replace('{mongoLanguageCount}', sqlLanguageCount).replace('{usersCount}', usersCount))).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
      console.log(chalk.green(`[${new Date().toISOString()}] [ClearDatabases] Successfully cleared databases for guild ${interaction.guild.id} by ${interaction.user.tag}`));
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] [ClearDatabases] Error in clear databases command: ${error.message}`));
      const embed = new ContainerBuilder().setAccentColor(resolveColor('#FF5D00')).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${translations.clearDatabases.resultsTitle}`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(translations.clearDatabases.error)).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(new TextDisplayBuilder().setContent('-# ' + [`<t:${Math.floor(Date.now() / 1000)}:f>`].filter(Boolean).join(' | ')));
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [embed]
      });
    }
  }
};
