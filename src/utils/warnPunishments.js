const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const DEFAULT_WARN_PUNISHMENTS = Object.freeze([
  { warnings: 2, type: 'mute', durationMs: 30 * MINUTE },
  { warnings: 4, type: 'mute', durationMs: 2 * HOUR },
  { warnings: 6, type: 'mute', durationMs: 5 * HOUR },
  { warnings: 7, type: 'mute', durationMs: 10 * HOUR },
  { warnings: 8, type: 'ban', durationMs: 1 * DAY },
  { warnings: 10, type: 'ban', durationMs: 10 * DAY },
  { warnings: 12, type: 'ban', durationMs: 31 * DAY },
  { warnings: 14, type: 'ban', durationMs: 183 * DAY },
  { warnings: 16, type: 'ban', durationMs: 365 * DAY }
]);

function parseDuration(value) {
  const match = String(value || '').trim().match(/^(\d+)(s|m|h|d|w)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 's') return amount * 1000;
  if (unit === 'm') return amount * MINUTE;
  if (unit === 'h') return amount * HOUR;
  if (unit === 'd') return amount * DAY;
  if (unit === 'w') return amount * 7 * DAY;
  return null;
}

function loadWarnPunishments() {
  const configured = String(process.env.WARN_PUNISHMENTS || '').trim();
  if (!configured) return DEFAULT_WARN_PUNISHMENTS.map((entry) => ({ ...entry }));

  const parsed = configured
    .split(',')
    .map((entry) => {
      const [warnings, type, duration] = entry.split(':').map((part) => String(part || '').trim());
      const count = Number(warnings);
      if (!Number.isInteger(count) || count <= 0) return null;
      if (!['mute', 'ban', 'permanentBan'].includes(type)) return null;
      const durationMs = type === 'permanentBan' ? null : parseDuration(duration);
      if (type !== 'permanentBan' && !durationMs) return null;
      return { warnings: count, type, durationMs };
    })
    .filter(Boolean)
    .sort((left, right) => left.warnings - right.warnings);

  return parsed.length ? parsed : DEFAULT_WARN_PUNISHMENTS.map((entry) => ({ ...entry }));
}

function getWarnPunishment(warningCount) {
  const count = Number(warningCount);
  const punishment = loadWarnPunishments().find((entry) => entry.warnings === count);
  return punishment ? { ...punishment } : null;
}

module.exports = {
  WARN_PUNISHMENTS: DEFAULT_WARN_PUNISHMENTS,
  getWarnPunishment
};
