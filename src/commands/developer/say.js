const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config({ quiet: true });
const { ADMIN_ROLES_LEVEL_0, DEV } = process.env;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Sends a message with the specified text.')
        .addStringOption(option => 
            option.setName('text')
                .setDescription('The text to send')
                .setRequired(true)),

    async execute(interaction) {
        // Проверка на наличие одной из разрешенных ролей
        const allowedRoles = ADMIN_ROLES_LEVEL_0 ? ADMIN_ROLES_LEVEL_0.split(',') : [];
        if (interaction.user.id !== DEV && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const text = interaction.options.getString('text');

        // Отправка подтверждения
        await interaction.reply({ content: 'Task completed!', ephemeral: true });

        // Отправка не эфемерного сообщения
        await interaction.channel.send(text);
    }
};
