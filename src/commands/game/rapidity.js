const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

async function recupererMotsAleatoiresAPI(nombreMots) {
    const url = `https://random-word-api.herokuapp.com/word?number=${nombreMots}`;
    try {
        const reponse = await fetch(url);
        const mots = await reponse.json();
        return mots;
    } catch (erreur) {
        console.error("Erreur lors de la récupération des mots depuis l'API :", erreur);
        return [];
    }
}

function afficherResultat(interaction, score, nbMotsProposes) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Résultats du jeu')
        .setDescription(`Vous avez obtenu ${score} points sur ${nbMotsProposes}.`);

    interaction.followUp({ embeds: [embed] });
}

async function choisirMots(interaction) {
    return await recupererMotsAleatoiresAPI(10); // Récupérer jusqu'à 10 mots aléatoires
}

async function lancerBoucleDeJeu(interaction, listePropositions) {
    let score = 0;
    let nbMotsProposes = listePropositions.length;

    const tempsLimite = 60; // Temps limite en secondes
    let tempsRestant = tempsLimite;

    const message = await interaction.followUp(`Temps restant : ${tempsRestant} secondes.`);

    const tempsDebut = Date.now();

    const interval = setInterval(() => {
        const tempsPasse = Math.floor((Date.now() - tempsDebut) / 1000);
        tempsRestant = tempsLimite - tempsPasse;
        if (tempsRestant <= 0) {
            clearInterval(interval);
            return;
        }
        message.edit(`Temps restant : ${tempsRestant} secondes.`);
    }, 1000);

    for (let i = 0; i < listePropositions.length; i++) {
        const mot = listePropositions[i];
        await interaction.followUp("Entrer le mot : " + mot);

        try {
            const filter = (message) => message.author.id === interaction.user.id;
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: tempsRestant * 1000, errors: ['time'] });
            const motUtilisateur = collected.first().content;

            if (motUtilisateur.toLowerCase() === mot.toLowerCase()) {
                score++;
            } else {
                await interaction.followUp("Mauvaise réponse. Le mot correct était : " + mot);
            }
        } catch (error) {
            await interaction.followUp("Temps écoulé. Fin du jeu.");
            afficherResultat(interaction, score, nbMotsProposes); // Envoyer le résultat si le temps est écoulé
            clearInterval(interval);
            return;
        }
    }

    clearInterval(interval);
    afficherResultat(interaction, score, nbMotsProposes);
}



module.exports = {
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const typeJeu = await choisirMots(interaction);
        if (!typeJeu || typeJeu.length === 0) {
            interaction.editReply("Une erreur s'est produite lors du chargement des mots aléatoires. Veuillez réessayer.");
            return;
        }

        await lancerBoucleDeJeu(interaction, typeJeu);
    },

    name: 'rapidity',
    description: "Jouez au jeu de taper les mots le plus vite possible.",
    options: [
        {
            name: 'type-jeu',
            description: 'Choisissez le type de jeu (uniquement les mots sont disponibles).',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Mots',
                    value: 'mots',
                },
            ],
            required: true,
        },
    ],
};
