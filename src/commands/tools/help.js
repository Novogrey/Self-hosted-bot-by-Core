const {
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  resolveColor
} = require('discord.js');

function commandRows(client) {
  const grouped = new Map();
  for (const command of client.commands.values()) {
    const category = command.category || 'tools';
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(command.data?.name || 'unknown');
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, commands]) => `**${category}**\n${commands.sort().map((name) => `/${name}`).join(', ')}`);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows available commands and access levels.')
    .setDMPermission(false),

  async execute(interaction, client) {
    const rows = commandRows(client);
    const container = new ContainerBuilder()
      .setAccentColor(resolveColor('#43C7B2'))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('## Self-hosted bot help'))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('Команды ниже зависят от включённых модулей и отключений в desktop-приложении.'))
      .addSeparatorComponents(new SeparatorBuilder());

    for (const row of rows.slice(0, 12)) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(row.slice(0, 3900)));
    }

    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent([
        '**AdminRole уровни доступа**',
        'Level 0: служебные owner/developer команды.',
        'Level 1: сильная модерация и очистка варнов.',
        'Level 2: remwarn и временный ban.',
        'Level 3: mute, unmute, slowmode.',
        'Level 4: warn, warns, clear.',
        'В настройках вводятся ID ролей через запятую.'
      ].join('\n')));

    return interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [container],
      allowedMentions: { parse: [], repliedUser: false }
    });
  }
};
