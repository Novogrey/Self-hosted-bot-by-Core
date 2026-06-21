const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { buildStatusComponents, formatTemplate } = require('./localizedComponents');

const BOT_ADMIN_INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1499785495264104688&permissions=2251800618994744&integration_type=0&scope=bot&response_type=code&redirect_uri=https%3A%2F%2Fnovogrey.github.io%2FCore%2Fadded%2F';
const ADMIN_RECOMMENDATION_COPY = {
  en: {
    title: 'Stability recommendation',
    text: [
      'Core will continue working. Administrator is recommended only for a more stable server transfer.',
      'Without it, Discord can sometimes limit role positions, role edits, channel overwrites, guild settings, cleanup or rollback.'
    ].join('\n'),
    errorsField: 'What Discord may limit',
    errors: [
      '`50013 Missing Permissions` - Discord denied an edit to roles, channels or permissions.',
      '`50001 Missing Access` - Discord hid a channel from the bot during cleanup or rollback.',
      'Partial transfer - some roles, channels, overwrites or settings may be skipped and may need manual cleanup.'
    ].join('\n'),
    footer: 'This is only a recommendation. The command will continue.',
    dmFooter: 'This is only a recommendation. Core continues working on the server.'
  },
  ru: {
    title: 'Рекомендация для стабильности',
    text: [
      'Core продолжит работу. Права администратора рекомендуются только для более стабильного переноса сервера.',
      'Без них Discord иногда может ограничить позиции ролей, изменение ролей, права каналов, настройки сервера, очистку или откат.'
    ].join('\n'),
    errorsField: 'Что может ограничить Discord',
    errors: [
      '`50013 Missing Permissions` - Discord отклонил изменение ролей, каналов или прав.',
      '`50001 Missing Access` - Discord скрыл канал от бота во время очистки или отката.',
      'Частичный перенос - часть ролей, каналов, прав или настроек может быть пропущена и потребовать ручной очистки.'
    ].join('\n'),
    footer: 'Это только рекомендация. Команда продолжит выполнение.',
    dmFooter: 'Это только рекомендация. Core продолжит работать на сервере.'
  },
  ua: {
    title: 'Рекомендація для стабільності',
    text: [
      'Core продовжить роботу. Права адміністратора рекомендуються лише для стабільнішого перенесення сервера.',
      'Без них Discord іноді може обмежити позиції ролей, редагування ролей, права каналів, налаштування сервера, очищення або відкат.'
    ].join('\n'),
    errorsField: 'Що може обмежити Discord',
    errors: [
      '`50013 Missing Permissions` - Discord відхилив зміну ролей, каналів або прав.',
      '`50001 Missing Access` - Discord приховав канал від бота під час очищення або відкату.',
      'Часткове перенесення - частина ролей, каналів, прав або налаштувань може бути пропущена і потребувати ручного очищення.'
    ].join('\n'),
    footer: 'Це лише рекомендація. Команда продовжить виконання.',
    dmFooter: 'Це лише рекомендація. Core продовжить працювати на сервері.'
  },
  de: {
    title: 'Empfehlung für Stabilität',
    text: [
      'Core arbeitet weiter. Administrator wird nur für eine stabilere Serverübertragung empfohlen.',
      'Ohne diese Berechtigung kann Discord manchmal Rollenpositionen, Rollenänderungen, Kanalrechte, Servereinstellungen, Cleanup oder Rollback begrenzen.'
    ].join('\n'),
    errorsField: 'Was Discord begrenzen kann',
    errors: [
      '`50013 Missing Permissions` - Discord hat eine Änderung an Rollen, Kanälen oder Rechten abgelehnt.',
      '`50001 Missing Access` - Discord hat einen Kanal während Cleanup oder Rollback vor dem Bot verborgen.',
      'Teilweise Übertragung - einige Rollen, Kanäle, Rechte oder Einstellungen können übersprungen werden und manuelle Bereinigung brauchen.'
    ].join('\n'),
    footer: 'Das ist nur eine Empfehlung. Der Befehl läuft weiter.',
    dmFooter: 'Das ist nur eine Empfehlung. Core arbeitet auf dem Server weiter.'
  }
};
const ADMIN_WARNING_TEXT = ADMIN_RECOMMENDATION_COPY.en.text;

function botHasAdministrator(guild) {
  return Boolean(guild?.members.me?.permissions?.has(PermissionFlagsBits.Administrator));
}

function getAdminRecommendationCopy(language = 'en') {
  return ADMIN_RECOMMENDATION_COPY[language] || ADMIN_RECOMMENDATION_COPY.en;
}

function getAdminWarningTitle(t = {}, language = 'en') {
  return t.botAdministratorRecommendationTitle || getAdminRecommendationCopy(language).title;
}

function getAdminWarningText(t = {}, language = 'en') {
  return formatTemplate(
    t.botAdministratorRecommendation || getAdminRecommendationCopy(language).text,
    { adminUrl: BOT_ADMIN_INVITE_URL }
  );
}

function getAdminWarningField(t = {}, language = 'en') {
  return {
    name: getAdminWarningTitle(t, language),
    value: getAdminWarningText(t, language)
  };
}

function buildAdminWarningComponents(t = {}, options = {}) {
  const copy = getAdminRecommendationCopy(options.language);
  const footer = options.dm
    ? (t.botAdministratorRecommendationFooterDm || copy.dmFooter)
    : (t.botAdministratorRecommendationFooter || copy.footer);

  return buildStatusComponents({
    title: getAdminWarningTitle(t, options.language),
    description: getAdminWarningText(t, options.language),
    fields: [
      {
        name: t.botAdministratorRecommendationErrorsField || copy.errorsField,
        value: copy.errors
      }
    ],
    footer,
    color: '#FFB000'
  });
}

async function sendAdminRequiredDm(interaction, t = {}, language = 'en') {
  return interaction.user.send({
    flags: MessageFlags.IsComponentsV2,
    components: buildAdminWarningComponents(t, { dm: true, language }),
    allowedMentions: { parse: [], repliedUser: false }
  }).then(() => true).catch(() => false);
}

module.exports = {
  ADMIN_WARNING_TEXT,
  BOT_ADMIN_INVITE_URL,
  buildAdminWarningComponents,
  botHasAdministrator,
  getAdminWarningText,
  getAdminWarningField,
  sendAdminRequiredDm
};
