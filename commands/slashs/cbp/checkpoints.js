const colors = require('colors/safe');
const Discord = require('discord.js');
const Database = require('better-sqlite3')(__dirname + '/../../../database/database.db');
const hooker = require('../../../functions/hooker');
const config = require(__dirname + '/../../../config/config.json');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('checkpoints')
        .setDescription('Verifica seus pontos atuais na tabela de classificação.')
        .addUserOption(option =>
            option.setName('jogador')
                .setDescription('Verifique a pontuação de outro jogador.')
        ),
    async execute(interaction) {
        try {
            if (!config.admins.includes(interaction.user.id)) {
                if (interaction.channel.id != config.leaderboardChat) {
                    return interaction.reply({ content: 'Por favor execute este comando em <#' + config.leaderboardChat + '>.', ephemeral: true });
                }
            }

            const guildId = interaction.guild.id;
            const userId = interaction.options.getUser('jogador')?.id || interaction.user.id;
            const targetUser = await interaction.guild.members.fetch(userId);

            const selectStmt = Database.prepare(`
                SELECT 
                    *,
                    (SELECT COUNT(*) + 1 FROM cbp AS c WHERE c.guildId = cbp.guildId AND c.points > cbp.points) AS position
                FROM cbp 
                WHERE guildId = ? AND userId = ?
            `);

            const userData = selectStmt.get(guildId, userId);

            if (!userData) {
                const initialText = interaction.user.id != targetUser.id ? 'Esse player' : 'Você';
                return interaction.reply({ content: initialText + ' ainda não tem pontos registrados.', ephemeral: true });
            }

            const points = userData.points;
            const wins = userData.wins;
            const team = userData.team;
            const position = userData.position;
            const bonus = userData.bonus;

            const embed = new Discord.EmbedBuilder()
                .setColor('Purple')
                .setTitle(`\`#${position}\` **»** \`${targetUser.displayName}\``)
                .setThumbnail(targetUser.displayAvatarURL({ format: 'png', size: 2048, dynamic: true }))
                .addFields(
                    { name: '**Time**', value: '```\n' + team + '\n```', inline: true },
                    { name: '**Pontos**', value: '```\n' + points + '\n```', inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '**Vitórias**', value: '```\n' + wins + '\n```', inline: true },
                    { name: '**Bônus**', value: '```\n' + bonus + '\n```', inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                )
                .setFooter({ text: 'Pixelmon Selvagem', iconURL: interaction.client.user.displayAvatarURL({ format: 'png', size: 2048, dynamic: true }) })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(colors.red('Error while executing /checkpoints:\n', error.stack));
            await hooker.commandErrorHooker(interaction.client, '/checkpoints', undefined, error);
            return interaction.reply({
                content: 'Ocorreu um erro ao processar o comando. Por favor, tente novamente mais tarde.',
                ephemeral: true
            });
        }
    },
};
