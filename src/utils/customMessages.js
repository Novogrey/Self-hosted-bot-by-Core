const { MessageFlags } = require('discord.js');
const { brandPayload } = require('./messageBranding');
const {
  defaultScamTrapDmPayload,
  defaultScamTrapNoticePayload
} = require('./scamTrapMessages');

const COMPONENT_TYPES = {
  ActionRow: 1,
  Button: 2,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  File: 13,
  Separator: 14,
  Container: 17
};

const BUTTON_STYLES = {
  Link: 5
};

const CATALOG_VERSION = 1;

function defaultPayload(content, accent = 4433842) {
  return {
    content,
    embeds: [
      {
        color: accent,
        description: content
      }
    ],
    allowedMentions: { parse: [], repliedUser: false }
  };
}

function commandPayload({ title, description, color = 4433842, fields = [] }) {
  return {
    embeds: [
      {
        color,
        title,
        description,
        fields
      }
    ],
    allowedMentions: { parse: [], repliedUser: false }
  };
}

function moderationDmPayload({ title, description, color = 15548997 }) {
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [
      {
        type: COMPONENT_TYPES.Container,
        accent_color: color,
        components: [
          {
            type: COMPONENT_TYPES.TextDisplay,
            content: `## ${title}\n${description}`
          },
          {
            type: COMPONENT_TYPES.Separator
          },
          {
            type: COMPONENT_TYPES.TextDisplay,
            content: '**Server**\n{{server}}\n\n**Reason**\n{{reason}}\n\n**Moderator**\n{{moderator}} {{moderatormention}}\n\n**Duration**\n{{duration}}\n\n**Expires**\n{{expires}}'
          }
        ]
      }
    ],
    allowedMentions: { parse: [], repliedUser: false }
  };
}

