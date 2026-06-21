const userLanguageSchema = require('../schemas/userLanguage');

const SUPPORTED_LANGUAGES = new Set(['en', 'ru', 'ua', 'de']);

function normalizeDiscordLanguage(locale, defaultLanguage = 'en') {
  const value = String(locale || '').trim().toLowerCase();

  if (value.startsWith('ru') || value.startsWith('be')) return 'ru';
  if (value.startsWith('uk') || value.startsWith('ua')) return 'ua';
  if (value.startsWith('de')) return 'de';
  if (value.startsWith('en')) return 'en';

  return SUPPORTED_LANGUAGES.has(value) ? value : defaultLanguage;
}

async function syncInteractionLocale(interaction, client) {
  const userId = interaction?.user?.id;
  if (!userId) return 'en';

  const language = cacheInteractionLocale(interaction, client);

  const connection = client.connections?.users;
  if (!connection) return language;

  try {
    const UserLanguage = connection.models.UserLanguage || connection.model('UserLanguage', userLanguageSchema);
    await UserLanguage.findOneAndUpdate(
      { userId },
      { $set: { language } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to sync Discord locale for ${userId}: ${error.message}`);
  }

  return language;
}

function cacheInteractionLocale(interaction, client) {
  const userId = interaction?.user?.id;
  const language = normalizeDiscordLanguage(interaction?.locale, 'en');
  if (userId) {
    client?.discordUserLocales?.set(userId, language);
  }
  return language;
}

function getCachedDiscordLanguage(client, userId, defaultLanguage = 'en') {
  return normalizeDiscordLanguage(client.discordUserLocales?.get(String(userId)), defaultLanguage);
}

module.exports = {
  cacheInteractionLocale,
  normalizeDiscordLanguage,
  syncInteractionLocale,
  getCachedDiscordLanguage
};
