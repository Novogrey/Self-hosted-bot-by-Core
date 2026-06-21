const {
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
  MUTE_ROLE
} = process.env;
const path = require('path');
const fs = require('fs');
const UserLanguage = require('../../schemas/userLanguage');
module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;
    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member) return;
    if (member.roles.cache.has(MUTE_ROLE)) {
      try {
        await message.delete();
      } catch (error) {
        console.error(`Error deleting message from ${message.author.tag}:`, error);
      }
    }
  }
};
