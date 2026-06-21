const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config({ quiet: true });
const { DEV } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Отключить бота.'),
    async execute(interaction) {
        // Проверка прав пользователя
        if (interaction.user.id !== DEV) { // Замените на ваш Discord ID
            return interaction.reply('У вас нет прав для выполнения этой команды.');
        }

        // Отправляем сообщение пользователю
        await interaction.reply({ content: 'Бот отключается...', ephemeral: true });

        // Завершаем работу процесса
        process.exit(0); // Успешное завершение
    },
};