function commandDefaultPayload(commandName = '{{command}}', accent = 4433842) {
  const label = commandName && commandName !== '{{command}}' ? `/${commandName}` : '/{{command}}';
  const commonFields = [
    { name: 'Команда', value: label, inline: true },
    { name: 'Канал', value: '{{channel}}', inline: true }
  ];

  const templates = {
    ban: commandPayload({
      title: 'Участник заблокирован',
      description: '**Участники:** {{targets}}\n**Причина:** {{reason}}\n**Срок:** {{time}}\n**Модератор:** {{mention}}',
      color: 15548997,
      fields: commonFields
    }),
    kick: commandPayload({
      title: 'Участник исключён',
      description: '**Участники:** {{targets}}\n**Причина:** {{reason}}\n**Модератор:** {{mention}}',
      color: 15548997,
      fields: commonFields
    }),
    mute: commandPayload({
      title: 'Участник замьючен',
      description: '**Участники:** {{targets}}\n**Причина:** {{reason}}\n**Срок:** {{time}}\n**Модератор:** {{mention}}',
      color: 16747084,
      fields: commonFields
    }),
    unban: commandPayload({
      title: 'Блокировка снята',
      description: '**Пользователи:** {{userids_or_mentions}}\n**Модератор:** {{mention}}',
      color: 5763719,
      fields: commonFields
    }),
    unmute: commandPayload({
      title: 'Мьют снят',
      description: '**Участники:** {{targets}}\n**Модератор:** {{mention}}',
      color: 5763719,
      fields: commonFields
    }),
    warn: commandPayload({
      title: 'Предупреждение выдано',
      description: '**Участники:** {{targets}}\n**Причина:** {{reason}}\n**Срок:** {{duration}}\n**Модератор:** {{mention}}',
      color: 16747084,
      fields: commonFields
    }),
    warns: commandPayload({
      title: 'Предупреждения участника',
      description: '**Участник:** {{target}}\n**Результат:** {{results}}',
      color: accent,
      fields: commonFields
    }),
    clear: commandPayload({
      title: 'Сообщения очищены',
      description: '**Количество:** {{amount}}\n**Канал:** {{channel}}\n**Модератор:** {{mention}}',
      color: 5763719,
      fields: commonFields
    }),
    clearwarns: commandPayload({
      title: 'Предупреждения очищены',
      description: '**Режим:** {{subcommand}}\n**Участники:** {{targets}}\n**Модератор:** {{mention}}',
      color: 5763719,
      fields: commonFields
    }),
    remwarn: commandPayload({
      title: 'Предупреждение удалено',
      description: '**Участники:** {{targets}}\n**Warn ID:** {{warnids}}\n**Модератор:** {{mention}}',
      color: 5763719,
      fields: commonFields
    }),
    slowmode: commandPayload({
      title: 'Slowmode обновлён',
      description: '**Канал:** {{channel}}\n**Интервал:** {{time}}\n**Модератор:** {{mention}}',
      color: 5763719,
      fields: commonFields
    }),
    help: commandPayload({
      title: 'Список команд',
      description: 'Выберите раздел или команду, чтобы посмотреть доступные функции бота.',
      color: 5793266,
      fields: commonFields
    }),
    levels: commandPayload({
      title: 'Карточка уровня',
      description: '**Участник:** {{target}}\nПоказывает уровень, опыт и прогресс участника.',
      color: 5793266,
      fields: commonFields
    }),
    top: commandPayload({
      title: 'Топ участников',
      description: '**Раздел:** {{subcommand}}\nПоказывает таблицу лидеров сервера.',
      color: 5793266,
      fields: commonFields
    }),
    level: commandPayload({
      title: 'Уровень обновлён',
      description: '**Действие:** {{subcommand}}\n**Участник:** {{target}}\n**Уровень:** {{level}}\n**Опыт:** {{experience}}',
      color: 5763719,
      fields: commonFields
    }),
    reset: commandPayload({
      title: 'Данные уровней сброшены',
      description: '**Режим:** {{subcommand}}\n**Участник:** {{target}}\n**Модератор:** {{mention}}',
      color: 16747084,
      fields: commonFields
    }),
    'bot-block': commandPayload({
      title: 'Ограничение доступа обновлено',
      description: '**Действие:** {{subcommand}}\n**Пользователи:** {{user_ids}}\n**Причина:** {{reason}}\n**Срок:** {{duration}}',
      color: 5793266,
      fields: commonFields
    }),
    refreshcommands: commandPayload({
      title: 'Команды обновлены',
      description: 'Slash-команды были заново зарегистрированы в Discord.',
      color: 5763719,
      fields: commonFields
    }),
    reload: commandPayload({
      title: 'Перезагрузка запущена',
      description: 'Runtime бота получил команду на перезапуск.',
      color: 16747084,
      fields: commonFields
    }),
    shutdown: commandPayload({
      title: 'Остановка запущена',
      description: 'Runtime бота получил команду на остановку.',
      color: 15548997,
      fields: commonFields
    }),
    say: commandPayload({
      title: 'Сообщение отправлено',
      description: '**Текст:** {{text}}',
      color: 5763719,
      fields: commonFields
    }),
    'welcome-preview': commandPayload({
      title: 'Предпросмотр приветствия',
      description: '**Тип:** {{target}}\nПроверьте отправленное тестовое сообщение.',
      color: 5793266,
      fields: commonFields
    }),
    clear_databases: commandPayload({
      title: 'Очистка базы данных',
      description: 'Старые записи SQLite были обработаны.',
      color: 16747084,
      fields: commonFields
    })
  };

  return templates[commandName] || commandPayload({
    title: `Ответ ${label}`,
    description: `Команда **${label}** выполнена.\n**Пользователь:** {{mention}}\n**Канал:** {{channel}}\n**Время:** {{timestamp}}`,
    color: accent,
    fields: commonFields
  });
}

