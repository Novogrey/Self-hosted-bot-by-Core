const NAME_LOCALIZATIONS = {
  add: { ru: 'РґРѕР±Р°РІРёС‚СЊ', uk: 'РґРѕРґР°С‚Рё', de: 'hinzufuegen' },
  remove: { ru: 'СѓРґР°Р»РёС‚СЊ', uk: 'РІРёРґР°Р»РёС‚Рё', de: 'entfernen' },
  user_ids: { ru: 'id_РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№', uk: 'id_РєРѕСЂРёСЃС‚СѓРІР°С‡С–РІ', de: 'nutzer_ids' },
  feedback: { ru: 'РѕР±СЂР°С‚РЅР°СЏ-СЃРІСЏР·СЊ', uk: 'Р·РІРѕСЂРѕС‚РЅРёР№-Р·РІСЏР·РѕРє', de: 'feedback' },
  help: { ru: 'РїРѕРјРѕС‰СЊ', uk: 'РґРѕРїРѕРјРѕРіР°', de: 'hilfe' },
  'roles-json': { ru: 'СЂРѕР»Рё-json', uk: 'СЂРѕР»С–-json', de: 'rollen-json' },
  'rules-import': { ru: 'РёРјРїРѕСЂС‚-РїСЂР°РІРёР»', uk: 'С–РјРїРѕСЂС‚-РїСЂР°РІРёР»', de: 'regeln-import' },
  'server-ai-create': { ru: 'РёРё-СЃРµСЂРІРµСЂ', uk: 'С€С–-СЃРµСЂРІРµСЂ', de: 'ki-server' },
  'server-export': { ru: 'СЌРєСЃРїРѕСЂС‚-СЃРµСЂРІРµСЂР°', uk: 'РµРєСЃРїРѕСЂС‚-СЃРµСЂРІРµСЂР°', de: 'server-export' },
  'server-import': { ru: 'РёРјРїРѕСЂС‚-СЃРµСЂРІРµСЂР°', uk: 'С–РјРїРѕСЂС‚-СЃРµСЂРІРµСЂР°', de: 'server-import' },
  'server-rollback': { ru: 'РѕС‚РєР°С‚-СЃРµСЂРІРµСЂР°', uk: 'РІС–РґРєР°С‚-СЃРµСЂРІРµСЂР°', de: 'server-rollback' },
  template: { ru: 'С€Р°Р±Р»РѕРЅ', uk: 'С€Р°Р±Р»РѕРЅ', de: 'vorlage' },
  'template-rate': { ru: 'РѕС†РµРЅРёС‚СЊ-С€Р°Р±Р»РѕРЅ', uk: 'РѕС†С–РЅРёС‚Рё-С€Р°Р±Р»РѕРЅ', de: 'vorlage-bewerten' },
  'template-suggest': { ru: 'РїСЂРµРґР»РѕР¶РёС‚СЊ-С€Р°Р±Р»РѕРЅ', uk: 'Р·Р°РїСЂРѕРїРѕРЅСѓРІР°С‚Рё-С€Р°Р±Р»РѕРЅ', de: 'vorlage-vorschlagen' },
  'Р­РєСЃРїРѕСЂС‚ РїСЂР°РІРёР» JSON': {
    'en-US': 'Export rules JSON',
    ru: 'Р­РєСЃРїРѕСЂС‚ РїСЂР°РІРёР» JSON',
    uk: 'Р•РєСЃРїРѕСЂС‚ РїСЂР°РІРёР» JSON',
    de: 'Regeln als JSON exportieren'
  },
  'РџСЂРµРґР»РѕР¶РёС‚СЊ С€Р°Р±Р»РѕРЅ РїСЂР°РІРёР»': {
    'en-US': 'Suggest rule template',
    ru: 'РџСЂРµРґР»РѕР¶РёС‚СЊ С€Р°Р±Р»РѕРЅ РїСЂР°РІРёР»',
    uk: 'Р—Р°РїСЂРѕРїРѕРЅСѓРІР°С‚Рё С€Р°Р±Р»РѕРЅ РїСЂР°РІРёР»',
    de: 'Regelvorlage vorschlagen'
  },
  clear_databases: { ru: 'РѕС‡РёСЃС‚РёС‚СЊ-Р±Р°Р·С‹', uk: 'РѕС‡РёСЃС‚РёС‚Рё-Р±Р°Р·Рё', de: 'datenbanken-leeren' },
  refreshcommands: { ru: 'РѕР±РЅРѕРІРёС‚СЊ-РєРѕРјР°РЅРґС‹', uk: 'РѕРЅРѕРІРёС‚Рё-РєРѕРјР°РЅРґРё', de: 'befehle-aktualisieren' },
  reload: { ru: 'РїРµСЂРµР·Р°РіСЂСѓР·РєР°', uk: 'РїРµСЂРµР·Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ', de: 'neu-laden' },
  'role-template-add': { ru: 'РґРѕР±Р°РІРёС‚СЊ-СЂРѕР»Рё-С€Р°Р±Р»РѕРЅ', uk: 'РґРѕРґР°С‚Рё-СЂРѕР»С–-С€Р°Р±Р»РѕРЅ', de: 'rollenvorlage-add' },
  'rule-template-add': {
    'en-US': 'Add rule template',
    ru: 'Р”РѕР±Р°РІРёС‚СЊ С€Р°Р±Р»РѕРЅ РїСЂР°РІРёР»',
    uk: 'Р”РѕРґР°С‚Рё С€Р°Р±Р»РѕРЅ РїСЂР°РІРёР»',
    de: 'Regelvorlage hinzufГјgen'
  },
  say: { ru: 'СЃРєР°Р·Р°С‚СЊ', uk: 'СЃРєР°Р·Р°С‚Рё', de: 'sagen' },
  shutdown: { ru: 'РІС‹РєР»СЋС‡РёС‚СЊ', uk: 'РІРёРјРєРЅСѓС‚Рё', de: 'abschalten' },
  'template-add': { ru: 'РґРѕР±Р°РІРёС‚СЊ-С€Р°Р±Р»РѕРЅ', uk: 'РґРѕРґР°С‚Рё-С€Р°Р±Р»РѕРЅ', de: 'vorlage-add' },
  'templete-delete': { ru: 'СѓРґР°Р»РёС‚СЊ-С€Р°Р±Р»РѕРЅ', uk: 'РІРёРґР°Р»РёС‚Рё-С€Р°Р±Р»РѕРЅ', de: 'vorlage-delete' },
  'welcome-preview': { ru: 'РїСЂРµРІСЊСЋ-РїСЂРёРІРµС‚СЃС‚РІРёСЏ', uk: 'РїРµСЂРµРіР»СЏРґ-РІС–С‚Р°РЅРЅСЏ', de: 'willkommen-vorschau' },
  ban: { ru: 'Р±Р°РЅ', uk: 'Р±Р°РЅ', de: 'bannen' },
  kick: { ru: 'РєРёРє', uk: 'РєС–Рє', de: 'kicken' },
  mute: { ru: 'РјСѓС‚', uk: 'РјСѓС‚', de: 'stumm' },
  unmute: { ru: 'СЂР°Р·РјСѓС‚', uk: 'СЂРѕР·РјСѓС‚', de: 'entstummen' },
  unban: { ru: 'СЂР°Р·Р±Р°РЅ', uk: 'СЂРѕР·Р±Р°РЅ', de: 'entbannen' },
  warn: { ru: 'РїСЂРµРґСѓРїСЂРµРґРёС‚СЊ', uk: 'РїРѕРїРµСЂРµРґРёС‚Рё', de: 'warnen' },
  warns: { ru: 'РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ', uk: 'РїРѕРїРµСЂРµРґР¶РµРЅРЅСЏ', de: 'warnungen' },
  remwarn: { ru: 'СЃРЅСЏС‚СЊ-РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёРµ', uk: 'Р·РЅСЏС‚Рё-РїРѕРїРµСЂРµРґР¶РµРЅРЅСЏ', de: 'warnung-entfernen' },
  clearwarns: { ru: 'РѕС‡РёСЃС‚РёС‚СЊ-РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ', uk: 'РѕС‡РёСЃС‚РёС‚Рё-РїРѕРїРµСЂРµРґР¶РµРЅРЅСЏ', de: 'warnungen-leeren' },
  clear: { ru: 'РѕС‡РёСЃС‚РёС‚СЊ', uk: 'РѕС‡РёСЃС‚РёС‚Рё', de: 'leeren' },
  slowmode: { ru: 'РјРµРґР»РµРЅРЅС‹Р№-СЂРµР¶РёРј', uk: 'РїРѕРІС–Р»СЊРЅРёР№-СЂРµР¶РёРј', de: 'slowmode' },
  levels: { ru: 'СѓСЂРѕРІРЅРё', uk: 'СЂС–РІРЅС–', de: 'level' },
  level: { ru: 'СѓСЂРѕРІРµРЅСЊ', uk: 'СЂС–РІРµРЅСЊ', de: 'level-setzen' },
  top: { ru: 'С‚РѕРї', uk: 'С‚РѕРї', de: 'top' },
  reset: { ru: 'СЃР±СЂРѕСЃ', uk: 'СЃРєРёРґР°РЅРЅСЏ', de: 'zuruecksetzen' },

  export: { ru: 'СЌРєСЃРїРѕСЂС‚', uk: 'РµРєСЃРїРѕСЂС‚', de: 'export' },
  import: { ru: 'РёРјРїРѕСЂС‚', uk: 'С–РјРїРѕСЂС‚', de: 'import' },
  send: { ru: 'РїСЂРёРјРµРЅРёС‚СЊ', uk: 'Р·Р°СЃС‚РѕСЃСѓРІР°С‚Рё', de: 'anwenden' },
  preview: { ru: 'РїСЂРµРІСЊСЋ', uk: 'РїРµСЂРµРіР»СЏРґ', de: 'vorschau' },
  list: { ru: 'СЃРїРёСЃРѕРє', uk: 'СЃРїРёСЃРѕРє', de: 'liste' },
  server: { ru: 'СЃРµСЂРІРµСЂ', uk: 'СЃРµСЂРІРµСЂ', de: 'server' },
  roles: { ru: 'СЂРѕР»Рё', uk: 'СЂРѕР»С–', de: 'rollen' },
  rules: { ru: 'РїСЂР°РІРёР»Р°', uk: 'РїСЂР°РІРёР»Р°', de: 'regeln' },
  all: { ru: 'РІСЃРµ', uk: 'СѓСЃРµ', de: 'alle' },
  user: { ru: 'СѓС‡Р°СЃС‚РЅРёРє', uk: 'СѓС‡Р°СЃРЅРёРє', de: 'mitglied' },
  setlevel: { ru: 'СѓСЃС‚Р°РЅРѕРІРёС‚СЊ-СѓСЂРѕРІРµРЅСЊ', uk: 'РІСЃС‚Р°РЅРѕРІРёС‚Рё-СЂС–РІРµРЅСЊ', de: 'level-setzen' },
  setexp: { ru: 'СѓСЃС‚Р°РЅРѕРІРёС‚СЊ-РѕРїС‹С‚', uk: 'РІСЃС‚Р°РЅРѕРІРёС‚Рё-РґРѕСЃРІС–Рґ', de: 'xp-setzen' },
  voice: { ru: 'РіРѕР»РѕСЃ', uk: 'РіРѕР»РѕСЃ', de: 'sprache' },

  file: { ru: 'С„Р°Р№Р»', uk: 'С„Р°Р№Р»', de: 'datei' },
  template: { ru: 'С€Р°Р±Р»РѕРЅ', uk: 'С€Р°Р±Р»РѕРЅ', de: 'vorlage' },
  channel: { ru: 'РєР°РЅР°Р»', uk: 'РєР°РЅР°Р»', de: 'kanal' },
  command: { ru: 'РєРѕРјР°РЅРґР°', uk: 'РєРѕРјР°РЅРґР°', de: 'befehl' },
  prompt: { ru: 'Р·Р°РїСЂРѕСЃ', uk: 'Р·Р°РїРёС‚', de: 'prompt' },
  delete_existing: { ru: 'СѓРґР°Р»РёС‚СЊ_С‚РµРєСѓС‰РµРµ', uk: 'РІРёРґР°Р»РёС‚Рё_РїРѕС‚РѕС‡РЅРµ', de: 'vorhandene_loeschen' },
  name: { ru: 'РЅР°Р·РІР°РЅРёРµ', uk: 'РЅР°Р·РІР°', de: 'name' },
  description: { ru: 'РѕРїРёСЃР°РЅРёРµ', uk: 'РѕРїРёСЃ', de: 'beschreibung' },
  stars: { ru: 'Р·РІРµР·РґС‹', uk: 'Р·С–СЂРєРё', de: 'sterne' },
  type: { ru: 'С‚РёРї', uk: 'С‚РёРї', de: 'typ' },
  message: { ru: 'СЃРѕРѕР±С‰РµРЅРёРµ', uk: 'РїРѕРІС–РґРѕРјР»РµРЅРЅСЏ', de: 'nachricht' },
  target: { ru: 'СѓС‡Р°СЃС‚РЅРёРє', uk: 'СѓС‡Р°СЃРЅРёРє', de: 'mitglied' },
  targets: { ru: 'СѓС‡Р°СЃС‚РЅРёРєРё', uk: 'СѓС‡Р°СЃРЅРёРєРё', de: 'mitglieder' },
  reason: { ru: 'РїСЂРёС‡РёРЅР°', uk: 'РїСЂРёС‡РёРЅР°', de: 'grund' },
  time: { ru: 'РІСЂРµРјСЏ', uk: 'С‡Р°СЃ', de: 'zeit' },
  duration: { ru: 'РґР»РёС‚РµР»СЊРЅРѕСЃС‚СЊ', uk: 'С‚СЂРёРІР°Р»С–СЃС‚СЊ', de: 'dauer' },
  amount: { ru: 'РєРѕР»РёС‡РµСЃС‚РІРѕ', uk: 'РєС–Р»СЊРєС–СЃС‚СЊ', de: 'anzahl' },
  userids_or_mentions: { ru: 'id_РёР»Рё_СѓРїРѕРјРёРЅР°РЅРёСЏ', uk: 'id_Р°Р±Рѕ_Р·РіР°РґРєРё', de: 'ids_oder_erwaehnungen' },
  warnids: { ru: 'id_РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёР№', uk: 'id_РїРѕРїРµСЂРµРґР¶РµРЅСЊ', de: 'warnungs_ids' },
  level: { ru: 'СѓСЂРѕРІРµРЅСЊ', uk: 'СЂС–РІРµРЅСЊ', de: 'level' },
  experience: { ru: 'РѕРїС‹С‚', uk: 'РґРѕСЃРІС–Рґ', de: 'erfahrung' }
};

