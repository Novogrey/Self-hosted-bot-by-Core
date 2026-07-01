const { MessageFlags } = require('discord.js');

const SCAM_TRAP_BAN_REASON = 'Scam advertisements / malicious advertising';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const DEFAULT_SCAM_TRAP_NOTICE_PAYLOAD = {
  flags: MessageFlags.IsComponentsV2,
  components: [
    {
      type: 17,
      components: [
        {
          type: 10,
          content: '# ⚠️ __НЕ ПИШИТЕ В ЭТОТ КАНАЛ__\n\nВ связи с участившимися случаями взломанных аккаунтов и self-host ботов, распространяющих мошенническую рекламу, данный канал используется для автоматического выявления подобных сообщений.\n\n**Запрещено отправлять сюда любые сообщения при любых обстоятельствах.** Любое нарушение приведёт к **перманентному бану без права на апелляцию**.\n\n🔒 Не передавайте данные своего аккаунта третьим лицам, используйте **2FA**, надёжный пароль и не переходите по подозрительным ссылкам.\n'
        },
        {
          type: 14,
          spacing: 2
        },
        {
          type: 10,
          content: '# ⚠️ __DO NOT WRITE IN THIS CHANNEL__\n\nDue to increased cases of compromised accounts and self-host bots spreading scam advertisements, this channel is used to automatically detect such messages.\n\n**Sending any messages here is strictly prohibited under any circumstances.** Violation will result in a **permanent ban without the right to appeal**.\n\n🔒 Do not share your account credentials, enable **2FA**, use a strong password, and avoid suspicious links.'
        },
        {
          type: 14
        }
      ]
    }
  ],
  allowedMentions: { parse: [], repliedUser: false }
};

const DEFAULT_SCAM_TRAP_DM_PAYLOAD = {
  flags: MessageFlags.IsComponentsV2,
  components: [
    {
      type: 17,
      accent_color: 15548997,
      components: [
        {
          type: 10,
          content: '## Account security action\nYou were permanently banned from **{{server}}** after sending a message in the protected scam-detection channel.'
        },
        {
          type: 14
        },
        {
          type: 10,
          content: '**Reason**\n{{reason}}\n\n**Channel**\n{{channel}}\n\nIf your account was compromised, reset your password, enable 2FA, and review connected apps before contacting server staff.'
        }
      ]
    }
  ],
  allowedMentions: { parse: [], repliedUser: false }
};

function defaultScamTrapNoticePayload() {
  return clone(DEFAULT_SCAM_TRAP_NOTICE_PAYLOAD);
}

function defaultScamTrapDmPayload() {
  return clone(DEFAULT_SCAM_TRAP_DM_PAYLOAD);
}

module.exports = {
  SCAM_TRAP_BAN_REASON,
  defaultScamTrapDmPayload,
  defaultScamTrapNoticePayload
};
