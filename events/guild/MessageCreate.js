const Discord = require('discord.js');
const colors = require('colors/safe');
const hooker = require('../../functions/hooker');

module.exports = {
    name: Discord.Events.MessageCreate,
    once: false,
    async execute(message) {
        try {
            if(message.author.id === '1052015834228342794' && message.content.toLowerCase() === 'tzpinheiro') {
                message.react('👎');
                message.reply('Tz Dos Pinheiros, cala-te mas é pá!');
                return message.channel.send('https://tenor.com/view/shut-shut-up-shut-it-shush-shut-your-mouth-gif-26635232');
            }
        } catch (error) {
            await hooker.commandErrorHooker(interaction.client, 'MessageCreate Event File', undefined, error);
            console.error(colors.red(error.stack || error));
        }
    },
};