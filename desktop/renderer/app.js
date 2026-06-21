const MAX_LOG_LINES = 300;
const COMMAND_PAGE_SIZE = 10;
const ONBOARDING_STORAGE_KEY = 'core-onboarding-complete';
const ONBOARDING_ASSET_BASE = './assets/onboarding';
const SUPPORT_SERVER_URL = 'https://discord.gg/YF8krDPCZh';
const WARN_DURATION_UNITS = ['m', 'h', 'd', 'w'];
const WELCOME_TAGS = [
  '{{username}}',
  '{{displayname}}',
  '{{globalname}}',
  '{{userid}}',
  '{{mention}}',
  '{{tag}}',
  '{{avatar}}',
  '{{server}}',
  '{{serverid}}',
  '{{membercount}}',
  '{{joindate}}',
  '{{joinedrelative}}',
  '{{createdat}}',
  '{{createdrelative}}',
  '{{guildicon}}',
  '{{guildbanner}}'
];

const uiCopy = {
  ru: {
    setup: 'Первый запуск',
    welcome: 'Приветствия',
    presence: 'Статус бота',
    loadJson: 'Загрузить JSON',
    insertExample: 'Пример',
    addRule: 'Добавить правило',
    edit: 'Изменить',
    remove: 'Удалить',
    warnCount: 'Варнов',
    warnAction: 'Действие',
    warnDuration: 'Срок',
    noWarnRules: 'Правил пока нет',
    saveRule: 'Сохранить правило',
    cancel: 'Отмена',
    completeSetup: 'Готово, открыть настройки',
    back: 'Назад',
    forward: 'Дальше',
    finishGuide: 'Не показывать при старте',
    dmWelcomeEnabled: 'ЛС-приветствие включено',
    serverWelcomeEnabled: 'Приветствие на сервере включено',
    dmWelcomeJson: 'JSON ЛС-приветствия',
    serverWelcomeJson: 'JSON приветствия на сервере',
    welcomeChannel: 'Канал приветствия',
    botStatus: 'Статус присутствия',
    activityType: 'Тип активности',
    activityText: 'Текст активности',
    tokenField: 'Токен бота',
    online: 'В сети',
    idle: 'Не активен',
    dnd: 'Не беспокоить',
    invisible: 'Невидимый',
    playing: 'Играет',
    watching: 'Смотрит',
    listening: 'Слушает',
    competing: 'Соревнуется',
    streaming: 'Стримит'
    ,
    joinServer: 'Официальный Discord',
    exportHosting: 'Экспорт для хостинга',
    hostingExported: 'Архив для хостинга сохранён',
    savedNotice: 'Сохранено!',
    settingsHub: 'Группы настроек',
    openGroup: 'Открыть',
    fieldsCount: 'Параметров',
    backToGroups: 'К группам'
  },
  en: {
    setup: 'First run',
    welcome: 'Welcomes',
    presence: 'Bot status',
    loadJson: 'Load JSON',
    insertExample: 'Example',
    addRule: 'Add rule',
    edit: 'Edit',
    remove: 'Remove',
    warnCount: 'Warns',
    warnAction: 'Action',
    warnDuration: 'Duration',
    noWarnRules: 'No rules yet',
    saveRule: 'Save rule',
    cancel: 'Cancel',
    completeSetup: 'Done, open settings',
    back: 'Back',
    forward: 'Next',
    finishGuide: 'Do not show at startup',
    dmWelcomeEnabled: 'DM welcome enabled',
    serverWelcomeEnabled: 'Server welcome enabled',
    dmWelcomeJson: 'DM welcome JSON',
    serverWelcomeJson: 'Server welcome JSON',
    welcomeChannel: 'Welcome channel',
    botStatus: 'Presence status',
    activityType: 'Activity type',
    activityText: 'Activity text',
    tokenField: 'Bot token',
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do not disturb',
    invisible: 'Invisible',
    playing: 'Playing',
    watching: 'Watching',
    listening: 'Listening',
    competing: 'Competing',
    streaming: 'Streaming',
    joinServer: 'Official Discord',
    exportHosting: 'Hosting Export',
    hostingExported: 'Hosting archive saved',
    savedNotice: 'Saved!',
    settingsHub: 'Settings groups',
    openGroup: 'Open',
    fieldsCount: 'Settings',
    backToGroups: 'Back to groups'
  },
  de: {
    setup: 'Erster Start',
    welcome: 'Begrussungen',
    presence: 'Bot-Status',
    loadJson: 'JSON laden',
    insertExample: 'Beispiel',
    addRule: 'Regel hinzufugen',
    edit: 'Andern',
    remove: 'Loschen',
    warnCount: 'Warns',
    warnAction: 'Aktion',
    warnDuration: 'Dauer',
    noWarnRules: 'Noch keine Regeln',
    saveRule: 'Regel speichern',
    cancel: 'Abbrechen',
    completeSetup: 'Fertig, Einstellungen offnen',
    back: 'Zuruck',
    forward: 'Weiter',
    finishGuide: 'Beim Start nicht zeigen',
    dmWelcomeEnabled: 'DM-Willkommen aktiv',
    serverWelcomeEnabled: 'Server-Willkommen aktiv',
    dmWelcomeJson: 'DM-Willkommen JSON',
    serverWelcomeJson: 'Server-Willkommen JSON',
    welcomeChannel: 'Willkommenskanal',
    botStatus: 'Prasenzstatus',
    activityType: 'Aktivitatstyp',
    activityText: 'Aktivitatstext',
    tokenField: 'Bot-Token',
    online: 'Online',
    idle: 'Abwesend',
    dnd: 'Nicht storen',
    invisible: 'Unsichtbar',
    playing: 'Spielt',
    watching: 'Schaut',
    listening: 'Hort',
    competing: 'Nimmt teil',
    streaming: 'Streamt',
    joinServer: 'Offizieller Discord',
    exportHosting: 'Hosting-Export',
    hostingExported: 'Hosting-Archiv gespeichert',
    savedNotice: 'Gespeichert!',
    settingsHub: 'Einstellungsgruppen',
    openGroup: 'Offnen',
    fieldsCount: 'Einstellungen',
    backToGroups: 'Zuruck zu Gruppen'
  },
  ua: {
    setup: 'Перший запуск',
    welcome: 'Привітання',
    presence: 'Статус бота',
    loadJson: 'Завантажити JSON',
    insertExample: 'Приклад',
    addRule: 'Додати правило',
    edit: 'Змінити',
    remove: 'Видалити',
    warnCount: 'Варнів',
    warnAction: 'Дія',
    warnDuration: 'Термін',
    noWarnRules: 'Правил ще немає',
    saveRule: 'Зберегти правило',
    cancel: 'Скасувати',
    completeSetup: 'Готово, відкрити налаштування',
    back: 'Назад',
    forward: 'Далі',
    finishGuide: 'Не показувати під час старту',
    dmWelcomeEnabled: 'ЛП-привітання увімкнено',
    serverWelcomeEnabled: 'Привітання на сервері увімкнено',
    dmWelcomeJson: 'JSON ЛП-привітання',
    serverWelcomeJson: 'JSON привітання на сервері',
    welcomeChannel: 'Канал привітання',
    botStatus: 'Статус присутності',
    activityType: 'Тип активності',
    activityText: 'Текст активності',
    tokenField: 'Токен бота',
    online: 'У мережі',
    idle: 'Не активний',
    dnd: 'Не турбувати',
    invisible: 'Невидимий',
    playing: 'Грає',
    watching: 'Дивиться',
    listening: 'Слухає',
    competing: 'Змагається',
    streaming: 'Стримить',
    joinServer: 'Офіційний Discord',
    exportHosting: 'Експорт для хостингу',
    hostingExported: 'Архів для хостингу збережено',
    savedNotice: 'Збережено!',
    settingsHub: 'Групи налаштувань',
    openGroup: 'Відкрити',
    fieldsCount: 'Параметрів',
    backToGroups: 'До груп'
  }
};

const selectOptions = {
  botStatus: [
    { value: 'online', label: { ru: 'В сети', en: 'Online', de: 'Online', ua: 'У мережі' } },
    { value: 'idle', label: { ru: 'Не активен', en: 'Idle', de: 'Abwesend', ua: 'Не активний' } },
    { value: 'dnd', label: { ru: 'Не беспокоить', en: 'Do not disturb', de: 'Nicht storen', ua: 'Не турбувати' } },
    { value: 'invisible', label: { ru: 'Невидимый', en: 'Invisible', de: 'Unsichtbar', ua: 'Невидимий' } }
  ],
  activityType: [
    { value: 'Watching', label: { ru: 'Смотрит', en: 'Watching', de: 'Schaut', ua: 'Дивиться' } },
    { value: 'Playing', label: { ru: 'Играет', en: 'Playing', de: 'Spielt', ua: 'Грає' } },
    { value: 'Listening', label: { ru: 'Слушает', en: 'Listening', de: 'Hort', ua: 'Слухає' } },
    { value: 'Competing', label: { ru: 'Соревнуется', en: 'Competing', de: 'Nimmt teil', ua: 'Змагається' } },
    { value: 'Streaming', label: { ru: 'Стримит', en: 'Streaming', de: 'Streamt', ua: 'Стримить' } }
  ]
};

