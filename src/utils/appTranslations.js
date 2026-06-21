const fs = require('fs');
const path = require('path');
const userLanguageSchema = require('../schemas/userLanguage');
const { normalizeDiscordLanguage, getCachedDiscordLanguage } = require('./discordLocale');

const SUPPORTED_LANGUAGES = new Set(['en', 'ru', 'ua', 'de']);

function normalizeLanguageCode(languageCode, defaultLanguage = 'en') {
    const value = String(languageCode || '').trim().toLowerCase();

    if (!value) {
        return defaultLanguage;
    }

    if (value.startsWith('ru') || value.startsWith('be')) {
        return 'ru';
    }

    if (value.startsWith('uk') || value.startsWith('ua')) {
        return 'ua';
    }

    if (value.startsWith('de')) {
        return 'de';
    }

    if (value.startsWith('en')) {
        return 'en';
    }

    return SUPPORTED_LANGUAGES.has(value) ? value : defaultLanguage;
}

function readTranslationFile(language) {
    const filePath = path.join(__dirname, '..', 'translations', `${language}.json`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadAppTranslations(languageCode, defaultLanguage = 'en') {
    const language = normalizeLanguageCode(languageCode, defaultLanguage);

    try {
        return readTranslationFile(language);
    } catch (error) {
        if (language !== defaultLanguage) {
            return loadAppTranslations(defaultLanguage, defaultLanguage);
        }

        if (defaultLanguage !== 'en') {
            return loadAppTranslations('en', 'en');
        }

        throw error;
    }
}

async function getDiscordUserLanguage(client, discordUserId, defaultLanguage = 'en') {
    if (!discordUserId) {
        return normalizeDiscordLanguage(defaultLanguage, 'en');
    }

    const cachedLanguage = getCachedDiscordLanguage(client, discordUserId, null);
    if (cachedLanguage) {
        return cachedLanguage;
    }

    if (!client?.connections?.users) {
        return normalizeDiscordLanguage(defaultLanguage, 'en');
    }

    try {
        const UserLanguage = client.connections.users.model('UserLanguage', userLanguageSchema);
        const userLanguage = await UserLanguage.findOne({ userId: String(discordUserId) }).lean().catch(() => null);
        return normalizeDiscordLanguage(userLanguage?.language, defaultLanguage);
    } catch (_) {
        return normalizeDiscordLanguage(defaultLanguage, 'en');
    }
}

module.exports = {
    normalizeLanguageCode,
    loadAppTranslations,
    getDiscordUserLanguage
};
