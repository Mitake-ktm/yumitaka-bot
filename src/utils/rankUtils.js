function getProcessedAvatar(user) {
    let avatarUrl = user.displayAvatarURL({ size: 256, dynamic: true });
    return avatarUrl.replace('.gif', '.png');
  }
  
function calculateRank(levels, targetUserId) {
    levels.sort((a, b) => {
    if (a.level === b.level) {
        return b.xp - a.xp;
    } else {
        return b.level - a.level;
    }
    });

    return levels.findIndex((lvl) => lvl.userId === targetUserId) + 1;
}
  
  module.exports = { getProcessedAvatar, calculateRank };