const translations = {
  ru: {
    appTitle: 'Self-hosted bot by Core',
    settings: 'Настройки',
    commands: 'Команды',
    logs: 'Логи',
    save: 'Сохранить',
    start: 'Старт',
    restart: 'Перезапуск',
    stop: 'Стоп',
    emergency: 'Аварийная остановка',
    dark: 'Тёмная',
    light: 'Светлая',
    main: 'Основное',
    channels: 'Каналы',
    moderation: 'Модерация',
    advanced: 'Дополнительно',
    token: 'Токен бота',
    clientId: 'ID бота',
    guildId: 'ID сервера',
    ownerId: 'ID владельца',
    sqlitePath: 'SQLite файл',
    choose: 'Выбрать',
    adminLog: 'Канал логов админов',
    logChannel: 'Канал логов',
    notification: 'Канал уведомлений',
    sqlBackup: 'Канал SQL backup',
    muteRole: 'Mute роль',
    levels: 'Уровни',
    voice: 'Voice tracking',
    sweep: 'Интервал sweep, мс',
    warns: 'Правила варнов',
    sqlBackupEnabled: 'SQL backup',
    sqlBackupDebounce: 'Задержка SQL backup, мс',
    disabledCommands: 'Отключённые команды',
    disabledCategories: 'Отключённые категории',
    search: 'Поиск команд',
    all: 'Все',
    enabled: 'Включено',
    disabled: 'Отключено',
    categoryLocked: 'категория',
    locked: 'зафиксировано',
    clearLogs: 'Очистить экран',
    status: 'Статус',
    running: 'работает',
    stopped: 'остановлен',
    starting: 'запускается',
    stopping: 'останавливается',
    emergencyStop: 'аварийная остановка',
    copied: 'Сохранено',
    noCommands: 'Команды не найдены',
    page: 'Страница',
    prev: 'Назад',
    next: 'Вперёд',
    helpTitle: 'Описание настройки',
    close: 'Закрыть',
    more: 'Подробнее',
    currentStatus: 'Текущий статус',
    pid: 'PID',
    commandCount: 'Команд',
    logCount: 'Строк логов'
  },
  en: {
    appTitle: 'Self-hosted bot by Core',
    settings: 'Settings',
    commands: 'Commands',
    logs: 'Logs',
    save: 'Save',
    start: 'Start',
    restart: 'Restart',
    stop: 'Stop',
    emergency: 'Emergency stop',
    dark: 'Dark',
    light: 'Light',
    main: 'Main',
    channels: 'Channels',
    moderation: 'Moderation',
    advanced: 'Advanced',
    token: 'Bot token',
    clientId: 'Bot ID',
    guildId: 'Server ID',
    ownerId: 'Owner ID',
    sqlitePath: 'SQLite file',
    choose: 'Choose',
    adminLog: 'Admin log channel',
    logChannel: 'Log channel',
    notification: 'Notification channel',
    sqlBackup: 'SQL backup channel',
    muteRole: 'Mute role',
    levels: 'Levels',
    voice: 'Voice tracking',
    sweep: 'Sweep interval, ms',
    warns: 'Warn rules',
    sqlBackupEnabled: 'SQL backup',
    sqlBackupDebounce: 'SQL backup delay, ms',
    disabledCommands: 'Disabled commands',
    disabledCategories: 'Disabled categories',
    search: 'Search commands',
    all: 'All',
    enabled: 'Enabled',
    disabled: 'Disabled',
    categoryLocked: 'category',
    locked: 'locked',
    clearLogs: 'Clear view',
    status: 'Status',
    running: 'running',
    stopped: 'stopped',
    starting: 'starting',
    stopping: 'stopping',
    emergencyStop: 'emergency stop',
    copied: 'Saved',
    noCommands: 'No commands found',
    page: 'Page',
    prev: 'Prev',
    next: 'Next',
    helpTitle: 'Setting details',
    close: 'Close',
    more: 'Details',
    currentStatus: 'Current status',
    pid: 'PID',
    commandCount: 'Commands',
    logCount: 'Log lines'
  },
  de: {
    appTitle: 'Self-hosted bot by Core',
    settings: 'Einstellungen',
    commands: 'Befehle',
    logs: 'Logs',
    save: 'Speichern',
    start: 'Start',
    restart: 'Neustart',
    stop: 'Stopp',
    emergency: 'Notstopp',
    dark: 'Dunkel',
    light: 'Hell',
    main: 'Basis',
    channels: 'Kanäle',
    moderation: 'Moderation',
    advanced: 'Erweitert',
    token: 'Bot-Token',
    clientId: 'Bot-ID',
    guildId: 'Server-ID',
    ownerId: 'Owner-ID',
    sqlitePath: 'SQLite-Datei',
    choose: 'Wählen',
    adminLog: 'Admin-Log-Kanal',
    logChannel: 'Log-Kanal',
    notification: 'Benachrichtigungskanal',
    sqlBackup: 'SQL-Backup-Kanal',
    muteRole: 'Mute-Rolle',
    levels: 'Level',
    voice: 'Voice tracking',
    sweep: 'Sweep-Intervall, ms',
    warns: 'Warn-Regeln',
    sqlBackupEnabled: 'SQL backup',
    sqlBackupDebounce: 'SQL backup Verzögerung, ms',
    disabledCommands: 'Deaktivierte Befehle',
    disabledCategories: 'Deaktivierte Kategorien',
    search: 'Befehle suchen',
    all: 'Alle',
    enabled: 'Aktiv',
    disabled: 'Aus',
    categoryLocked: 'Kategorie',
    locked: 'gesperrt',
    clearLogs: 'Ansicht leeren',
    status: 'Status',
    running: 'läuft',
    stopped: 'gestoppt',
    starting: 'startet',
    stopping: 'stoppt',
    emergencyStop: 'Notstopp',
    copied: 'Gespeichert',
    noCommands: 'Keine Befehle gefunden',
    page: 'Seite',
    prev: 'Zurück',
    next: 'Weiter',
    helpTitle: 'Einstellung erklärt',
    close: 'Schließen',
    more: 'Details',
    currentStatus: 'Aktueller Status',
    pid: 'PID',
    commandCount: 'Befehle',
    logCount: 'Log-Zeilen'
  },
  ua: {
    appTitle: 'Self-hosted bot by Core',
    settings: 'Налаштування',
    commands: 'Команди',
    logs: 'Логи',
    save: 'Зберегти',
    start: 'Старт',
    restart: 'Перезапуск',
    stop: 'Стоп',
    emergency: 'Аварійна зупинка',
    dark: 'Темна',
    light: 'Світла',
    main: 'Основне',
    channels: 'Канали',
    moderation: 'Модерація',
    advanced: 'Додатково',
    token: 'Токен бота',
    clientId: 'ID бота',
    guildId: 'ID сервера',
    ownerId: 'ID власника',
    sqlitePath: 'SQLite файл',
    choose: 'Вибрати',
    adminLog: 'Канал логів адмінів',
    logChannel: 'Канал логів',
    notification: 'Канал сповіщень',
    sqlBackup: 'Канал SQL backup',
    muteRole: 'Mute роль',
    levels: 'Рівні',
    voice: 'Voice tracking',
    sweep: 'Інтервал sweep, мс',
    warns: 'Правила варнів',
    sqlBackupEnabled: 'SQL backup',
    sqlBackupDebounce: 'Затримка SQL backup, мс',
    disabledCommands: 'Вимкнені команди',
    disabledCategories: 'Вимкнені категорії',
    search: 'Пошук команд',
    all: 'Усі',
    enabled: 'Увімкнено',
    disabled: 'Вимкнено',
    categoryLocked: 'категорія',
    locked: 'зафіксовано',
    clearLogs: 'Очистити екран',
    status: 'Статус',
    running: 'працює',
    stopped: 'зупинено',
    starting: 'запускається',
    stopping: 'зупиняється',
    emergencyStop: 'аварійна зупинка',
    copied: 'Збережено',
    noCommands: 'Команди не знайдено',
    page: 'Сторінка',
    prev: 'Назад',
    next: 'Вперед',
    helpTitle: 'Опис налаштування',
    close: 'Закрити',
    more: 'Докладніше',
    currentStatus: 'Поточний статус',
    pid: 'PID',
    commandCount: 'Команд',
    logCount: 'Рядків логів'
  }
};

