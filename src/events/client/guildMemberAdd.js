const chalk = require('chalk');
const {
  buildDmWelcomePayload,
  buildServerWelcomePayload
} = require('../../utils/welcomeJsonMessages');
const { getTargetGuildId } = require('../../utils/botRuntimeConfig');

const TARGET_GUILD_ID = getTargetGuildId();

async function sendDmWelcome(member) {
  const payload = buildDmWelcomePayload(member);
  if (!payload) return;

  await member.send(payload);
  console.log(chalk.green(`[${new Date().toISOString()}] Custom welcome DM sent to ${member.user?.tag || member.id}.`));
}

async function sendServerWelcome(member) {
  const channelId = process.env.WELCOME_SERVER_CHANNEL_ID;
  if (!channelId) return;

  const payload = buildServerWelcomePayload(member);
  if (!payload) return;

  const channel = member.guild.channels.cache.get(channelId) || await member.guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased?.()) {
    console.warn(chalk.yellow(`[${new Date().toISOString()}] Welcome channel ${channelId} was not found or is not text based.`));
    return;
  }

  await channel.send(payload);
  console.log(chalk.green(`[${new Date().toISOString()}] Custom server welcome sent for ${member.user?.tag || member.id}.`));
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (!member?.guild || member.guild.id !== TARGET_GUILD_ID || member.user?.bot) return;

    await sendDmWelcome(member).catch((error) => {
      console.warn(chalk.yellow(`[${new Date().toISOString()}] Failed to send custom welcome DM to ${member.user?.tag || member.id}: ${error.message}`));
    });

    await sendServerWelcome(member).catch((error) => {
      console.warn(chalk.yellow(`[${new Date().toISOString()}] Failed to send custom server welcome for ${member.user?.tag || member.id}: ${error.message}`));
    });
  }
};