const BASE_MESSAGE_CATALOG = [
  {
    key: 'welcome.dm',
    category: 'Welcomes',
    title: { ru: 'ЛС-приветствие', en: 'DM welcome', de: 'DM-Willkommen', ua: 'ЛП-привітання' },
    description: {
      ru: 'Сообщение, которое бот отправляет новому участнику в личные сообщения.',
      en: 'Message sent to a new member in direct messages.'
    },
    defaultPayload: defaultPayload('Привет, {{mention}}! Добро пожаловать на **{{server}}**.')
  },
  {
    key: 'welcome.server',
    category: 'Welcomes',
    title: { ru: 'Серверное приветствие', en: 'Server welcome', de: 'Server-Willkommen', ua: 'Серверне привітання' },
    description: {
      ru: 'Сообщение в канале приветствия при входе участника на сервер.',
      en: 'Message sent in the welcome channel when a member joins.'
    },
    defaultPayload: defaultPayload('Добро пожаловать на **{{server}}**, {{mention}}!')
  },
  {
    key: 'automod.dm.notice',
    category: 'Automoderation',
    title: { ru: 'ЛС автомодерации', en: 'Automoderation DM notice', de: 'Automoderation-DM', ua: 'ЛП автомодерації' },
    description: {
      ru: 'Личное уведомление участнику после срабатывания автомодерации.',
      en: 'Direct-message notice after an automoderation action.'
    },
    defaultPayload: defaultPayload('Ваше сообщение на **{{server}}** обработано автомодерацией.\n\n**Причина:** {{reason}}\n{{punishment}}', 16747084)
  },
  {
    key: 'automod.log',
    category: 'Automoderation',
    title: { ru: 'Лог автомодерации', en: 'Automoderation log', de: 'Automoderation-Log', ua: 'Лог автомодерації' },
    description: {
      ru: 'Сообщение в канале логов автомодерации.',
      en: 'Message sent to the automoderation log channel.'
    },
    defaultPayload: defaultPayload('**Пользователь:** {{mention}}\n**Канал:** {{channel}}\n**Нарушения:**\n{{violations}}\n**Удалено:** {{deleted}}\n**Превью:** {{preview}}')
  },
  {
    key: 'scamTrap.notice',
    category: 'Scam trap',
    title: { ru: 'Сообщение защитного канала', en: 'Scam trap channel notice', de: 'Scam-Trap-Kanalhinweis', ua: 'Повідомлення захисного каналу' },
    description: {
      ru: 'Сообщение, которое приложение отправляет в специальный канал для выявления scam-рекламы.',
      en: 'Message sent by the desktop app to the dedicated scam-advertising trap channel.'
    },
    defaultPayload: defaultScamTrapNoticePayload()
  },
  {
    key: 'scamTrap.banDm',
    category: 'Scam trap',
    title: { ru: 'ЛС после scam-trap бана', en: 'Scam trap ban DM', de: 'Scam-Trap-Ban-DM', ua: 'ЛП після scam-trap бану' },
    description: {
      ru: 'Личное сообщение пользователю, которого бот перманентно банит за сообщение в scam-trap канале.',
      en: 'Direct message sent to a user permanently banned for writing in the scam trap channel.'
    },
    defaultPayload: defaultScamTrapDmPayload()
  },
  {
    key: 'moderation.ban.dm',
    category: 'Moderation DMs',
    title: { ru: 'ЛС о бане', en: 'Ban DM', de: 'Ban-DM', ua: 'ЛП про бан' },
    description: { ru: 'Личное сообщение пользователю при временном или постоянном бане.', en: 'Direct message sent when a user is temporarily or permanently banned.' },
    defaultPayload: moderationDmPayload({
      title: 'You have been banned',
      description: 'A moderation action was applied to your account on **{{server}}**.'
    })
  },
  {
    key: 'moderation.kick.dm',
    category: 'Moderation DMs',
    title: { ru: 'ЛС о кике', en: 'Kick DM', de: 'Kick-DM', ua: 'ЛП про кік' },
    description: { ru: 'Личное сообщение пользователю при исключении с сервера.', en: 'Direct message sent when a user is kicked from the server.' },
    defaultPayload: moderationDmPayload({
      title: 'You have been kicked',
      description: 'You were removed from **{{server}}** by the moderation team.'
    })
  },
  {
    key: 'moderation.mute.dm',
    category: 'Moderation DMs',
    title: { ru: 'ЛС о муте', en: 'Mute DM', de: 'Mute-DM', ua: 'ЛП про мут' },
    description: { ru: 'Личное сообщение пользователю при временном или постоянном муте.', en: 'Direct message sent when a user is muted.' },
    defaultPayload: moderationDmPayload({
      title: 'You have been muted',
      description: 'Your ability to speak on **{{server}}** was limited by moderation.'
    })
  },
  {
    key: 'moderation.warn.dm',
    category: 'Moderation DMs',
    title: { ru: 'ЛС о варне', en: 'Warning DM', de: 'Warnung-DM', ua: 'ЛП про варн' },
    description: { ru: 'Личное сообщение пользователю при выдаче предупреждения.', en: 'Direct message sent when a user receives a warning.' },
    defaultPayload: moderationDmPayload({
      title: 'You have received a warning',
      description: 'A warning was added to your account on **{{server}}**.'
    })
  },
  {
    key: 'moderation.warnMute.dm',
    category: 'Moderation DMs',
    title: { ru: 'ЛС о муте по варнам', en: 'Warn punishment mute DM', de: 'Warn-Strafe-Mute-DM', ua: 'ЛП про мут за варни' },
    description: { ru: 'Личное сообщение при автоматическом муте по правилам варнов.', en: 'Direct message sent when warning rules apply a mute.' },
    defaultPayload: moderationDmPayload({
      title: 'Warning punishment: mute',
      description: 'Warning rules applied an additional mute on **{{server}}**.'
    })
  },
  {
    key: 'moderation.warnBan.dm',
    category: 'Moderation DMs',
    title: { ru: 'ЛС о бане по варнам', en: 'Warn punishment ban DM', de: 'Warn-Strafe-Ban-DM', ua: 'ЛП про бан за варни' },
    description: { ru: 'Личное сообщение при автоматическом бане по правилам варнов.', en: 'Direct message sent when warning rules apply a ban.' },
    defaultPayload: moderationDmPayload({
      title: 'Warning punishment: ban',
      description: 'Warning rules applied an additional ban on **{{server}}**.'
    })
  },
  {
    key: 'system.error',
    category: 'System',
    title: { ru: 'Ошибка взаимодействия', en: 'Interaction error', de: 'Interaktionsfehler', ua: 'Помилка взаємодії' },
    description: {
      ru: 'Ответ, если команда или компонент завершились ошибкой.',
      en: 'Response shown when a command or component fails.'
    },
    defaultPayload: defaultPayload('Произошла ошибка при выполнении действия.')
  },
  {
    key: 'system.guildOnly',
    category: 'System',
    title: { ru: 'Команда недоступна здесь', en: 'Command unavailable here', de: 'Befehl hier nicht verfügbar', ua: 'Команда тут недоступна' },
    description: {
      ru: 'Ответ, если guild-only команда вызвана не на целевом сервере.',
      en: 'Response shown when a guild-only command is used outside the target server.'
    },
    defaultPayload: defaultPayload('Эта команда доступна только на сервере `{{serverid}}`.')
  },
  {
    key: 'command.default.response',
    category: 'Commands',
    title: { ru: 'Fallback неизвестной команды', en: 'Unknown command fallback', de: 'Fallback fur unbekannte Befehle', ua: 'Fallback невідомої команди' },
    description: {
      ru: 'Запасной шаблон только для команды, у которой нет отдельного слота. Обычные команды используют свои собственные ответы.',
      en: 'Fallback template only for a command without its own slot. Regular commands use their own responses.'
    },
    defaultPayload: commandDefaultPayload()
  }
];

