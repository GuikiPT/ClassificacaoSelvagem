const Discord = require('discord.js');
const fs = require('fs');
const colors = require('colors');
const moment = require('moment');
require('dotenv').config({});
require('better-logging')(console, {
    format: ctx => `${colors.gray(`[${moment().format('HH:mm:ss')}]`)} ${colors.gray(`[${moment().format('DD/MM/YYYY')}]`)} ${ctx.type} » ${ctx.msg}`,
    saveToFile: __dirname + `/logs/bot/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}.log`,
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
const hooker = require('./functions/hooker');

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.AutoModerationConfiguration,
        Discord.GatewayIntentBits.AutoModerationExecution,
        Discord.GatewayIntentBits.DirectMessageReactions,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildIntegrations,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildModeration,
        Discord.GatewayIntentBits.GuildPresences,
        Discord.GatewayIntentBits.GuildScheduledEvents,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildWebhooks,
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.MessageContent,
    ],
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.GuildScheduledEvent,
        Discord.Partials.Message,
        Discord.Partials.Reaction,
        Discord.Partials.ThreadMember,
        Discord.Partials.User,
    ],
});
client.slashCommands = new Discord.Collection();

(async function () {
    try {
        try {
            await require('./database/database')(client);
        }
        catch (error) {
            await hooker.commandErrorHooker(client, 'main.js', 'Loading database.js', error);
            console.error(colors.red('Error while loading database.js:\n', error.stack));
        }

        const handlerFiles = fs.readdirSync('./handlers');

        for (const file of handlerFiles) {
            if (file.endsWith('.js')) {
                const handler = require(`./handlers/${file}`);
                await handler(client);
            }
        }
    } catch (error) {
        await hooker.commandErrorHooker(client, 'main.js', 'Loading bot handler', error);
        console.error(colors.red(error.stack || error));
    }
})();

client.login(process.env.DiscordToken);

process.on('uncaughtException', async (error) => {
    await hooker.commandErrorHooker(client, 'main.js', 'uncaughtException', error);
    console.error(colors.red('Uncaught Exception occurred:\n', error.stack));
    process.exit();
});

process.on('unhandledRejection', async (reason, promise) => {
    await hooker.commandErrorHooker(client, 'main.js', 'uncaughtException', reason);
    console.error(colors.red('Unhandled Promise Rejection:\n', reason));
});