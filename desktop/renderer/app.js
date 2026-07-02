const MAX_LOG_LINES = 300;
const COMMAND_PAGE_SIZE = 10;
const ONBOARDING_STORAGE_KEY = 'core-onboarding-complete';
const ONBOARDING_ASSET_BASE = './assets/onboarding';
const SUPPORT_SERVER_URL = 'https://discord.gg/YF8krDPCZh';
const MESSAGE_BRAND_FOOTER = '-# Created by [Self-hosted bot by Core](https://github.com/Novogrey/Self-hosted-bot-by-Core)';
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
const MESSAGE_TAGS = [
  ...WELCOME_TAGS,
  '{{moderator}}',
  '{{moderatorid}}',
  '{{moderatormention}}',
  '{{reason}}',
  '{{duration}}',
  '{{expires}}',
  '{{warnid}}',
  '{{count}}',
  '{{action}}',
  '{{results}}',
  '{{subcommand}}',
  '{{target}}',
  '{{targetid}}',
  '{{targets}}',
  '{{text}}',
  '{{amount}}',
  '{{time}}',
  '{{user_ids}}',
  '{{userids_or_mentions}}',
  '{{warnids}}',
  '{{level}}',
  '{{experience}}',
  '{{command}}',
  '{{channel}}',
  '{{channelid}}',
  '{{violations}}',
  '{{deleted}}',
  '{{preview}}',
  '{{timestamp}}',
  '{{method}}',
  '{{original}}',
  '{{punishment}}'
];
const TEMPLATE_TAG_DETAILS = [
  ['{{username}}', 'Имя пользователя Discord без упоминания.'],
  ['{{displayname}}', 'Отображаемое имя участника на сервере или глобальное имя пользователя.'],
  ['{{globalname}}', 'Глобальное имя Discord, если оно доступно.'],
  ['{{userid}}', 'Discord ID пользователя.'],
  ['{{mention}}', 'Упоминание пользователя в формате <@user_id>.'],
  ['{{tag}}', 'Discord tag или имя пользователя.'],
  ['{{avatar}}', 'Ссылка на аватар пользователя.'],
  ['{{server}}', 'Название сервера.'],
  ['{{serverid}}', 'Discord ID сервера.'],
  ['{{membercount}}', 'Количество участников сервера, если Discord отдал это значение.'],
  ['{{joindate}}', 'Дата вступления участника на сервер в формате Discord timestamp.'],
  ['{{joinedrelative}}', 'Относительное время вступления на сервер, например “5 дней назад”.'],
  ['{{createdat}}', 'Дата создания аккаунта в формате Discord timestamp.'],
  ['{{createdrelative}}', 'Относительное время с момента создания аккаунта.'],
  ['{{guildicon}}', 'Ссылка на иконку сервера.'],
  ['{{guildbanner}}', 'Ссылка на баннер сервера.'],
  ['{{moderator}}', 'Имя модератора, выполнившего действие.'],
  ['{{moderatorid}}', 'Discord ID модератора.'],
  ['{{moderatormention}}', 'Упоминание модератора.'],
  ['{{reason}}', 'Причина модерационного действия или срабатывания автомодерации.'],
  ['{{duration}}', 'Длительность наказания.'],
  ['{{expires}}', 'Дата или время окончания наказания.'],
  ['{{warnid}}', 'ID одного предупреждения.'],
  ['{{count}}', 'Количество предупреждений или обработанных элементов, если команда передаёт это значение.'],
  ['{{action}}', 'Название действия, выбранного командой или правилом наказаний.'],
  ['{{results}}', 'Готовый текст результата команды.'],
  ['{{subcommand}}', 'Использованный подкомандный режим.'],
  ['{{target}}', 'Основной пользователь или объект действия.'],
  ['{{targetid}}', 'Discord ID основного пользователя или объекта действия.'],
  ['{{targets}}', 'Список пользователей или объектов действия.'],
  ['{{text}}', 'Текст, переданный в команду.'],
  ['{{amount}}', 'Числовое значение из команды, например количество сообщений.'],
  ['{{time}}', 'Время или интервал, переданный в команду.'],
  ['{{user_ids}}', 'Список пользовательских ID из команды.'],
  ['{{userids_or_mentions}}', 'Список ID или упоминаний пользователей из команды.'],
  ['{{warnids}}', 'Список ID предупреждений.'],
  ['{{level}}', 'Уровень из команд системы уровней.'],
  ['{{experience}}', 'Количество XP из команд системы уровней.'],
  ['{{command}}', 'Название slash-команды без слеша.'],
  ['{{channel}}', 'Упоминание канала, где выполнялась команда или произошло событие.'],
  ['{{channelid}}', 'Discord ID канала.'],
  ['{{violations}}', 'Список нарушений, найденных автомодерацией.'],
  ['{{deleted}}', 'Статус удаления сообщения после срабатывания автомодерации.'],
  ['{{preview}}', 'Короткий фрагмент исходного сообщения.'],
  ['{{timestamp}}', 'Текущее время в формате Discord timestamp.'],
  ['{{method}}', 'Метод ответа interaction: reply, editReply, followUp и похожие варианты.'],
  ['{{original}}', 'Текст стандартного сообщения, которое заменяет кастомный шаблон.'],
  ['{{punishment}}', 'Наказание, применённое автомодерацией или правилами варнов.'],
  ['{{option.<name>}}', 'Значение slash-опции по её имени. Например {{option.reason}} или {{option.user}}.']
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
    setupScamTrap: 'Настроить защитный канал',
    scamTrapConfigured: 'Защитный канал настроен',
    savedNotice: 'Сохранено!',
    settingsHub: 'Группы настроек',
    openGroup: 'Открыть',
    fieldsCount: 'Параметров',
    backToGroups: 'К группам',
    messageEditor: 'Редактор сообщений',
    messageSlot: 'Шаблон сообщения',
    messageEnabled: 'Использовать кастомный шаблон',
    messageContent: 'Обычный текст',
    messageEmbeds: 'Embeds',
    messageComponents: 'Components V2 и link buttons',
    messagePreview: 'Превью',
    restoreDefault: 'Сбросить к дефолту',
    addEmbed: 'Добавить embed',
    addField: 'Добавить поле',
    addTextBlock: 'Текстовый блок',
    addSeparator: 'Разделитель',
    addLinkButton: 'Link button',
    addContainer: 'Container',
    addSection: 'Section',
    addThumbnail: 'Thumbnail',
    addMediaGallery: 'Gallery',
    addGalleryItem: 'Media Gallery Item',
    addFile: 'File',
    importMessageJson: 'Импорт message JSON',
    allowedMentions: 'Разрешить упоминания',
    noMessageSlot: 'Выберите сообщение слева',
    actualPayloadNote: 'Ниже редактируется реальное сообщение, которое бот отправит при включённом шаблоне.',
    componentSafetyNote: 'Разрешены display Components V2 и link buttons. Custom buttons, selects и text inputs заблокированы, чтобы не ломать команды.'
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
    setupScamTrap: 'Configure trap channel',
    scamTrapConfigured: 'Scam trap channel configured',
    savedNotice: 'Saved!',
    settingsHub: 'Settings groups',
    openGroup: 'Open',
    fieldsCount: 'Settings',
    backToGroups: 'Back to groups',
    messageEditor: 'Message editor',
    messageSlot: 'Message template',
    messageEnabled: 'Use custom template',
    messageContent: 'Plain content',
    messageEmbeds: 'Embeds',
    messageComponents: 'Components V2 and link buttons',
    messagePreview: 'Preview',
    restoreDefault: 'Reset to default',
    addEmbed: 'Add embed',
    addField: 'Add field',
    addTextBlock: 'Text block',
    addSeparator: 'Separator',
    addLinkButton: 'Link button',
    addContainer: 'Container',
    addSection: 'Section',
    addThumbnail: 'Thumbnail',
    addMediaGallery: 'Gallery',
    addGalleryItem: 'Media Gallery Item',
    addFile: 'File',
    importMessageJson: 'Import message JSON',
    allowedMentions: 'Allowed mentions',
    noMessageSlot: 'Select a message on the left',
    actualPayloadNote: 'You are editing the real message the bot will send when this template is enabled.',
    componentSafetyNote: 'Display Components V2 and link buttons are allowed. Custom buttons, selects and text inputs are blocked to protect command logic.'
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
    setupScamTrap: 'Schutzkanal einrichten',
    scamTrapConfigured: 'Scam-Trap-Kanal eingerichtet',
    savedNotice: 'Gespeichert!',
    settingsHub: 'Einstellungsgruppen',
    openGroup: 'Offnen',
    fieldsCount: 'Einstellungen',
    backToGroups: 'Zuruck zu Gruppen',
    messageEditor: 'Nachrichten-Editor',
    messageSlot: 'Nachrichtenvorlage',
    messageEnabled: 'Eigene Vorlage verwenden',
    messageContent: 'Textinhalt',
    messageEmbeds: 'Embeds',
    messageComponents: 'Components V2 und Link-Buttons',
    messagePreview: 'Vorschau',
    restoreDefault: 'Standard wiederherstellen',
    addEmbed: 'Embed hinzufugen',
    addField: 'Feld hinzufugen',
    addTextBlock: 'Textblock',
    addSeparator: 'Trenner',
    addLinkButton: 'Link button',
    addContainer: 'Container',
    addSection: 'Section',
    addThumbnail: 'Thumbnail',
    addMediaGallery: 'Gallery',
    addGalleryItem: 'Media Gallery Item',
    addFile: 'File',
    importMessageJson: 'Message JSON importieren',
    allowedMentions: 'Erlaubte Erwahnungen',
    noMessageSlot: 'Links eine Nachricht auswahlen',
    actualPayloadNote: 'Hier bearbeiten Sie die echte Nachricht, die der Bot sendet, wenn die Vorlage aktiv ist.',
    componentSafetyNote: 'Display Components V2 und Link-Buttons sind erlaubt. Custom Buttons, Selects und Text Inputs sind zum Schutz der Befehle blockiert.'
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
    setupScamTrap: 'Налаштувати захисний канал',
    scamTrapConfigured: 'Захисний канал налаштовано',
    savedNotice: 'Збережено!',
    settingsHub: 'Групи налаштувань',
    openGroup: 'Відкрити',
    fieldsCount: 'Параметрів',
    backToGroups: 'До груп',
    messageEditor: 'Редактор повідомлень',
    messageSlot: 'Шаблон повідомлення',
    messageEnabled: 'Використовувати власний шаблон',
    messageContent: 'Звичайний текст',
    messageEmbeds: 'Embeds',
    messageComponents: 'Components V2 і link buttons',
    messagePreview: 'Превʼю',
    restoreDefault: 'Скинути до дефолту',
    addEmbed: 'Додати embed',
    addField: 'Додати поле',
    addTextBlock: 'Текстовий блок',
    addSeparator: 'Розділювач',
    addLinkButton: 'Link button',
    addContainer: 'Container',
    addSection: 'Section',
    addThumbnail: 'Thumbnail',
    addMediaGallery: 'Gallery',
    addGalleryItem: 'Media Gallery Item',
    addFile: 'File',
    importMessageJson: 'Імпорт message JSON',
    allowedMentions: 'Дозволити згадки',
    noMessageSlot: 'Виберіть повідомлення зліва',
    actualPayloadNote: 'Нижче редагується реальне повідомлення, яке бот надішле, якщо шаблон увімкнено.',
    componentSafetyNote: 'Дозволені display Components V2 і link buttons. Custom buttons, selects і text inputs заблоковані, щоб не ламати команди.'
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
    guides: 'Гайды',
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
    guides: 'Guides',
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
    guides: 'Anleitungen',
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
    guides: 'Гайди',
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
      { key: 'ADMIN_ROLES_LEVEL_0', labelMap: { ru: 'Уровень доступа 0', en: 'Access level 0', de: 'Zugriffsstufe 0', ua: 'Рівень доступу 0' } },
      { key: 'ADMIN_ROLES_LEVEL_1', labelMap: { ru: 'Уровень доступа 1', en: 'Access level 1', de: 'Zugriffsstufe 1', ua: 'Рівень доступу 1' } },
      { key: 'ADMIN_ROLES_LEVEL_2', labelMap: { ru: 'Уровень доступа 2', en: 'Access level 2', de: 'Zugriffsstufe 2', ua: 'Рівень доступу 2' } },
      { key: 'ADMIN_ROLES_LEVEL_3', labelMap: { ru: 'Уровень доступа 3', en: 'Access level 3', de: 'Zugriffsstufe 3', ua: 'Рівень доступу 3' } },
      { key: 'ADMIN_ROLES_LEVEL_4', labelMap: { ru: 'Уровень доступа 4', en: 'Access level 4', de: 'Zugriffsstufe 4', ua: 'Рівень доступу 4' } },
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
      { key: 'AUTOMOD_SPAM_TIME_WINDOW_MS', labelMap: { ru: 'Окно спама, мс', en: 'Spam window, ms', de: 'Spam-Fenster, ms', ua: 'Вікно спаму, мс' }, type: 'number', attrs: 'min="5000" step="1000"' },
      { key: 'SCAM_AD_CHANNEL_ID', labelMap: { ru: 'ID защитного scam-канала', en: 'Scam trap channel ID', de: 'Scam-Trap-Kanal-ID', ua: 'ID захисного scam-каналу' } },
      {
        key: 'SCAM_TRAP_SETUP_ACTION',
        type: 'action',
        action: 'setup-scam-trap',
        labelMap: { ru: 'Первичная настройка канала', en: 'Initial channel setup', de: 'Ersteinrichtung des Kanals', ua: 'Первинне налаштування каналу' },
        descriptionMap: {
          ru: 'Сохраняет настройки, делает канал публичным для @everyone, очищает остальные channel overwrites, отправляет предупреждение и пытается поднять канал наверх.',
          en: 'Saves settings, makes the channel public for @everyone, clears other channel overwrites, sends the warning and tries to move the channel to the top.',
          de: 'Speichert die Einstellungen, macht den Kanal fur @everyone sichtbar, entfernt andere Channel-Overrides, sendet den Hinweis und versucht den Kanal nach oben zu verschieben.',
          ua: 'Зберігає налаштування, відкриває канал для @everyone, очищає інші channel overwrites, надсилає попередження і пробує підняти канал угору.'
        }
      }
    ]
  },
  {
    id: 'messages',
    titleMap: { ru: 'Редактор сообщений', en: 'Message editor', de: 'Nachrichten-Editor', ua: 'Редактор повідомлень' },
    summaryMap: { ru: 'Визуальная настройка приветствий, ответов команд, embeds, Components V2 и link buttons.', en: 'Visual setup for welcomes, command responses, embeds, Components V2 and link buttons.', de: 'Visuelle Einrichtung fur Welcomes, Befehlsantworten, Embeds, Components V2 und Link-Buttons.', ua: 'Візуальне налаштування привітань, відповідей команд, embeds, Components V2 і link buttons.' },
    accent: '#f28b82',
    items: [
      { key: 'CUSTOM_MESSAGES_JSON', labelMap: { ru: 'Все сообщения бота', en: 'All bot messages', de: 'Alle Bot-Nachrichten', ua: 'Усі повідомлення бота' }, type: 'messageEditor' }
    ]
  },
  {
    id: 'welcomes',
    titleMap: { ru: 'Приветствия', en: 'Welcomes', de: 'Begrussungen', ua: 'Привітання' },
    summaryMap: { ru: 'Включение ЛС и серверного приветствия, канал задаётся здесь, дизайн - в редакторе сообщений.', en: 'Enable DM and server welcomes here; message design is edited in Message editor.', de: 'DM- und Server-Willkommen aktivieren; Design im Nachrichten-Editor.', ua: 'Увімкнення ЛП і серверного привітання; дизайн у редакторі повідомлень.' },
    accent: '#66d18f',
    items: [
      { key: 'WELCOME_DM_ENABLED', labelMap: { ru: 'ЛС-приветствие включено', en: 'DM welcome enabled', de: 'DM-Willkommen aktiv', ua: 'ЛП-привітання увімкнено' }, type: 'checkbox' },
      { key: 'WELCOME_SERVER_ENABLED', labelMap: { ru: 'Приветствие на сервере включено', en: 'Server welcome enabled', de: 'Server-Willkommen aktiv', ua: 'Привітання на сервері увімкнено' }, type: 'checkbox' },
      { key: 'WELCOME_SERVER_CHANNEL_ID', labelMap: { ru: 'Канал приветствия', en: 'Welcome channel', de: 'Willkommenskanal', ua: 'Канал привітання' } }
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
  CUSTOM_MESSAGES_JSON: 'Visual editor storage for all customizable bot messages. It supports content, embeds, Components V2 display blocks and link buttons. Runtime blocks custom_id buttons, select menus and text inputs so command actions cannot be broken.',
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
  SQL_BACKUP_ENABLED: 'Включает резервное копирование SQLite. Для работы нужен канал SQL backup и право бота отправлять файлы.',
  SQL_BACKUP_DEBOUNCE_MS: 'Минимальная пауза между backup-событиями после изменений базы. Значение стоит увеличить, если сервер часто пишет в SQLite.',
  DISABLED_COMMANDS: 'Список команд через запятую, которые нужно скрыть или отключить. То же самое можно переключать во вкладке команд.',
  DISABLED_COMMAND_CATEGORIES: 'Список категорий через запятую. Категория global принудительно отключена, потому что публичные команды удалены.',
  SCAM_AD_CHANNEL_ID: 'ID специального канала-ловушки для scam-рекламы. Любое сообщение пользователя в этом канале приводит к перманентному бану с удалением сообщений за 7 дней. Обычная автомодерация этот канал пропускает.',
  SCAM_TRAP_SETUP_ACTION: 'Кнопка выполняет первичную настройку указанного scam trap канала через Discord API: сохраняет текущие настройки, оставляет один overwrite для @everyone с правами View Channel, Send Messages и Read Message History, отправляет редактируемое предупреждение из Message editor и пытается переместить канал наверх.'
};

const guideSections = [
  {
    eyebrow: 'Start',
    title: 'Порядок первичной настройки',
    summary: 'Рекомендуемый порядок действий для запуска self-hosted бота без пропуска обязательных Discord-настроек.',
    steps: [
      'Создать приложение в Discord Developer Portal и открыть раздел Bot.',
      'Скопировать bot token и вставить его только в поле DISCORD_TOKEN. Токен нельзя публиковать, отправлять в чат или показывать на скриншотах.',
      'Скопировать Application ID из General Information и вставить его в CLIENT_ID.',
      'Включить Developer Mode в Discord, скопировать ID сервера и вставить его в GUILD_ID.',
      'В разделе Bot включить Privileged Gateway Intents: Server Members Intent и Message Content Intent. Presence Intent включается только если серверу реально нужны presence-события.',
      'Добавить бота на сервер по ссылке приглашения с правом Administrator или выдать вручную права для модерации, сообщений, каналов и ролей.',
      'Заполнить каналы логов, роли доступа, mute role, приветствия, автомодерацию и scam-trap канал.',
      'Нажать Save, затем Start. После успешного запуска в логах появится статус процесса и ссылка приглашения.'
    ]
  },
  {
    eyebrow: 'Discord IDs',
    title: 'Как получить ID сервера, канала, роли и пользователя',
    summary: 'Все поля с ID принимают только числовой Discord ID без скобок, ссылок и лишнего текста.',
    steps: [
      'Открыть Discord -> User Settings -> Advanced -> включить Developer Mode.',
      'ID сервера: нажать правой кнопкой по иконке сервера -> Copy Server ID.',
      'ID канала: нажать правой кнопкой по нужному текстовому каналу -> Copy Channel ID.',
      'ID роли: открыть Server Settings -> Roles -> нажать правой кнопкой по роли -> Copy Role ID.',
      'ID пользователя: нажать правой кнопкой по пользователю -> Copy User ID.',
      'Если поле принимает несколько ID, вводить их через запятую: 123456789012345678,987654321098765432.'
    ]
  },
  {
    eyebrow: 'Developer Portal',
    title: 'Токен бота, ID бота и Intents',
    summary: 'Эти значения берутся только из Discord Developer Portal и нужны для авторизации, команд и событий.',
    settings: [
      ['DISCORD_TOKEN', 'Раздел Bot -> Reset Token или Copy Token. Вставляется в единственное поле токена. Это секретный ключ бота.'],
      ['CLIENT_ID', 'Раздел General Information -> Application ID. Используется для регистрации slash-команд и ссылки приглашения.'],
      ['GUILD_ID', 'ID сервера, где бот должен работать. Берётся через Developer Mode в Discord.'],
      ['DEV', 'ID владельца или технического администратора. Эти пользователи получают доступ к служебным командам управления ботом.'],
      ['Server Members Intent', 'Включить в Bot -> Privileged Gateway Intents. Нужен для welcome-событий, ролей, участников и части модерации.'],
      ['Message Content Intent', 'Включить в Bot -> Privileged Gateway Intents. Нужен автомодерации для проверки текста, ссылок, плохих слов и спама.'],
      ['Presence Intent', 'Не обязателен для базовой работы. Включать только если сервер использует функциональность, зависящую от presence-событий.']
    ]
  },
  {
    eyebrow: 'Main',
    title: 'Основные настройки приложения',
    summary: 'Эти параметры отвечают за подключение бота, целевой сервер и локальную базу.',
    settings: [
      ['DISCORD_TOKEN', 'Токен бота из Developer Portal. Без него Start не сможет запустить Discord-клиент.'],
      ['CLIENT_ID', 'Application ID бота. Нужен для slash-команд и формирования ссылки приглашения.'],
      ['GUILD_ID', 'ID основного сервера. Команды и большинство функций рассчитаны на этот сервер.'],
      ['DEV', 'ID владельцев/разработчиков через запятую. Используется для служебных команд вроде перезагрузки и обновления команд.'],
      ['SQLITE_DB_PATH', 'Путь к SQLite базе. По умолчанию подходит стандартное значение. Менять стоит только если нужно хранить базу в другом месте.']
    ]
  },
  {
    eyebrow: 'Presence',
    title: 'Статус и активность бота',
    summary: 'Эти настройки меняют то, как бот отображается в списке участников Discord.',
    settings: [
      ['BOT_STATUS', 'Статус присутствия: online, idle, dnd или invisible. Выбирается через меню.'],
      ['BOT_ACTIVITY_TYPE', 'Тип активности: Watching, Playing, Listening, Competing или Streaming.'],
      ['BOT_ACTIVITY_TEXT', 'Текст активности. Например: /help, moderation, server security. Если оставить пустым, используется стандартный текст.']
    ]
  },
  {
    eyebrow: 'Channels',
    title: 'Каналы логов, уведомлений и резервных копий',
    summary: 'Для каждого поля нужен ID текстового канала. Боту нужны права View Channel, Send Messages, Read Message History и Attach Files для backup.',
    settings: [
      ['ADMIN_LOG_CHANNEL_ID', 'Канал важных административных событий и модерационных логов. Рекомендуется закрытый канал для персонала.'],
      ['LOG_CHANNEL_ID', 'Основной канал логов. Можно использовать отдельно от admin logs, если сервер разделяет технические и модерационные события.'],
      ['NOTIFICATION', 'Канал служебных уведомлений, предпросмотров и автоматических системных сообщений.'],
      ['SQL_BACKUP_CHANNEL_ID', 'Канал, куда бот отправляет резервные копии SQLite. Должен быть приватным.'],
      ['AUTOMOD_LOG_CHANNEL_ID', 'Канал логов автомодерации. Если пустой, бот использует ADMIN_LOG_CHANNEL_ID.'],
      ['WELCOME_SERVER_CHANNEL_ID', 'Канал публичного приветствия новых участников. Используется только если server welcome включён.'],
      ['SCAM_AD_CHANNEL_ID', 'Специальный scam-trap канал. Любое сообщение пользователя в этом канале приводит к перманентному бану.']
    ]
  },
  {
    eyebrow: 'Access',
    title: 'AdminRole уровни доступа',
    summary: 'AdminRole не выдаёт Discord Administrator. Это список ролей, которым бот разрешает команды определённого уровня.',
    settings: [
      ['ADMIN_ROLES_LEVEL_0', 'Служебный уровень владельца: управление ботом, обновление команд и технические действия.'],
      ['ADMIN_ROLES_LEVEL_1', 'Сильная модерация: постоянные строгие действия, включая наиболее опасные команды.'],
      ['ADMIN_ROLES_LEVEL_2', 'Средняя модерация: remwarn и временные ban-действия.'],
      ['ADMIN_ROLES_LEVEL_3', 'Обычная модерация: mute, unmute и slowmode.'],
      ['ADMIN_ROLES_LEVEL_4', 'Базовая модерация: warn, warns и clear.'],
      ['Формат', 'В каждое поле вводятся Role ID через запятую: RoleID,RoleID. Роль должна существовать на целевом сервере.']
    ]
  },
  {
    eyebrow: 'Moderation',
    title: 'Модерация, mute role и правила варнов',
    summary: 'Эти настройки влияют на ручные команды модерации и автоматические наказания за накопленные предупреждения.',
    settings: [
      ['MUTE_ROLE', 'ID роли мута. Бот выдаёт её при mute и снимает при unmute или истечении наказания. Роль должна быть ниже роли бота.'],
      ['WARN_PUNISHMENTS', 'Правила наказаний за количество варнов. В интерфейсе добавляются через модальное окно: количество варнов, действие и срок.'],
      ['MODERATION_SWEEP_INTERVAL_MS', 'Как часто бот проверяет истёкшие муты/баны. 60000 означает один раз в минуту. Слишком маленькое значение повышает нагрузку.']
    ]
  },
  {
    eyebrow: 'Automod',
    title: 'Автомодерация',
    summary: 'Автомодерация проверяет сообщения на массовые пинги, плохие слова, ссылки, Discord-инвайты и спам.',
    settings: [
      ['AUTOMOD_ENABLED', 'Главный переключатель автомодерации. Если выключен, остальные automod-проверки не выполняются.'],
      ['AUTOMOD_DELETE_MESSAGE', 'Удаляет нарушающее сообщение. Требуется право Manage Messages.'],
      ['AUTOMOD_WARN_USER', 'Записывает нарушение как варн и может запускать правила WARN_PUNISHMENTS.'],
      ['AUTOMOD_IGNORE_ADMINISTRATORS', 'Пропускает участников с Discord Administrator. Владелец сервера также пропускается.'],
      ['AUTOMOD_BYPASS_ROLE_IDS', 'Роли-исключения через запятую. Участники с этими ролями не проверяются автомодерацией.'],
      ['AUTOMOD_PING_ENABLED', 'Включает защиту от массовых упоминаний.'],
      ['AUTOMOD_PING_MAX_MENTIONS', 'Максимальное число упоминаний в одном сообщении до срабатывания.'],
      ['AUTOMOD_BAD_WORDS_ENABLED', 'Включает фильтр запрещённых слов.'],
      ['AUTOMOD_BAD_WORDS', 'Слова через запятую, точку с запятой или новую строку. Регистр не важен.'],
      ['AUTOMOD_LINKS_ENABLED', 'Включает проверку ссылок.'],
      ['AUTOMOD_LINKS_BLOCK_INVITES', 'Блокирует discord.gg и discord.com/invite ссылки.'],
      ['AUTOMOD_LINKS_BLOCK_ALL', 'Блокирует все ссылки, кроме разрешённых доменов.'],
      ['AUTOMOD_LINKS_ALLOWED_DOMAINS', 'Разрешённые домены без https. Например: example.com, docs.example.com.'],
      ['AUTOMOD_SPAM_ENABLED', 'Включает антиспам по частоте и повторяющемуся тексту.'],
      ['AUTOMOD_SPAM_MESSAGE_LIMIT', 'Сколько сообщений можно отправить в заданное окно времени.'],
      ['AUTOMOD_SPAM_TIME_WINDOW_MS', 'Окно времени в миллисекундах. 60000 означает 60 секунд.']
    ]
  },
  {
    eyebrow: 'Scam trap',
    title: 'Защитный scam-trap канал',
    summary: 'Scam-trap канал нужен для автоматического выявления взломанных аккаунтов и ботов, отправляющих мошенническую рекламу.',
    steps: [
      'Создать отдельный текстовый канал на сервере.',
      'Скопировать Channel ID и вставить его в SCAM_AD_CHANNEL_ID.',
      'Открыть карточку Automoderation и нажать кнопку первичной настройки канала.',
      'Приложение сохранит настройки, откроет канал для @everyone, очистит остальные channel overwrites, отправит предупреждение и попробует поднять канал наверх.',
      'После запуска бота любое пользовательское сообщение в этом канале приведёт к permanent ban и удалению сообщений пользователя за последние 7 дней.',
      'Обычная автомодерация этот канал пропускает, чтобы не создавать двойные наказания.'
    ]
  },
  {
    eyebrow: 'Messages',
    title: 'Редактор сообщений',
    summary: 'Редактор позволяет менять реальные сообщения бота без ручного редактирования JSON.',
    settings: [
      ['CUSTOM_MESSAGES_JSON', 'Внутреннее хранилище всех шаблонов редактора. Обычно поле не редактируется вручную: изменения делаются через визуальный редактор.'],
      ['Шаблоны приветствий', 'Отдельно настраиваются ЛС-приветствие и приветствие на сервере.'],
      ['Шаблоны модерации', 'Можно редактировать ответы команд и личные уведомления о ban, kick, mute, warn и наказаниях по варнам.'],
      ['Components V2', 'Поддерживаются Container, Section, Text Display, Thumbnail, Media Gallery, File, Separator и link buttons. Functional custom_id buttons не редактируются, чтобы не ломать команды.'],
      ['Теги', 'Все доступные теги перечислены в разделе “Теги шаблонов сообщений”. Их можно использовать в content, embeds и текстовых Components V2.'],
      ['Сброс', 'Кнопка reset возвращает выбранный шаблон к стандартному виду.']
    ]
  },
  {
    eyebrow: 'Welcomes',
    title: 'Приветствия',
    summary: 'Приветствия делятся на личное сообщение и публичное сообщение на сервере.',
    settings: [
      ['WELCOME_DM_ENABLED', 'Включает личное приветствие новому участнику. Если выключено, ЛС не отправляется.'],
      ['WELCOME_SERVER_ENABLED', 'Включает приветствие в канале сервера.'],
      ['WELCOME_SERVER_CHANNEL_ID', 'ID канала, куда отправляется публичное приветствие.'],
      ['Теги приветствий', `Приветствия используют пользовательские и серверные теги из общего справочника: ${WELCOME_TAGS.join(', ')}.`]
    ]
  },
  {
    eyebrow: 'Tags',
    title: 'Теги шаблонов сообщений',
    summary: 'Теги подставляются перед отправкой сообщения. Их можно использовать в тексте, embeds, Components V2 и ссылках на изображения. Если конкретный сценарий не передаёт значение тега, тег останется без замены или будет пустым.',
    settings: TEMPLATE_TAG_DETAILS
  },
  {
    eyebrow: 'Commands',
    title: 'Команды и отключение функций',
    summary: 'Во вкладке команд можно включать и выключать доступные команды без ручного изменения конфигурации.',
    settings: [
      ['DISABLED_COMMANDS', 'Список конкретных команд через запятую. Переключатели во вкладке Commands обновляют это поле автоматически.'],
      ['DISABLED_COMMAND_CATEGORIES', 'Список категорий команд через запятую. Категория global заблокирована по умолчанию, потому что публичные команды удалены.'],
      ['Commands tab', 'Поиск, фильтр категорий и кнопки Enabled/Disabled позволяют быстро управлять видимостью и регистрацией команд.']
    ]
  },
  {
    eyebrow: 'Data',
    title: 'Уровни, voice tracking и SQL backup',
    summary: 'Эти функции используют SQLite и не требуют MongoDB.',
    settings: [
      ['LEVELS_ENABLED', 'Включает начисление XP и систему уровней.'],
      ['VOICE_TRACKING_ENABLED', 'Включает учёт активности в голосовых каналах.'],
      ['LEVEL_ROLE_MAP', 'Карта ролей за уровни, если сервер использует автоматическую выдачу ролей за прогресс.'],
      ['SQL_BACKUP_ENABLED', 'Включает отправку резервных копий SQLite в указанный канал.'],
      ['SQL_BACKUP_DEBOUNCE_MS', 'Минимальная пауза между backup-событиями после изменений базы.']
    ]
  },
  {
    eyebrow: 'Runtime',
    title: 'Запуск, остановка, логи и экспорт',
    summary: 'Кнопки управления работают с локальным процессом бота и сохраняют настройки перед запуском.',
    settings: [
      ['Save', 'Сохраняет текущие настройки. После успешного сохранения кнопка показывает “Сохранено!”.'],
      ['Start', 'Сохраняет настройки и запускает бота. Логи запуска отображаются во вкладке Logs.'],
      ['Restart', 'Останавливает текущий процесс и запускает его снова.'],
      ['Stop', 'Корректно завершает процесс бота.'],
      ['Emergency stop', 'Принудительно завершает процесс, если обычная остановка не помогает.'],
      ['Logs', 'Показывает системные сообщения приложения, stdout и stderr процесса бота.'],
      ['Hosting export', 'Создаёт ZIP для хостинга с текущими настройками. Архив может содержать токен, поэтому его нельзя публиковать.'],
      ['Updater', 'Updater используется для установленной версии приложения. Portable-сборку обновляют заменой portable-папки.']
    ]
  },
  {
    eyebrow: 'Security',
    title: 'Безопасность перед публикацией',
    summary: 'Перед передачей файлов другим пользователям необходимо проверить, что секреты не попали в публичные материалы.',
    steps: [
      'Нельзя публиковать Discord token, .env, hosting ZIP и скриншоты с токеном.',
      'Если токен был показан посторонним, его нужно сразу reset в Discord Developer Portal.',
      'Hosting ZIP предназначен для загрузки на хостинг и может содержать действующий токен.',
      'Каналы логов и backup должны быть закрыты от обычных участников.',
      'Роль бота должна быть выше ролей, которыми он управляет, иначе mute/unmute и часть модерации не сработают.'
    ]
  }
];

const state = {
  tab: localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true' ? 'settings' : 'setup',
  lang: normalizeLang(localStorage.getItem('core-ui-lang') || 'ru'),
  theme: localStorage.getItem('core-ui-theme') || 'dark',
  env: {},
  commands: [],
  messageCatalog: [],
  logs: [],
  status: { status: 'stopped', pid: null },
  version: '',
  search: '',
  commandCategory: 'all',
  commandPage: 1,
  setupStep: 0,
  settingsGroup: null,
  messageSlot: null,
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

function guideSettingName(name) {
  const item = settingsLayout.flatMap((section) => section.items).find((entry) => entry.key === name);
  return item ? settingLabel(item) : name;
}

function formatGuideText(value) {
  const knownKeys = settingsLayout
    .flatMap((section) => section.items)
    .map((item) => item.key)
    .sort((left, right) => right.length - left.length);
  const pattern = new RegExp(`\\b(${knownKeys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g');
  return String(value ?? '').replace(pattern, (key) => `«${guideSettingName(key)}»`);
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
    ['guides', t('guides')],
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

    <div class="version-badge">v${escapeHtml(state.version || 'dev')}</div>

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

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function parseCustomMessageConfig() {
  const raw = String(envValue('CUSTOM_MESSAGES_JSON') || '').trim();
  if (!raw) return { version: 1, slots: {} };

  try {
    const parsed = JSON.parse(raw);
    return {
      version: Number(parsed.version || 1),
      slots: parsed.slots && typeof parsed.slots === 'object' ? parsed.slots : parsed
    };
  } catch {
    return { version: 1, slots: {} };
  }
}

function saveCustomMessageConfig(config) {
  const slots = Object.fromEntries(
    Object.entries(config.slots || {}).filter(([, value]) => value && typeof value === 'object')
  );
  setEnvValue('CUSTOM_MESSAGES_JSON', JSON.stringify({ version: 1, slots }, null, 2));
}

function messageCatalog() {
  return state.messageCatalog?.length ? state.messageCatalog : [
    {
      key: 'welcome.dm',
      category: 'Welcomes',
      title: { ru: 'ЛС-приветствие', en: 'DM welcome' },
      description: { ru: 'Сообщение новому участнику в личные сообщения.', en: 'Message sent to a new member in direct messages.' },
      defaultPayload: { content: 'Привет, {{mention}}! Добро пожаловать на **{{server}}**.' }
    },
    {
      key: 'command.default.response',
      category: 'Commands',
      title: { ru: 'Fallback неизвестной команды', en: 'Unknown command fallback' },
      description: { ru: 'Запасной шаблон для команды без отдельного слота.', en: 'Fallback template for a command without its own slot.' },
      defaultPayload: {
        content: 'Команда **/{{command}}** выполнена.\nПользователь: {{mention}}\nКанал: {{channel}}\nВремя: {{timestamp}}'
      }
    }
  ];
}

function currentMessageSlot() {
  const catalog = messageCatalog();
  if (!state.messageSlot || !catalog.some((slot) => slot.key === state.messageSlot)) {
    state.messageSlot = catalog[0]?.key || null;
  }
  return catalog.find((slot) => slot.key === state.messageSlot) || catalog[0] || null;
}

function defaultMessageTemplate(slot) {
  return {
    enabled: false,
    payload: clone(slot?.defaultPayload || { content: '' })
  };
}

function getMessageTemplate(key) {
  const slot = messageCatalog().find((entry) => entry.key === key);
  const config = parseCustomMessageConfig();
  const template = config.slots?.[key];
  if (!template || typeof template !== 'object') return defaultMessageTemplate(slot);
  return {
    enabled: template.enabled !== false,
    payload: normalizeEditorPayload(template.payload || slot?.defaultPayload || { content: '' })
  };
}

function setMessageTemplate(key, nextTemplate) {
  const config = parseCustomMessageConfig();
  config.slots[key] = {
    enabled: Boolean(nextTemplate.enabled),
    payload: normalizeEditorPayload(nextTemplate.payload)
  };
  saveCustomMessageConfig(config);
}

function resetMessageTemplate(key) {
  const config = parseCustomMessageConfig();
  delete config.slots[key];
  saveCustomMessageConfig(config);
  setEnvValue('CUSTOM_MESSAGES_RESET_AT', new Date().toISOString());
}

function normalizeEditorPayload(payload = {}) {
  const next = clone(payload) || {};
  if (!Array.isArray(next.embeds)) next.embeds = [];
  if (!Array.isArray(next.components)) next.components = [];
  if (!next.allowedMentions || typeof next.allowedMentions !== 'object') {
    next.allowedMentions = { parse: [], repliedUser: false };
  }
  if (!Array.isArray(next.allowedMentions.parse)) next.allowedMentions.parse = [];
  return next;
}

function updateCurrentMessage(mutator, rerender = true) {
  const slot = currentMessageSlot();
  if (!slot) return;
  const template = getMessageTemplate(slot.key);
  const next = clone(template);
  mutator(next);
  setMessageTemplate(slot.key, next);
  if (rerender) renderView();
}

function numberToHex(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '#43c7b2';
  return `#${Math.max(0, Math.min(0xffffff, number)).toString(16).padStart(6, '0')}`;
}

function hexToNumber(value) {
  const normalized = String(value || '').replace('#', '');
  const number = Number.parseInt(normalized, 16);
  return Number.isFinite(number) ? number : 4433842;
}

function markdownPreview(value) {
  return escapeHtml(value || '')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/\n/g, '<br>');
}

function renderMessageSlotList(slots) {
  const groups = new Map();
  for (const slot of slots) {
    const category = slot.category || 'Messages';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(slot);
  }

  return [...groups.entries()].map(([category, entries]) => `
    <div class="message-slot-group">
      <span>${escapeHtml(category)}</span>
      ${entries.map((slot) => `
        <button type="button" data-message-slot="${escapeHtml(slot.key)}" class="${slot.key === state.messageSlot ? 'active' : ''}">
          <strong>${escapeHtml(localText(slot.title, slot.key))}</strong>
          <small>${escapeHtml(slot.key)}</small>
        </button>
      `).join('')}
    </div>
  `).join('');
}

function renderAllowedMentions(payload) {
  const parse = new Set(payload.allowedMentions?.parse || []);
  const options = [
    ['users', 'Users'],
    ['roles', 'Roles'],
    ['everyone', 'Everyone']
  ];
  return `
    <div class="mention-toggles">
      ${options.map(([value, label]) => `
        <label>
          <input type="checkbox" data-mention-parse="${value}" ${parse.has(value) ? 'checked' : ''}>
          <span>${escapeHtml(label)}</span>
        </label>
      `).join('')}
    </div>
  `;
}

function renderEmbedEditor(embed, index) {
  const fields = Array.isArray(embed.fields) ? embed.fields : [];
  return `
    <article class="embed-editor" data-embed-index="${index}">
      <div class="embed-editor-head">
        <strong>Embed ${index + 1}</strong>
        <button type="button" data-embed-delete="${index}">${escapeHtml(ui('remove'))}</button>
      </div>
      <div class="editor-grid">
        <label>Title<input data-embed-prop="title" data-embed-index="${index}" value="${escapeHtml(embed.title || '')}"></label>
        <label>URL<input data-embed-prop="url" data-embed-index="${index}" value="${escapeHtml(embed.url || '')}"></label>
        <label>Author name<input data-embed-prop="author.name" data-embed-index="${index}" value="${escapeHtml(embed.author?.name || '')}"></label>
        <label>Author URL<input data-embed-prop="author.url" data-embed-index="${index}" value="${escapeHtml(embed.author?.url || '')}"></label>
        <label>Author icon URL<input data-embed-prop="author.icon_url" data-embed-index="${index}" value="${escapeHtml(embed.author?.icon_url || '')}"></label>
        <label>Timestamp<input data-embed-prop="timestamp" data-embed-index="${index}" value="${escapeHtml(embed.timestamp || '')}" placeholder="2026-06-30T12:00:00.000Z"></label>
        <label class="span-2">Description<textarea data-embed-prop="description" data-embed-index="${index}" rows="4">${escapeHtml(embed.description || '')}</textarea></label>
        <label>Color<input type="color" data-embed-prop="color" data-embed-index="${index}" value="${escapeHtml(numberToHex(embed.color))}"></label>
        <label>Thumbnail URL<input data-embed-prop="thumbnail.url" data-embed-index="${index}" value="${escapeHtml(embed.thumbnail?.url || '')}"></label>
        <label>Image URL<input data-embed-prop="image.url" data-embed-index="${index}" value="${escapeHtml(embed.image?.url || '')}"></label>
        <label>Footer<input data-embed-prop="footer.text" data-embed-index="${index}" value="${escapeHtml(embed.footer?.text || '')}"></label>
        <label>Footer icon URL<input data-embed-prop="footer.icon_url" data-embed-index="${index}" value="${escapeHtml(embed.footer?.icon_url || '')}"></label>
      </div>
      <div class="embed-fields">
        <div class="mini-toolbar">
          <strong>Fields</strong>
          <button type="button" data-embed-add-field="${index}">${escapeHtml(ui('addField'))}</button>
        </div>
        ${fields.map((field, fieldIndex) => `
          <div class="embed-field-row">
            <input data-embed-field-prop="name" data-embed-index="${index}" data-field-index="${fieldIndex}" value="${escapeHtml(field.name || '')}" placeholder="Name">
            <textarea rows="2" data-embed-field-prop="value" data-embed-index="${index}" data-field-index="${fieldIndex}" placeholder="Value">${escapeHtml(field.value || '')}</textarea>
            <label class="inline-check"><input type="checkbox" data-embed-field-prop="inline" data-embed-index="${index}" data-field-index="${fieldIndex}" ${field.inline ? 'checked' : ''}> Inline</label>
            <button type="button" data-embed-delete-field="${index}:${fieldIndex}">${escapeHtml(ui('remove'))}</button>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}

function selectOption(value, current, label) {
  return `<option value="${escapeHtml(value)}" ${String(value) === String(current) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

function renderComponentHead(title, path) {
  return `
    <div class="component-head">
      <strong>${escapeHtml(title)}</strong>
      <button type="button" data-component-delete="${escapeHtml(path)}">${escapeHtml(ui('remove'))}</button>
    </div>
  `;
}

function renderLinkButtonInputs(button, componentPath, buttonIndex, removable = true, prefix = 'component') {
  const propAttr = prefix === 'section' ? 'data-section-button-prop' : 'data-component-button-prop';
  const deleteAttr = prefix === 'section' ? '' : `<button type="button" data-component-button-delete="${escapeHtml(componentPath)}:${buttonIndex}">${escapeHtml(ui('remove'))}</button>`;
  return `
    <div class="link-button-row">
      <input ${propAttr}="label" data-component-path="${escapeHtml(componentPath)}" data-button-index="${buttonIndex}" value="${escapeHtml(button.label || '')}" placeholder="Label">
      <input ${propAttr}="url" data-component-path="${escapeHtml(componentPath)}" data-button-index="${buttonIndex}" value="${escapeHtml(button.url || '')}" placeholder="https://example.com">
      <label class="inline-check"><input type="checkbox" ${propAttr}="disabled" data-component-path="${escapeHtml(componentPath)}" data-button-index="${buttonIndex}" ${button.disabled ? 'checked' : ''}> Disabled</label>
      ${removable ? deleteAttr : ''}
    </div>
  `;
}

function renderSectionAccessoryEditor(component, path) {
  const accessory = component.accessory || {};
  const accessoryType = Number(accessory.type) === 11 ? 'thumbnail' : 'button';
  return `
    <div class="component-subgrid">
      <label>Accessory
        <select data-section-accessory-type data-component-path="${escapeHtml(path)}">
          ${selectOption('button', accessoryType, 'Link button')}
          ${selectOption('thumbnail', accessoryType, 'Thumbnail')}
        </select>
      </label>
      ${accessoryType === 'thumbnail' ? `
        <label>Thumbnail URL<input data-component-prop="accessory.media.url" data-component-path="${escapeHtml(path)}" value="${escapeHtml(accessory.media?.url || '')}" placeholder="https://example.com/image.png"></label>
        <label>Description<input data-component-prop="accessory.description" data-component-path="${escapeHtml(path)}" value="${escapeHtml(accessory.description || '')}"></label>
        <label class="inline-check"><input type="checkbox" data-component-prop="accessory.spoiler" data-component-path="${escapeHtml(path)}" ${accessory.spoiler ? 'checked' : ''}> Spoiler</label>
      ` : ''}
      ${accessoryType === 'button' ? renderLinkButtonInputs(accessory, path, 0, false, 'section') : ''}
    </div>
  `;
}

function renderMediaGalleryItems(component, path) {
  const items = Array.isArray(component.items) ? component.items : [];
  return `
    <div class="gallery-items">
      <div class="mini-toolbar">
        <strong>Media items</strong>
        <button type="button" data-gallery-item-add="${escapeHtml(path)}">${escapeHtml(ui('addGalleryItem'))}</button>
      </div>
      ${items.map((item, itemIndex) => `
        <div class="gallery-item-row">
          <input data-gallery-item-prop="url" data-component-path="${escapeHtml(path)}" data-gallery-index="${itemIndex}" value="${escapeHtml(item.media?.url || '')}" placeholder="Media URL">
          <input data-gallery-item-prop="description" data-component-path="${escapeHtml(path)}" data-gallery-index="${itemIndex}" value="${escapeHtml(item.description || '')}" placeholder="Description">
          <label class="inline-check"><input type="checkbox" data-gallery-item-prop="spoiler" data-component-path="${escapeHtml(path)}" data-gallery-index="${itemIndex}" ${item.spoiler ? 'checked' : ''}> Spoiler</label>
          <button type="button" data-gallery-item-delete="${escapeHtml(path)}:${itemIndex}">${escapeHtml(ui('remove'))}</button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderComponentAddButtons(parentPath = '', includeContainer = true) {
  const parent = escapeHtml(parentPath);
  const containerButton = includeContainer ? `<button type="button" data-component-add="container" data-component-parent="${parent}">${escapeHtml(ui('addContainer'))}</button>` : '';
  return `
    ${containerButton}
    <button type="button" data-component-add="section" data-component-parent="${parent}">${escapeHtml(ui('addSection'))}</button>
    <button type="button" data-component-add="thumbnail" data-component-parent="${parent}">${escapeHtml(ui('addThumbnail'))}</button>
    <button type="button" data-component-add="text" data-component-parent="${parent}">${escapeHtml(ui('addTextBlock'))}</button>
    <button type="button" data-component-add="gallery" data-component-parent="${parent}">${escapeHtml(ui('addMediaGallery'))}</button>
    <button type="button" data-component-add="file" data-component-parent="${parent}">${escapeHtml(ui('addFile'))}</button>
    <button type="button" data-component-add="separator" data-component-parent="${parent}">${escapeHtml(ui('addSeparator'))}</button>
    <button type="button" data-component-add="button" data-component-parent="${parent}">${escapeHtml(ui('addLinkButton'))}</button>
  `;
}

function childPath(parentPath, index) {
  return parentPath ? `${parentPath}.${index}` : String(index);
}

function renderComponentList(components, parentPath = '') {
  return components.map((component, index) => renderComponentEditor(component, childPath(parentPath, index))).join('');
}

function renderContainerChildren(component, path) {
  const children = Array.isArray(component.components) ? component.components : [];
  return `
    <div class="container-builder">
      <div class="mini-toolbar">
        <strong>Container components</strong>
        <div>${renderComponentAddButtons(path, false)}</div>
      </div>
      ${children.length ? `
        <div class="component-nested-list">
          ${renderComponentList(children, path)}
        </div>
      ` : `<div class="empty-state compact">Add Section, Text Display, Media Gallery, File, Separator or Link Button Row</div>`}
    </div>
  `;
}

function renderComponentEditor(component, path) {
  const type = Number(component.type);
  if (type === 10) {
    return `
      <article class="component-row">
        ${renderComponentHead('Text Display', path)}
        <textarea rows="3" data-component-prop="content" data-component-path="${escapeHtml(path)}">${escapeHtml(component.content || '')}</textarea>
      </article>
    `;
  }

  if (type === 14) {
    return `
      <article class="component-row">
        ${renderComponentHead('Separator', path)}
        <div class="component-subgrid">
          <label>Spacing
            <select data-component-prop="spacing" data-component-path="${escapeHtml(path)}">
              ${selectOption(1, component.spacing || 1, 'Small')}
              ${selectOption(2, component.spacing || 1, 'Large')}
            </select>
          </label>
          <label class="inline-check"><input type="checkbox" data-component-prop="divider" data-component-path="${escapeHtml(path)}" ${component.divider !== false ? 'checked' : ''}> Divider line</label>
        </div>
      </article>
    `;
  }

  if (type === 1) {
    const buttons = Array.isArray(component.components) && component.components.length ? component.components : [{ type: 2, style: 5, label: 'Open link', url: '' }];
    return `
      <article class="component-row">
        ${renderComponentHead('Link Button Row', path)}
        <div class="link-button-list">
          ${buttons.map((button, buttonIndex) => renderLinkButtonInputs(button, path, buttonIndex, buttons.length > 1)).join('')}
        </div>
        <button type="button" data-component-button-add="${escapeHtml(path)}">${escapeHtml(ui('addLinkButton'))}</button>
      </article>
    `;
  }

  if (type === 9) {
    return `
      <article class="component-row">
        ${renderComponentHead('Section', path)}
        <textarea rows="3" data-component-prop="components.0.content" data-component-path="${escapeHtml(path)}">${escapeHtml(component.components?.[0]?.content || '')}</textarea>
        ${renderSectionAccessoryEditor(component, path)}
      </article>
    `;
  }

  if (type === 11) {
    return `
      <article class="component-row">
        ${renderComponentHead('Thumbnail', path)}
        <div class="component-subgrid">
          <label>Media URL<input data-component-prop="media.url" data-component-path="${escapeHtml(path)}" value="${escapeHtml(component.media?.url || '')}" placeholder="https://example.com/image.png"></label>
          <label>Description<input data-component-prop="description" data-component-path="${escapeHtml(path)}" value="${escapeHtml(component.description || '')}"></label>
          <label class="inline-check"><input type="checkbox" data-component-prop="spoiler" data-component-path="${escapeHtml(path)}" ${component.spoiler ? 'checked' : ''}> Spoiler</label>
        </div>
      </article>
    `;
  }

  if (type === 12) {
    return `
      <article class="component-row">
        ${renderComponentHead('Media Gallery', path)}
        ${renderMediaGalleryItems(component, path)}
      </article>
    `;
  }

  if (type === 13) {
    return `
      <article class="component-row">
        ${renderComponentHead('File', path)}
        <div class="component-subgrid">
          <label>File URL<input data-component-prop="file.url" data-component-path="${escapeHtml(path)}" value="${escapeHtml(component.file?.url || '')}" placeholder="attachment://file.png"></label>
          <label class="inline-check"><input type="checkbox" data-component-prop="spoiler" data-component-path="${escapeHtml(path)}" ${component.spoiler ? 'checked' : ''}> Spoiler</label>
        </div>
      </article>
    `;
  }

  if (type === 17) {
    return `
      <article class="component-row component-container-editor">
        ${renderComponentHead('Container', path)}
        <div class="component-subgrid">
          <label>Accent<input type="color" data-component-prop="accent_color" data-component-path="${escapeHtml(path)}" value="${escapeHtml(numberToHex(component.accent_color))}"></label>
          <label class="inline-check"><input type="checkbox" data-component-prop="spoiler" data-component-path="${escapeHtml(path)}" ${component.spoiler ? 'checked' : ''}> Spoiler</label>
        </div>
        ${renderContainerChildren(component, path)}
      </article>
    `;
  }

  return `
    <article class="component-row">
      ${renderComponentHead(`Unsupported component ${type}`, path)}
      <p class="editor-note">This block can be imported as JSON, but the visual editor cannot safely edit it.</p>
    </article>
  `;
}

function renderPreviewEmbed(embed) {
  return `
    <div class="preview-embed" style="--embed-color: ${escapeHtml(numberToHex(embed.color))}">
      ${embed.author?.name ? `
        <div class="preview-embed-author">
          ${embed.author.icon_url ? `<img src="${escapeHtml(embed.author.icon_url)}" alt="">` : ''}
          <span>${markdownPreview(embed.author.name)}</span>
        </div>
      ` : ''}
      <div class="preview-embed-body">
        <div>
          ${embed.title ? `<strong>${markdownPreview(embed.title)}</strong>` : ''}
          ${embed.description ? `<p>${markdownPreview(embed.description)}</p>` : ''}
          ${(embed.fields || []).length ? `<div class="preview-fields">${embed.fields.map((field) => `
            <div class="${field.inline ? 'inline' : ''}">
              <b>${escapeHtml(field.name || 'Field')}</b>
              <span>${markdownPreview(field.value || '')}</span>
            </div>
          `).join('')}</div>` : ''}
          ${embed.image?.url ? `<img class="preview-embed-image" src="${escapeHtml(embed.image.url)}" alt="">` : ''}
        </div>
        ${embed.thumbnail?.url ? `<img class="preview-embed-thumb" src="${escapeHtml(embed.thumbnail.url)}" alt="">` : ''}
      </div>
      ${(embed.footer?.text || embed.timestamp) ? `
        <div class="preview-embed-footer">
          ${embed.footer?.icon_url ? `<img src="${escapeHtml(embed.footer.icon_url)}" alt="">` : ''}
          <small>${escapeHtml([embed.footer?.text, embed.timestamp].filter(Boolean).join(' • '))}</small>
        </div>
      ` : ''}
    </div>
  `;
}

function renderPreviewButton(button) {
  return `<span class="${button.disabled ? 'disabled' : ''}">${escapeHtml(button.label || 'Open link')}</span>`;
}

function renderPreviewComponent(component) {
  const type = Number(component.type);
  if (type === 10) return `<div class="preview-text-display">${markdownPreview(component.content || '')}</div>`;
  if (type === 14) {
    return `<div class="preview-separator ${component.divider === false ? 'no-divider' : ''} ${Number(component.spacing) === 2 ? 'large' : ''}"></div>`;
  }
  if (type === 1) {
    return `<div class="preview-buttons">${(component.components || []).map(renderPreviewButton).join('')}</div>`;
  }
  if (type === 9) {
    return `
      <div class="preview-section">
        <div>${(component.components || []).map(renderPreviewComponent).join('')}</div>
        ${component.accessory ? `<div class="preview-accessory">${renderPreviewComponent(component.accessory)}</div>` : ''}
      </div>
    `;
  }
  if (type === 11) {
    return `
      <div class="preview-thumbnail">
        ${component.media?.url ? `<img src="${escapeHtml(component.media.url)}" alt="">` : ''}
        ${component.description ? `<small>${escapeHtml(component.description)}</small>` : ''}
      </div>
    `;
  }
  if (type === 12) {
    return `
      <div class="preview-gallery">
        ${(component.items || []).map((item) => `
          <figure>
            ${item.media?.url ? `<img src="${escapeHtml(item.media.url)}" alt="">` : ''}
            ${item.description ? `<figcaption>${escapeHtml(item.description)}</figcaption>` : ''}
          </figure>
        `).join('')}
      </div>
    `;
  }
  if (type === 13) {
    return `<div class="preview-file">${escapeHtml(component.file?.url || 'attachment://file')}</div>`;
  }
  if (type === 17) {
    return `
      <div class="preview-container" style="--container-color: ${escapeHtml(numberToHex(component.accent_color))}">
        ${(component.components || []).map(renderPreviewComponent).join('')}
      </div>
    `;
  }
  if (type === 2) return `<div class="preview-buttons">${renderPreviewButton(component)}</div>`;
  return '';
}

function renderMessagePreview(payload) {
  const components = Array.isArray(payload.components) ? payload.components : [];
  const embeds = Array.isArray(payload.embeds) ? payload.embeds : [];
  return `
    <div class="discord-preview">
      <div class="preview-author">
        <span class="preview-avatar">C</span>
        <strong>Self-hosted bot by Core</strong>
        <small>BOT</small>
      </div>
      ${payload.content ? `<div class="preview-content">${markdownPreview(payload.content)}</div>` : ''}
      ${embeds.map(renderPreviewEmbed).join('')}
      ${components.length ? `<div class="preview-components">${components.map(renderPreviewComponent).join('')}</div>` : ''}
      <div class="preview-footer">${markdownPreview(MESSAGE_BRAND_FOOTER)}</div>
    </div>
  `;
}

function renderMessageEditor(item) {
  const slots = messageCatalog();
  const slot = currentMessageSlot();
  const template = slot ? getMessageTemplate(slot.key) : null;
  const payload = normalizeEditorPayload(template?.payload || {});

  if (!slot || !template) return `<div class="empty-state">${escapeHtml(ui('noMessageSlot'))}</div>`;

  return `
    <div class="message-editor">
      <aside class="message-slots">
        <div class="field-heading">
          <span>${escapeHtml(ui('messageSlot'))}</span>
          ${helpButton(item.key, ui('messageEditor'))}
        </div>
        ${renderMessageSlotList(slots)}
      </aside>
      <section class="message-workbench">
        <div class="message-workbench-head">
          <div>
            <span class="eyebrow">${escapeHtml(slot.key)}</span>
            <h2>${escapeHtml(localText(slot.title, slot.key))}</h2>
            <p>${escapeHtml(localText(slot.description, ''))}</p>
            <p class="editor-note">${escapeHtml(ui('actualPayloadNote'))}</p>
          </div>
          <div class="message-head-actions">
            <label class="message-enabled">
              <input type="checkbox" data-message-enabled ${template.enabled ? 'checked' : ''}>
              <span>${escapeHtml(ui('messageEnabled'))}</span>
            </label>
            <button type="button" data-message-import>${escapeHtml(ui('importMessageJson'))}</button>
            <button type="button" data-message-reset>${escapeHtml(ui('restoreDefault'))}</button>
          </div>
        </div>

        <div class="message-editor-grid">
          <div class="message-edit-column">
            <section class="editor-block">
              <div class="panel-title"><h2>${escapeHtml(ui('messageContent'))}</h2></div>
              <textarea rows="5" data-message-content placeholder="Text, Markdown and {{tags}}">${escapeHtml(payload.content || '')}</textarea>
              <div class="tag-cloud">
                ${MESSAGE_TAGS.map((tag) => `<code>${escapeHtml(tag)}</code>`).join('')}
              </div>
              <div class="field">
                <div class="field-heading"><span>${escapeHtml(ui('allowedMentions'))}</span></div>
                ${renderAllowedMentions(payload)}
              </div>
            </section>

            <section class="editor-block">
              <div class="mini-toolbar">
                <h2>${escapeHtml(ui('messageEmbeds'))}</h2>
                <button type="button" data-embed-add>${escapeHtml(ui('addEmbed'))}</button>
              </div>
              ${payload.embeds.length ? payload.embeds.map(renderEmbedEditor).join('') : `<div class="empty-state compact">No embeds</div>`}
            </section>

            <section class="editor-block">
              <div class="mini-toolbar">
                <h2>${escapeHtml(ui('messageComponents'))}</h2>
                <div>
                  ${renderComponentAddButtons('', true)}
                </div>
              </div>
              <p class="editor-note">${escapeHtml(ui('componentSafetyNote'))}</p>
              <div class="component-list">
                ${payload.components.length ? renderComponentList(payload.components) : `<div class="empty-state compact">No Components V2 blocks</div>`}
              </div>
            </section>
          </div>

          <aside class="message-preview-column">
            <div class="panel-title"><h2>${escapeHtml(ui('messagePreview'))}</h2></div>
            ${renderMessagePreview(payload)}
          </aside>
        </div>
      </section>
    </div>
  `;
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
        const label = field.label && field.label !== field.key ? field.label : guideSettingName(field.key);
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
      title: { ru: 'Создание Discord-приложения', en: 'Create a Discord app', de: 'Discord-App erstellen', ua: 'Створи Discord-застосунок' },
      bullets: {
        ru: ['Открыть Discord Developer Portal и вкладку Applications.', 'Выбрать New Application в правом верхнем углу.', 'Это отдельный self-host бот для выбранного сервера.'],
        en: ['Open Discord Developer Portal and Applications.', 'Click New Application in the top-right corner.', 'This creates a separate self-host bot for your server.']
      }
    },
    {
      image: 'step-02-create-app.png',
      title: { ru: 'Имя и создание приложения', en: 'Name and create the app', de: 'App benennen', ua: 'Назви і створи app' },
      bullets: {
        ru: ['Ввести имя бота.', 'Отметить принятие условий Discord.', 'Выбрать Create.'],
        en: ['Enter the bot name.', 'Accept Discord terms.', 'Click Create.']
      }
    },
    {
      image: 'step-03-application-id.png',
      title: { ru: 'ID бота', en: 'Copy bot ID', de: 'Bot-ID kopieren', ua: 'Скопіюй ID бота' },
      fields: [{ key: 'CLIENT_ID', label: 'CLIENT_ID' }],
      bullets: {
        ru: ['В General Information скопировать Application ID.', 'Вставить его в поле ID бота / CLIENT_ID.', 'Этот ID нужен для регистрации slash-команд и ссылки приглашения.'],
        en: ['Copy Application ID in General Information.', 'Paste it into Bot ID / CLIENT_ID.', 'It is used for slash commands and invite URL.']
      }
    },
    {
      image: 'step-04-token.png',
      title: { ru: 'Токен бота', en: 'Get the token here', de: 'Token hier holen', ua: 'Отримай токен тут' },
      fields: [{ key: 'DISCORD_TOKEN', label: 'DISCORD_TOKEN', type: 'password' }],
      bullets: {
        ru: ['Открыть вкладку Bot.', 'Выбрать Reset Token и скопировать токен один раз.', 'В Core токен вводится только в одно поле: Токен бота / DISCORD_TOKEN. Токен нельзя отправлять другим людям или публиковать.'],
        en: ['Open the Bot tab.', 'Click Reset Token and copy it once.', 'Paste it only into Bot token / DISCORD_TOKEN. Never share the token.']
      }
    },
    {
      image: 'step-05-intents.png',
      title: { ru: 'Необходимые Intents', en: 'Enable required intents', de: 'Intents aktivieren', ua: 'Увімкни потрібні Intents' },
      bullets: {
        ru: ['В разделе Bot включаются Presence Intent, Server Members Intent и Message Content Intent.', 'Server Members нужен для приветствий новых участников.', 'Message Content нужен функциям модерации, которые читают сообщения.'],
        en: ['Enable Presence Intent, Server Members Intent, and Message Content Intent.', 'Server Members is needed for welcome events.', 'Message Content is needed for moderation features that read messages.']
      }
    },
    {
      title: { ru: 'Режим разработчика Discord', en: 'Enable Discord Developer Mode', de: 'Entwicklermodus aktivieren', ua: 'Увімкни режим розробника Discord' },
      fields: [
        { key: 'GUILD_ID', label: 'GUILD_ID' },
        { key: 'ADMIN_LOG_CHANNEL_ID', label: 'ADMIN_LOG_CHANNEL_ID' },
        { key: 'LOG_CHANNEL_ID', label: 'LOG_CHANNEL_ID' },
        { key: 'NOTIFICATION', label: 'NOTIFICATION' },
        { key: 'SQL_BACKUP_CHANNEL_ID', label: 'SQL_BACKUP_CHANNEL_ID' }
      ],
      bullets: {
        ru: ['Discord -> User Settings -> Advanced -> Developer Mode.', 'После этого ID копируются через правый клик по серверу, каналу, роли или пользователю -> Copy ID.', 'ID сервера вводится в GUILD_ID, ID каналов логов - в соответствующие поля каналов.'],
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
        ru: ['AdminRole не выдаёт Discord-админку. Это список ролей, которым бот разрешает команды конкретного уровня.', 'ID ролей вводятся через запятую: AdminRoleID,AdminRoleID.', 'Уровень 0 - служебные команды владельца. 1 - сильная модерация. 2 - remwarn/временный ban. 3 - mute/unmute/slowmode. 4 - warn/warns/clear.'],
        en: ['AdminRole does not grant Discord administrator. It is a role-ID allowlist for bot command levels.', 'Enter role IDs separated by commas: AdminRoleID,AdminRoleID.', 'Level 0 is owner/service tools. 1 is strong moderation. 2 is remwarn/temp ban. 3 is mute/unmute/slowmode. 4 is warn/warns/clear.']
      }
    },
    {
      title: { ru: 'Приветствия через JSON и теги', en: 'Welcome JSON and tags', de: 'Willkommen-JSON und Tags', ua: 'Привітання через JSON і теги' },
      bullets: {
        ru: ['ЛС-приветствие и серверное приветствие являются отдельными настройками.', 'Поддерживаются обычный message JSON, embeds и Components V2. Для серверного приветствия обязательно нужен канал.', `Доступные теги: ${WELCOME_TAGS.join(', ')}.`],
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

  if (item.type === 'messageEditor') {
    return renderMessageEditor(item);
  }

  if (item.type === 'action') {
    return `
      <div class="field action-field">
        <div class="field-heading">
          <span>${escapeHtml(label)}</span>
          ${helpButton(item.key, label)}
        </div>
        ${item.descriptionMap ? `<p>${escapeHtml(localText(item.descriptionMap, ''))}</p>` : ''}
        <button type="button" class="primary" data-action="${escapeHtml(item.action || '')}">${escapeHtml(ui(item.buttonKey || 'setupScamTrap'))}</button>
      </div>
    `;
  }

  if (item.type === 'checkbox') {
    const checked = String(envValue(item.key)).toLowerCase() === 'true';
    return `
      <div class="toggle-row">
        <div class="field-heading">
          <span>${escapeHtml(label)}</span>
          ${helpButton(item.key, label)}
        </div>
        <label class="switch ${checked ? 'is-on' : ''}" data-switch-control="${escapeHtml(item.key)}">
          <input
            id="${id}"
            data-env="${escapeHtml(item.key)}"
            data-switch-toggle="${escapeHtml(item.key)}"
            type="checkbox"
            role="switch"
            aria-checked="${checked ? 'true' : 'false'}"
            aria-label="${escapeHtml(label)}"
            ${checked ? 'checked' : ''}
          >
          <span class="switch-track"></span>
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

function renderGuideSteps(steps = []) {
  return steps?.length ? `
    <ol class="guide-steps">
      ${steps.map((step) => `<li>${escapeHtml(formatGuideText(step))}</li>`).join('')}
    </ol>
  ` : '';
}

function renderGuideSettings(settings = []) {
  return settings?.length ? `
    <div class="guide-settings">
      ${settings.map(([name, description]) => {
        const label = guideSettingName(name);
        const nameHtml = String(name).startsWith('{{')
          ? `<code>${escapeHtml(label)}</code>`
          : `<strong>${escapeHtml(label)}</strong>`;
        return `
          <div class="guide-setting-row">
            ${nameHtml}
            <p>${escapeHtml(formatGuideText(description))}</p>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';
}

function renderGuideCard(section, index) {
  return `
    <article class="guide-card">
      <div class="guide-card-number">${escapeHtml(String(index + 1).padStart(2, '0'))}</div>
      <div class="guide-card-body">
        <span class="eyebrow">${escapeHtml(section.eyebrow || 'Guide')}</span>
        <h3>${escapeHtml(formatGuideText(section.title))}</h3>
        <p>${escapeHtml(formatGuideText(section.summary || ''))}</p>
        ${renderGuideSteps(section.steps)}
        ${renderGuideSettings(section.settings)}
      </div>
    </article>
  `;
}

function renderGuidesView() {
  return `
    <section class="guide-view">
      <div class="guide-hero">
        <span class="eyebrow">${escapeHtml(t('guides'))}</span>
        <h2>Полный справочник по настройке</h2>
        <p>Пошаговая настройка self-hosted бота: обязательные Discord-значения, права, каналы, автомодерация, шаблоны сообщений и теги.</p>
      </div>
      <div class="guide-grid">
        ${guideSections.map(renderGuideCard).join('')}
      </div>
    </section>
  `;
}

function renderView() {
  if (!state.shellReady) renderShell();

  const view = document.getElementById('view');
  if (!view) return;

  if (state.tab === 'setup') view.innerHTML = renderSetupView();
  else if (state.tab === 'commands') view.innerHTML = renderCommandsView();
  else if (state.tab === 'guides') view.innerHTML = renderGuidesView();
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
  body.textContent = formatGuideText(helpFor(key));
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

function syncSwitchControl(input) {
  if (!input || input.type !== 'checkbox' || !input.dataset.switchToggle) return;
  input.setAttribute('aria-checked', input.checked ? 'true' : 'false');
  input.closest('.switch')?.classList.toggle('is-on', input.checked);
}

function setSwitchChecked(input, checked) {
  if (!input || input.type !== 'checkbox') return;
  input.checked = checked;
  setEnvValue(input.dataset.env, String(checked));
  syncSwitchControl(input);
}

function toggleSwitchControl(input) {
  if (!input || input.disabled) return;
  const previous = input.checked;
  const checked = !previous;
  setSwitchChecked(input, checked);

  saveConfig().catch((error) => {
    setSwitchChecked(input, previous);
    pushLocalLog(error.stack || error.message || String(error), 'stderr');
  });
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

function refreshMessagePreview() {
  const slot = currentMessageSlot();
  const column = document.querySelector('.message-preview-column');
  if (!slot || !column) return;
  const payload = normalizeEditorPayload(getMessageTemplate(slot.key).payload);
  column.innerHTML = `
    <div class="panel-title"><h2>${escapeHtml(ui('messagePreview'))}</h2></div>
    ${renderMessagePreview(payload)}
  `;
}

function setNestedValue(target, pathValue, value) {
  const pathParts = String(pathValue).split('.');
  let cursor = target;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const part = pathParts[index];
    const nextPart = pathParts[index + 1];
    if (!cursor[part] || typeof cursor[part] !== 'object') cursor[part] = /^\d+$/.test(nextPart) ? [] : {};
    cursor = cursor[part];
  }
  const key = pathParts[pathParts.length - 1];
  if (value === '') delete cursor[key];
  else cursor[key] = value;
}

function mutateCurrentPayload(mutator, rerender = false) {
  updateCurrentMessage((template) => {
    template.payload = normalizeEditorPayload(template.payload);
    mutator(template.payload, template);
  }, rerender);
  if (!rerender) refreshMessagePreview();
}

function updateMessageContent(value) {
  mutateCurrentPayload((payload) => {
    if (value) payload.content = value;
    else delete payload.content;
  });
}

function updateMessageEnabled(checked) {
  updateCurrentMessage((template) => {
    template.enabled = checked;
  }, false);
}

function updateMentionParse(value, checked) {
  mutateCurrentPayload((payload) => {
    const set = new Set(payload.allowedMentions?.parse || []);
    if (checked) set.add(value);
    else set.delete(value);
    payload.allowedMentions = {
      ...(payload.allowedMentions || {}),
      parse: [...set],
      repliedUser: false
    };
  });
}

function addEmbed() {
  mutateCurrentPayload((payload) => {
    payload.embeds.push({
      title: 'Title',
      description: 'Description with {{tags}}',
      color: 4433842,
      fields: []
    });
  }, true);
}

function deleteEmbed(index) {
  mutateCurrentPayload((payload) => {
    payload.embeds.splice(index, 1);
  }, true);
}

function updateEmbedProperty(index, property, value) {
  mutateCurrentPayload((payload) => {
    const embed = payload.embeds[index];
    if (!embed) return;
    setNestedValue(embed, property, property === 'color' ? hexToNumber(value) : value);
  });
}

function addEmbedField(index) {
  mutateCurrentPayload((payload) => {
    const embed = payload.embeds[index];
    if (!embed) return;
    if (!Array.isArray(embed.fields)) embed.fields = [];
    embed.fields.push({ name: 'Name', value: 'Value', inline: false });
  }, true);
}

function deleteEmbedField(index, fieldIndex) {
  mutateCurrentPayload((payload) => {
    const fields = payload.embeds[index]?.fields;
    if (!Array.isArray(fields)) return;
    fields.splice(fieldIndex, 1);
  }, true);
}

function updateEmbedField(index, fieldIndex, property, value, checked = false) {
  mutateCurrentPayload((payload) => {
    const field = payload.embeds[index]?.fields?.[fieldIndex];
    if (!field) return;
    field[property] = property === 'inline' ? checked : value;
  });
}

function parseComponentPath(pathValue) {
  if (pathValue === undefined || pathValue === null || pathValue === '') return [];
  return String(pathValue)
    .split('.')
    .map((part) => Number(part))
    .filter((part) => Number.isInteger(part) && part >= 0);
}

function componentAtPath(payload, pathValue, create = false) {
  const parts = parseComponentPath(pathValue);
  if (!parts.length) return null;
  let list = payload.components;
  let component = null;
  for (let index = 0; index < parts.length; index += 1) {
    if (!Array.isArray(list)) return null;
    component = list[parts[index]];
    if (!component) return null;
    if (index < parts.length - 1) {
      if (!Array.isArray(component.components)) {
        if (!create) return null;
        component.components = [];
      }
      list = component.components;
    }
  }
  return component;
}

function componentChildrenAtPath(payload, parentPath = '', create = false) {
  if (!parentPath) {
    if (!Array.isArray(payload.components) && create) payload.components = [];
    return payload.components;
  }

  const parent = componentAtPath(payload, parentPath, create);
  if (!parent) return null;
  if (!Array.isArray(parent.components)) {
    if (!create) return null;
    parent.components = [];
  }
  return parent.components;
}

function componentParentList(payload, pathValue, create = false) {
  const parts = parseComponentPath(pathValue);
  if (!parts.length) return null;
  const parentPath = parts.slice(0, -1).join('.');
  return componentChildrenAtPath(payload, parentPath, create);
}

function createComponent(type) {
  if (type === 'text') return { type: 10, content: 'Text Display with {{tags}}' };
  if (type === 'separator') return { type: 14, divider: true, spacing: 1 };
  if (type === 'button') {
    return {
      type: 1,
      components: [{ type: 2, style: 5, label: 'Open link', url: 'https://github.com/Novogrey/Self-hosted-bot-by-Core' }]
    };
  }
  if (type === 'container') {
    return {
      type: 17,
      accent_color: 4433842,
      components: []
    };
  }
  if (type === 'section') {
    return {
      type: 9,
      components: [{ type: 10, content: 'Section text with {{tags}}' }],
      accessory: { type: 2, style: 5, label: 'Open link', url: 'https://github.com/Novogrey/Self-hosted-bot-by-Core' }
    };
  }
  if (type === 'thumbnail') {
    return {
      type: 9,
      components: [{ type: 10, content: 'Section with thumbnail' }],
      accessory: { type: 11, media: { url: '' }, description: 'Thumbnail' }
    };
  }
  if (type === 'gallery') {
    return {
      type: 12,
      items: [{ media: { url: '' }, description: 'Media item' }]
    };
  }
  if (type === 'file') {
    return {
      type: 13,
      file: { url: '' }
    };
  }
  return null;
}

function addComponent(type, parentPath = '') {
  mutateCurrentPayload((payload) => {
    const list = componentChildrenAtPath(payload, parentPath, true);
    const component = createComponent(type);
    if (!Array.isArray(list) || !component) return;
    list.push(component);
  }, true);
}

function deleteComponent(pathValue) {
  mutateCurrentPayload((payload) => {
    const parts = parseComponentPath(pathValue);
    const list = componentParentList(payload, pathValue);
    if (!Array.isArray(list) || !parts.length) return;
    list.splice(parts[parts.length - 1], 1);
  }, true);
}

function coerceComponentProperty(property, value, checked = false) {
  if (property === 'accent_color') return hexToNumber(value);
  if (property === 'spacing') return Number(value) || 1;
  if (property.endsWith('spoiler') || property === 'divider' || property === 'disabled') return Boolean(checked);
  return value;
}

function updateComponentProperty(pathValue, property, value, checked = false) {
  mutateCurrentPayload((payload) => {
    const component = componentAtPath(payload, pathValue, true);
    if (!component) return;
    setNestedValue(component, property, coerceComponentProperty(property, value, checked));
  });
}

function ensureLinkButton(button = {}) {
  return {
    type: 2,
    style: 5,
    label: button.label || 'Open link',
    url: button.url || 'https://github.com/Novogrey/Self-hosted-bot-by-Core',
    disabled: Boolean(button.disabled)
  };
}

function updateComponentButtonProperty(pathValue, buttonIndex, property, value, checked = false) {
  mutateCurrentPayload((payload) => {
    const row = componentAtPath(payload, pathValue, true);
    if (!row) return;
    if (!Array.isArray(row.components)) row.components = [];
    if (!row.components[buttonIndex]) row.components[buttonIndex] = ensureLinkButton();
    const button = row.components[buttonIndex];
    if (!button) return;
    button.type = 2;
    button.style = 5;
    button[property] = property === 'disabled' ? Boolean(checked) : value;
    delete button.custom_id;
  });
}

function addComponentButton(pathValue) {
  mutateCurrentPayload((payload) => {
    const row = componentAtPath(payload, pathValue, true);
    if (!row) return;
    if (!Array.isArray(row.components)) row.components = [];
    if (row.components.length >= 5) return;
    row.components.push(ensureLinkButton({ label: `Link ${row.components.length + 1}` }));
  }, true);
}

function deleteComponentButton(pathValue, buttonIndex) {
  mutateCurrentPayload((payload) => {
    const row = componentAtPath(payload, pathValue);
    if (!Array.isArray(row?.components)) return;
    row.components.splice(buttonIndex, 1);
    if (!row.components.length) row.components.push(ensureLinkButton());
  }, true);
}

function setSectionAccessoryType(pathValue, accessoryType) {
  mutateCurrentPayload((payload) => {
    const section = componentAtPath(payload, pathValue, true);
    if (!section) return;
    if (accessoryType === 'thumbnail') section.accessory = { type: 11, media: { url: '' }, description: '' };
    if (accessoryType === 'button') section.accessory = ensureLinkButton();
  }, true);
}

function updateSectionButtonProperty(pathValue, property, value, checked = false) {
  mutateCurrentPayload((payload) => {
    const section = componentAtPath(payload, pathValue, true);
    if (!section) return;
    section.accessory = ensureLinkButton(section.accessory);
    section.accessory[property] = property === 'disabled' ? Boolean(checked) : value;
    delete section.accessory.custom_id;
  });
}

function addGalleryItem(pathValue) {
  mutateCurrentPayload((payload) => {
    const gallery = componentAtPath(payload, pathValue, true);
    if (!gallery) return;
    if (!Array.isArray(gallery.items)) gallery.items = [];
    if (gallery.items.length >= 10) return;
    gallery.items.push({ media: { url: '' }, description: `Media ${gallery.items.length + 1}` });
  }, true);
}

function updateGalleryItem(pathValue, itemIndex, property, value, checked = false) {
  mutateCurrentPayload((payload) => {
    const gallery = componentAtPath(payload, pathValue, true);
    if (!gallery) return;
    if (!Array.isArray(gallery.items)) gallery.items = [];
    if (!gallery.items[itemIndex]) gallery.items[itemIndex] = { media: { url: '' } };
    const item = gallery.items[itemIndex];
    if (property === 'url') {
      if (!item.media) item.media = {};
      if (value) item.media.url = value;
      else delete item.media.url;
      return;
    }
    if (property === 'spoiler') item.spoiler = Boolean(checked);
    else if (value) item[property] = value;
    else delete item[property];
  });
}

function deleteGalleryItem(pathValue, itemIndex) {
  mutateCurrentPayload((payload) => {
    const gallery = componentAtPath(payload, pathValue);
    if (!Array.isArray(gallery?.items)) return;
    gallery.items.splice(itemIndex, 1);
  }, true);
}

async function importMessageJson() {
  const content = await coreCall('chooseJson', [], 60000);
  if (!content) return;
  const parsed = JSON.parse(content);
  const payload = Array.isArray(parsed) ? { components: parsed } : parsed;
  updateCurrentMessage((template) => {
    template.enabled = true;
    template.payload = normalizeEditorPayload(payload);
  }, true);
}

function resetCurrentMessage() {
  const slot = currentMessageSlot();
  if (!slot) return;
  resetMessageTemplate(slot.key);
  renderView();
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
  state.messageCatalog = result.messageCatalog || state.messageCatalog;
  state.version = result.version || state.version;
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
    if (action === 'setup-scam-trap') {
      await saveConfig();
      const result = await coreCall('setupScamTrapChannel', [state.env], 120000);
      if (result?.channelId) {
        pushLocalLog(`${ui('scamTrapConfigured')}: ${result.channelId}${result.messageId ? ` / ${result.messageId}` : ''}`, 'system');
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

  document.querySelectorAll('[data-message-slot]').forEach((button) => {
    bindOnce(button, 'click', 'MessageSlot', (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.messageSlot = button.dataset.messageSlot;
      renderView();
    });
  });

  document.querySelectorAll('[data-message-enabled]').forEach((input) => {
    bindOnce(input, 'change', 'MessageEnabled', (event) => {
      event.stopPropagation();
      updateMessageEnabled(input.checked);
    });
  });

  document.querySelectorAll('[data-message-content]').forEach((input) => {
    bindOnce(input, 'input', 'MessageContent', (event) => {
      event.stopPropagation();
      updateMessageContent(input.value);
    });
  });

  document.querySelectorAll('[data-mention-parse]').forEach((input) => {
    bindOnce(input, 'change', 'MentionParse', (event) => {
      event.stopPropagation();
      updateMentionParse(input.dataset.mentionParse, input.checked);
    });
  });

  document.querySelectorAll('[data-embed-add]').forEach((button) => {
    bindOnce(button, 'click', 'EmbedAdd', (event) => {
      event.preventDefault();
      event.stopPropagation();
      addEmbed();
    });
  });

  document.querySelectorAll('[data-embed-delete]').forEach((button) => {
    bindOnce(button, 'click', 'EmbedDelete', (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteEmbed(Number(button.dataset.embedDelete));
    });
  });

  document.querySelectorAll('[data-embed-prop]').forEach((input) => {
    bindOnce(input, 'input', 'EmbedProp', (event) => {
      event.stopPropagation();
      updateEmbedProperty(Number(input.dataset.embedIndex), input.dataset.embedProp, input.value);
    });
  });

  document.querySelectorAll('[data-embed-add-field]').forEach((button) => {
    bindOnce(button, 'click', 'EmbedAddField', (event) => {
      event.preventDefault();
      event.stopPropagation();
      addEmbedField(Number(button.dataset.embedAddField));
    });
  });

  document.querySelectorAll('[data-embed-delete-field]').forEach((button) => {
    bindOnce(button, 'click', 'EmbedDeleteField', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const [embedIndex, fieldIndex] = button.dataset.embedDeleteField.split(':').map(Number);
      deleteEmbedField(embedIndex, fieldIndex);
    });
  });

  document.querySelectorAll('[data-embed-field-prop]').forEach((input) => {
    bindOnce(input, 'input', 'EmbedFieldProp', (event) => {
      event.stopPropagation();
      updateEmbedField(
        Number(input.dataset.embedIndex),
        Number(input.dataset.fieldIndex),
        input.dataset.embedFieldProp,
        input.value,
        input.checked
      );
    });
    bindOnce(input, 'change', 'EmbedFieldChange', (event) => {
      event.stopPropagation();
      updateEmbedField(
        Number(input.dataset.embedIndex),
        Number(input.dataset.fieldIndex),
        input.dataset.embedFieldProp,
        input.value,
        input.checked
      );
    });
  });

  document.querySelectorAll('[data-component-add]').forEach((button) => {
    bindOnce(button, 'click', 'ComponentAdd', (event) => {
      event.preventDefault();
      event.stopPropagation();
      addComponent(button.dataset.componentAdd, button.dataset.componentParent || '');
    });
  });

  document.querySelectorAll('[data-component-delete]').forEach((button) => {
    bindOnce(button, 'click', 'ComponentDelete', (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteComponent(button.dataset.componentDelete);
    });
  });

  document.querySelectorAll('[data-component-prop]').forEach((input) => {
    bindOnce(input, 'input', 'ComponentProp', (event) => {
      event.stopPropagation();
      updateComponentProperty(input.dataset.componentPath ?? input.dataset.componentIndex, input.dataset.componentProp, input.value, input.checked);
    });
    bindOnce(input, 'change', 'ComponentPropChange', (event) => {
      event.stopPropagation();
      updateComponentProperty(input.dataset.componentPath ?? input.dataset.componentIndex, input.dataset.componentProp, input.value, input.checked);
    });
  });

  document.querySelectorAll('[data-section-accessory-type]').forEach((select) => {
    bindOnce(select, 'change', 'SectionAccessoryType', (event) => {
      event.stopPropagation();
      setSectionAccessoryType(select.dataset.componentPath ?? select.dataset.componentIndex, select.value);
    });
  });

  document.querySelectorAll('[data-component-button-prop]').forEach((input) => {
    bindOnce(input, 'input', 'ComponentButtonProp', (event) => {
      event.stopPropagation();
      updateComponentButtonProperty(
        input.dataset.componentPath ?? input.dataset.componentIndex,
        Number(input.dataset.buttonIndex || 0),
        input.dataset.componentButtonProp,
        input.value,
        input.checked
      );
    });
    bindOnce(input, 'change', 'ComponentButtonChange', (event) => {
      event.stopPropagation();
      updateComponentButtonProperty(
        input.dataset.componentPath ?? input.dataset.componentIndex,
        Number(input.dataset.buttonIndex || 0),
        input.dataset.componentButtonProp,
        input.value,
        input.checked
      );
    });
  });

  document.querySelectorAll('[data-section-button-prop]').forEach((input) => {
    bindOnce(input, 'input', 'SectionButtonProp', (event) => {
      event.stopPropagation();
      updateSectionButtonProperty(input.dataset.componentPath ?? input.dataset.componentIndex, input.dataset.sectionButtonProp, input.value, input.checked);
    });
    bindOnce(input, 'change', 'SectionButtonChange', (event) => {
      event.stopPropagation();
      updateSectionButtonProperty(input.dataset.componentPath ?? input.dataset.componentIndex, input.dataset.sectionButtonProp, input.value, input.checked);
    });
  });

  document.querySelectorAll('[data-component-button-add]').forEach((button) => {
    bindOnce(button, 'click', 'ComponentButtonAdd', (event) => {
      event.preventDefault();
      event.stopPropagation();
      addComponentButton(button.dataset.componentButtonAdd);
    });
  });

  document.querySelectorAll('[data-component-button-delete]').forEach((button) => {
    bindOnce(button, 'click', 'ComponentButtonDelete', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const parts = button.dataset.componentButtonDelete.split(':');
      const buttonIndex = Number(parts.pop());
      deleteComponentButton(parts.join(':'), buttonIndex);
    });
  });

  document.querySelectorAll('[data-gallery-item-add]').forEach((button) => {
    bindOnce(button, 'click', 'GalleryItemAdd', (event) => {
      event.preventDefault();
      event.stopPropagation();
      addGalleryItem(button.dataset.galleryItemAdd);
    });
  });

  document.querySelectorAll('[data-gallery-item-delete]').forEach((button) => {
    bindOnce(button, 'click', 'GalleryItemDelete', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const parts = button.dataset.galleryItemDelete.split(':');
      const itemIndex = Number(parts.pop());
      deleteGalleryItem(parts.join(':'), itemIndex);
    });
  });

  document.querySelectorAll('[data-gallery-item-prop]').forEach((input) => {
    bindOnce(input, 'input', 'GalleryItemProp', (event) => {
      event.stopPropagation();
      updateGalleryItem(
        input.dataset.componentPath ?? input.dataset.componentIndex,
        Number(input.dataset.galleryIndex),
        input.dataset.galleryItemProp,
        input.value,
        input.checked
      );
    });
    bindOnce(input, 'change', 'GalleryItemChange', (event) => {
      event.stopPropagation();
      updateGalleryItem(
        input.dataset.componentPath ?? input.dataset.componentIndex,
        Number(input.dataset.galleryIndex),
        input.dataset.galleryItemProp,
        input.value,
        input.checked
      );
    });
  });

  document.querySelectorAll('[data-message-import]').forEach((button) => {
    bindOnce(button, 'click', 'MessageImport', (event) => {
      event.preventDefault();
      event.stopPropagation();
      importMessageJson().catch((error) => pushLocalLog(error.stack || error.message || String(error), 'stderr'));
    });
  });

  document.querySelectorAll('[data-message-reset]').forEach((button) => {
    bindOnce(button, 'click', 'MessageReset', (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetCurrentMessage();
    });
  });

  document.querySelectorAll('[data-switch-control]').forEach((control) => {
    bindOnce(control, 'click', 'SwitchControl', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleSwitchControl(control.querySelector('[data-switch-toggle]'));
    });
    bindOnce(control, 'keydown', 'SwitchKey', (event) => {
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      toggleSwitchControl(control.querySelector('[data-switch-toggle]'));
    });
  });

  document.querySelectorAll('[data-env]').forEach((input) => {
    bindOnce(input, 'input', 'EnvInput', (event) => {
      event.stopPropagation();
      setEnvValue(input.dataset.env, input.type === 'checkbox' ? String(input.checked) : input.value);
      syncSwitchControl(input);
    });

    bindOnce(input, 'change', 'EnvChange', (event) => {
      event.stopPropagation();
      setEnvValue(input.dataset.env, input.type === 'checkbox' ? String(input.checked) : input.value);
      syncSwitchControl(input);
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
    syncSwitchControl(input);
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
    syncSwitchControl(input);
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
    state.messageCatalog = payload.messageCatalog || [];
    state.logs = (payload.logs || []).slice(-MAX_LOG_LINES);
    state.status = payload.status || state.status;
    state.version = payload.version || state.version;

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
