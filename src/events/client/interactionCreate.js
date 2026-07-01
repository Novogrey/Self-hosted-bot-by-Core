const { InteractionType } = require('discord.js');
const { loadAppTranslations } = require('../../utils/appTranslations');
const { logPublicCommandUsage } = require('../../utils/commandUsageLogger');
const { isCoreGuild, logCoreModeratorCommand } = require('../../utils/coreServerLogs');
const { cacheInteractionLocale, syncInteractionLocale } = require('../../utils/discordLocale');
const { getTargetGuildId } = require('../../utils/botRuntimeConfig');
const { getActiveBotAccessBlock, replyWithBotAccessBlock } = require('../../utils/botAccessBlocks');
const { buildStatusComponents, formatTemplate, v2Flags } = require('../../utils/localizedComponents');
const { buildCustomPayload, installInteractionMessageOverrides } = require('../../utils/customMessages');

const TARGET_GUILD_ID = getTargetGuildId();

function getDynamicComponent(collection, customId) {
  return collection.get(customId) || collection.get(String(customId || '').split(':')[0]);
}

async function replyWithError(interaction, translations) {
  const t = translations.system || {};
  const payload = {
    flags: v2Flags(true),
    components: buildStatusComponents({
      title: t.errorTitle || 'Interaction failed',
      description: t.errorDescription || 'Something went wrong while executing this interaction.'
    })
  };
  const customPayload = buildCustomPayload('system.error', {
    original: t.errorDescription || 'Something went wrong while executing this interaction.'
  }, payload);

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(customPayload).catch(() => null);
  }

  return interaction.reply(customPayload).catch(() => null);
}

function isUnknownInteraction(error) {
  return Number(error?.code || error?.rawError?.code) === 10062;
}

function persistInteractionLocale(interaction, client) {
  void syncInteractionLocale(interaction, client).catch((error) => {
    console.error(`[${new Date().toISOString()}] Failed to persist interaction locale: ${error.message}`);
  });
}

function bypassesBotAccessBlock(interaction, command = null) {
  if (process.env.DEV && interaction.user?.id === process.env.DEV) return true;
  if (isCoreGuild(interaction.guildId || interaction.guild)) return true;
  return command?.category === 'developer';
}

async function handleBotAccessBlock(interaction, client, language, command = null) {
  if (bypassesBotAccessBlock(interaction, command)) return false;

  const block = await getActiveBotAccessBlock(client, interaction.user?.id).catch(() => null);
  if (!block) return false;

  await replyWithBotAccessBlock(interaction, client, block, language);
  return true;
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return interaction.respond([]).catch(() => null);

      const block = bypassesBotAccessBlock(interaction, command)
        ? null
        : await getActiveBotAccessBlock(client, interaction.user?.id).catch(() => null);
      if (block) return interaction.respond([]).catch(() => null);

      if (command.scope !== 'global' && (!TARGET_GUILD_ID || interaction.guildId !== TARGET_GUILD_ID)) {
        return interaction.respond([]).catch(() => null);
      }

      try {
        await command.autocomplete(interaction, client);
      } catch (error) {
        if (!isUnknownInteraction(error)) console.error(error);
        await interaction.respond([]).catch(() => null);
      }
      return;
    }

    const language = cacheInteractionLocale(interaction, client);
    persistInteractionLocale(interaction, client);
    const translations = loadAppTranslations(language, 'en');

    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (await handleBotAccessBlock(interaction, client, language, command)) return;

      if (command.scope !== 'global' && (!TARGET_GUILD_ID || interaction.guildId !== TARGET_GUILD_ID)) {
        const t = translations.system || {};
        const payload = {
          flags: v2Flags(true),
          components: buildStatusComponents({
            title: t.guildOnlyTitle || 'Command unavailable here',
            description: formatTemplate(
              TARGET_GUILD_ID
                ? (t.guildOnlyDescription || 'This command is only available on server `{guildId}`.')
                : 'Guild-only commands are not configured for this bot.',
              { guildId: TARGET_GUILD_ID }
            )
          })
        };
        return interaction.reply(buildCustomPayload('system.guildOnly', {
          command: interaction.commandName,
          serverid: TARGET_GUILD_ID || ''
        }, payload)).catch(() => null);
      }

      try {
        logPublicCommandUsage(interaction, command);
        installInteractionMessageOverrides(interaction, command.data?.name || interaction.commandName);
        await command.execute(interaction, client);
        void logCoreModeratorCommand(interaction, command, 'completed').catch((logError) => {
          console.error(`[${new Date().toISOString()}] Failed to log Core moderator command: ${logError.message}`);
        });
      } catch (error) {
        if (isUnknownInteraction(error)) return;
        void logCoreModeratorCommand(interaction, command, 'failed').catch((logError) => {
          console.error(`[${new Date().toISOString()}] Failed to log failed Core moderator command: ${logError.message}`);
        });
        console.error(error);
        await replyWithError(interaction, translations);
      }
      return;
    }

    if (interaction.isButton()) {
      const button = getDynamicComponent(client.buttons, interaction.customId);
      if (!button) return;

      if (await handleBotAccessBlock(interaction, client, language)) return;

      try {
        await button.execute(interaction, client);
      } catch (error) {
        if (isUnknownInteraction(error)) return;
        console.error(error);
        await replyWithError(interaction, translations);
      }
      return;
    }

    if (interaction.isStringSelectMenu?.() || interaction.isSelectMenu?.()) {
      const menu = getDynamicComponent(client.selectMenus, interaction.customId);
      if (!menu) return;

      if (await handleBotAccessBlock(interaction, client, language)) return;

      try {
        await menu.execute(interaction, client);
      } catch (error) {
        if (isUnknownInteraction(error)) return;
        console.error(error);
        await replyWithError(interaction, translations);
      }
      return;
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      const modal = getDynamicComponent(client.modals, interaction.customId);
      if (!modal) return;

      if (await handleBotAccessBlock(interaction, client, language)) return;

      try {
        await modal.execute(interaction, client);
      } catch (error) {
        if (isUnknownInteraction(error)) return;
        console.error(error);
        await replyWithError(interaction, translations);
      }
    }
  }
};
