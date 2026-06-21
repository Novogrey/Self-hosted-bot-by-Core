const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config({ quiet: true });
const { DEV } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Перезагружает бота.')
        .setDefaultMemberPermissions(0), // Установите необходимые права для использования команды, если нужно
    async execute(interaction) {
        if (interaction.user.id !== DEV) { // Замените на ваш Discord ID
            return interaction.reply({ content: 'У вас нет прав на перезагрузку бота.', ephemeral: true });
        }

        await interaction.reply({ content: 'Перезагрузка...', ephemeral: true });

        console.log('Перезагрузка бота...');

        process.exit(1); // Завершение процесса, что приведет к перезапуску бота, если настроено.
    },
};