const MODERATION_COMMANDS = new Set([
  'ban',
  'kick',
  'mute',
  'unban',
  'unmute',
  'warn',
  'warns',
  'clear',
  'clearwarns',
  'remwarn',
  'slowmode'
]);

function messageCatalogForCommands(commands = []) {
  const slots = [...BASE_MESSAGE_CATALOG];
  const seen = new Set(slots.map((slot) => slot.key));

  for (const command of commands) {
    const name = command?.name || command?.data?.name;
    if (!name) continue;

    const key = `command.${name}.response`;
    if (seen.has(key)) continue;
    seen.add(key);

    slots.push({
      key,
      category: MODERATION_COMMANDS.has(name) ? 'Moderation commands' : 'Commands',
      title: {
        ru: `Ответ /${name}`,
        en: `/${name} response`,
        de: `/${name} Antwort`,
        ua: `Відповідь /${name}`
      },
      description: {
        ru: `Кастомизация реального ответа команды /${name}. Этот payload будет отправлен ботом, если шаблон включён.`,
        en: `Customizes the actual /${name} response. This payload will be sent by the bot when the template is enabled.`
      },
      command: name,
      defaultPayload: commandDefaultPayload(name, MODERATION_COMMANDS.has(name) ? 16747084 : 4433842)
    });
  }

  return slots;
}

