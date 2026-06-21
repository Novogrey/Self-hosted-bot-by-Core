const { PermissionFlagsBits } = require('discord.js');
const { CORE_GUILD_ID, isCoreGuild } = require('./coreServerLogs');
const voiceRoleSchema = require('../schemas/voiceRole');
const voiceRoleConfig = require('../config/voiceRoleRewards');

function normalizeRewardEntry(channelId, value, defaultRemoveOnLeave) {
  if (!channelId || !value) return [];

  if (typeof value === 'string') {
    return [{ channelId, roleId: value, removeOnLeave: defaultRemoveOnLeave }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeRewardEntry(channelId, entry, defaultRemoveOnLeave));
  }

  if (typeof value === 'object' && value.roleId) {
    return [{
      channelId,
      roleId: value.roleId,
      removeOnLeave: value.removeOnLeave ?? defaultRemoveOnLeave
    }];
  }

  return [];
}

function getConfiguredVoiceRoleConfigs(guildId = CORE_GUILD_ID) {
  const defaultRemoveOnLeave = voiceRoleConfig.defaultRemoveOnLeave !== false;
  const rewards = voiceRoleConfig.voiceRoleRewards || {};
  return Object.entries(rewards)
    .flatMap(([channelId, value]) => normalizeRewardEntry(channelId, value, defaultRemoveOnLeave))
    .filter((config) => config.channelId && config.roleId)
    .map((config) => ({
      guildId,
      channelId: String(config.channelId),
      roleId: String(config.roleId),
      enabled: true,
      removeOnLeave: config.removeOnLeave !== false
    }));
}

function getConnection(client) {
  return client?.connections?.core
    || client?.connections?.users
    || client?.connections?.moderator
    || null;
}

function getVoiceRoleModel(client) {
  const connection = getConnection(client);
  if (!connection) return null;
  return connection.models.VoiceRole || connection.model('VoiceRole', voiceRoleSchema);
}

async function getEnabledVoiceRoleConfigs(client, guildId = CORE_GUILD_ID) {
  return getConfiguredVoiceRoleConfigs(guildId);
}

