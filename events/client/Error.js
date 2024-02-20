const Discord = require('discord.js');
const colors = require('colors/safe');
const hooker = require('../../functions/hooker');

module.exports = {
    name: Discord.Events.Error,
    once: false,
    async execute(error) {
        await hooker.commandErrorHooker(null, 'Error Event File', undefined, error);
        console.error(colors.red(error.stack || error));        
    },
};
