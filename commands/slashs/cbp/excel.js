const colors = require('colors/safe');
const Discord = require('discord.js');
const Database = require('better-sqlite3')(__dirname + '/../../../database/database.db');
const hooker = require('../../../functions/hooker');
const config = require(__dirname + '/../../../config/config.json');
const XLSX = require('xlsx');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('excel')
        .setDescription('Exporta os dados da tabela de classificação para um ficheiro excel.'),
    async execute(interaction) {
        try {
            const prepareAllTableData = Database.prepare('SELECT * FROM cbp WHERE guildId = ?');
            const allTable = await prepareAllTableData.all(interaction.guild.id);

            if (!allTable.length) {
                return await interaction.reply({ content: 'Ainda não há usuários na tabela de classificação.', ephemeral: true });
            }
            
            const ws = XLSX.utils.json_to_sheet(allTable);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'CBP2 - 2023');

            const excelBuffer = XLSX.write(wb, { type: 'buffer' });
            const fileStream = Buffer.from(excelBuffer, 'binary');
            XLSX.writeFile(wb, __dirname + '/../../../database/cbp2.xlsx');

            const attachment = new Discord.AttachmentBuilder(fileStream, { name: 'cbp2.xlsx', description: 'CBP2 - Database as Excel Format' });

            return await interaction.reply({ files: [attachment ]});

        } catch (error) {
            console.error(colors.red('Error while executing /excel:\n', error.stack));
            await hooker.commandErrorHooker(interaction.client, '/excel', undefined, error);
            return interaction.reply({
                content: 'Ocorreu um erro ao processar o comando. Por favor, tente novamente mais tarde.',
                ephemeral: true
            });
        }
    },
};