async function mirrorConfiguredVoiceRolesToMongo(client, guildId = CORE_GUILD_ID, configsInput = null) {
  const VoiceRole = getVoiceRoleModel(client);
  if (!VoiceRole) return { mirrored: 0, disabled: 0 };

  const configs = Array.isArray(configsInput)
    ? configsInput
    : getConfiguredVoiceRoleConfigs(guildId);
  const activeKeys = configs.map((config) => `${config.channelId}:${config.roleId}`);

  for (const config of configs) {
    await VoiceRole.findOneAndUpdate(
      { guildId, channelId: config.channelId, roleId: config.roleId },
      {
        $set: {
          enabled: true,
          removeOnLeave: config.removeOnLeave !== false,
          updatedBy: 'code-config'
        },
        $setOnInsert: {
          guildId,
          channelId: config.channelId,
          roleId: config.roleId,
          createdBy: 'code-config'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).catch((error) => {
      console.error(`[${new Date().toISOString()}] Failed to mirror voice role ${config.channelId}:${config.roleId}: ${error.message}`);
    });
  }

  const activeKeySet = new Set(activeKeys);
  const existing = await VoiceRole.find({ guildId, enabled: true })
    .select('_id channelId roleId')
    .lean()
    .catch((error) => {
      console.error(`[${new Date().toISOString()}] Failed to scan voice role configs: ${error.message}`);
      return [];
    });
  const staleIds = existing
    .filter((config) => !activeKeySet.has(`${config.channelId}:${config.roleId}`))
    .map((config) => config._id);

  const disabled = staleIds.length
    ? await VoiceRole.updateMany(
      { _id: { $in: staleIds } },
      {
        $set: {
          enabled: false,
          updatedBy: 'code-config'
        }
      }
    ).catch((error) => {
      console.error(`[${new Date().toISOString()}] Failed to disable stale voice role configs: ${error.message}`);
      return { modifiedCount: 0 };
    })
    : { modifiedCount: 0 };

  return { mirrored: configs.length, disabled: disabled.modifiedCount || 0 };
}

async function fetchMember(member) {
  if (!member?.partial) return member;
  return member.fetch().catch(() => member);
}

function canManageRole(member, role) {
  if (!member || !role) return false;
  if (!member.permissions?.has?.(PermissionFlagsBits.ManageRoles)) return false;
  return member.roles.highest.position > role.position;
}

async function addRole(member, roleId, reason) {
  if (!member.roles.cache.has(roleId)) {
    await member.roles.add(roleId, reason);
    return true;
  }
  return false;
}

async function removeRole(member, roleId, reason) {
  if (member.roles.cache.has(roleId)) {
    await member.roles.remove(roleId, reason);
    return true;
  }
  return false;
}

async function syncVoiceRolesForMember(member, previousChannelId = null, configsInput = null) {
  member = await fetchMember(member);
  const guild = member?.guild;
  if (!isCoreGuild(guild)) return { added: 0, removed: 0, skipped: true };

  const configs = Array.isArray(configsInput)
    ? configsInput
    : await getEnabledVoiceRoleConfigs(member.client, guild.id);
  if (!configs.length) return { added: 0, removed: 0, skipped: false };

  const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
  const currentChannelId = member.voice?.channelId || null;
  const desiredRoleIds = new Set(
    configs
      .filter((config) => config.channelId === currentChannelId)
      .map((config) => config.roleId)
  );
  const removableRoleIds = new Set(
    configs
      .filter((config) => config.removeOnLeave !== false)
      .filter((config) => config.channelId !== currentChannelId || config.channelId === previousChannelId)
      .map((config) => config.roleId)
      .filter((roleId) => !desiredRoleIds.has(roleId))
  );

  let added = 0;
  let removed = 0;

  for (const roleId of desiredRoleIds) {
    const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
    if (!canManageRole(me, role)) continue;
    try {
      if (await addRole(member, roleId, 'Core voice role reward: member joined configured voice channel.')) added += 1;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to add voice role ${roleId} to ${member.id}: ${error.message}`);
    }
  }

  for (const roleId of removableRoleIds) {
    const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
    if (!canManageRole(me, role)) continue;
    try {
      if (await removeRole(member, roleId, 'Core voice role reward: member left configured voice channel.')) removed += 1;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to remove voice role ${roleId} from ${member.id}: ${error.message}`);
    }
  }

  return { added, removed, skipped: false };
}

async function removeVoiceRoleFromChannelMembers(guild, channelId, roleId) {
  if (!isCoreGuild(guild)) return 0;
  const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
  const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
  const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
  if (!channel?.members?.size || !canManageRole(me, role)) return 0;

  let removed = 0;
  for (const member of channel.members.values()) {
    try {
      if (await removeRole(member, roleId, 'Core voice role reward config removed.')) removed += 1;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to remove deleted voice role ${roleId} from ${member.id}: ${error.message}`);
    }
  }
  return removed;
}

async function syncVoiceRolesForGuild(client, guild) {
  if (!isCoreGuild(guild)) return { added: 0, removed: 0, configs: 0 };

  const configs = await getEnabledVoiceRoleConfigs(client, guild.id);
  await mirrorConfiguredVoiceRolesToMongo(client, guild.id, configs);
  if (!configs.length) return { added: 0, removed: 0, configs: 0 };

  const roleChannels = new Map();
  let added = 0;
  let removed = 0;

  for (const config of configs) {
    if (!roleChannels.has(config.roleId)) roleChannels.set(config.roleId, new Set());
    roleChannels.get(config.roleId).add(config.channelId);

    const channel = guild.channels.cache.get(config.channelId) || await guild.channels.fetch(config.channelId).catch(() => null);
    if (!channel?.members?.size) continue;

    for (const member of channel.members.values()) {
      const result = await syncVoiceRolesForMember(member, null, configs);
      added += result.added || 0;
    }
  }

  const removableRoleIds = configs
    .filter((config) => config.removeOnLeave !== false)
    .map((config) => config.roleId);

  if (removableRoleIds.length) {
    const members = await guild.members.fetch().catch(() => null);
    if (members?.size) {
      for (const member of members.values()) {
        const currentChannelId = member.voice?.channelId || null;
        for (const roleId of new Set(removableRoleIds)) {
          const desiredChannels = roleChannels.get(roleId) || new Set();
          if (desiredChannels.has(currentChannelId)) continue;
          const result = await syncVoiceRolesForMember(member, currentChannelId, configs);
          removed += result.removed || 0;
          break;
        }
      }
    }
  }

  console.log(`[VoiceRoles] Synced ${configs.length} config(s) for guild ${guild.id}. Added=${added}, removed=${removed}.`);
  return { added, removed, configs: configs.length };
}

module.exports = {
  getEnabledVoiceRoleConfigs,
  getConfiguredVoiceRoleConfigs,
  getVoiceRoleModel,
  mirrorConfiguredVoiceRolesToMongo,
  removeVoiceRoleFromChannelMembers,
  syncVoiceRolesForGuild,
  syncVoiceRolesForMember
};