const settingsLayout = [
  {
    id: 'identity',
    titleKey: 'main',
    summaryMap: { ru: 'Токен, ID приложения, сервер и SQLite база.', en: 'Token, application ID, server and SQLite database.', de: 'Token, App-ID, Server und SQLite database.', ua: 'Токен, ID застосунку, сервер і SQLite база.' },
    accent: '#43c7b2',
    items: [
      { key: 'DISCORD_TOKEN', labelMap: { ru: 'Токен бота', en: 'Bot token', de: 'Bot-Token', ua: 'Токен бота' }, type: 'password' },
      { key: 'CLIENT_ID', labelKey: 'clientId' },
      { key: 'GUILD_ID', labelKey: 'guildId' },
      { key: 'DEV', labelKey: 'ownerId' },
      { key: 'SQLITE_DB_PATH', labelKey: 'sqlitePath', type: 'path' }
    ]
  },
  {
    id: 'presence',
    titleMap: { ru: 'Статус бота', en: 'Bot status', de: 'Bot-Status', ua: 'Статус бота' },
    summaryMap: { ru: 'Presence, активность и текст статуса в Discord.', en: 'Presence, activity type and Discord status text.', de: 'Presence, Aktivitatstyp und Discord status text.', ua: 'Presence, активність і текст статусу в Discord.' },
    accent: '#6ea8ff',
    items: [
      { key: 'BOT_STATUS', labelMap: { ru: 'Статус присутствия', en: 'Presence status', de: 'Prasenzstatus', ua: 'Статус присутності' }, type: 'select', options: selectOptions.botStatus },
      { key: 'BOT_ACTIVITY_TYPE', labelMap: { ru: 'Тип активности', en: 'Activity type', de: 'Aktivitatstyp', ua: 'Тип активності' }, type: 'select', options: selectOptions.activityType },
      { key: 'BOT_ACTIVITY_TEXT', labelMap: { ru: 'Текст активности', en: 'Activity text', de: 'Aktivitatstext', ua: 'Текст активності' } }
    ]
  },
  {
    id: 'channels',
    titleKey: 'channels',
    summaryMap: { ru: 'Каналы логов, уведомлений и резервных копий.', en: 'Log, notification and backup channel IDs.', de: 'Log-, notification- und backup-channel IDs.', ua: 'Канали логів, сповіщень і резервних копій.' },
    accent: '#e0b14f',
    items: [
      { key: 'ADMIN_LOG_CHANNEL_ID', labelKey: 'adminLog' },
      { key: 'LOG_CHANNEL_ID', labelKey: 'logChannel' },
      { key: 'NOTIFICATION', labelKey: 'notification' },
      { key: 'SQL_BACKUP_CHANNEL_ID', labelKey: 'sqlBackup' }
    ]
  },
  {
    id: 'moderation',
    titleKey: 'moderation',
    summaryMap: { ru: 'Роли доступа, мут-роль и правила наказаний за варны.', en: 'Access roles, mute role and warning punishment rules.', de: 'Access roles, mute role und warn rules.', ua: 'Ролі доступу, mute-роль і правила покарань за варни.' },
    accent: '#ef6572',
    items: [
      { key: 'MUTE_ROLE', labelKey: 'muteRole' },
      { key: 'ADMIN_ROLES_LEVEL_0', label: 'Admin role 0' },
      { key: 'ADMIN_ROLES_LEVEL_1', label: 'Admin role 1' },
      { key: 'ADMIN_ROLES_LEVEL_2', label: 'Admin role 2' },
      { key: 'ADMIN_ROLES_LEVEL_3', label: 'Admin role 3' },
      { key: 'ADMIN_ROLES_LEVEL_4', label: 'Admin role 4' },
      { key: 'WARN_PUNISHMENTS', labelKey: 'warns', type: 'warnRules' },
      { key: 'MODERATION_SWEEP_INTERVAL_MS', labelKey: 'sweep', type: 'number', attrs: 'min="30000" step="1000"' }
    ]
  },
  {
    id: 'automod',
    titleMap: { ru: 'Автомодерация', en: 'Automoderation', de: 'Automoderation', ua: 'Автомодерація' },
    summaryMap: { ru: 'Пинги, плохие слова, ссылки, Discord-инвайты и спам.', en: 'Pings, bad words, links, Discord invites and spam.', de: 'Pings, Wortfilter, Links, Discord-Einladungen und Spam.', ua: 'Пінги, погані слова, посилання, Discord-запрошення і спам.' },
    accent: '#9f7aea',
    items: [
      { key: 'AUTOMOD_ENABLED', labelMap: { ru: 'Автомодерация включена', en: 'Automoderation enabled', de: 'Automoderation aktiv', ua: 'Автомодерація увімкнена' }, type: 'checkbox' },
      { key: 'AUTOMOD_DELETE_MESSAGE', labelMap: { ru: 'Удалять нарушающее сообщение', en: 'Delete violating message', de: 'Regelverstoss-Nachricht loschen', ua: 'Видаляти повідомлення з порушенням' }, type: 'checkbox' },
      { key: 'AUTOMOD_WARN_USER', labelMap: { ru: 'Выдавать варн за нарушение', en: 'Issue warning for violation', de: 'Warn fur Verstoss ausstellen', ua: 'Видавати варн за порушення' }, type: 'checkbox' },
      { key: 'AUTOMOD_IGNORE_ADMINISTRATORS', labelMap: { ru: 'Игнорировать Discord-администраторов', en: 'Ignore Discord administrators', de: 'Discord-Administratoren ignorieren', ua: 'Ігнорувати Discord-адміністраторів' }, type: 'checkbox' },
      { key: 'AUTOMOD_LOG_CHANNEL_ID', labelMap: { ru: 'Канал логов автомодерации', en: 'Automoderation log channel', de: 'Automoderation-Log-Kanal', ua: 'Канал логів автомодерації' } },
      { key: 'AUTOMOD_BYPASS_ROLE_IDS', labelMap: { ru: 'Роли-исключения', en: 'Bypass role IDs', de: 'Bypass-Rollen-IDs', ua: 'Ролі-винятки' } },
      { key: 'AUTOMOD_PING_ENABLED', labelMap: { ru: 'Защита от массовых пингов', en: 'Mass ping protection', de: 'Mass-Ping-Schutz', ua: 'Захист від масових пінгів' }, type: 'checkbox' },
      { key: 'AUTOMOD_PING_MAX_MENTIONS', labelMap: { ru: 'Лимит упоминаний', en: 'Mention limit', de: 'Mention-Limit', ua: 'Ліміт згадок' }, type: 'number', attrs: 'min="1" step="1"' },
      { key: 'AUTOMOD_BAD_WORDS_ENABLED', labelMap: { ru: 'Фильтр плохих слов', en: 'Bad words filter', de: 'Wortfilter', ua: 'Фільтр поганих слів' }, type: 'checkbox' },
      { key: 'AUTOMOD_BAD_WORDS', labelMap: { ru: 'Список плохих слов', en: 'Bad words list', de: 'Wortliste', ua: 'Список поганих слів' }, type: 'textarea', attrs: 'rows="4" spellcheck="false"' },
      { key: 'AUTOMOD_LINKS_ENABLED', labelMap: { ru: 'Проверять ссылки', en: 'Check links', de: 'Links prufen', ua: 'Перевіряти посилання' }, type: 'checkbox' },
      { key: 'AUTOMOD_LINKS_BLOCK_INVITES', labelMap: { ru: 'Блокировать Discord-инвайты', en: 'Block Discord invites', de: 'Discord-Einladungen blockieren', ua: 'Блокувати Discord-запрошення' }, type: 'checkbox' },
      { key: 'AUTOMOD_LINKS_BLOCK_ALL', labelMap: { ru: 'Блокировать все ссылки', en: 'Block all links', de: 'Alle Links blockieren', ua: 'Блокувати всі посилання' }, type: 'checkbox' },
      { key: 'AUTOMOD_LINKS_ALLOWED_DOMAINS', labelMap: { ru: 'Разрешённые домены', en: 'Allowed domains', de: 'Erlaubte Domains', ua: 'Дозволені домени' }, type: 'textarea', attrs: 'rows="3" spellcheck="false"' },
      { key: 'AUTOMOD_SPAM_ENABLED', labelMap: { ru: 'Антиспам включён', en: 'Anti-spam enabled', de: 'Anti-Spam aktiv', ua: 'Антиспам увімкнено' }, type: 'checkbox' },
      { key: 'AUTOMOD_SPAM_MESSAGE_LIMIT', labelMap: { ru: 'Сообщений за окно', en: 'Messages per window', de: 'Nachrichten pro Fenster', ua: 'Повідомлень за вікно' }, type: 'number', attrs: 'min="2" step="1"' },
      { key: 'AUTOMOD_SPAM_TIME_WINDOW_MS', labelMap: { ru: 'Окно спама, мс', en: 'Spam window, ms', de: 'Spam-Fenster, ms', ua: 'Вікно спаму, мс' }, type: 'number', attrs: 'min="5000" step="1000"' }
    ]
  },
  {
    id: 'welcomes',
    titleMap: { ru: 'Приветствия', en: 'Welcomes', de: 'Begrussungen', ua: 'Привітання' },
    summaryMap: { ru: 'Отдельные JSON-шаблоны для ЛС и серверного приветствия.', en: 'Separate JSON templates for DM and server welcomes.', de: 'Separate JSON-Vorlagen fur DM- und Server-Willkommen.', ua: 'Окремі JSON-шаблони для ЛП і серверного привітання.' },
    accent: '#66d18f',
    items: [
      { key: 'WELCOME_DM_ENABLED', labelMap: { ru: 'ЛС-приветствие включено', en: 'DM welcome enabled', de: 'DM-Willkommen aktiv', ua: 'ЛП-привітання увімкнено' }, type: 'checkbox' },
      { key: 'WELCOME_DM_JSON', labelMap: { ru: 'JSON ЛС-приветствия', en: 'DM welcome JSON', de: 'DM-Willkommen JSON', ua: 'JSON ЛП-привітання' }, type: 'json', sample: 'dm' },
      { key: 'WELCOME_SERVER_ENABLED', labelMap: { ru: 'Приветствие на сервере включено', en: 'Server welcome enabled', de: 'Server-Willkommen aktiv', ua: 'Привітання на сервері увімкнено' }, type: 'checkbox' },
      { key: 'WELCOME_SERVER_CHANNEL_ID', labelMap: { ru: 'Канал приветствия', en: 'Welcome channel', de: 'Willkommenskanal', ua: 'Канал привітання' } },
      { key: 'WELCOME_SERVER_JSON', labelMap: { ru: 'JSON приветствия на сервере', en: 'Server welcome JSON', de: 'Server-Willkommen JSON', ua: 'JSON привітання на сервері' }, type: 'json', sample: 'server' }
    ]
  },
  {
    id: 'advanced',
    titleKey: 'advanced',
    summaryMap: { ru: 'Уровни, voice tracking, backup и отключение команд.', en: 'Levels, voice tracking, backup and command disabling.', de: 'Level, Voice tracking, Backup und command disabling.', ua: 'Рівні, voice tracking, backup і вимкнення команд.' },
    accent: '#8ab4f8',
    items: [
      { key: 'LEVELS_ENABLED', labelKey: 'levels', type: 'checkbox' },
      { key: 'VOICE_TRACKING_ENABLED', labelKey: 'voice', type: 'checkbox' },
      { key: 'SQL_BACKUP_ENABLED', labelKey: 'sqlBackupEnabled', type: 'checkbox' },
      { key: 'SQL_BACKUP_DEBOUNCE_MS', labelKey: 'sqlBackupDebounce', type: 'number', attrs: 'min="250" step="250"' },
      { key: 'DISABLED_COMMANDS', labelKey: 'disabledCommands' },
      { key: 'DISABLED_COMMAND_CATEGORIES', labelKey: 'disabledCategories' }
    ]
  }
];