const DESCRIPTION_LOCALIZATIONS = {
  add: {
    ru: 'Р‘Р»РѕРєРёСЂСѓРµС‚ РѕРґРёРЅ РёР»Рё РЅРµСЃРєРѕР»СЊРєРѕ ID РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РґР»СЏ С‚РёРєРµС‚РѕРІ РїРѕРґРґРµСЂР¶РєРё.',
    uk: 'Р‘Р»РѕРєСѓС” РѕРґРёРЅ Р°Р±Рѕ РєС–Р»СЊРєР° ID РєРѕСЂРёСЃС‚СѓРІР°С‡С–РІ РґР»СЏ С‚С–РєРµС‚С–РІ РїС–РґС‚СЂРёРјРєРё.',
    de: 'Sperrt eine oder mehrere Nutzer-IDs fГјr Support-Tickets.'
  },
  remove: {
    ru: 'РЎРЅРёРјР°РµС‚ Р±Р»РѕРєРёСЂРѕРІРєСѓ СЃ РѕРґРЅРѕРіРѕ РёР»Рё РЅРµСЃРєРѕР»СЊРєРёС… ID РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.',
    uk: 'Р—РЅС–РјР°С” Р±Р»РѕРєСѓРІР°РЅРЅСЏ Р· РѕРґРЅРѕРіРѕ Р°Р±Рѕ РєС–Р»СЊРєРѕС… ID РєРѕСЂРёСЃС‚СѓРІР°С‡С–РІ.',
    de: 'Entfernt die Sperre fГјr eine oder mehrere Nutzer-IDs.'
  },
  feedback: {
    ru: 'РћС‚РїСЂР°РІР»СЏРµС‚ РїСЂРёРІР°С‚РЅС‹Р№ feedback СЂР°Р·СЂР°Р±РѕС‚С‡РёРєСѓ Core.',
    uk: 'РќР°РґСЃРёР»Р°С” РїСЂРёРІР°С‚РЅРёР№ feedback СЂРѕР·СЂРѕР±РЅРёРєСѓ Core.',
    de: 'Sendet privates Feedback an den Core-Entwickler.'
  },
  help: {
    ru: 'РџРѕРєР°Р·С‹РІР°РµС‚ СЃРїСЂР°РІРєСѓ РїРѕ РїСѓР±Р»РёС‡РЅС‹Рј РєРѕРјР°РЅРґР°Рј Core.',
    uk: 'РџРѕРєР°Р·СѓС” РґРѕРІС–РґРєСѓ Р·Р° РїСѓР±Р»С–С‡РЅРёРјРё РєРѕРјР°РЅРґР°РјРё Core.',
    de: 'Zeigt Hilfe zu den Г¶ffentlichen Core-Befehlen.'
  },
  'roles-json': {
    ru: 'Р­РєСЃРїРѕСЂС‚РёСЂСѓРµС‚ РёР»Рё РёРјРїРѕСЂС‚РёСЂСѓРµС‚ СЂРѕР»Рё С‡РµСЂРµР· Р·Р°РєРѕРґРёСЂРѕРІР°РЅРЅС‹Р№ JSON.',
    uk: 'Р•РєСЃРїРѕСЂС‚СѓС” Р°Р±Рѕ С–РјРїРѕСЂС‚СѓС” СЂРѕР»С– С‡РµСЂРµР· Р·Р°РєРѕРґРѕРІР°РЅРёР№ JSON.',
    de: 'Exportiert oder importiert Rollen Гјber codiertes JSON.'
  },
  'rules-import': {
    ru: 'РРјРїРѕСЂС‚РёСЂСѓРµС‚ РїСЂР°РІРёР»Р° РёР· Р·Р°РєРѕРґРёСЂРѕРІР°РЅРЅРѕРіРѕ JSON РёР»Рё РїСѓР±Р»РёС‡РЅРѕРіРѕ С€Р°Р±Р»РѕРЅР°.',
    uk: 'Р†РјРїРѕСЂС‚СѓС” РїСЂР°РІРёР»Р° С–Р· Р·Р°РєРѕРґРѕРІР°РЅРѕРіРѕ JSON Р°Р±Рѕ РїСѓР±Р»С–С‡РЅРѕРіРѕ С€Р°Р±Р»РѕРЅСѓ.',
    de: 'Importiert Regeln aus codiertem JSON oder einer Г¶ffentlichen Vorlage.'
  },
  'server-ai-create': {
    ru: 'РЎРѕР·РґР°С‘С‚ СЂРѕР»Рё Рё РєР°РЅР°Р»С‹ РїРѕ AI-РїР»Р°РЅСѓ СЃРµСЂРІРµСЂР°.',
    uk: 'РЎС‚РІРѕСЂСЋС” СЂРѕР»С– С‚Р° РєР°РЅР°Р»Рё Р·Р° AI-РїР»Р°РЅРѕРј СЃРµСЂРІРµСЂР°.',
    de: 'Erstellt Rollen und KanГ¤le aus einem KI-Serverplan.'
  },
  'server-export': {
    ru: 'Р’С‹РіСЂСѓР¶Р°РµС‚ РЅР°СЃС‚СЂРѕР№РєРё СЃРµСЂРІРµСЂР° РІ Р·Р°РєРѕРґРёСЂРѕРІР°РЅРЅС‹Р№ JSON-С„Р°Р№Р».',
    uk: 'Р’РёРІР°РЅС‚Р°Р¶СѓС” РЅР°Р»Р°С€С‚СѓРІР°РЅРЅСЏ СЃРµСЂРІРµСЂР° РІ Р·Р°РєРѕРґРѕРІР°РЅРёР№ JSON-С„Р°Р№Р».',
    de: 'Exportiert die Serverkonfiguration als codierte JSON-Datei.'
  },
  'server-import': {
    ru: 'РЎРѕР·РґР°С‘С‚ СЂРѕР»Рё Рё РєР°РЅР°Р»С‹ РёР· Р·Р°РєРѕРґРёСЂРѕРІР°РЅРЅРѕРіРѕ JSON-С„Р°Р№Р»Р°.',
    uk: 'РЎС‚РІРѕСЂСЋС” СЂРѕР»С– С‚Р° РєР°РЅР°Р»Рё С–Р· Р·Р°РєРѕРґРѕРІР°РЅРѕРіРѕ JSON-С„Р°Р№Р»Сѓ.',
    de: 'Erstellt Rollen und KanГ¤le aus einer codierten JSON-Datei.'
  },
  'server-rollback': {
    ru: 'Р’РѕСЃСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ СЃРµСЂРІРµСЂ РёР· РІСЂРµРјРµРЅРЅРѕРіРѕ РѕС‚РєР°С‚Р°.',
    uk: 'Р’С–РґРЅРѕРІР»СЋС” СЃРµСЂРІРµСЂ С–Р· С‚РёРјС‡Р°СЃРѕРІРѕРіРѕ РІС–РґРєР°С‚Сѓ.',
    de: 'Stellt den Server aus einem temporГ¤ren Rollback wieder her.'
  },
  template: {
    ru: 'РџСЂРёРјРµРЅСЏРµС‚ РїСѓР±Р»РёС‡РЅС‹Рµ СЃРµСЂРІРµСЂРЅС‹Рµ С€Р°Р±Р»РѕРЅС‹.',
    uk: 'Р—Р°СЃС‚РѕСЃРѕРІСѓС” РїСѓР±Р»С–С‡РЅС– СЃРµСЂРІРµСЂРЅС– С€Р°Р±Р»РѕРЅРё.',
    de: 'Wendet Г¶ffentliche Servervorlagen an.'
  },
  'template-rate': {
    ru: 'РћС†РµРЅРёРІР°РµС‚ РїСѓР±Р»РёС‡РЅС‹Р№ С€Р°Р±Р»РѕРЅ Р·РІС‘Р·РґР°РјРё.',
    uk: 'РћС†С–РЅСЋС” РїСѓР±Р»С–С‡РЅРёР№ С€Р°Р±Р»РѕРЅ Р·С–СЂРєР°РјРё.',
    de: 'Bewertet eine Г¶ffentliche Vorlage mit Sternen.'
  },
  'template-suggest': {
    ru: 'РџСЂРµРґР»Р°РіР°РµС‚ РїСѓР±Р»РёС‡РЅС‹Р№ С€Р°Р±Р»РѕРЅ РґР»СЏ Core.',
    uk: 'РџСЂРѕРїРѕРЅСѓС” РїСѓР±Р»С–С‡РЅРёР№ С€Р°Р±Р»РѕРЅ РґР»СЏ Core.',
    de: 'SchlГ¤gt eine Г¶ffentliche Vorlage fГјr Core vor.'
  },
  clear_databases: {
    ru: 'РћС‡РёС‰Р°РµС‚ СѓСЃС‚Р°СЂРµРІС€РёРµ Р·Р°РїРёСЃРё РІ Р±Р°Р·Р°С… РґР°РЅРЅС‹С….',
    uk: 'РћС‡РёС‰Р°С” Р·Р°СЃС‚Р°СЂС–Р»С– Р·Р°РїРёСЃРё РІ Р±Р°Р·Р°С… РґР°РЅРёС….',
    de: 'Entfernt veraltete DatenbankeintrГ¤ge.'
  },
  refreshcommands: {
    ru: 'РћР±РЅРѕРІР»СЏРµС‚ РєРѕРјР°РЅРґС‹ Р±РѕС‚Р°.',
    uk: 'РћРЅРѕРІР»СЋС” РєРѕРјР°РЅРґРё Р±РѕС‚Р°.',
    de: 'Aktualisiert die Bot-Befehle.'
  },
  reload: {
    ru: 'РџРµСЂРµР·Р°РіСЂСѓР¶Р°РµС‚ РјРѕРґСѓР»СЊ Р±РѕС‚Р°.',
    uk: 'РџРµСЂРµР·Р°РІР°РЅС‚Р°Р¶СѓС” РјРѕРґСѓР»СЊ Р±РѕС‚Р°.',
    de: 'LГ¤dt ein Bot-Modul neu.'
  },
  'role-template-add': {
    ru: 'Р”РѕР±Р°РІР»СЏРµС‚ РёР»Рё РѕР±РЅРѕРІР»СЏРµС‚ РїСѓР±Р»РёС‡РЅС‹Р№ С€Р°Р±Р»РѕРЅ СЂРѕР»РµР№.',
    uk: 'Р”РѕРґР°С” Р°Р±Рѕ РѕРЅРѕРІР»СЋС” РїСѓР±Р»С–С‡РЅРёР№ С€Р°Р±Р»РѕРЅ СЂРѕР»РµР№.',
    de: 'FГјgt eine Г¶ffentliche Rollenvorlage hinzu oder aktualisiert sie.'
  },
  'template-add': {
    ru: 'Р”РѕР±Р°РІР»СЏРµС‚ РёР»Рё РѕР±РЅРѕРІР»СЏРµС‚ РїСѓР±Р»РёС‡РЅС‹Р№ СЃРµСЂРІРµСЂРЅС‹Р№ С€Р°Р±Р»РѕРЅ.',
    uk: 'Р”РѕРґР°С” Р°Р±Рѕ РѕРЅРѕРІР»СЋС” РїСѓР±Р»С–С‡РЅРёР№ СЃРµСЂРІРµСЂРЅРёР№ С€Р°Р±Р»РѕРЅ.',
    de: 'FГјgt eine Г¶ffentliche Servervorlage hinzu oder aktualisiert sie.'
  },
  'templete-delete': {
    ru: 'РЈРґР°Р»СЏРµС‚ РїСѓР±Р»РёС‡РЅС‹Р№ С€Р°Р±Р»РѕРЅ.',
    uk: 'Р’РёРґР°Р»СЏС” РїСѓР±Р»С–С‡РЅРёР№ С€Р°Р±Р»РѕРЅ.',
    de: 'LГ¶scht eine Г¶ffentliche Vorlage.'
  },
  'welcome-preview': {
    ru: 'РџРѕРєР°Р·С‹РІР°РµС‚ РїСЂРёРІРµС‚СЃС‚РІРµРЅРЅРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ РІ Р»РёС‡РЅС‹С… СЃРѕРѕР±С‰РµРЅРёСЏС….',
    uk: 'РџРѕРєР°Р·СѓС” РІС–С‚Р°Р»СЊРЅРµ РїРѕРІС–РґРѕРјР»РµРЅРЅСЏ РІ РѕСЃРѕР±РёСЃС‚РёС… РїРѕРІС–РґРѕРјР»РµРЅРЅСЏС….',
    de: 'Zeigt die Willkommensnachricht als Direktnachricht.'
  },
  say: { ru: 'РћС‚РїСЂР°РІР»СЏРµС‚ СЃРѕРѕР±С‰РµРЅРёРµ РѕС‚ РёРјРµРЅРё Р±РѕС‚Р°.', uk: 'РќР°РґСЃРёР»Р°С” РїРѕРІС–РґРѕРјР»РµРЅРЅСЏ РІС–Рґ С–РјРµРЅС– Р±РѕС‚Р°.', de: 'Sendet eine Nachricht als Bot.' },
  shutdown: { ru: 'Р’С‹РєР»СЋС‡Р°РµС‚ Р±РѕС‚Р°.', uk: 'Р’РёРјРёРєР°С” Р±РѕС‚Р°.', de: 'Schaltet den Bot aus.' },
  ban: { ru: 'Р‘Р°РЅРёС‚ РѕРґРЅРѕРіРѕ РёР»Рё РЅРµСЃРєРѕР»СЊРєРёС… СѓС‡Р°СЃС‚РЅРёРєРѕРІ.', uk: 'Р‘Р°РЅРёС‚СЊ РѕРґРЅРѕРіРѕ Р°Р±Рѕ РєС–Р»СЊРєРѕС… СѓС‡Р°СЃРЅРёРєС–РІ.', de: 'Bannt ein oder mehrere Mitglieder.' },
  kick: { ru: 'Р’С‹РіРѕРЅСЏРµС‚ РѕРґРЅРѕРіРѕ РёР»Рё РЅРµСЃРєРѕР»СЊРєРёС… СѓС‡Р°СЃС‚РЅРёРєРѕРІ.', uk: 'Р’РёРіР°РЅСЏС” РѕРґРЅРѕРіРѕ Р°Р±Рѕ РєС–Р»СЊРєРѕС… СѓС‡Р°СЃРЅРёРєС–РІ.', de: 'Kickt ein oder mehrere Mitglieder.' },
  mute: { ru: 'Р’С‹РґР°С‘С‚ РјСѓС‚ РѕРґРЅРѕРјСѓ РёР»Рё РЅРµСЃРєРѕР»СЊРєРёРј СѓС‡Р°СЃС‚РЅРёРєР°Рј.', uk: 'Р’РёРґР°С” РјСѓС‚ РѕРґРЅРѕРјСѓ Р°Р±Рѕ РєС–Р»СЊРєРѕРј СѓС‡Р°СЃРЅРёРєР°Рј.', de: 'Schaltet ein oder mehrere Mitglieder stumm.' },
  unmute: { ru: 'РЎРЅРёРјР°РµС‚ РІСЂРµРјРµРЅРЅС‹Р№ РјСѓС‚.', uk: 'Р—РЅС–РјР°С” С‚РёРјС‡Р°СЃРѕРІРёР№ РјСѓС‚.', de: 'Entfernt eine temporГ¤re Stummschaltung.' },
  unban: { ru: 'РЎРЅРёРјР°РµС‚ Р±Р°РЅ РїРѕ ID РёР»Рё СѓРїРѕРјРёРЅР°РЅРёСЋ.', uk: 'Р—РЅС–РјР°С” Р±Р°РЅ Р·Р° ID Р°Р±Рѕ Р·РіР°РґРєРѕСЋ.', de: 'Entbannt per ID oder ErwГ¤hnung.' },
  warn: { ru: 'Р’С‹РґР°С‘С‚ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёРµ СѓС‡Р°СЃС‚РЅРёРєР°Рј.', uk: 'Р’РёРґР°С” РїРѕРїРµСЂРµРґР¶РµРЅРЅСЏ СѓС‡Р°СЃРЅРёРєР°Рј.', de: 'Warnt Mitglieder.' },
  warns: { ru: 'РџРѕРєР°Р·С‹РІР°РµС‚ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ СѓС‡Р°СЃС‚РЅРёРєР°.', uk: 'РџРѕРєР°Р·СѓС” РїРѕРїРµСЂРµРґР¶РµРЅРЅСЏ СѓС‡Р°СЃРЅРёРєР°.', de: 'Zeigt Verwarnungen eines Mitglieds.' },
  remwarn: { ru: 'РЈРґР°Р»СЏРµС‚ РІС‹Р±СЂР°РЅРЅС‹Рµ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ.', uk: 'Р’РёРґР°Р»СЏС” РІРёР±СЂР°РЅС– РїРѕРїРµСЂРµРґР¶РµРЅРЅСЏ.', de: 'Entfernt ausgewГ¤hlte Verwarnungen.' },
  clearwarns: { ru: 'РћС‡РёС‰Р°РµС‚ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ СѓС‡Р°СЃС‚РЅРёРєР° РёР»Рё СЃРµСЂРІРµСЂР°.', uk: 'РћС‡РёС‰Р°С” РїРѕРїРµСЂРµРґР¶РµРЅРЅСЏ СѓС‡Р°СЃРЅРёРєР° Р°Р±Рѕ СЃРµСЂРІРµСЂР°.', de: 'Leert Verwarnungen eines Mitglieds oder Servers.' },
  clear: { ru: 'РћС‡РёС‰Р°РµС‚ СЃРѕРѕР±С‰РµРЅРёСЏ РІ РєР°РЅР°Р»Рµ.', uk: 'РћС‡РёС‰Р°С” РїРѕРІС–РґРѕРјР»РµРЅРЅСЏ РІ РєР°РЅР°Р»С–.', de: 'LГ¶scht Nachrichten im Kanal.' },
  slowmode: { ru: 'РќР°СЃС‚СЂР°РёРІР°РµС‚ РјРµРґР»РµРЅРЅС‹Р№ СЂРµР¶РёРј РєР°РЅР°Р»Р°.', uk: 'РќР°Р»Р°С€С‚РѕРІСѓС” РїРѕРІС–Р»СЊРЅРёР№ СЂРµР¶РёРј РєР°РЅР°Р»Сѓ.', de: 'Stellt den Slowmode des Kanals ein.' },
  levels: { ru: 'РџРѕРєР°Р·С‹РІР°РµС‚ СѓСЂРѕРІРµРЅСЊ СѓС‡Р°СЃС‚РЅРёРєР°.', uk: 'РџРѕРєР°Р·СѓС” СЂС–РІРµРЅСЊ СѓС‡Р°СЃРЅРёРєР°.', de: 'Zeigt das Level eines Mitglieds.' },
  level: { ru: 'РЈРїСЂР°РІР»СЏРµС‚ СѓСЂРѕРІРЅРµРј Рё РѕРїС‹С‚РѕРј СѓС‡Р°СЃС‚РЅРёРєРѕРІ.', uk: 'РљРµСЂСѓС” СЂС–РІРЅРµРј С– РґРѕСЃРІС–РґРѕРј СѓС‡Р°СЃРЅРёРєС–РІ.', de: 'Verwaltet Level und Erfahrung.' },
  top: { ru: 'РџРѕРєР°Р·С‹РІР°РµС‚ С‚РѕРї СѓС‡Р°СЃС‚РЅРёРєРѕРІ.', uk: 'РџРѕРєР°Р·СѓС” С‚РѕРї СѓС‡Р°СЃРЅРёРєС–РІ.', de: 'Zeigt die Rangliste.' },
  reset: { ru: 'РЎР±СЂР°СЃС‹РІР°РµС‚ РґР°РЅРЅС‹Рµ СѓСЂРѕРІРЅРµР№ Рё РІСЂРµРјРµРЅРё.', uk: 'РЎРєРёРґР°С” РґР°РЅС– СЂС–РІРЅС–РІ С– С‡Р°СЃСѓ.', de: 'Setzt Level- und Zeitdaten zurГјck.' },
  export: {
    ru: 'Р­РєСЃРїРѕСЂС‚РёСЂСѓРµС‚ РґР°РЅРЅС‹Рµ СЌС‚РѕРіРѕ СЃРµСЂРІРµСЂР°.',
    uk: 'Р•РєСЃРїРѕСЂС‚СѓС” РґР°РЅС– С†СЊРѕРіРѕ СЃРµСЂРІРµСЂР°.',
    de: 'Exportiert Daten dieses Servers.'
  },
  import: {
    ru: 'РРјРїРѕСЂС‚РёСЂСѓРµС‚ РґР°РЅРЅС‹Рµ РёР· С„Р°Р№Р»Р° РёР»Рё РїСѓР±Р»РёС‡РЅРѕРіРѕ С€Р°Р±Р»РѕРЅР°.',
    uk: 'Р†РјРїРѕСЂС‚СѓС” РґР°РЅС– Р· С„Р°Р№Р»Сѓ Р°Р±Рѕ РїСѓР±Р»С–С‡РЅРѕРіРѕ С€Р°Р±Р»РѕРЅСѓ.',
    de: 'Importiert Daten aus einer Datei oder Г¶ffentlichen Vorlage.'
  },
  send: {
    ru: 'РџСЂРёРјРµРЅСЏРµС‚ РїСѓР±Р»РёС‡РЅС‹Р№ С€Р°Р±Р»РѕРЅ РїРѕСЃР»Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ.',
    uk: 'Р—Р°СЃС‚РѕСЃРѕРІСѓС” РїСѓР±Р»С–С‡РЅРёР№ С€Р°Р±Р»РѕРЅ РїС–СЃР»СЏ РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ.',
    de: 'Wendet eine Г¶ffentliche Vorlage nach BestГ¤tigung an.'
  },
  preview: {
    ru: 'РџРѕРєР°Р·С‹РІР°РµС‚ РїСЂРµРІСЊСЋ С€Р°Р±Р»РѕРЅР°.',
    uk: 'РџРѕРєР°Р·СѓС” РїРµСЂРµРіР»СЏРґ С€Р°Р±Р»РѕРЅСѓ.',
    de: 'Zeigt eine Vorlagenvorschau.'
  },
  list: {
    ru: 'РџРѕРєР°Р·С‹РІР°РµС‚ РґРѕСЃС‚СѓРїРЅС‹Рµ РїСѓР±Р»РёС‡РЅС‹Рµ С€Р°Р±Р»РѕРЅС‹.',
    uk: 'РџРѕРєР°Р·СѓС” РґРѕСЃС‚СѓРїРЅС– РїСѓР±Р»С–С‡РЅС– С€Р°Р±Р»РѕРЅРё.',
    de: 'Zeigt verfГјgbare Г¶ffentliche Vorlagen.'
  }
};

