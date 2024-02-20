const Discord = require('discord.js');
const colors = require('colors/safe');
const hooker = require('../../functions/hooker');

module.exports = {
    name: Discord.Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = await interaction.client.slashCommands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            await hooker.commandErrorHooker(interaction.client, 'InteractionCreate Event File', undefined, error);
            console.error(colors.red(`Error executing ${interaction.commandName}:\n`, error.stack));
        }
    },
};