const settingHelp = {
  BOT_STATUS: 'Presence status that Discord shows for the bot account after startup. Use online, idle, do-not-disturb, or invisible.',
  BOT_ACTIVITY_TYPE: 'Activity type for the bot profile. It is paired with the activity text field, for example Watching /help or Playing moderation.',
  BOT_ACTIVITY_TEXT: 'Text shown in the bot activity line. Leave it empty to use the default self-host text.',
  WELCOME_DM_ENABLED: 'Turns on custom direct-message welcome. The stock Core DM is removed; if this is off or JSON is empty, no welcome DM is sent.',
  WELCOME_DM_JSON: 'Paste or load a Discord message JSON for the direct-message welcome. It can contain content, embeds, or Components V2 components. Supported tags include {{username}}, {{displayname}}, {{globalname}}, {{userid}}, {{mention}}, {{tag}}, {{avatar}}, {{server}}, {{serverid}}, {{membercount}}, {{joindate}}, {{joinedrelative}}, {{createdat}}, {{createdrelative}}, {{guildicon}}, and {{guildbanner}}.',
  WELCOME_SERVER_ENABLED: 'Turns on the separate server welcome message. It is sent to WELCOME_SERVER_CHANNEL_ID and uses its own JSON template.',
  WELCOME_SERVER_CHANNEL_ID: 'Text channel ID where server welcome messages will be sent. Enable Discord Developer Mode, right-click the channel, then Copy ID.',
  WELCOME_SERVER_JSON: 'Paste or load a Discord message JSON for the public server welcome. It supports the same tags as the DM template and can use content, embeds, or Components V2.',
  token: 'Старое имя переменной для токена Discord-бота. Оставлено для совместимости, но лучше заполнять DISCORD_TOKEN. Никогда не отправляй этот токен другим людям.',
  DISCORD_TOKEN: 'Основной токен Discord-бота из Discord Developer Portal. По нему приложение запускает именно self-hosted бота.',
  CLIENT_ID: 'ID приложения Discord. Нужен для регистрации slash-команд и создания ссылки приглашения с правами администратора.',
  GUILD_ID: 'ID сервера, где бот будет регистрировать и использовать команды. Для self-host режима это главный рабочий сервер.',
  DEV: 'Discord ID владельца или разработчика. Эти пользователи получают доступ к developer-командам вроде reload, shutdown и refreshcommands.',
  SQLITE_DB_PATH: 'Путь к SQLite базе. Можно оставить data/core.sqlite, тогда база будет лежать рядом с данными приложения.',
  ADMIN_LOG_CHANNEL_ID: 'Канал, куда отправляются важные события администрирования и системные сообщения бота.',
  LOG_CHANNEL_ID: 'Основной канал логов. Используй отдельный приватный канал, чтобы рабочие сообщения не мешали участникам.',
  NOTIFICATION: 'Канал уведомлений для служебных сообщений, превью и автоматических событий.',
  SQL_BACKUP_CHANNEL_ID: 'Канал, куда бот сможет отправлять резервные копии SQLite, если SQL backup включён.',
  MUTE_ROLE: 'ID роли мута. Бот будет выдавать её при mute и снимать при unmute или истечении наказания.',
  WARN_PUNISHMENTS: 'Правила наказаний за варны. Формат: количество:действие:срок, например 2:mute:30m,8:ban:1d.',
  MODERATION_SWEEP_INTERVAL_MS: 'Как часто бот проверяет истёкшие наказания. Чем меньше число, тем быстрее реакции, но выше нагрузка.',
  AUTOMOD_ENABLED: 'Главный переключатель автомодерации. Если выключить, проверки пингов, слов, ссылок и спама не будут выполняться.',
  AUTOMOD_DELETE_MESSAGE: 'Удаляет сообщение, которое нарушило правила автомодерации. Для работы боту нужно право Manage Messages.',
  AUTOMOD_WARN_USER: 'Если включено, каждое нарушение записывается как варн в SQLite и может запускать наказания из правил варнов.',
  AUTOMOD_IGNORE_ADMINISTRATORS: 'Пропускает участников с Discord Administrator. Дополнительно всегда пропускаются владелец сервера и роли-исключения.',
  AUTOMOD_LOG_CHANNEL_ID: 'Канал для логов автомодерации. Если оставить пустым, будет использован ADMIN_LOG_CHANNEL_ID.',
  AUTOMOD_BYPASS_ROLE_IDS: 'ID ролей через запятую, которые автомодерация должна игнорировать. Подходит для модераторов, ботов-помощников и доверенных ролей.',
  AUTOMOD_PING_ENABLED: 'Включает защиту от массовых упоминаний пользователей, ролей и everyone/here.',
  AUTOMOD_PING_MAX_MENTIONS: 'Сколько упоминаний разрешено в одном сообщении. Если лимит превышен, сообщение считается нарушением.',
  AUTOMOD_BAD_WORDS_ENABLED: 'Включает фильтр плохих слов. Список слов задаётся отдельно в поле ниже.',
  AUTOMOD_BAD_WORDS: 'Список запрещённых слов через запятую, точку с запятой или новую строку. Регистр не важен.',
  AUTOMOD_LINKS_ENABLED: 'Включает проверку ссылок. Можно блокировать только Discord-инвайты или все ссылки кроме разрешённых доменов.',
  AUTOMOD_LINKS_BLOCK_INVITES: 'Блокирует ссылки discord.gg и discord.com/invite. Полезно, если реклама чужих серверов запрещена.',
  AUTOMOD_LINKS_BLOCK_ALL: 'Блокирует любые ссылки, кроме доменов из allowlist. Если выключено, проверяются только Discord-инвайты.',
  AUTOMOD_LINKS_ALLOWED_DOMAINS: 'Домены, которые разрешены при блокировке всех ссылок. Указывать без https, например example.com, docs.example.com.',
  AUTOMOD_SPAM_ENABLED: 'Включает антиспам по частоте сообщений и повторяющемуся тексту.',
  AUTOMOD_SPAM_MESSAGE_LIMIT: 'Сколько сообщений один участник может отправить за окно времени до срабатывания антиспама.',
  AUTOMOD_SPAM_TIME_WINDOW_MS: 'Окно времени антиспама в миллисекундах. Например 60000 означает 60 секунд.',
  LEVELS_ENABLED: 'Включает систему уровней и XP. Если выключить, команды уровней останутся видны в UI, но runtime не будет начислять прогресс.',
  VOICE_TRACKING_ENABLED: 'Включает учёт времени в голосовых каналах для лидербордов и статистики.',
  SQL_BACKUP_ENABLED: 'Включает резервное копирование SQLite. Для работы укажи канал SQL backup и дай боту право отправлять файлы.',
  SQL_BACKUP_DEBOUNCE_MS: 'Минимальная пауза между backup-событиями после изменений базы. Увеличь значение, если сервер часто пишет в SQLite.',
  DISABLED_COMMANDS: 'Список команд через запятую, которые нужно скрыть или отключить. То же самое можно переключать во вкладке команд.',
  DISABLED_COMMAND_CATEGORIES: 'Список категорий через запятую. Категория global принудительно отключена, потому что публичные команды удалены.'
};

const state = {
  tab: localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true' ? 'settings' : 'setup',
  lang: normalizeLang(localStorage.getItem('core-ui-lang') || 'ru'),
  theme: localStorage.getItem('core-ui-theme') || 'dark',
  env: {},
  commands: [],
  logs: [],
  status: { status: 'stopped', pid: null },
  search: '',
  commandCategory: 'all',
  commandPage: 1,
  setupStep: 0,
  settingsGroup: null,
  warnRuleIndex: null,
  busy: false,
  shellReady: false
};

const appNode = document.getElementById('app');
let searchTimer = null;
let listenersBound = false;
let coreSubscriptionsBound = false;

function normalizeLang(lang) {
  if (lang === 'uk') return 'ua';
  return translations[lang] ? lang : 'ru';
}

function t(key) {
  return translations[state.lang]?.[key] || translations.en[key] || key;
}

function localText(map, fallback = '') {
  if (!map || typeof map !== 'object') return fallback;
  return map[state.lang] || map.en || map.ru || fallback;
}

function ui(key) {
  return uiCopy[state.lang]?.[key] || uiCopy.en[key] || key;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function envValue(key) {
  return state.env[key] ?? '';
}

function setEnvValue(key, value) {
  state.env[key] = value;
}

function listFromEnv(key) {
  return String(envValue(key))
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function sectionTitle(section) {
  return section.titleMap ? localText(section.titleMap, section.titleKey) : t(section.titleKey);
}

function sectionId(section, index = 0) {
  return section.id || section.titleKey || `section-${index}`;
}

function sectionSummary(section) {
  return section.summaryMap ? localText(section.summaryMap, '') : '';
}

function settingLabel(item) {
  if (item.labelMap) return localText(item.labelMap, item.label || item.key);
  return item.label || t(item.labelKey);
}

function adminRoleHelp(level) {
  const levels = {
    0: 'Уровень 0: служебные команды владельца и разработчика, например /refreshcommands, /reload, /shutdown, /say, set/reset level и команды обслуживания автомодерации.',
    1: 'Уровень 1: сильные модераторские действия: /kick, /unban, /clearwarns, а также постоянный ban/mute в текущей сборке команд.',
    2: 'Уровень 2: работа с удалением варнов и временным баном: /remwarn и временный /ban.',
    3: 'Уровень 3: муты и скорость канала: /mute, /unmute, /slowmode.',
    4: 'Уровень 4: ежедневная модерация: /warn, /warns, /clear.'
  };
  return `AdminRole - это уровни доступа команд бота, а не автоматическая выдача Discord-админки. Вписывай ID ролей через запятую, например 123456789012345678,987654321098765432. ${levels[level] || ''}`;
}

function helpFor(key) {
  const adminRoleMatch = key.match(/^ADMIN_ROLES_LEVEL_(\d)$/);
  if (adminRoleMatch) {
    return adminRoleHelp(adminRoleMatch[1]);
  }
  return settingHelp[key] || 'Подробное описание для этой настройки пока не задано.';
}

function statusText() {
  const raw = state.status?.status || 'stopped';
  return t(raw === 'emergency-stop' ? 'emergencyStop' : raw) || raw;
}

function renderShell() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.lang = state.lang;

  const nav = [
    ['setup', ui('setup')],
    ['settings', t('settings')],
    ['commands', t('commands')],
    ['logs', t('logs')]
  ].map(([id, label]) => `
    <button class="nav-button" type="button" data-tab="${id}">
      <span>${escapeHtml(label)}</span>
    </button>
  `).join('');

  appNode.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">C</div>
        <div class="brand-copy">
          <h1>${escapeHtml(t('appTitle'))}</h1>
          <p>
            <span class="status-dot"></span>
            <span data-status-label>${escapeHtml(statusText())}</span>
            <span data-status-pid></span>
          </p>
        </div>
      </div>

      <nav class="nav">${nav}</nav>

      <div class="side-metrics">
        <div>
          <span>${escapeHtml(t('commandCount'))}</span>
          <strong data-command-count>${state.commands.length}</strong>
        </div>
        <div>
          <span>${escapeHtml(t('logCount'))}</span>
          <strong data-log-count>${state.logs.length}</strong>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-actions">
          <button class="community" type="button" data-action="join-server">${escapeHtml(ui('joinServer'))}</button>
          <button type="button" data-action="export-hosting">${escapeHtml(ui('exportHosting'))}</button>
        </div>
        <div class="segmented" aria-label="Language">
          ${['ru', 'en', 'de', 'ua'].map((lang) => `
            <button type="button" data-lang="${lang}">${lang.toUpperCase()}</button>
          `).join('')}
        </div>
        <div class="segmented" aria-label="Theme">
          <button type="button" data-theme="dark">${escapeHtml(t('dark'))}</button>
          <button type="button" data-theme="light">${escapeHtml(t('light'))}</button>
        </div>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <span class="eyebrow">${escapeHtml(t('currentStatus'))}</span>
          <strong class="top-status">
            <span class="status-dot"></span>
            <span data-status-label>${escapeHtml(statusText())}</span>
          </strong>
        </div>
        <div class="runtime-actions">
          <button class="primary" type="button" data-action="start">${escapeHtml(t('start'))}</button>
          <button type="button" data-action="restart">${escapeHtml(t('restart'))}</button>
          <button type="button" data-action="stop">${escapeHtml(t('stop'))}</button>
          <button class="danger" type="button" data-action="emergency">${escapeHtml(t('emergency'))}</button>
          <button class="save" type="button" data-action="save" data-save-button>${escapeHtml(t('save'))}</button>
        </div>
      </header>

      <section class="view" id="view"></section>
    </main>

    <div class="help-overlay" data-help-overlay hidden>
      <section class="help-drawer" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <button class="drawer-close" type="button" data-close-help aria-label="${escapeHtml(t('close'))}">×</button>
        <span class="eyebrow">${escapeHtml(t('helpTitle'))}</span>
        <h2 id="help-title" data-help-title></h2>
        <p data-help-body></p>
      </section>
    </div>

    <div class="modal-overlay" data-warn-modal hidden>
      <form class="modal-card" data-warn-form>
        <div class="panel-title">
          <h2>${escapeHtml(ui('addRule'))}</h2>
        </div>
        <div class="field">
          <div class="field-heading"><label for="warn-count">${escapeHtml(ui('warnCount'))}</label></div>
          <input id="warn-count" data-warn-count type="number" min="1" step="1" value="2" required>
        </div>
        <div class="field">
          <div class="field-heading"><label for="warn-action">${escapeHtml(ui('warnAction'))}</label></div>
          <select id="warn-action" data-warn-action>
            <option value="mute">mute</option>
            <option value="ban">ban</option>
            <option value="permanentBan">permanentBan</option>
          </select>
        </div>
        <div class="modal-duration">
          <div class="field">
            <div class="field-heading"><label for="warn-duration-amount">${escapeHtml(ui('warnDuration'))}</label></div>
            <input id="warn-duration-amount" data-warn-duration-amount type="number" min="1" step="1" value="30">
          </div>
          <div class="field">
            <div class="field-heading"><label for="warn-duration-unit">Unit</label></div>
            <select id="warn-duration-unit" data-warn-duration-unit>
              ${WARN_DURATION_UNITS.map((unit) => `<option value="${unit}">${unit}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" data-warn-cancel>${escapeHtml(ui('cancel'))}</button>
          <button class="primary" type="submit">${escapeHtml(ui('saveRule'))}</button>
        </div>
      </form>
    </div>
  `;

  state.shellReady = true;
  updateChrome();
  bindRenderedControls();
}

function updateChrome() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.lang = state.lang;
  document.body.classList.toggle('is-busy', state.busy);

  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === state.tab);
  });
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.classList.toggle('active', button.dataset.lang === state.lang);
  });
  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.classList.toggle('active', button.dataset.theme === state.theme);
  });
  document.querySelectorAll('.status-dot').forEach((dot) => {
    dot.className = `status-dot ${escapeHtml(state.status?.status || 'stopped')}`;
  });
  document.querySelectorAll('[data-status-label]').forEach((node) => {
    node.textContent = statusText();
  });

  const pidNode = document.querySelector('[data-status-pid]');
  if (pidNode) pidNode.textContent = state.status?.pid ? ` · ${t('pid')} ${state.status.pid}` : '';

  const commandCount = document.querySelector('[data-command-count]');
  if (commandCount) commandCount.textContent = String(state.commands.length);

  const logCount = document.querySelector('[data-log-count]');
  if (logCount) logCount.textContent = String(state.logs.length);
}

