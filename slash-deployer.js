const Discord = require('discord.js');
const fs = require('node:fs');
const colors = require('colors/safe');
const moment = require('moment');
require('dotenv').config({});
require('better-logging')(console, {
    format: ctx => `${colors.gray(`[${moment().format('HH:mm:ss')}]`)} ${colors.gray(`[${moment().format('DD/MM/YYYY')}]`)} ${ctx.type} » ${ctx.msg}`,
    saveToFile: __dirname + `/logs/slash-deployer/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}.log`,
    color: {
        base: colors.gray,
        type: {
            debug: colors.green,
            info: colors.blue,
            log: colors.white,
            error: colors.red,
            warn: colors.yellow,
        },
    },
});

const commands = [];
const slashFolders = fs.readdirSync(__dirname + '/commands/slashs');
for (const folder of slashFolders) {
    const slashFiles = fs.readdirSync(__dirname + `/commands/slashs/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of slashFiles) {
        const slash = require(__dirname + `/commands/slashs/${folder}/${file}`);
        if ('data' in slash && 'execute' in slash) {
            commands.push(slash.data.toJSON());
        } else {
            console.info(`[WARNING] The command ${slash.data} is missing a required "data" or "execute" property.`);
        }
    }
}

const rest = new Discord.REST().setToken(process.env.DiscordToken);
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        // Discord.Routes.applicationGuildCommands(process.env.DiscordSlashClientId, process.env.DiscordSlashGuildId),
        const data = await rest.put(
            Discord.Routes.applicationCommands(process.env.DiscordSlashClientId),
            { body: commands },
        );
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();