function parseCustomMessages(raw = process.env.CUSTOM_MESSAGES_JSON) {
  const source = String(raw || '').trim();
  if (!source) return { version: CATALOG_VERSION, slots: {} };

  try {
    const parsed = JSON.parse(source);
    const slots = parsed?.slots && typeof parsed.slots === 'object' ? parsed.slots : parsed;
    return { version: Number(parsed?.version || CATALOG_VERSION), slots: slots || {} };
  } catch {
    return { version: CATALOG_VERSION, slots: {} };
  }
}

function getCustomTemplate(key, raw = process.env.CUSTOM_MESSAGES_JSON) {
  const config = parseCustomMessages(raw);
  const template = config.slots?.[key];
  if (!template || typeof template !== 'object' || template.enabled === false) return null;
  const payload = template.payload && typeof template.payload === 'object' ? template.payload : null;
  return payload ? { ...template, payload } : null;
}

function findDefaultTemplate(key, catalog = BASE_MESSAGE_CATALOG) {
  return catalog.find((slot) => slot.key === key)?.defaultPayload || null;
}

function applyTags(value, tags) {
  if (typeof value === 'string') {
    return value.replace(/\{\{([\w.-]+)\}\}/g, (match, key) => (
      Object.prototype.hasOwnProperty.call(tags, key) ? String(tags[key] ?? '') : match
    ));
  }

  if (Array.isArray(value)) return value.map((entry) => applyTags(entry, tags));

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, applyTags(entry, tags)])
    );
  }

  return value;
}

function safeArray(value, max = 25) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function plain(value) {
  if (value && typeof value.toJSON === 'function') {
    try {
      return value.toJSON();
    } catch {
      return value;
    }
  }
  return value;
}

function sanitizeEmbed(embed) {
  if (!embed || typeof embed !== 'object') return null;
  const next = {};
  for (const key of ['title', 'description', 'url', 'timestamp']) {
    if (embed[key] !== undefined) next[key] = String(embed[key]).slice(0, key === 'description' ? 4096 : 256);
  }
  if (embed.color !== undefined && Number.isFinite(Number(embed.color))) next.color = Number(embed.color);
  if (embed.author?.name) {
    next.author = {
      name: String(embed.author.name).slice(0, 256),
      url: embed.author.url ? String(embed.author.url).slice(0, 2048) : undefined,
      icon_url: embed.author.icon_url ? String(embed.author.icon_url).slice(0, 2048) : undefined
    };
  }
  if (embed.footer?.text) {
    next.footer = {
      text: String(embed.footer.text).slice(0, 2048),
      icon_url: embed.footer.icon_url ? String(embed.footer.icon_url).slice(0, 2048) : undefined
    };
  }
  if (embed.thumbnail?.url) next.thumbnail = { url: String(embed.thumbnail.url).slice(0, 2048) };
  if (embed.image?.url) next.image = { url: String(embed.image.url).slice(0, 2048) };
  const fields = safeArray(embed.fields, 25)
    .map((field) => ({
      name: String(field?.name || 'Field').slice(0, 256),
      value: String(field?.value || '\u200b').slice(0, 1024),
      inline: Boolean(field?.inline)
    }))
    .filter((field) => field.name && field.value);
  if (fields.length) next.fields = fields;
  return Object.keys(next).length ? next : null;
}

