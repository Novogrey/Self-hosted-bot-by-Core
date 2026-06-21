const { ActivityType, MessageFlags } = require('discord.js');
const chalk = require('chalk');

const tempBanSchema = require('../../schemas/ban');
const tempMuteSchema = require('../../schemas/mute');
const warnSchema = require('../../schemas/warn');

const CHECK_INTERVAL_MS = Number(process.env.MODERATION_SWEEP_INTERVAL_MS || 60000);
const ACTIVITY_TYPES = {
  Playing: ActivityType.Playing,
  Streaming: ActivityType.Streaming,
  Listening: ActivityType.Listening,
  Watching: ActivityType.Watching,
  Competing: ActivityType.Competing
};

function adminInviteUrl(clientId) {
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
}

function getModel(connection, name, schema) {
  return connection.models[name] || connection.model(name, schema);
}

async function sendLog(guild, content) {
  const channelId = process.env.ADMIN_LOG_CHANNEL_ID;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased?.()) return;

  await channel.send({
    content,
    flags: MessageFlags.SuppressNotifications,
    allowedMentions: { parse: [], repliedUser: false }
  }).catch((error) => {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to send moderation log: ${error.message}`));
  });
}

async function sweepExpiredBans(client, TempBan) {
  const expiredBans = await TempBan.find({ unbanTime: { $lte: new Date() } }).catch(() => []);

  for (const ban of expiredBans) {
    const guild = client.guilds.cache.get(ban.guildID) || await client.guilds.fetch(ban.guildID).catch(() => null);
    if (!guild) {
      await TempBan.deleteOne({ _id: ban._id }).catch(() => null);
      continue;
    }

    await guild.members.unban(ban.userID, 'Temporary ban expired').catch((error) => {
      if (error.code !== 10026) {
        console.error(chalk.red(`[${new Date().toISOString()}] Failed to unban ${ban.userID}: ${error.message}`));
      }
    });

    await sendLog(guild, `Temporary ban expired for <@${ban.userID}>.`);
    await TempBan.deleteOne({ _id: ban._id }).catch(() => null);
  }
}

async function sweepExpiredMutes(client, TempMute) {
  const expiredMutes = await TempMute.find({ unmuteTime: { $lte: new Date() } }).catch(() => []);

  for (const mute of expiredMutes) {
    const guild = client.guilds.cache.get(mute.guildID) || await client.guilds.fetch(mute.guildID).catch(() => null);
    if (!guild) {
      await TempMute.deleteOne({ _id: mute._id }).catch(() => null);
      continue;
    }

    const member = await guild.members.fetch(mute.userID).catch(() => null);
    if (member) {
      const muteRoleId = process.env.MUTE_ROLE;
      if (muteRoleId && member.roles.cache.has(muteRoleId)) {
        await member.roles.remove(muteRoleId, 'Temporary mute expired').catch((error) => {
          console.error(chalk.red(`[${new Date().toISOString()}] Failed to remove mute role from ${mute.userID}: ${error.message}`));
        });
      }

      if (member.communicationDisabledUntilTimestamp) {
        await member.timeout(null, 'Temporary mute expired').catch((error) => {
          console.error(chalk.red(`[${new Date().toISOString()}] Failed to remove timeout from ${mute.userID}: ${error.message}`));
        });
      }

      await member.user.send(`Your mute on **${guild.name}** has expired.`).catch(() => null);
    }

    await sendLog(guild, `Temporary mute expired for <@${mute.userID}>.`);
    await TempMute.deleteOne({ _id: mute._id }).catch(() => null);
  }
}

async function sweepExpiredWarnings(client, Warn) {
  const warnings = await Warn.find({ 'warnings.expires': { $lte: new Date() } }).catch(() => []);
  const now = new Date();

  for (const warnDoc of warnings) {
    const expired = warnDoc.warnings.filter((warning) => warning.expires && now >= warning.expires);
    if (!expired.length) continue;

    warnDoc.warnings = warnDoc.warnings.filter((warning) => !warning.expires || now < warning.expires);

    if (warnDoc.warnings.length) {
      await warnDoc.save().catch(() => null);
    } else {
      await Warn.deleteOne({ _id: warnDoc._id }).catch(() => null);
    }

    const guild = client.guilds.cache.get(warnDoc.guildID) || await client.guilds.fetch(warnDoc.guildID).catch(() => null);
    if (!guild) continue;

    await sendLog(guild, `Expired ${expired.length} warning(s) for <@${warnDoc.userID}>.`);
    const member = await guild.members.fetch(warnDoc.userID).catch(() => null);
    await member?.user?.send?.(`Expired warning(s) were removed on **${guild.name}**.`).catch(() => null);
  }
}

async function runModerationSweep(client) {
  const connection = client.connections?.moderator;
  if (!connection) return;

  const TempBan = getModel(connection, 'TempBan', tempBanSchema);
  const TempMute = getModel(connection, 'TempMute', tempMuteSchema);
  const Warn = getModel(connection, 'Warn', warnSchema);

  await sweepExpiredBans(client, TempBan);
  await sweepExpiredMutes(client, TempMute);
  await sweepExpiredWarnings(client, Warn);
}

function applyConfiguredPresence(client) {
  if (!client.user) return;

  const status = ['online', 'idle', 'dnd', 'invisible'].includes(process.env.BOT_STATUS)
    ? process.env.BOT_STATUS
    : 'online';
  const activityText = String(process.env.BOT_ACTIVITY_TEXT || 'self-hosted moderation').trim();
  const activityType = ACTIVITY_TYPES[process.env.BOT_ACTIVITY_TYPE] || ActivityType.Watching;
  const activity = activityText
    ? {
      name: activityText,
      type: activityType,
      ...(activityType === ActivityType.Streaming ? { url: process.env.BOT_STREAM_URL || 'https://discord.gg/YF8krDPCZh' } : {})
    }
    : null;

  try {
    client.user.setPresence({
      status,
      activities: activity ? [activity] : []
    });
  } catch (error) {
    console.error(chalk.red(`[${new Date().toISOString()}] Failed to update bot presence: ${error.message}`));
  }
}

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    const inviteUrl = adminInviteUrl(client.user.id);
    console.log(chalk.green(`[${new Date().toISOString()}] Logged in as ${client.user.tag}`));
    console.log(chalk.cyan(`[${new Date().toISOString()}] Administrator invite: ${inviteUrl}`));
    applyConfiguredPresence(client);

    if (typeof client.syncCommandRegistrations === 'function') {
      await client.syncCommandRegistrations({ includeAllGuilds: true }).catch((error) => {
        console.error(chalk.red(`[${new Date().toISOString()}] Command fast-sync failed: ${error.message}`));
      });
    }

    await runModerationSweep(client).catch((error) => {
      console.error(chalk.red(`[${new Date().toISOString()}] Initial moderation sweep failed: ${error.message}`));
    });

    setInterval(() => {
      runModerationSweep(client).catch((error) => {
        console.error(chalk.red(`[${new Date().toISOString()}] Moderation sweep failed: ${error.message}`));
      });
    }, Math.max(CHECK_INTERVAL_MS, 30000));
  }
};
