const {getProcessedAvatar, calculateRank} = require('../../utils/rankUtils')
const { Font, RankCardBuilder } = require('canvacord');
const { ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const calculateLevelXp = require('../../utils/calculateLevelXp');
const Level = require('../../models/Level');

module.exports = {
  callback: async (client, interaction) => {
    try {
    if (!interaction.inGuild()) {
      interaction.reply('You can only run this command inside a server.');
      return;
    }

    await interaction.deferReply();

    const mentionedUserId = interaction.options.get('target-user')?.value;
    const targetUserId = mentionedUserId || interaction.member.id;
    const targetUserObj = await interaction.guild.members.fetch(targetUserId);

    Font.loadDefault();

    const fetchedLevel = await Level.findOne({
      userId: targetUserId,
      guildId: interaction.guild.id,
    });

    if (!fetchedLevel) {
      interaction.editReply(
        mentionedUserId
          ? `${targetUserObj.user.tag} n'a pas encore de niveau. Encourage-le à participer plus !`
          : "tu n'as aucun niveau ici. Continue a parler pour en avoir"
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

    let avatarUrl = getProcessedAvatar(targetUserObj.user);
    let currentRank = calculateRank(allLevels, targetUserId);
    
    const rankCard = new RankCardBuilder()
      .setAvatar(avatarUrl)
      .setCurrentXP(fetchedLevel.xp)
      .setRequiredXP(calculateLevelXp(fetchedLevel.level))
      .setLevel(fetchedLevel.level)
      .setRank(currentRank)
      .setStatus(targetUserObj.presence?.status || 'offline')
      .setProgressCalculator((current, required) => (current / required) * 100)
      .setBackground("#8e44ad")
      .setStyles({
        progressbar: {
          track: { fill: '#333333', style: {
            backgroundColor: "black",
          } },
          thumb: { fill: '#FFC300', style: {
            backgroundColor: "#C585E6",
          } },
        },
        
      });
    
    const data = await rankCard.build({ format: 'png' });
    const attachment = new AttachmentBuilder(data, { name: 'rankCard.png' });
    
    interaction.editReply({ files: [attachment] });
    
  } catch(error){
    console.error('Error executing the level command:', error);
    interaction.editReply('Oups, une erreur est survenue en générant la carte. Réessaie plus tard ou contacte un admin.')
  }
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