function sanitizeButton(component) {
  if (!component || Number(component.type) !== COMPONENT_TYPES.Button) return null;
  if (Number(component.style) !== BUTTON_STYLES.Link || !component.url) return null;
  return {
    type: COMPONENT_TYPES.Button,
    style: BUTTON_STYLES.Link,
    label: String(component.label || 'Open link').slice(0, 80),
    url: String(component.url).slice(0, 2048),
    emoji: component.emoji,
    disabled: Boolean(component.disabled)
  };
}

function sanitizeThumbnail(component) {
  if (!component || Number(component.type) !== COMPONENT_TYPES.Thumbnail || !component.media?.url) return null;
  const next = {
    type: COMPONENT_TYPES.Thumbnail,
    media: { url: String(component.media.url).slice(0, 2048) }
  };
  if (component.description) next.description = String(component.description).slice(0, 1024);
  if (component.spoiler !== undefined) next.spoiler = Boolean(component.spoiler);
  return next;
}

function sanitizeSeparator(component) {
  const next = { type: COMPONENT_TYPES.Separator };
  if (component.divider !== undefined) next.divider = Boolean(component.divider);
  if (component.spacing !== undefined) {
    const spacing = Number(component.spacing);
    if (spacing === 1 || spacing === 2) next.spacing = spacing;
  }
  return next;
}

function sanitizeMediaGalleryItem(item) {
  if (!item?.media?.url) return null;
  const next = {
    media: { url: String(item.media.url).slice(0, 2048) }
  };
  if (item.description) next.description = String(item.description).slice(0, 1024);
  if (item.spoiler !== undefined) next.spoiler = Boolean(item.spoiler);
  return next;
}

function sanitizeFileComponent(component) {
  if (!component || Number(component.type) !== COMPONENT_TYPES.File || !component.file?.url) return null;
  const next = {
    type: COMPONENT_TYPES.File,
    file: { url: String(component.file.url).slice(0, 2048) }
  };
  if (component.spoiler !== undefined) next.spoiler = Boolean(component.spoiler);
  return next;
}

function sanitizeComponent(component, context = 'top') {
  if (!component || typeof component !== 'object') return null;
  const type = Number(component.type);

  if (type === COMPONENT_TYPES.ActionRow) {
    const buttons = safeArray(component.components, 5).map(sanitizeButton).filter(Boolean);
    return buttons.length ? { type: COMPONENT_TYPES.ActionRow, components: buttons } : null;
  }

  if (type === COMPONENT_TYPES.Button || type === COMPONENT_TYPES.Thumbnail) return null;

  if (type === COMPONENT_TYPES.TextDisplay) {
    return {
      type: COMPONENT_TYPES.TextDisplay,
      content: String(component.content || '\u200b').slice(0, 4000)
    };
  }

  if (type === COMPONENT_TYPES.Separator) return sanitizeSeparator(component);

  if (type === COMPONENT_TYPES.Section) {
    const children = safeArray(component.components, 3)
      .map((child) => sanitizeComponent(child, 'section'))
      .filter((child) => child && Number(child.type) === COMPONENT_TYPES.TextDisplay);
    if (!children.length) return null;
    const accessory = sanitizeButton(component.accessory) || sanitizeThumbnail(component.accessory);
    if (!accessory) return children.length === 1 ? children[0] : null;
    const next = { type, components: children };
    next.accessory = accessory;
    return next;
  }

  if (type === COMPONENT_TYPES.Container) {
    if (context === 'container') return null;
    const children = safeArray(component.components, 10)
      .map((child) => sanitizeComponent(child, 'container'))
      .filter(Boolean);
    if (!children.length) return null;
    const next = { type, components: children };
    if (component.accent_color !== undefined && Number.isFinite(Number(component.accent_color))) {
      next.accent_color = Number(component.accent_color);
    }
    if (component.spoiler !== undefined) next.spoiler = Boolean(component.spoiler);
    return next;
  }

  if (type === COMPONENT_TYPES.MediaGallery) {
    const items = safeArray(component.items, 10).map(sanitizeMediaGalleryItem).filter(Boolean);
    return items.length ? { type, items } : null;
  }

  if (type === COMPONENT_TYPES.File) return sanitizeFileComponent(component);

  return null;
}