const OPTION_DESCRIPTION_LOCALIZATIONS = {
  user_ids: {
    ru: 'ID РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РёР»Рё СѓРїРѕРјРёРЅР°РЅРёСЏ С‡РµСЂРµР· РїСЂРѕР±РµР» РёР»Рё Р·Р°РїСЏС‚СѓСЋ.',
    uk: 'ID РєРѕСЂРёСЃС‚СѓРІР°С‡С–РІ Р°Р±Рѕ Р·РіР°РґРєРё С‡РµСЂРµР· РїСЂРѕР±С–Р» С‡Рё РєРѕРјСѓ.',
    de: 'Nutzer-IDs oder ErwГ¤hnungen, getrennt durch Leerzeichen oder Kommas.'
  },
  file: {
    ru: 'Р—Р°РєРѕРґРёСЂРѕРІР°РЅРЅС‹Р№ JSON-С„Р°Р№Р» Core.',
    uk: 'Р—Р°РєРѕРґРѕРІР°РЅРёР№ JSON-С„Р°Р№Р» Core.',
    de: 'Codierte Core-JSON-Datei.'
  },
  template: {
    ru: 'РљР»СЋС‡ РїСѓР±Р»РёС‡РЅРѕРіРѕ С€Р°Р±Р»РѕРЅР°.',
    uk: 'РљР»СЋС‡ РїСѓР±Р»С–С‡РЅРѕРіРѕ С€Р°Р±Р»РѕРЅСѓ.',
    de: 'SchlГјssel der Г¶ffentlichen Vorlage.'
  },
  channel: {
    ru: 'РљР°РЅР°Р» РґР»СЏ РѕС‚РїСЂР°РІРєРё. РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ С‚РµРєСѓС‰РёР№ РєР°РЅР°Р».',
    uk: 'РљР°РЅР°Р» РґР»СЏ РЅР°РґСЃРёР»Р°РЅРЅСЏ. Р—Р° Р·Р°РјРѕРІС‡СѓРІР°РЅРЅСЏРј РїРѕС‚РѕС‡РЅРёР№ РєР°РЅР°Р».',
    de: 'Zielkanal. StandardmГ¤Гџig der aktuelle Kanal.'
  },
  prompt: {
    ru: 'РћРїРёС€РёС‚Рµ, РєР°РєРѕР№ СЃРµСЂРІРµСЂ РЅСѓР¶РЅРѕ СЃРѕР·РґР°С‚СЊ.',
    uk: 'РћРїРёС€С–С‚СЊ, СЏРєРёР№ СЃРµСЂРІРµСЂ РїРѕС‚СЂС–Р±РЅРѕ СЃС‚РІРѕСЂРёС‚Рё.',
    de: 'Beschreibe, welcher Server erstellt werden soll.'
  },
  delete_existing: {
    ru: 'РЈРґР°Р»РёС‚СЊ С‚РµРєСѓС‰РёРµ РєР°РЅР°Р»С‹ Рё СЂРѕР»Рё РїРµСЂРµРґ РїСЂРёРјРµРЅРµРЅРёРµРј.',
    uk: 'Р’РёРґР°Р»РёС‚Рё РїРѕС‚РѕС‡РЅС– РєР°РЅР°Р»Рё С‚Р° СЂРѕР»С– РїРµСЂРµРґ Р·Р°СЃС‚РѕСЃСѓРІР°РЅРЅСЏРј.',
    de: 'Aktuelle KanГ¤le und Rollen vorher lГ¶schen.'
  },
  name: {
    ru: 'РќР°Р·РІР°РЅРёРµ С€Р°Р±Р»РѕРЅР°.',
    uk: 'РќР°Р·РІР° С€Р°Р±Р»РѕРЅСѓ.',
    de: 'Name der Vorlage.'
  },
  description: {
    ru: 'РљРѕСЂРѕС‚РєРѕРµ РѕРїРёСЃР°РЅРёРµ.',
    uk: 'РљРѕСЂРѕС‚РєРёР№ РѕРїРёСЃ.',
    de: 'Kurze Beschreibung.'
  },
  stars: {
    ru: 'РћС†РµРЅРєР° РѕС‚ 1 РґРѕ 5.',
    uk: 'РћС†С–РЅРєР° РІС–Рґ 1 РґРѕ 5.',
    de: 'Bewertung von 1 bis 5.'
  },
  command: {
    ru: 'РќР°Р·РІР°РЅРёРµ РєРѕРјР°РЅРґС‹.',
    uk: 'РќР°Р·РІР° РєРѕРјР°РЅРґРё.',
    de: 'Befehlsname.'
  },
  message: {
    ru: 'РўРµРєСЃС‚ СЃРѕРѕР±С‰РµРЅРёСЏ.',
    uk: 'РўРµРєСЃС‚ РїРѕРІС–РґРѕРјР»РµРЅРЅСЏ.',
    de: 'Nachrichtentext.'
  }
};

