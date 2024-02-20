const colors = require('colors/safe');
const Discord = require('discord.js');
const Database = require('better-sqlite3')(__dirname + '/../../../database/database.db');
const config = require(__dirname + '/../../../config/config.json');
const hooker = require('../../../functions/hooker');
const logChannelId = '1132946252519198762';

// Function to remove non-ASCII characters from the string
function removeNonAsciiChars(str) {
    return str.replace(/[^\x00-\x7F]/g, '');
}

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('points')
        .setDescription('Adiciona informações à tabela de classificação de uma pessoa')
        .addUserOption(option =>
            option.setName('jogador')
                .setDescription('O Jogador para adicionar os pontos')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('points')
                .setDescription('Quantidade de pontos atuais')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('wins')
                .setDescription('Quantidade de vitórias atuais')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('bonus')
                .setDescription('Quantidade de bonus atuais')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('team')
                .setDescription('Time Atual')
                .setRequired(true)
        )        ,
    async execute(interaction) {
        try {
            if (!config.admins.includes(interaction.user.id)) return await interaction.reply({ content: 'Não tens permissões para executar este comando!', ephemeral: true });

            const guildId = interaction.guild.id;
          
            const points = interaction.options.getInteger('points');

            if (points > 100) {
                return interaction.reply({ content: 'Os pontos não podem ser maiores que `100`!', ephemeral: true });
            }

            const user = interaction.options.getUser('jogador');
            const targetMember = await interaction.guild.members.fetch(user.id);
            const targetDisplayName = targetMember.displayName;
            const wins = interaction.options.getInteger('wins');
            const bonus = interaction.options.getInteger('bonus');
            const team = interaction.options.getString('team');

            // Sanitize playerName to remove non-ASCII characters
            const sanitizedPlayerName = removeNonAsciiChars(targetDisplayName);

            const insertStmt = Database.prepare('INSERT INTO cbp (guildId, userId, playerName, points, wins, team, bonus) VALUES (?, ?, ?, ?, ?, ?, ?)');
            const updateStmt = Database.prepare('UPDATE cbp SET points = ?, wins = ?, team = ?, bonus = ? WHERE guildId = ? AND userId = ?');
            const selectStmt = Database.prepare('SELECT * FROM cbp WHERE guildId = ? AND userId = ?');

            const existingData = selectStmt.get(guildId, user.id);

            const adminDisplayName = interaction.member.displayName;

            if (existingData) {
                try {
                    await updateStmt.run(points, wins, team, bonus, guildId, user.id);
                }
                catch (error) {
                    await hooker.commandErrorHooker(interaction.client, '/points', 'Inserting user points into database', error);
                    console.error(colors.red('Error while inserting user points into database:\n', error.stack));
                }
                if (Database.changes > 0) {
                    await interaction.reply({ content: `Os dados do <@!${user.id}> foram atualizados com sucesso!`, ephemeral: true });

                    const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
                    if (!logChannel) return;

                    const updatedUserPoints = new Discord.EmbedBuilder()
                        .setColor('Purple')
                        .setTitle(`\`${adminDisplayName}\` atualizou a pontuação do \`${targetDisplayName}\``)
                        .setDescription(`**Admin:** <@!${interaction.member.id}>\n**Player:** <@!${user.id}> (${targetDisplayName})`)
                        .setThumbnail(user.displayAvatarURL({ size: 2048, format: 'png', dynamic: true }))
                        .addFields(
                            { name: '**Pontos**', value: '```\n' + points + '\n```' },
                            { name: '**Vitórias**', value: '```\n' + wins + '\n```' },
                            { name: '**Bônus**', value: '```\n' + bonus + '\n```' },
                            { name: '**Time**', value: '```\n' + team + '\n```' },
                        )
                        .setFooter({ text: `Atualizado por ${adminDisplayName}`, iconURL: interaction.member.displayAvatarURL({ format: 'png', size: 2048, dynamic: true }) })
                        .setTimestamp();
                    return await logChannel.send({ embeds: [updatedUserPoints] });
                } else {
                    await interaction.reply({ content: `Os dados do <@!${user.id}> foram adicionados com sucesso!`, ephemeral: true });

                    const logChannel = await interaction.guild.channels.cache.get(config.logChannelId);
                    if (!logChannel) return;

                    const updatedUserPoints = new Discord.EmbedBuilder()
                        .setColor('Purple')
                        .setTitle(`\`${adminDisplayName}\` atualizou a pontuação do \`${targetDisplayName}\``)
                        .setDescription(`**Admin:** <@!${interaction.member.id}>\n**Player:** <@!${user.id}> (${targetDisplayName})`)
                        .setThumbnail(user.displayAvatarURL({ size: 2048, format: 'png', dynamic: true }))
                        .addFields(
                            { name: '**Pontos**', value: '```\n' + points + '\n```' },
                            { name: '**Vitórias**', value: '```\n' + wins + '\n```' },
                            { name: '**Bônus**', value: '```\n' + bonus + '\n```' },
                            { name: '**Time**', value: '```\n' + team + '\n```' },
                        )
                        .setFooter({ text: `Atualizado por ${adminDisplayName}`, iconURL: interaction.member.displayAvatarURL({ format: 'png', size: 2048, dynamic: true }) })
                        .setTimestamp();
                    return await logChannel.send({ embeds: [updatedUserPoints] });
                }
            } else {
                await insertStmt.run(guildId, user.id, sanitizedPlayerName, points, wins, team, bonus);
                await interaction.reply({ content: `Os dados do <@!${user.id}> foram adicionados com sucesso!`, ephemeral: true });

                const logChannel = await interaction.guild.channels.cache.get(config.logChannelId);
                if (!logChannel) return;

                const createdUserPoints = new Discord.EmbedBuilder()
                    .setColor('Purple')
                    .setTitle(`\`${adminDisplayName}\` atualizou a pontuação do \`${targetDisplayName}\``)
                    .setDescription(`**Admin:** <@!${interaction.member.id}>\n**Player:** <@!${user.id}> (${targetDisplayName})`)
                    .setThumbnail(user.displayAvatarURL({ size: 2048, format: 'png', dynamic: true }))
                    .addFields(
                        { name: '**Pontos**', value: '```\n' + points + '\n```' },
                        { name: '**Vitórias**', value: '```\n' + wins + '\n```' },
                        { name: '**Bônus**', value: '```\n' + bonus + '\n```' },
                        { name: '**Time**', value: '```\n' + team + '\n```' },
                    )
                    .setFooter({ text: `Atualizado por ${adminDisplayName}`, iconURL: interaction.member.displayAvatarURL({ format: 'png', size: 2048, dynamic: true }) })
                    .setTimestamp();
                return await logChannel.send({ embeds: [createdUserPoints] });
            }
        } catch (error) {
            await hooker.commandErrorHooker(interaction.client, '/points', undefined, error);
            console.error(colors.red('Error while executing /points:\n', error.stack));
        }
    },
};