function hasV2Component(components = []) {
  return components.some((component) => {
    const type = Number(component?.type);
    if ([9, 10, 11, 12, 13, 14, 17].includes(type)) return true;
    return Array.isArray(component?.components) && hasV2Component(component.components);
  });
}

function hasProtectedComponents(components = []) {
  return components.some((component) => {
    component = plain(component);
    const type = Number(component?.type);
    if (type === COMPONENT_TYPES.Button) {
      return Number(component.style) !== BUTTON_STYLES.Link || Boolean(component.custom_id);
    }
    if ([3, 4, 5, 6, 7, 8].includes(type)) return true;
    return Array.isArray(component?.components) && hasProtectedComponents(component.components);
  });
}

function payloadHasProtectedComponents(payload) {
  return hasProtectedComponents(safeArray(payload?.components, 50));
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;

  const next = {};
  if (payload.content !== undefined) next.content = String(payload.content).slice(0, 2000);

  const embeds = safeArray(payload.embeds, 10).map(sanitizeEmbed).filter(Boolean);
  if (embeds.length) next.embeds = embeds;

  const components = safeArray(payload.components, 40).map(sanitizeComponent).filter(Boolean);
  if (components.length) {
    next.components = components;
    if (hasV2Component(components)) {
      next.flags = Number(payload.flags || 0) | MessageFlags.IsComponentsV2;
    } else if (payload.flags !== undefined) {
      next.flags = Number(payload.flags || 0);
    }
  } else if (payload.flags !== undefined) {
    next.flags = Number(payload.flags || 0);
  }

  if (payload.allowedMentions && typeof payload.allowedMentions === 'object') {
    next.allowedMentions = {
      parse: safeArray(payload.allowedMentions.parse, 3).filter((entry) => ['users', 'roles', 'everyone'].includes(entry)),
      users: safeArray(payload.allowedMentions.users, 100).map(String),
      roles: safeArray(payload.allowedMentions.roles, 100).map(String),
      repliedUser: Boolean(payload.allowedMentions.repliedUser)
    };
  } else {
    next.allowedMentions = { parse: [], repliedUser: false };
  }

  return Object.keys(next).length ? brandPayload(next) : null;
}

function extractPayloadText(payload) {
  const parts = [];
  if (typeof payload?.content === 'string') parts.push(payload.content);
  for (const sourceEmbed of safeArray(payload?.embeds, 10)) {
    const embed = plain(sourceEmbed);
    if (embed?.title) parts.push(embed.title);
    if (embed?.description) parts.push(embed.description);
    for (const field of safeArray(embed?.fields, 25)) {
      if (field?.name || field?.value) parts.push([field.name, field.value].filter(Boolean).join('\n'));
    }
  }

  const walk = (components = []) => {
    for (const sourceComponent of safeArray(components, 50)) {
      const component = plain(sourceComponent);
      if (component?.content) parts.push(component.content);
      if (Array.isArray(component?.components)) walk(component.components);
    }
  };
  walk(payload?.components);

  return parts.join('\n').trim().slice(0, 3900);
}

function firstCustomPayload(keys, tags, fallbackPayload, raw = process.env.CUSTOM_MESSAGES_JSON) {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list.filter(Boolean)) {
    const template = getCustomTemplate(key, raw);
    if (!template) continue;
    const tagged = applyTags(template.payload, tags);
    const sanitized = sanitizePayload(tagged);
    if (sanitized) return sanitized;
  }

  return brandPayload(fallbackPayload);
}

function buildCustomPayload(keys, tags = {}, fallbackPayload = null, raw = process.env.CUSTOM_MESSAGES_JSON) {
  const source = fallbackPayload || defaultPayload('');
  const payloadTags = {
    timestamp: `<t:${Math.floor(Date.now() / 1000)}:f>`,
    original: extractPayloadText(source),
    ...tags
  };
  return firstCustomPayload(keys, payloadTags, source, raw);
}