function mergeLocalizations(target, field, values) {
  if (!values || !Object.keys(values).length) return;
  target[field] = {
    ...(target[field] || {}),
    ...values
  };
}

function isSafeLocalizedCommandName(value) {
  return typeof value === 'string' && /^[a-z0-9_-]{1,32}$/.test(value);
}

function isSafeLocalizedDescription(value) {
  return typeof value === 'string' && /^[\x09\x0A\x0D\x20-\x7E]{1,100}$/.test(value);
}

function cleanLocalizationMap(target, field, validator) {
  if (!target?.[field] || typeof target[field] !== 'object') return;

  const cleaned = Object.fromEntries(
    Object.entries(target[field]).filter(([, value]) => validator(value))
  );

  if (Object.keys(cleaned).length) {
    target[field] = cleaned;
  } else {
    delete target[field];
  }
}

function sanitizeCommandLocalizations(node) {
  if (!node || typeof node !== 'object') return node;

  cleanLocalizationMap(node, 'name_localizations', isSafeLocalizedCommandName);
  cleanLocalizationMap(node, 'description_localizations', isSafeLocalizedDescription);

  if (Array.isArray(node.options)) {
    node.options.forEach(sanitizeCommandLocalizations);
  }

  if (Array.isArray(node.choices)) {
    node.choices.forEach(sanitizeCommandLocalizations);
  }

  return node;
}

function localizeNode(node, depth = 0) {
  if (!node || typeof node !== 'object') return node;

  const name = String(node.name || '');
  mergeLocalizations(node, 'name_localizations', NAME_LOCALIZATIONS[name]);
  if (node.description) {
    const isOption = depth > 0 && ![1, 2].includes(Number(node.type));
    mergeLocalizations(
      node,
      'description_localizations',
      isOption
        ? OPTION_DESCRIPTION_LOCALIZATIONS[name] || DESCRIPTION_LOCALIZATIONS[name]
        : DESCRIPTION_LOCALIZATIONS[name]
    );
  }

  if (Array.isArray(node.options)) {
    node.options.forEach((option) => localizeNode(option, depth + 1));
  }

  if (Array.isArray(node.choices)) {
    node.choices.forEach((choice) => {
      const choiceName = String(choice.name || '');
      mergeLocalizations(choice, 'name_localizations', NAME_LOCALIZATIONS[choiceName]);
    });
  }

  return node;
}

function applyCommandLocalizations(payload) {
  return sanitizeCommandLocalizations(localizeNode(payload));
}

module.exports = {
  applyCommandLocalizations,
  sanitizeCommandLocalizations
};