function helpButton(key, label) {
  return `
    <button class="help-button" type="button" data-help="${escapeHtml(key)}" aria-label="${escapeHtml(`${t('more')}: ${label}`)}">!</button>
  `;
}

function parseWarnRules(value) {
  return String(value || '')
    .split(',')
    .map((entry) => {
      const [countValue, actionValue, durationValue] = entry.split(':').map((part) => String(part || '').trim());
      const count = Number(countValue);
      if (!Number.isInteger(count) || count <= 0) return null;
      const action = ['mute', 'ban', 'permanentBan'].includes(actionValue) ? actionValue : 'mute';
      const durationMatch = String(durationValue || '').match(/^(\d+)([mhdw])$/i);
      return {
        count,
        action,
        amount: durationMatch ? Number(durationMatch[1]) : 30,
        unit: durationMatch ? durationMatch[2].toLowerCase() : 'm'
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.count - right.count);
}

function serializeWarnRules(rules) {
  return rules
    .filter((rule) => Number.isInteger(rule.count) && rule.count > 0 && ['mute', 'ban', 'permanentBan'].includes(rule.action))
    .sort((left, right) => left.count - right.count)
    .map((rule) => {
      if (rule.action === 'permanentBan') return `${rule.count}:permanentBan:`;
      const amount = Math.max(1, Number(rule.amount) || 1);
      const unit = WARN_DURATION_UNITS.includes(rule.unit) ? rule.unit : 'm';
      return `${rule.count}:${rule.action}:${amount}${unit}`;
    })
    .join(',');
}

function formatWarnRule(rule) {
  if (rule.action === 'permanentBan') return `${rule.count} -> permanentBan`;
  return `${rule.count} -> ${rule.action} ${rule.amount}${rule.unit}`;
}

function welcomeJsonExample(type) {
  const content = type === 'server'
    ? 'Welcome {{mention}} to **{{server}}**!'
    : 'Hi {{username}}, welcome to **{{server}}**!';
  return JSON.stringify({
    content,
    embeds: [
      {
        title: 'Welcome, {{displayname}}',
        description: 'User ID: {{userid}}\nMembers: {{membercount}}',
        color: 4433842,
        thumbnail: { url: '{{avatar}}' }
      }
    ],
    allowedMentions: { users: ['{{userid}}'], roles: [], repliedUser: false }
  }, null, 2);
}

function prettyJsonValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function renderWarnRulesField(item) {
  const label = settingLabel(item);
  const rules = parseWarnRules(envValue(item.key));
  return `
    <div class="field warn-rules-field">
      <div class="field-heading">
        <label>${escapeHtml(label)}</label>
        ${helpButton(item.key, label)}
      </div>
      <div class="warn-rule-list" data-warn-list>
        ${rules.length ? rules.map((rule, index) => `
          <article class="warn-rule-card">
            <strong>${escapeHtml(formatWarnRule(rule))}</strong>
            <div class="warn-rule-actions">
              <button type="button" data-warn-edit="${index}">${escapeHtml(ui('edit'))}</button>
              <button type="button" data-warn-delete="${index}">${escapeHtml(ui('remove'))}</button>
            </div>
          </article>
        `).join('') : `<div class="empty-state compact">${escapeHtml(ui('noWarnRules'))}</div>`}
      </div>
      <button type="button" data-warn-add>${escapeHtml(ui('addRule'))}</button>
    </div>
  `;
}

function renderJsonField(item, id, value, label) {
  return `
    <div class="field json-field">
      <div class="field-heading">
        <label for="${id}">${escapeHtml(label)}</label>
        ${helpButton(item.key, label)}
      </div>
      <textarea id="${id}" data-env="${escapeHtml(item.key)}" rows="8" spellcheck="false">${value}</textarea>
      <div class="field-actions">
        <button type="button" data-action="load-json:${escapeHtml(item.key)}">${escapeHtml(ui('loadJson'))}</button>
        <button type="button" data-action="sample-json:${escapeHtml(item.key)}:${escapeHtml(item.sample || 'dm')}">${escapeHtml(ui('insertExample'))}</button>
      </div>
    </div>
  `;
}

function renderSetupFields(fields = []) {
  if (!fields.length) return '';

  return `
    <div class="setup-fields">
      ${fields.map((field) => {
        const label = field.label || field.key;
        const id = `setup-${field.key}`;
        return `
          <div class="field">
            <div class="field-heading">
              <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
              ${helpButton(field.key, label)}
            </div>
            <input id="${escapeHtml(id)}" data-env="${escapeHtml(field.key)}" type="${field.type || 'text'}" value="${escapeHtml(envValue(field.key))}" autocomplete="off">
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function setupSteps() {
  return [
    {
      image: 'step-01-applications.png',
      title: { ru: 'Создай приложение Discord', en: 'Create a Discord app', de: 'Discord-App erstellen', ua: 'Створи Discord-застосунок' },
      bullets: {
        ru: ['Открой Discord Developer Portal и вкладку Applications.', 'Нажми New Application в правом верхнем углу.', 'Это будет отдельный self-host бот для твоего сервера.'],
        en: ['Open Discord Developer Portal and Applications.', 'Click New Application in the top-right corner.', 'This creates a separate self-host bot for your server.']
      }
    },
    {
      image: 'step-02-create-app.png',
      title: { ru: 'Заполни имя и создай app', en: 'Name and create the app', de: 'App benennen', ua: 'Назви і створи app' },
      bullets: {
        ru: ['Впиши имя бота.', 'Поставь галочку условий Discord.', 'Нажми Create.'],
        en: ['Enter the bot name.', 'Accept Discord terms.', 'Click Create.']
      }
    },
    {
      image: 'step-03-application-id.png',
      title: { ru: 'Скопируй ID бота', en: 'Copy bot ID', de: 'Bot-ID kopieren', ua: 'Скопіюй ID бота' },
      fields: [{ key: 'CLIENT_ID', label: 'CLIENT_ID' }],
      bullets: {
        ru: ['В General Information скопируй Application ID.', 'Вставь его в поле ID бота / CLIENT_ID.', 'Этот ID нужен для регистрации slash-команд и ссылки приглашения.'],
        en: ['Copy Application ID in General Information.', 'Paste it into Bot ID / CLIENT_ID.', 'It is used for slash commands and invite URL.']
      }
    },
    {
      image: 'step-04-token.png',
      title: { ru: 'Получай токен только здесь', en: 'Get the token here', de: 'Token hier holen', ua: 'Отримай токен тут' },
      fields: [{ key: 'DISCORD_TOKEN', label: 'DISCORD_TOKEN', type: 'password' }],
      bullets: {
        ru: ['Открой вкладку Bot.', 'Нажми Reset Token и скопируй токен один раз.', 'В Core вставляй его только в одно поле: Токен бота / DISCORD_TOKEN. Никому не отправляй токен.'],
        en: ['Open the Bot tab.', 'Click Reset Token and copy it once.', 'Paste it only into Bot token / DISCORD_TOKEN. Never share the token.']
      }
    },
    {
      image: 'step-05-intents.png',
      title: { ru: 'Включи нужные Intents', en: 'Enable required intents', de: 'Intents aktivieren', ua: 'Увімкни потрібні Intents' },
      bullets: {
        ru: ['В Bot включи Presence Intent, Server Members Intent и Message Content Intent.', 'Без Server Members не будет нормального приветствия новых участников.', 'Без Message Content часть модерации и автомодерации не сможет читать сообщения.'],
        en: ['Enable Presence Intent, Server Members Intent, and Message Content Intent.', 'Server Members is needed for welcome events.', 'Message Content is needed for moderation features that read messages.']
      }
    },
    {
      title: { ru: 'Включи режим разработчика Discord', en: 'Enable Discord Developer Mode', de: 'Entwicklermodus aktivieren', ua: 'Увімкни режим розробника Discord' },
      fields: [
        { key: 'GUILD_ID', label: 'GUILD_ID' },
        { key: 'ADMIN_LOG_CHANNEL_ID', label: 'ADMIN_LOG_CHANNEL_ID' },
        { key: 'LOG_CHANNEL_ID', label: 'LOG_CHANNEL_ID' },
        { key: 'NOTIFICATION', label: 'NOTIFICATION' },
        { key: 'SQL_BACKUP_CHANNEL_ID', label: 'SQL_BACKUP_CHANNEL_ID' }
      ],
      bullets: {
        ru: ['Discord -> User Settings -> Advanced -> Developer Mode.', 'После этого можно копировать ID: правый клик по серверу, каналу, роли или пользователю -> Copy ID.', 'ID сервера вставь в GUILD_ID, ID каналов логов - в соответствующие поля каналов.'],
        en: ['Discord -> User Settings -> Advanced -> Developer Mode.', 'Then right-click a server, channel, role, or user and choose Copy ID.', 'Paste server ID into GUILD_ID and log channel IDs into channel fields.']
      }
    },
    {
      title: { ru: 'AdminRole - это уровни доступа', en: 'AdminRole means access levels', de: 'AdminRole sind Zugriffsstufen', ua: 'AdminRole - це рівні доступу' },
      fields: [
        { key: 'ADMIN_ROLES_LEVEL_0', label: 'ADMIN_ROLES_LEVEL_0' },
        { key: 'ADMIN_ROLES_LEVEL_1', label: 'ADMIN_ROLES_LEVEL_1' },
        { key: 'ADMIN_ROLES_LEVEL_2', label: 'ADMIN_ROLES_LEVEL_2' },
        { key: 'ADMIN_ROLES_LEVEL_3', label: 'ADMIN_ROLES_LEVEL_3' },
        { key: 'ADMIN_ROLES_LEVEL_4', label: 'ADMIN_ROLES_LEVEL_4' }
      ],
      bullets: {
        ru: ['AdminRole не выдаёт Discord-админку. Это список ролей, которым бот разрешает команды конкретного уровня.', 'Вводи ID ролей через запятую: AdminRoleID,AdminRoleID.', 'Уровень 0 - служебные команды владельца. 1 - сильная модерация. 2 - remwarn/временный ban. 3 - mute/unmute/slowmode. 4 - warn/warns/clear.'],
        en: ['AdminRole does not grant Discord administrator. It is a role-ID allowlist for bot command levels.', 'Enter role IDs separated by commas: AdminRoleID,AdminRoleID.', 'Level 0 is owner/service tools. 1 is strong moderation. 2 is remwarn/temp ban. 3 is mute/unmute/slowmode. 4 is warn/warns/clear.']
      }
    },
    {
      title: { ru: 'Приветствия через JSON и теги', en: 'Welcome JSON and tags', de: 'Willkommen-JSON und Tags', ua: 'Привітання через JSON і теги' },
      bullets: {
        ru: ['ЛС-приветствие и серверное приветствие теперь разные настройки.', 'Можно вставить обычный message JSON, embeds или Components V2. Для серверного приветствия обязательно укажи канал.', `Доступные теги: ${WELCOME_TAGS.join(', ')}.`],
        en: ['DM welcome and server welcome are separate settings.', 'You can paste normal message JSON, embeds, or Components V2. Server welcome also needs a channel ID.', `Available tags: ${WELCOME_TAGS.join(', ')}.`]
      }
    }
  ];
}

function renderSetupView() {
  const steps = setupSteps();
  state.setupStep = Math.min(Math.max(0, state.setupStep), steps.length - 1);
  const step = steps[state.setupStep];
  const bullets = localText(step.bullets, step.bullets.en || []);

  return `
    <section class="setup-view">
      <div class="setup-card">
        <div class="setup-copy">
          <span class="eyebrow">${escapeHtml(ui('setup'))} ${state.setupStep + 1} / ${steps.length}</span>
          <h2>${escapeHtml(localText(step.title, 'First run'))}</h2>
          <ul>
            ${bullets.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
          </ul>
          ${renderSetupFields(step.fields)}
          <div class="setup-actions">
            <button type="button" data-setup-page="prev" ${state.setupStep <= 0 ? 'disabled' : ''}>${escapeHtml(ui('back'))}</button>
            <button type="button" data-setup-page="next" ${state.setupStep >= steps.length - 1 ? 'disabled' : ''}>${escapeHtml(ui('forward'))}</button>
            <button class="primary" type="button" data-action="setup-done">${escapeHtml(ui('completeSetup'))}</button>
          </div>
        </div>
        <div class="setup-media">
          ${step.image ? `<img src="${ONBOARDING_ASSET_BASE}/${escapeHtml(step.image)}" alt="${escapeHtml(localText(step.title, 'Guide step'))}">` : `
            <div class="setup-placeholder">
              ${WELCOME_TAGS.map((tag) => `<code>${escapeHtml(tag)}</code>`).join('')}
            </div>
          `}
        </div>
      </div>
    </section>
  `;
}

function renderField(item) {
  const label = settingLabel(item);
  const id = `setting-${item.key.replace(/[^a-z0-9_-]/gi, '-')}`;
  const rawValue = envValue(item.key);
  const value = escapeHtml(item.type === 'json' ? prettyJsonValue(rawValue) : rawValue);
  const attrs = item.attrs || '';

  if (item.type === 'warnRules') {
    return renderWarnRulesField(item);
  }

  if (item.type === 'checkbox') {
    const checked = String(envValue(item.key)).toLowerCase() === 'true' ? 'checked' : '';
    return `
      <div class="toggle-row">
        <div class="field-heading">
          <span>${escapeHtml(label)}</span>
          ${helpButton(item.key, label)}
        </div>
        <label class="switch" for="${id}">
          <input id="${id}" data-env="${escapeHtml(item.key)}" type="checkbox" ${checked}>
          <span></span>
        </label>
      </div>
    `;
  }

  if (item.type === 'path') {
    return `
      <div class="field">
        <div class="field-heading">
          <label for="${id}">${escapeHtml(label)}</label>
          ${helpButton(item.key, label)}
        </div>
        <div class="combo">
          <input id="${id}" data-env="${escapeHtml(item.key)}" type="text" value="${value}" autocomplete="off">
          <button type="button" data-action="choose-db">${escapeHtml(t('choose'))}</button>
        </div>
      </div>
    `;
  }

  if (item.type === 'select') {
    return `
      <div class="field">
        <div class="field-heading">
          <label for="${id}">${escapeHtml(label)}</label>
          ${helpButton(item.key, label)}
        </div>
        <select id="${id}" data-env="${escapeHtml(item.key)}">
          ${(item.options || []).map((option) => `
            <option value="${escapeHtml(option.value)}" ${envValue(item.key) === option.value ? 'selected' : ''}>
              ${escapeHtml(localText(option.label, option.value))}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  if (item.type === 'json') {
    return renderJsonField(item, id, value, label);
  }

  if (item.type === 'textarea') {
    return `
      <div class="field">
        <div class="field-heading">
          <label for="${id}">${escapeHtml(label)}</label>
          ${helpButton(item.key, label)}
        </div>
        <textarea id="${id}" data-env="${escapeHtml(item.key)}" ${attrs}>${value}</textarea>
      </div>
    `;
  }

  return `
    <div class="field">
      <div class="field-heading">
        <label for="${id}">${escapeHtml(label)}</label>
        ${helpButton(item.key, label)}
      </div>
      <input id="${id}" data-env="${escapeHtml(item.key)}" type="${item.type || 'text'}" value="${value}" ${attrs} autocomplete="off">
    </div>
  `;
}

function renderSettingsCard(section, index) {
  const id = sectionId(section, index);
  const checkboxCount = section.items.filter((item) => item.type === 'checkbox').length;
  const enabledCount = section.items.filter((item) => item.type === 'checkbox' && String(envValue(item.key)).toLowerCase() === 'true').length;

  return `
    <button class="settings-card" type="button" data-settings-group="${escapeHtml(id)}" style="--section-accent: ${escapeHtml(section.accent || '#43c7b2')}">
      <span class="settings-card-glow"></span>
      <span class="settings-card-top">
        <span class="settings-card-mark">${escapeHtml(String(index + 1).padStart(2, '0'))}</span>
        <span class="badge">${escapeHtml(`${section.items.length} ${ui('fieldsCount')}`)}</span>
      </span>
      <strong>${escapeHtml(sectionTitle(section))}</strong>
      <span class="settings-card-summary">${escapeHtml(sectionSummary(section))}</span>
      <span class="settings-card-footer">
        <span>${checkboxCount ? `${enabledCount}/${checkboxCount} ${t('enabled').toLowerCase()}` : ui('openGroup')}</span>
        <span class="settings-card-arrow">-></span>
      </span>
    </button>
  `;
}

function renderSettingsCards() {
  return `
    <div class="settings-hub">
      <div class="settings-hero">
        <span class="eyebrow">${escapeHtml(ui('settingsHub'))}</span>
        <h2>${escapeHtml(t('settings'))}</h2>
      </div>
      <div class="settings-card-grid">
        ${settingsLayout.map(renderSettingsCard).join('')}
      </div>
    </div>
  `;
}

function renderSettingsDetail(section) {
  return `
    <div class="settings-detail">
      <div class="settings-detail-header" style="--section-accent: ${escapeHtml(section.accent || '#43c7b2')}">
        <button type="button" data-settings-back>${escapeHtml(ui('backToGroups'))}</button>
        <div>
          <span class="eyebrow">${escapeHtml(ui('settingsHub'))}</span>
          <h2>${escapeHtml(sectionTitle(section))}</h2>
          <p>${escapeHtml(sectionSummary(section))}</p>
        </div>
      </div>
      <section class="panel settings-panel settings-panel-detail">
        <div class="settings-field-grid">
          ${section.items.map(renderField).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderSettingsView() {
  if (!state.settingsGroup) return renderSettingsCards();

  const section = settingsLayout.find((entry, index) => sectionId(entry, index) === state.settingsGroup);
  if (!section) {
    state.settingsGroup = null;
    return renderSettingsCards();
  }

  return renderSettingsDetail(section);
}

function commandCategories() {
  return ['all', ...new Set(state.commands.map((command) => command.category).filter(Boolean))];
}

function filteredCommands() {
  const term = state.search.trim().toLowerCase();
  return state.commands.filter((command) => {
    const categoryOk = state.commandCategory === 'all' || command.category === state.commandCategory;
    const searchText = `${command.name} ${command.description || ''} ${command.category || ''}`.toLowerCase();
    return categoryOk && (!term || searchText.includes(term));
  });
}

function renderCommandsView() {
  const categories = commandCategories();

  return `
    <section class="panel command-panel">
      <div class="command-toolbar">
        <input class="search" data-search type="search" placeholder="${escapeHtml(t('search'))}" value="${escapeHtml(state.search)}" autocomplete="off">
        <select data-category>
          ${categories.map((category) => `
            <option value="${escapeHtml(category)}" ${state.commandCategory === category ? 'selected' : ''}>
              ${category === 'all' ? escapeHtml(t('all')) : escapeHtml(category)}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="command-results" data-command-results>
        ${renderCommandResults()}
      </div>
    </section>
  `;
}

function renderCommandResults() {
  const filtered = filteredCommands();
  const pageCount = Math.max(1, Math.ceil(filtered.length / COMMAND_PAGE_SIZE));
  state.commandPage = Math.min(Math.max(1, state.commandPage), pageCount);
  const offset = (state.commandPage - 1) * COMMAND_PAGE_SIZE;
  const pageItems = filtered.slice(offset, offset + COMMAND_PAGE_SIZE);

  return `
    <div class="command-list" data-command-list>
      ${pageItems.length ? pageItems.map(renderCommandCard).join('') : `
        <div class="empty-state">${escapeHtml(t('noCommands'))}</div>
      `}
    </div>

    <div class="pager">
      <button type="button" data-command-page="prev" ${state.commandPage <= 1 ? 'disabled' : ''}>${escapeHtml(t('prev'))}</button>
      <span>${escapeHtml(t('page'))} ${state.commandPage} / ${pageCount}</span>
      <button type="button" data-command-page="next" ${state.commandPage >= pageCount ? 'disabled' : ''}>${escapeHtml(t('next'))}</button>
    </div>
  `;
}

function renderCommandCard(command) {
  const disabled = command.disabled ? t('disabled') : t('enabled');
  return `
    <article class="command-card">
      <div class="command-main">
        <strong>/${escapeHtml(command.name)}</strong>
        <span>${escapeHtml(command.category || 'guild')} · ${escapeHtml(command.scope || 'guild')}</span>
        ${command.description ? `<p>${escapeHtml(command.description)}</p>` : ''}
      </div>
      <div class="command-state">
        ${command.disabledByCategory ? `<span class="badge">${escapeHtml(t('categoryLocked'))}</span>` : ''}
        ${command.protectedDefault ? `<span class="badge locked">${escapeHtml(t('locked'))}</span>` : ''}
        <button type="button" class="${command.disabled ? '' : 'enabled'}" data-command-toggle="${escapeHtml(command.name)}" ${command.protectedDefault ? 'disabled' : ''}>
          ${escapeHtml(disabled)}
        </button>
      </div>
    </article>
  `;
}

function renderLogsView() {
  return `
    <section class="panel log-panel">
      <div class="log-toolbar">
        <button type="button" data-action="clear-logs">${escapeHtml(t('clearLogs'))}</button>
      </div>
      <div class="log-view" data-log-list>
        ${state.logs.slice(-MAX_LOG_LINES).map(renderLogLineHtml).join('')}
      </div>
    </section>
  `;
}

function renderLogLineHtml(entry) {
  return `
    <div class="log-line ${escapeHtml(entry.stream || 'info')}">
      <time>${escapeHtml(new Date(entry.at).toLocaleTimeString())}</time>
      <span>${escapeHtml(entry.stream || 'info')}</span>
      <code>${escapeHtml(entry.line || '')}</code>
    </div>
  `;
}

function createLogLineNode(entry) {
  const row = document.createElement('div');
  row.className = `log-line ${entry.stream || 'info'}`;

  const time = document.createElement('time');
  time.textContent = new Date(entry.at).toLocaleTimeString();

  const stream = document.createElement('span');
  stream.textContent = entry.stream || 'info';

  const code = document.createElement('code');
  code.textContent = entry.line || '';

  row.append(time, stream, code);
  return row;
}

function renderView() {
  if (!state.shellReady) renderShell();

  const view = document.getElementById('view');
  if (!view) return;

  if (state.tab === 'setup') view.innerHTML = renderSetupView();
  else if (state.tab === 'commands') view.innerHTML = renderCommandsView();
  else if (state.tab === 'logs') view.innerHTML = renderLogsView();
  else view.innerHTML = renderSettingsView();

  view.classList.remove('view-mounted');
  requestAnimationFrame(() => view.classList.add('view-mounted'));
  updateChrome();
  bindRenderedControls();

  if (state.tab === 'logs') scrollLogsToBottom();
}

function renderCommandsOnly() {
  if (state.tab !== 'commands') return;
  const results = document.querySelector('[data-command-results]');
  if (!results) {
    renderView();
    return;
  }

  results.innerHTML = renderCommandResults();
  updateChrome();
  bindRenderedControls();
}

function rerenderShellAndView() {
  renderShell();
  renderView();
}

function scrollLogsToBottom() {
  const list = document.querySelector('[data-log-list]');
  if (list) list.scrollTop = list.scrollHeight;
}

function openHelp(key) {
  const item = settingsLayout.flatMap((section) => section.items).find((entry) => entry.key === key);
  const label = item ? settingLabel(item) : key;
  const title = document.querySelector('[data-help-title]');
  const body = document.querySelector('[data-help-body]');
  const overlay = document.querySelector('[data-help-overlay]');

  if (!title || !body || !overlay) return;
  title.textContent = label;
  body.textContent = helpFor(key);
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function closeHelp() {
  const overlay = document.querySelector('[data-help-overlay]');
  if (!overlay) return;
  overlay.classList.remove('open');
  window.setTimeout(() => {
    overlay.hidden = true;
  }, 160);
}

function withTimeout(promise, label, timeoutMs = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    })
  ]);
}

function coreCall(method, args = [], timeoutMs = 15000) {
  const fn = window.coreBot?.[method];
  if (typeof fn !== 'function') {
    throw new Error(`Desktop bridge method is unavailable: ${method}`);
  }
  return withTimeout(fn(...args), method, timeoutMs);
}

function setFieldValue(key, value) {
  setEnvValue(key, value);
  const field = document.querySelector(`[data-env="${CSS.escape(key)}"]`);
  if (field) field.value = value;
}

function openWarnRuleModal(index = null) {
  const rules = parseWarnRules(envValue('WARN_PUNISHMENTS'));
  const rule = Number.isInteger(index) ? rules[index] : null;
  const modal = document.querySelector('[data-warn-modal]');
  if (!modal) return;

  state.warnRuleIndex = Number.isInteger(index) ? index : null;
  const count = modal.querySelector('[data-warn-count]');
  const action = modal.querySelector('[data-warn-action]');
  const amount = modal.querySelector('[data-warn-duration-amount]');
  const unit = modal.querySelector('[data-warn-duration-unit]');
  const title = modal.querySelector('h2');

  if (title) title.textContent = rule ? ui('edit') : ui('addRule');
  if (count) count.value = String(rule?.count || 2);
  if (action) action.value = rule?.action || 'mute';
  if (amount) amount.value = String(rule?.amount || 30);
  if (unit) unit.value = rule?.unit || 'm';

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('open'));
}

function closeWarnRuleModal() {
  const modal = document.querySelector('[data-warn-modal]');
  if (!modal) return;
  modal.classList.remove('open');
  window.setTimeout(() => {
    modal.hidden = true;
  }, 140);
}

async function saveWarnRuleFromModal(event) {
  event?.preventDefault?.();
  const modal = document.querySelector('[data-warn-modal]');
  if (!modal) return;

  const count = Math.max(1, Number(modal.querySelector('[data-warn-count]')?.value) || 1);
  const action = modal.querySelector('[data-warn-action]')?.value || 'mute';
  const amount = Math.max(1, Number(modal.querySelector('[data-warn-duration-amount]')?.value) || 1);
  const unit = modal.querySelector('[data-warn-duration-unit]')?.value || 'm';
  const rules = parseWarnRules(envValue('WARN_PUNISHMENTS'));
  const nextRule = { count, action, amount, unit };

  if (Number.isInteger(state.warnRuleIndex)) {
    rules[state.warnRuleIndex] = nextRule;
    const duplicateIndex = rules.findIndex((rule, index) => index !== state.warnRuleIndex && rule.count === count);
    if (duplicateIndex >= 0) rules.splice(duplicateIndex, 1);
  } else {
    const existingIndex = rules.findIndex((rule) => rule.count === count);
    if (existingIndex >= 0) rules[existingIndex] = nextRule;
    else rules.push(nextRule);
  }

  setEnvValue('WARN_PUNISHMENTS', serializeWarnRules(rules));
  closeWarnRuleModal();
  renderView();

  try {
    await saveConfig();
  } catch (error) {
    pushLocalLog(error.stack || error.message || String(error), 'stderr');
  }
}

async function deleteWarnRule(index) {
  const rules = parseWarnRules(envValue('WARN_PUNISHMENTS'));
  rules.splice(index, 1);
  setEnvValue('WARN_PUNISHMENTS', serializeWarnRules(rules));
  renderView();

  try {
    await saveConfig();
  } catch (error) {
    pushLocalLog(error.stack || error.message || String(error), 'stderr');
  }
}

async function loadJsonForField(key) {
  const content = await coreCall('chooseJson', [], 60000);
  if (!content) return;
  JSON.parse(content);
  setFieldValue(key, JSON.stringify(JSON.parse(content), null, 2));
  await saveConfig();
  pushLocalLog(t('copied'), 'system');
}

async function setJsonExample(key, type) {
  setFieldValue(key, welcomeJsonExample(type));
  await saveConfig();
  pushLocalLog(t('copied'), 'system');
}

function showSaveConfirmation() {
  const button = document.querySelector('[data-save-button]');
  if (!button) return;

  button.textContent = ui('savedNotice');
  button.classList.add('confirmed');
  window.clearTimeout(showSaveConfirmation.timer);
  showSaveConfirmation.timer = window.setTimeout(() => {
    const currentButton = document.querySelector('[data-save-button]');
    if (!currentButton) return;
    currentButton.textContent = t('save');
    currentButton.classList.remove('confirmed');
  }, 1600);
}

async function saveConfig() {
  const result = await coreCall('saveConfig', [state.env]);
  state.env = result.env;
  state.commands = result.commands;
  updateChrome();
  return result;
}

async function runAction(action) {
  state.busy = true;
  updateChrome();

  try {
    if (['start', 'restart', 'stop', 'emergency'].includes(action)) {
      pushLocalLog(`${action} requested from UI`, 'system');
    }
    if (action === 'join-server') {
      await coreCall('openExternal', [SUPPORT_SERVER_URL], 10000);
      return;
    }
    if (action === 'export-hosting') {
      await saveConfig();
      const result = await coreCall('exportHosting', [state.env], 120000);
      if (result?.path) {
        pushLocalLog(`${ui('hostingExported')}: ${result.path} (${result.files || 0} files)`, 'system');
      }
      return;
    }
    if (action === 'setup-done') {
      await saveConfig();
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      state.tab = 'settings';
      renderView();
      return;
    }
    if (action.startsWith('load-json:')) {
      await loadJsonForField(action.slice('load-json:'.length));
      renderView();
      return;
    }
    if (action.startsWith('sample-json:')) {
      const [, key, type] = action.split(':');
      await setJsonExample(key, type || 'dm');
      renderView();
      return;
    }
    if (['start', 'restart'].includes(action)) await saveConfig();
    if (action === 'start') state.status = await coreCall('startBot');
    if (action === 'restart') state.status = await coreCall('restartBot', [], 30000);
    if (action === 'stop') state.status = await coreCall('stopBot');
    if (action === 'emergency') state.status = await coreCall('emergencyStop');
    if (action === 'save') {
      await saveConfig();
      pushLocalLog(t('copied'), 'system');
      showSaveConfirmation();
    }
    if (action === 'clear-logs') {
      state.logs = [];
      const list = document.querySelector('[data-log-list]');
      if (list) list.textContent = '';
    }
    if (action === 'choose-db') {
      const selected = await coreCall('chooseDatabase', [], 60000);
      if (selected) {
        setEnvValue('SQLITE_DB_PATH', selected);
        const input = document.querySelector('[data-env="SQLITE_DB_PATH"]');
        if (input) input.value = selected;
        await saveConfig();
        pushLocalLog(t('copied'), 'system');
      }
    }
  } catch (error) {
    pushLocalLog(error.stack || error.message || String(error), 'stderr');
  } finally {
    state.busy = false;
    updateChrome();
  }
}

async function toggleCommand(name) {
  const command = state.commands.find((entry) => entry.name === name);
  if (!command || command.protectedDefault) return;

  const disabled = new Set(listFromEnv('DISABLED_COMMANDS'));
  if (disabled.has(name)) disabled.delete(name);
  else disabled.add(name);

  setEnvValue('DISABLED_COMMANDS', [...disabled].sort().join(','));
  state.commands = state.commands.map((entry) => (
    entry.name === name
      ? { ...entry, disabledByCommand: disabled.has(name), disabled: disabled.has(name) || entry.disabledByCategory }
      : entry
  ));
  renderCommandsOnly();

  try {
    await saveConfig();
    renderCommandsOnly();
  } catch (error) {
    pushLocalLog(error.stack || error.message || String(error), 'stderr');
  }
}

function pushLocalLog(line, stream = 'system') {
  const entry = { at: new Date().toISOString(), stream, line };
  handleLogLine(entry);
}

function handleLogLine(entry) {
  state.logs.push(entry);
  if (state.logs.length > MAX_LOG_LINES) state.logs = state.logs.slice(-MAX_LOG_LINES);

  if (state.tab === 'logs') {
    const list = document.querySelector('[data-log-list]');
    if (list) {
      list.appendChild(createLogLineNode(entry));
      while (list.children.length > MAX_LOG_LINES) list.firstElementChild?.remove();
      scrollLogsToBottom();
    }
  }
  updateChrome();
}

function closestTarget(event, selector) {
  return event.target instanceof Element ? event.target.closest(selector) : null;
}

function targetMatches(event, selector) {
  return event.target instanceof Element && event.target.matches(selector);
}

function bindOnce(element, eventName, key, handler) {
  const marker = `bound${key}`;
  if (element.dataset[marker]) return;
  element.dataset[marker] = '1';
  element.addEventListener(eventName, handler);
}

function bindRenderedControls() {
  document.querySelectorAll('[data-help]').forEach((button) => {
    bindOnce(button, 'click', 'Help', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openHelp(button.dataset.help);
    });
  });

  document.querySelectorAll('[data-close-help]').forEach((button) => {
    bindOnce(button, 'click', 'CloseHelp', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeHelp();
    });
  });

  document.querySelectorAll('[data-tab]').forEach((button) => {
    bindOnce(button, 'click', 'Tab', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (state.tab === button.dataset.tab) return;
      state.tab = button.dataset.tab;
      state.commandPage = 1;
      updateChrome();
      renderView();
    });
  });

  document.querySelectorAll('[data-settings-group]').forEach((button) => {
    bindOnce(button, 'click', 'SettingsGroup', (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.settingsGroup = button.dataset.settingsGroup;
      renderView();
    });
  });

  document.querySelectorAll('[data-settings-back]').forEach((button) => {
    bindOnce(button, 'click', 'SettingsBack', (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.settingsGroup = null;
      renderView();
    });
  });

  document.querySelectorAll('[data-lang]').forEach((button) => {
    bindOnce(button, 'click', 'Lang', (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.lang = normalizeLang(button.dataset.lang);
      localStorage.setItem('core-ui-lang', state.lang);
      rerenderShellAndView();
    });
  });

  document.querySelectorAll('[data-theme]').forEach((button) => {
    bindOnce(button, 'click', 'Theme', (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.theme = button.dataset.theme;
      localStorage.setItem('core-ui-theme', state.theme);
      updateChrome();
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    bindOnce(button, 'click', 'Action', (event) => {
      event.preventDefault();
      event.stopPropagation();
      runAction(button.dataset.action);
    });
  });

  document.querySelectorAll('[data-command-toggle]').forEach((button) => {
    bindOnce(button, 'click', 'CommandToggle', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleCommand(button.dataset.commandToggle);
    });
  });

  document.querySelectorAll('[data-command-page]').forEach((button) => {
    bindOnce(button, 'click', 'CommandPage', (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.commandPage += button.dataset.commandPage === 'next' ? 1 : -1;
      renderCommandsOnly();
    });
  });

  document.querySelectorAll('[data-setup-page]').forEach((button) => {
    bindOnce(button, 'click', 'SetupPage', (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.setupStep += button.dataset.setupPage === 'next' ? 1 : -1;
      renderView();
    });
  });

  document.querySelectorAll('[data-warn-add]').forEach((button) => {
    bindOnce(button, 'click', 'WarnAdd', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openWarnRuleModal();
    });
  });

  document.querySelectorAll('[data-warn-edit]').forEach((button) => {
    bindOnce(button, 'click', 'WarnEdit', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openWarnRuleModal(Number(button.dataset.warnEdit));
    });
  });

  document.querySelectorAll('[data-warn-delete]').forEach((button) => {
    bindOnce(button, 'click', 'WarnDelete', (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteWarnRule(Number(button.dataset.warnDelete));
    });
  });

  document.querySelectorAll('[data-warn-cancel]').forEach((button) => {
    bindOnce(button, 'click', 'WarnCancel', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeWarnRuleModal();
    });
  });

  document.querySelectorAll('[data-warn-form]').forEach((form) => {
    bindOnce(form, 'submit', 'WarnForm', (event) => {
      event.stopPropagation();
      saveWarnRuleFromModal(event);
    });
  });

  document.querySelectorAll('[data-env]').forEach((input) => {
    bindOnce(input, 'input', 'EnvInput', (event) => {
      event.stopPropagation();
      setEnvValue(input.dataset.env, input.type === 'checkbox' ? String(input.checked) : input.value);
    });

    bindOnce(input, 'change', 'EnvChange', (event) => {
      event.stopPropagation();
      setEnvValue(input.dataset.env, input.type === 'checkbox' ? String(input.checked) : input.value);
      if (input.type === 'checkbox') {
        saveConfig().catch((error) => {
          pushLocalLog(error.stack || error.message || String(error), 'stderr');
        });
      }
    });
  });

  document.querySelectorAll('[data-search]').forEach((input) => {
    bindOnce(input, 'input', 'Search', (event) => {
      event.stopPropagation();
      state.search = input.value;
      state.commandPage = 1;
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(renderCommandsOnly, 90);
    });
  });

  document.querySelectorAll('[data-category]').forEach((select) => {
    bindOnce(select, 'change', 'Category', (event) => {
      event.stopPropagation();
      state.commandCategory = select.value;
      state.commandPage = 1;
      renderCommandsOnly();
    });
  });
}

