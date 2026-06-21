const {
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder
} = require('discord.js');
const chalk = require('chalk');
const levelSchema = require('../../schemas/levelSchema');
const { getDiscordUserLanguage, loadAppTranslations } = require('../../utils/appTranslations');
const { formatTemplate } = require('../../utils/localizedComponents');
require('dotenv').config({ quiet: true });

const { NOTIFICATION } = process.env;

const LEVELS_ENABLED = process.env.LEVELS_ENABLED !== 'false';
const messageDebugLogs = ['1', 'true', 'yes', 'on'].includes(String(process.env.MESSAGE_DEBUG_LOGS || '').trim().toLowerCase());
const userMessageTimestamps = new Map();

function debugLog(message) {
  if (messageDebugLogs) console.log(message);
}

function parseLevelRoleMap(value) {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([level, roleId]) => Number.isFinite(Number(level)) && typeof roleId === 'string' && roleId.trim())
        .map(([level, roleId]) => [Number(level), roleId.trim()])
    );
  } catch (_) {
    return Object.fromEntries(
      String(value)
        .split(',')
        .map((pair) => pair.split(':').map((part) => part.trim()))
        .filter(([level, roleId]) => Number.isFinite(Number(level)) && roleId)
        .map(([level, roleId]) => [Number(level), roleId])
    );
  }
}

const levelRoleMap = parseLevelRoleMap(process.env.LEVEL_ROLE_MAP);

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

async function updateUserLevel(user) {
  const previousLevel = user.level;
  let experienceNeededForNextLevel = getExperienceForLevel(user.level + 1);

  while (user.experience >= experienceNeededForNextLevel) {
    user.level += 1;
    user.experience -= experienceNeededForNextLevel;
    experienceNeededForNextLevel = getExperienceForLevel(user.level + 1);
  }

  return {
    previousLevel,
    currentLevel: user.level,
    levelUpdated: user.level !== previousLevel
  };
}

function getReachedMilestone(previousLevel, currentLevel) {
  for (let level = currentLevel; level > previousLevel; level -= 1) {
    if (level > 0 && level % 5 === 0) return level;
  }

  return null;
}

function canReceiveExperience(userId) {
  const now = Date.now();
  const timestamps = userMessageTimestamps.get(userId) || [];
  const oneMinuteAgo = now - 60000;
  const recentMessages = timestamps.filter(timestamp => timestamp > oneMinuteAgo);

  recentMessages.push(now);
  userMessageTimestamps.set(userId, recentMessages);

  return recentMessages.length <= 7;
}

async function updateRoles(member, level) {
  const previousRoles = Object.keys(levelRoleMap).filter(roleLevel => roleLevel < level);
  for (const roleLevel of previousRoles) {
    const roleId = levelRoleMap[roleLevel];
    const role = member.guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.remove(role).catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] Failed to remove role ${roleId} from ${member.user.tag}: ${error.message}`));
      });
    }
  }

  const newRoles = Object.keys(levelRoleMap).filter(roleLevel => roleLevel == level);
  for (const roleLevel of newRoles) {
    const roleId = levelRoleMap[roleLevel];
    const role = member.guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.add(role).catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] Failed to add role ${roleId} to ${member.user.tag}: ${error.message}`));
      });
    }
  }
}

function buildLevelUpComponents(member, level, t) {
  return [
    new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(formatTemplate(
          t.title || '## {username} reached level {level}!',
          {
            username: member.user.username,
            level
          }
        )),
        new TextDisplayBuilder().setContent(formatTemplate(
          t.description || 'Congratulations, <@{userId}>! You have reached **level {level}**.',
          {
            userId: member.user.id,
            level
          }
        ))
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(t.footer || '-# Level milestone notification'))
  ];
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!LEVELS_ENABLED) {
      return;
    }

    if (!message.guild) return;
    if (message.author.bot) {
      debugLog(chalk.yellow(`[${new Date().toISOString()}] MessageCreate ignored from bot ${message.author.tag}`));
      return;
    }

    if (!client.connections.users) {
      console.log(chalk.yellow(`[${new Date().toISOString()}] Warning: Core database connection is not available. Cannot process messageCreate for ${message.author.tag}`));
      return;
    }

    const Level = client.connections.users.model('Level', levelSchema);
    const userId = message.author.id;
    const guildID = message.guild.id;

    if (!canReceiveExperience(userId)) {
      debugLog(chalk.yellow(`[${new Date().toISOString()}] Experience limit reached for ${message.author.tag}`));
      return;
    }

    try {
      let user = await Level.findOne({ userId, guildID }).catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] Error fetching user ${userId} from Level: ${error.message}`));
        return null;
      });

      if (!user) {
        user = new Level({
          userId,
          guildID,
        level: 1,
        experience: 0,
        voiceTime: 0
      });
      debugLog(chalk.yellow(`[${new Date().toISOString()}] Created new Level document for ${message.author.tag}`));
      }

      user.experience += 30;
      const levelResult = await updateUserLevel(user);

      if (levelResult.levelUpdated) {
        const member = message.guild.members.cache.get(userId);
        if (member) {
          await updateRoles(member, user.level);
          const milestoneLevel = getReachedMilestone(levelResult.previousLevel, levelResult.currentLevel);
          const notificationChannel = message.guild.channels.cache.get(NOTIFICATION);

          if (milestoneLevel && notificationChannel) {
            const language = await getDiscordUserLanguage(client, member.id, 'en');
            const translations = loadAppTranslations(language, 'en');
            const t = translations.levelUp || {};

            await notificationChannel.send({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
              components: buildLevelUpComponents(member, milestoneLevel, t),
              allowedMentions: { parse: [], users: [member.user.id], repliedUser: false }
            }).catch(error => {
              console.error(chalk.red(`[${new Date().toISOString()}] Failed to send level-up notification for ${member.user.tag}: ${error.message}`));
            });

            debugLog(chalk.green(`[${new Date().toISOString()}] Silent milestone notification sent for ${member.user.tag} to level ${milestoneLevel}`));
          }
        }
      }

      await user.save().catch(error => {
        console.error(chalk.red(`[${new Date().toISOString()}] Failed to save user ${userId} to Level: ${error.message}`));
      });

      debugLog(chalk.green(`[${new Date().toISOString()}] Experience added for ${message.author.tag} (Level: ${user.level}, XP: ${user.experience})`));
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] Error processing messageCreate for ${message.author.tag}: ${error.message}`));
    }
  }
};
