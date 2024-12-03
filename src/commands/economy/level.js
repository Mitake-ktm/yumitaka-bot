const { Font, RankCardBuilder } = require('canvacord');
const { Client, Interaction, ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const calculateLevelXp = require('../../utils/calculateLevelXp');
const Level = require('../../models/Level');

module.exports = {
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      interaction.reply('You can only run this command inside a server.');
      return;
    }

    await interaction.deferReply();

    const mentionedUserId = interaction.options.get('target-user')?.value;
    const targetUserId = mentionedUserId || interaction.member.id;
    const targetUserObj = await interaction.guild.members.fetch(targetUserId);

    const fetchedLevel = await Level.findOne({
      userId: targetUserId,
      guildId: interaction.guild.id,
    });

    if (!fetchedLevel) {
      interaction.editReply(
        mentionedUserId
          ? `${targetUserObj.user.tag} doesn't have any levels yet.`
          : "You don't have any levels yet."
      );
      return;
    }

    let allLevels = await Level.find({ guildId: interaction.guild.id }).select(
      '-_id userId level xp'
    );

    allLevels.sort((a, b) => {
      if (a.level === b.level) {
        return b.xp - a.xp;
      } else {
        return b.level - a.level;
      }
    });

    let currentRank = allLevels.findIndex((lvl) => lvl.userId === targetUserId) + 1;
    Font.loadDefault();

    let avatarUrl = targetUserObj.user.displayAvatarURL({
      size: 256,
      dynamic: true,
    });
    
    avatarUrl = avatarUrl.replace('.gif', '.png');
    
    const rankCard = new RankCardBuilder()
      .setAvatar(avatarUrl)
      .setCurrentXP(fetchedLevel.xp)
      .setRequiredXP(calculateLevelXp(fetchedLevel.level))
      .setLevel(fetchedLevel.level)
      .setRank(currentRank)
      .setStatus(targetUserObj.presence?.status || 'offline')
      .setProgressCalculator((current, required) => (current / required) * 100)
      .setStyles({
        progressbar: {
          track: { fill: '#333333' },
          thumb: { fill: '#FFC300' },
        },
      });
    
    const data = await rankCard.build({ format: 'png' });
    const attachment = new AttachmentBuilder(data, { name: 'rankCard.png' });
    
    interaction.editReply({ files: [attachment] });
    
  },

  name: 'level',
  description: "Shows your/someone's level.",
  options: [
    {
      name: 'target-user',
      description: 'The user whose level you want to see.',
      type: ApplicationCommandOptionType.Mentionable,
    },
  ],
};
