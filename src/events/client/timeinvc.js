const chalk = require('chalk');

// Переключатель для включения/выключения отслеживания голосовой активности
const VOICE_TRACKING_ENABLED = process.env.VOICE_TRACKING_ENABLED !== 'false';

// Хранилище времени входа пользователей в голосовые каналы
const userJoinTimes = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        // Skip if voice tracking is disabled
        if (!VOICE_TRACKING_ENABLED) {
            return;
        }

        // Check database connection
        if (!client.connections?.users) {
            console.log(chalk.yellow(`[${new Date().toISOString()}] [VoiceTracking] Warning: users_db connection is not available. Cannot process voiceStateUpdate for user ${oldState.id || newState.id}`));
            return;
        }

        // Create Level model
        let Level;
        try {
            Level = client.connections.users.model('Level', require('../../schemas/levelSchema'));
        } catch (error) {
            console.error(chalk.red(`[${new Date().toISOString()}] [VoiceTracking] Error creating Level model: ${error.message}`));
            return;
        }

        // Пользователь вышел из голосового канала
        if (oldState.channel && !newState.channel) {
            const userId = oldState.id;
            const guildId = oldState.guild.id;
            const joinTime = userJoinTimes.get(userId);
            if (joinTime) {
                try {
                    const timeInVoice = Date.now() - joinTime;
                    userJoinTimes.delete(userId);

                    // Проверяем или создаем запись пользователя
                    let user = await Level.findOne({ userId, guildID: guildId }).catch(error => {
                        console.error(chalk.red(`[${new Date().toISOString()}] [VoiceTracking] Error fetching user ${userId} in guild ${guildId}: ${error.message}`));
                        return null;
                    });
                    if (!user) {
                        user = new Level({
                            userId,
                            guildID: guildId,
                            level: 1,
                            experience: 0,
                            voiceTime: 0
                        });
                        console.log(chalk.yellow(`[${new Date().toISOString()}] [VoiceTracking] Created new Level document for user ${userId} in guild ${guildId}`));
                    }

                    // Обновляем время в голосовом канале
                    user.voiceTime += Math.floor(timeInVoice / 1000);
                    await user.save().catch(error => {
                        console.error(chalk.red(`[${new Date().toISOString()}] [VoiceTracking] Error saving voice time for user ${userId}: ${error.message}`));
                        throw error;
                    });
                    console.log(chalk.green(`[${new Date().toISOString()}] [VoiceTracking] Voice time updated for user ${userId} in guild ${guildId}: ${Math.floor(timeInVoice / 1000)} seconds`));
                } catch (error) {
                    console.error(chalk.red(`[${new Date().toISOString()}] [VoiceTracking] Error processing voiceStateUpdate (exit) for user ${userId}: ${error.message}`));
                }
            }
        }

        // Пользователь вошёл в голосовой канал
        if (!oldState.channel && newState.channel) {
            const userId = newState.id;
            try {
                userJoinTimes.set(userId, Date.now());
                console.log(chalk.green(`[${new Date().toISOString()}] [VoiceTracking] User ${userId} joined voice channel ${newState.channel.name} in guild ${newState.guild.id}`));
            } catch (error) {
                console.error(chalk.red(`[${new Date().toISOString()}] [VoiceTracking] Error processing voiceStateUpdate (join) for user ${userId}: ${error.message}`));
            }
        }
    }
};