function userTags(user, prefix = '') {
  return {
    [`${prefix}username`]: user?.username || '',
    [`${prefix}displayname`]: user?.displayName || user?.globalName || user?.username || '',
    [`${prefix}globalname`]: user?.globalName || user?.username || '',
    [`${prefix}userid`]: user?.id || '',
    [`${prefix}mention`]: user?.id ? `<@${user.id}>` : '',
    [`${prefix}tag`]: user?.tag || user?.username || '',
    [`${prefix}avatar`]: user?.displayAvatarURL?.({ size: 512, extension: 'png' }) || user?.avatarURL?.() || ''
  };
}

function stringifyOptionValue(option) {
  if (!option || typeof option !== 'object') return '';
  if (option.user?.id) return `<@${option.user.id}>`;
  if (option.member?.id) return `<@${option.member.id}>`;
  if (option.channel?.id) return `<#${option.channel.id}>`;
  if (option.role?.id) return `<@&${option.role.id}>`;
  if (option.attachment?.url) return option.attachment.url;
  if (option.value !== undefined && option.value !== null) return String(option.value);
  return '';
}

function interactionOptionTags(interaction) {
  const tags = {
    amount: 'Не указано',
    duration: 'Не указано',
    experience: 'Не указано',
    level: 'Не указано',
    reason: 'Не указано',
    results: 'Готово',
    subcommand: 'Не указано',
    target: 'Не указано',
    targets: 'Не указано',
    text: 'Не указано',
    time: 'Не указано',
    user_ids: 'Не указано',
    userids_or_mentions: 'Не указано',
    warnids: 'Не указано'
  };

  const visit = (option) => {
    if (!option || typeof option !== 'object') return;
    const key = String(option.name || '').trim();
    if (!key) return;

    if (Array.isArray(option.options) && option.options.length) {
      tags.subcommand = key;
      tags[`option.${key}`] = key;
      for (const child of option.options) visit(child);
      return;
    }

    const value = stringifyOptionValue(option);
    if (!value) return;
    tags[`option.${key}`] = value;
    tags[key] = value;
  };

  for (const option of interaction.options?.data || []) visit(option);
  return tags;
}

function interactionTags(interaction, commandName, method, fallbackPayload) {
  const guild = interaction.guild;
  return {
    ...userTags(interaction.user),
    ...interactionOptionTags(interaction),
    command: commandName || interaction.commandName || '',
    method,
    channelid: interaction.channelId || '',
    channel: interaction.channelId ? `<#${interaction.channelId}>` : '',
    server: guild?.name || '',
    serverid: guild?.id || interaction.guildId || '',
    membercount: guild?.memberCount || '',
    original: extractPayloadText(fallbackPayload)
  };
}

function installInteractionMessageOverrides(interaction, commandName) {
  if (!interaction || interaction.__selfHostedCustomMessagesInstalled) return;

  const wrap = (method) => {
    if (typeof interaction[method] !== 'function') return;
    const original = interaction[method].bind(interaction);
    interaction[method] = (payload = {}) => {
      if (payloadHasProtectedComponents(payload)) {
        return original(brandPayload(payload));
      }

      const customKeys = commandName
        ? [`command.${commandName}.response`]
        : ['command.default.response'];
      const customPayload = buildCustomPayload(
        customKeys,
        interactionTags(interaction, commandName, method, payload),
        payload
      );
      return original(customPayload || brandPayload(payload));
    };
  };

  wrap('reply');
  wrap('editReply');
  wrap('followUp');

  Object.defineProperty(interaction, '__selfHostedCustomMessagesInstalled', {
    value: true,
    enumerable: false
  });
}

module.exports = {
  BASE_MESSAGE_CATALOG,
  CATALOG_VERSION,
  applyTags,
  buildCustomPayload,
  defaultPayload,
  extractPayloadText,
  findDefaultTemplate,
  installInteractionMessageOverrides,
  messageCatalogForCommands,
  parseCustomMessages,
  payloadHasProtectedComponents,
  sanitizePayload,
  userTags
};