function handleClick(event) {
  if (!appNode.contains(event.target) && !targetMatches(event, '[data-help-overlay]')) return;

  const help = closestTarget(event, '[data-help]');
  if (help) {
    openHelp(help.dataset.help);
    return;
  }

  if (closestTarget(event, '[data-close-help]') || targetMatches(event, '[data-help-overlay]')) {
    closeHelp();
    return;
  }

  const tab = closestTarget(event, '[data-tab]');
  if (tab) {
    if (state.tab !== tab.dataset.tab) {
      state.tab = tab.dataset.tab;
      state.commandPage = 1;
      updateChrome();
      renderView();
    }
    return;
  }

  const settingsGroup = closestTarget(event, '[data-settings-group]');
  if (settingsGroup) {
    state.settingsGroup = settingsGroup.dataset.settingsGroup;
    renderView();
    return;
  }

  if (closestTarget(event, '[data-settings-back]')) {
    state.settingsGroup = null;
    renderView();
    return;
  }

  const lang = closestTarget(event, '[data-lang]');
  if (lang) {
    state.lang = normalizeLang(lang.dataset.lang);
    localStorage.setItem('core-ui-lang', state.lang);
    rerenderShellAndView();
    return;
  }

  const theme = closestTarget(event, '[data-theme]');
  if (theme) {
    state.theme = theme.dataset.theme;
    localStorage.setItem('core-ui-theme', state.theme);
    updateChrome();
    return;
  }

  const action = closestTarget(event, '[data-action]');
  if (action) {
    runAction(action.dataset.action);
    return;
  }

  const commandToggle = closestTarget(event, '[data-command-toggle]');
  if (commandToggle) {
    toggleCommand(commandToggle.dataset.commandToggle);
    return;
  }

  const commandPage = closestTarget(event, '[data-command-page]');
  if (commandPage) {
    const direction = commandPage.dataset.commandPage;
    state.commandPage += direction === 'next' ? 1 : -1;
    renderCommandsOnly();
    return;
  }

  const setupPage = closestTarget(event, '[data-setup-page]');
  if (setupPage) {
    state.setupStep += setupPage.dataset.setupPage === 'next' ? 1 : -1;
    renderView();
    return;
  }

  const warnAdd = closestTarget(event, '[data-warn-add]');
  if (warnAdd) {
    openWarnRuleModal();
    return;
  }

  const warnEdit = closestTarget(event, '[data-warn-edit]');
  if (warnEdit) {
    openWarnRuleModal(Number(warnEdit.dataset.warnEdit));
    return;
  }

  const warnDelete = closestTarget(event, '[data-warn-delete]');
  if (warnDelete) {
    deleteWarnRule(Number(warnDelete.dataset.warnDelete));
    return;
  }

  if (closestTarget(event, '[data-warn-cancel]') || targetMatches(event, '[data-warn-modal]')) {
    closeWarnRuleModal();
  }
}

