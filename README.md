<div align="center">

# Self-hosted Bot by Core

**Панель управления и runtime-комплект для приватного self-hosted Discord-бота.**

[![Discord](https://img.shields.io/badge/Official%20Discord-Core-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/YF8krDPCZh)
[![Windows](https://img.shields.io/badge/Windows-x64%20%7C%20ia32-0078D4?style=for-the-badge&logo=windows&logoColor=white)](#-состав-поставки)
[![License](https://img.shields.io/badge/License-Personal%20Use%20Only-43C7B2?style=for-the-badge)](./LICENSE.md)

</div>

---

## RU | Русский

## Назначение

**Self-hosted Bot by Core** предназначен для владельцев Discord-серверов, которым требуется приватный бот с локальным управлением, SQL-хранилищем и контролируемым набором команд. Проект не использует публичные команды и ориентирован на эксплуатацию в рамках одного сервера.

> [!IMPORTANT]
> Приложение рассчитано на самостоятельное администрирование. Владелец сервера отвечает за безопасность токена, корректность прав Discord-бота и настройки хостинга.

## Основные возможности

- Графическая desktop-панель для настройки и запуска бота.
- SQLite-хранилище без MongoDB.
- Регистрация slash-команд для выбранного сервера.
- Сообщения на базе Discord Components V2.
- Управление доступностью команд через интерфейс.
- Журнал работы во вкладке приложения.
- Пошаговый мастер первичной настройки.
- Подсказки по каждому параметру через кнопку `!`.
- Поддержка светлой и тёмной темы.
- Языки интерфейса: русский, английский, немецкий, украинский.
- Управление процессом: запуск, перезапуск, остановка, аварийная остановка.
- Раздельные JSON-шаблоны приветствий для личных сообщений и серверного канала.
- Настройка статуса и активности Discord-бота.
- Визуальный редактор правил предупреждений.
- Автомодерация упоминаний, нецензурной лексики, ссылок, приглашений в Discord и спама.
- Экспорт runtime-архива для размещения на Node.js-хостинге.

## Состав поставки

| Файл | Назначение |
| --- | --- |
| `Self-hosted-bot-by-Core-Setup-<version>-x64.exe` | Установщик для 64-bit Windows |
| `Self-hosted-bot-by-Core-Setup-<version>-ia32.exe` | Установщик для 32-bit Windows |
| `Self-hosted-bot-by-Core-Setup-<version>.exe` | Универсальный установщик Windows |
| `Self-hosted-bot-by-Core-Portable-<version>-x64.zip` | Portable-сборка для 64-bit Windows |
| `Self-hosted-bot-by-Core-Portable-<version>-ia32.zip` | Portable-сборка для 32-bit Windows |
| `Self-hosted-bot-by-Core-Updater-<version>.exe` | Основной файл обновления установленной версии без удаления данных |
| `Self-hosted-bot-by-Core-Updater-<version>.zip` | Резервный updater-пакет с открытыми файлами обновления |

Рекомендуемый вариант для большинства рабочих станций Windows: `x64.exe`.
Если приложение уже установлено, используйте updater `.exe`. Для portable-сборки скачайте новый portable ZIP и замените старую portable-папку вручную.

## Первичная настройка

1. Установите приложение или распакуйте portable-архив.
2. Запустите **Self-hosted Bot by Core**.
3. Откройте вкладку **Первый запуск** и выполните шаги мастера.
4. В Discord Developer Portal создайте приложение и пользователя-бота.
5. Скопируйте `Application ID` в поле `CLIENT_ID`.
6. Скопируйте token бота в единственное поле `DISCORD_TOKEN`.
7. Включите Discord Developer Mode.
8. Скопируйте ID сервера, каналов логов, канала приветствия и ролей доступа.
9. Включите Privileged Gateway Intents:
   - Presence Intent;
   - Server Members Intent;
   - Message Content Intent.
10. Нажмите **Сохранить**.
11. Нажмите **Старт**.

После успешного запуска в журнале приложения отображается ссылка приглашения бота с правами администратора.

## Приветствия

Приложение поддерживает два независимых JSON-шаблона:

- **Личное приветствие** - отправляется новому участнику в личные сообщения.
- **Серверное приветствие** - отправляется в указанный текстовый канал.

Поддерживаемые форматы:

- обычный Discord message payload;
- `embeds`;
- Components V2 payload.

Пример:

```json
{
  "content": "Привет, {{mention}}. Добро пожаловать на сервер **{{server}}**.",
  "embeds": [
    {
      "title": "Новый участник: {{displayname}}",
      "description": "Discord ID: {{userid}}\nУчастников на сервере: {{membercount}}",
      "color": 4433842,
      "thumbnail": {
        "url": "{{avatar}}"
      }
    }
  ],
  "allowedMentions": {
    "users": ["{{userid}}"],
    "roles": [],
    "repliedUser": false
  }
}
```

Доступные теги:

`{{username}}`, `{{displayname}}`, `{{globalname}}`, `{{userid}}`, `{{mention}}`, `{{tag}}`, `{{avatar}}`, `{{server}}`, `{{serverid}}`, `{{membercount}}`, `{{joindate}}`, `{{joinedrelative}}`, `{{createdat}}`, `{{createdrelative}}`, `{{guildicon}}`, `{{guildbanner}}`.

## Уровни доступа AdminRole

`AdminRole` - это уровни доступа к командам бота. Эти параметры не выдают Discord Administrator permission и не изменяют роли пользователей.

Формат значения:

```txt
RoleID,RoleID,RoleID
```

Назначение уровней:

| Уровень | Назначение |
| --- | --- |
| `ADMIN_ROLES_LEVEL_0` | Служебные команды владельца и разработчика |
| `ADMIN_ROLES_LEVEL_1` | Расширенные действия модерации и очистка предупреждений |
| `ADMIN_ROLES_LEVEL_2` | Управление отдельными предупреждениями и временный ban |
| `ADMIN_ROLES_LEVEL_3` | `mute`, `unmute`, `slowmode` |
| `ADMIN_ROLES_LEVEL_4` | `warn`, `warns`, `clear` |

## Экспорт для хостинга

Функция **Экспорт для хостинга** создаёт ZIP-архив, предназначенный для загрузки на Node.js-хостинг.

Состав архива:

- `bot.js`;
- `src/`;
- `config/`;
- `.env` с текущими настройками;
- `.env.example`;
- `package.json` без desktop-зависимостей;
- `LICENSE.md`;
- `README_HOSTING.md`.

Порядок запуска на хостинге:

```bash
npm install
npm start
```

> [!CAUTION]
> Экспортированный архив может содержать действующий Discord token. Такой архив нельзя публиковать, передавать третьим лицам или размещать в открытом репозитории.

## Лицензия

Проект распространяется по пользовательской лицензии **Core Personal Use License**.

Разрешено использовать приложение для собственных серверов. Запрещено изменять, перепаковывать, продавать, распространять, публиковать, сдавать в аренду, сублицензировать или использовать приложение как основу для публичного/коммерческого продукта.

Полный текст: [LICENSE.md](./LICENSE.md).

## Поддержка

Официальный Discord-сервер Core: <https://discord.gg/YF8krDPCZh>

---

## EN | English

## Purpose

**Self-hosted Bot by Core** is a private Discord bot runtime and desktop control panel for server owners who need local configuration, SQL storage, and a controlled command set. The project is designed for single-server self-hosted operation and does not include public commands.

> [!IMPORTANT]
> The application is intended for self-managed operation. The server owner is responsible for bot token security, Discord permissions, and hosting configuration.

## Key Capabilities

- Desktop control panel for configuration and process management.
- SQLite storage without MongoDB.
- Guild-specific slash command registration.
- Discord Components V2 messages.
- Command availability management through the interface.
- Built-in runtime log view.
- First-run setup guide.
- Per-setting help via `!` buttons.
- Light and dark interface themes.
- UI languages: Russian, English, German, Ukrainian.
- Start, restart, stop, and emergency stop controls.
- Separate JSON welcome templates for DM and server channel messages.
- Bot presence and activity configuration.
- Visual warning-rule editor.
- Automoderation for pings, bad words, links, Discord invites, and spam.
- Runtime ZIP export for Node.js hosting.

## Distribution Package

| File | Purpose |
| --- | --- |
| `Self-hosted-bot-by-Core-Setup-<version>-x64.exe` | Installer for 64-bit Windows |
| `Self-hosted-bot-by-Core-Setup-<version>-ia32.exe` | Installer for 32-bit Windows |
| `Self-hosted-bot-by-Core-Setup-<version>.exe` | Universal Windows installer |
| `Self-hosted-bot-by-Core-Portable-<version>-x64.zip` | Portable build for 64-bit Windows |
| `Self-hosted-bot-by-Core-Portable-<version>-ia32.zip` | Portable build for 32-bit Windows |
| `Self-hosted-bot-by-Core-Updater-<version>.exe` | Main updater for an installed version without removing data |
| `Self-hosted-bot-by-Core-Updater-<version>.zip` | Fallback updater package with transparent update files |

The recommended option for most Windows workstations is `x64.exe`.
If the app is already installed, use the updater executable. For portable builds, download the new portable ZIP and replace the old portable folder manually.

## Initial Configuration

1. Install the application or extract the portable archive.
2. Start **Self-hosted Bot by Core**.
3. Open the **First run** tab and complete the guide.
4. Create a Discord application and bot user in Discord Developer Portal.
5. Copy `Application ID` into `CLIENT_ID`.
6. Copy the bot token into the single `DISCORD_TOKEN` field.
7. Enable Discord Developer Mode.
8. Copy server, log channel, welcome channel, and access role IDs.
9. Enable Privileged Gateway Intents:
   - Presence Intent;
   - Server Members Intent;
   - Message Content Intent.
10. Click **Save**.
11. Click **Start**.

After startup, the application log displays the administrator invite URL.

## Hosting Export

The **Hosting Export** function creates a ZIP archive for Node.js hosting deployments.

Archive contents:

- `bot.js`;
- `src/`;
- `config/`;
- `.env` generated from current settings;
- `.env.example`;
- runtime-only `package.json`;
- `LICENSE.md`;
- `README_HOSTING.md`.

Deployment command:

```bash
npm install
npm start
```

> [!CAUTION]
> The exported archive may contain a valid Discord token. Do not publish, redistribute, or upload it to a public repository.

## License

This project uses the custom **Core Personal Use License**.

You may use the application for your own servers. You may not modify, repackage, sell, redistribute, publish, rent, sublicense, or use the application as the basis for a public or commercial product.

Full text: [LICENSE.md](./LICENSE.md).

## Support

Official Core Discord server: <https://discord.gg/YF8krDPCZh>
