const Discord = require('discord.js');
const colors = require('colors/safe');
const hooker = require('../../functions/hooker');

module.exports = {
    name: Discord.Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready!`);
        console.log(`Logged in as ${client.user.tag}`);
        
        try {
            await updateActivity(client);

            console.log('Bot activity set successfully!');

            setInterval(() => {
                updateActivity(client);
            }, 300000);
        } catch (error) {
            await hooker.commandErrorHooker(client, 'ClientReady Event File', undefined, error);
            console.error(colors.red('An error occurred while setting bot activity:\n', error.stack));
        }
    },
};

async function updateActivity(client) {
    try {
        await client.user.setActivity('Pixelmon Selvagem', { type: Discord.ActivityType.Playing });
        console.log('Bot activity updated successfully!');
    } catch (error) {
        console.error(colors.red('An error occurred while setting bot activity:\n', error.stack));
    }
}