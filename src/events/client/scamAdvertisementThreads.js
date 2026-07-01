const { ChannelType, PermissionsBitField } = require('discord.js');
const chalk = require('chalk');

require('dotenv').config({ quiet: true });

function scamTrapChannelId() {
  return process.env.SCAM_AD_CHANNEL_ID || process.env.SCAM_AD_CHANNEL || '';
}

module.exports = {
  name: 'threadCreate',
  async execute(thread) {
    const channelId = scamTrapChannelId();
    if (!channelId || thread.parentId !== channelId) return;
    if (![ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(thread.type)) return;

    try {
      const botMember = thread.guild?.members.me
        || await thread.guild?.members.fetchMe().catch(() => null);
      const canManageThreads = botMember?.permissions.has(PermissionsBitField.Flags.ManageThreads)
        || botMember?.permissions.has(PermissionsBitField.Flags.ManageChannels);

      if (!canManageThreads) {
        console.error(chalk.yellow(`[${new Date().toISOString()}] [ScamAdvertisementThreads] Missing ManageThreads/ManageChannels permission in ${thread.guild?.name || 'guild'}`));
        return;
      }

      await thread.delete('Thread created in scam trap channel');
      console.log(chalk.yellow(`[${new Date().toISOString()}] [ScamAdvertisementThreads] Deleted thread ${thread.id} created in scam trap channel.`));
    } catch (error) {
      console.error(chalk.red(`[${new Date().toISOString()}] [ScamAdvertisementThreads] Failed to delete thread ${thread.id}: ${error.stack || error.message}`));
    }
  }
};
