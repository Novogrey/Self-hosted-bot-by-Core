const {
  ContainerBuilder,
  FileBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
  resolveColor
} = require('discord.js');

function formatTemplate(template, values = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => {
    return values[key] === undefined || values[key] === null ? `{${key}}` : String(values[key]);
  });
}

function buildStatusComponents({ title, description, fields = [], attachmentUrls = [], footer, color = '#FF5D00' }) {
  const container = new ContainerBuilder()
    .setAccentColor(resolveColor(color))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));

  if (description) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
  }

  if (fields.length) {
    container.addSeparatorComponents(new SeparatorBuilder());
    for (const field of fields) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${field.name}**\n${field.value}`)
      );
    }
  }

  if (attachmentUrls.length) {
    container.addSeparatorComponents(new SeparatorBuilder());
    for (const url of attachmentUrls) {
      container.addFileComponents(new FileBuilder({ file: { url } }));
    }
  }

  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(footer || `-# <t:${Math.floor(Date.now() / 1000)}:f>`)
  );

  return [container];
}

function v2Flags(ephemeral = true) {
  return ephemeral ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral : MessageFlags.IsComponentsV2;
}

module.exports = {
  buildStatusComponents,
  formatTemplate,
  v2Flags
};
