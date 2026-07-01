const {
  ContainerBuilder,
  MessageFlags,
  PermissionsBitField,
  SeparatorBuilder,
  TextDisplayBuilder,
  resolveColor
} = require('discord.js');
const chalk = require('chalk');
const { buildCustomPayload, userTags } = require('../../utils/customMessages');
const { SCAM_TRAP_BAN_REASON } = require('../../utils/scamTrapMessages');

require('dotenv').config({ quiet: true });

const processingUsers = new Set();
const processedUsers = new Set();

function scamTrapChannelId() {
  return process.env.SCAM_AD_CHANNEL_ID || process.env.SCAM_AD_CHANNEL || '';
}

function fallbackBanDm(message) {
  const container = new ContainerBuilder()
    .setAccentColor(resolveColor('#ff4d5f'))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `## Account security action\nYou were permanently banned from **${message.guild.name}** after sending a message in the protected scam-detection channel.`
    ))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Reason**\n${SCAM_TRAP_BAN_REASON}\n\n**Channel**\n<#${message.channelId}>\n\nIf your account was compromised, reset your password, enable 2FA, and review connected apps before contacting server staff.`
    ));

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    allowedMentions: { parse: [], repliedUser: false }
  };
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    const channelId = scamTrapChannelId();
    if (!channelId || message.channelId !== channelId) return;
    if (!message.guild || message.author?.bot || message.webhookId) return;

    const userId = message.author.id;
    if (processingUsers.has(userId) || processedUsers.has(userId)) return;

    processingUsers.add(userId);
    try {
      const existingBan = await message.guild.bans.fetch(userId).catch(() => null);
      if (existingBan) {
        processedUsers.add(userId);
        return;
      }

      const botMember = message.guild.members.me
        || await message.guild.members.fetchMe().catch(() => null);
      if (!botMember?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        console.error(chalk.red(`[${new Date().toISOString()}] [ScamAdvertisements] Missing BanMembers permission in ${message.guild.name}`));
        return;
      }

      const dmPayload = buildCustomPayload('scamTrap.banDm', {
        server: message.guild.name,
        serverid: message.guild.id,
        channel: `<#${message.channelId}>`,
        channelid: message.channelId,
        reason: SCAM_TRAP_BAN_REASON,
        ...userTags(message.author)
      }, fallbackBanDm(message));

      await message.author.send(dmPayload).catch((error) => {
        console.error(chalk.yellow(`[${new Date().toISOString()}] [ScamAdvertisements] Failed to DM ${message.author.tag || userId}: ${error.message}`));
      });

      await message.guild.members.ban(userId, {
        deleteMessageSeconds: 7 * 24 * 60 * 60,
        reason: SCAM_TRAP_BAN_REASON
      });

      processedUsers.add(userId);
      console.log(chalk.red(`[${new Date().toISOString()}] [ScamAdvertisements] Permanently banned ${message.author.tag || userId} (${userId}) and deleted last 7 days of messages.`));
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] [ScamAdvertisements] Error processing ${message.author?.tag || userId}: ${error.stack || error.message}`));
    } finally {
      processingUsers.delete(userId);
    }
  }
};
