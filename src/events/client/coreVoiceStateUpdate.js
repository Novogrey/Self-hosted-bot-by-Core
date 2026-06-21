const { logVoiceStateUpdate } = require('../../utils/coreServerLogs');
const { syncVoiceRolesForMember } = require('../../utils/voiceRoleRewards');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    await logVoiceStateUpdate(oldState, newState);
    const member = newState.member || oldState.member || await newState.guild.members.fetch(newState.id).catch(() => null);
    if (member) {
      await syncVoiceRolesForMember(member, oldState.channelId);
    }
  }
};