function handleInput(event) {
  const input = closestTarget(event, '[data-env]');
  if (input) {
    setEnvValue(input.dataset.env, input.type === 'checkbox' ? String(input.checked) : input.value);
    return;
  }

  const search = closestTarget(event, '[data-search]');
  if (search) {
    state.search = search.value;
    state.commandPage = 1;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(renderCommandsOnly, 90);
  }
}

function handleChange(event) {
  const input = closestTarget(event, '[data-env]');
  if (input) {
    setEnvValue(input.dataset.env, input.type === 'checkbox' ? String(input.checked) : input.value);
    if (input.type === 'checkbox') {
      saveConfig().catch((error) => {
        pushLocalLog(error.stack || error.message || String(error), 'stderr');
      });
    }
    return;
  }

  const category = closestTarget(event, '[data-category]');
  if (category) {
    state.commandCategory = category.value;
    state.commandPage = 1;
    renderCommandsOnly();
  }
}

async function init() {
  bindUiEvents();
  renderShell();
  renderView();

  try {
    const payload = await coreCall('loadConfig', [], 8000);
    state.env = payload.env || {};
    state.commands = payload.commands || [];
    state.logs = (payload.logs || []).slice(-MAX_LOG_LINES);
    state.status = payload.status || state.status;

    renderShell();
    renderView();
    bindCoreSubscriptions();
  } catch (error) {
    pushLocalLog(error.stack || error.message || String(error), 'stderr');
    state.tab = 'logs';
    renderView();
  }
}

function bindUiEvents() {
  if (listenersBound) return;
  listenersBound = true;
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
}

function bindCoreSubscriptions() {
  if (coreSubscriptionsBound || !window.coreBot) return;
  coreSubscriptionsBound = true;

  window.coreBot.onLogLine?.(handleLogLine);
  window.coreBot.onStatus?.((status) => {
    state.status = status;
    updateChrome();
  });
}

init().catch((error) => {
  pushLocalLog(error.stack || error.message || String(error), 'stderr');
  state.tab = 'logs';
  renderView();
});
