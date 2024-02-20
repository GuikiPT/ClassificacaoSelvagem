const fs = require('fs');
const colors = require('colors/safe');
const hooker = require('../functions/hooker');

module.exports = async function (client) {
    const eventFolders = fs.readdirSync(__dirname + '/../events');

    for (const folder of eventFolders) {
        const eventFiles = fs.readdirSync(__dirname + `/../events/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(__dirname + `/../events/${folder}/${file}`);
            if (event.once) {
                try {
                    client.once(event.name, (...args) => event.execute(...args));
                    console.log(`Loaded event '${event.name}' (once)`);
                } catch (error) {
                    await hooker.commandErrorHooker(client, 'event handler -> ' + event.name, 'Loading ' + event.name + ' file.', error);
                    console.error(colors.red(`Error occurred while loading event '${event.name}' (once):`, error.stack));
                }
            } else {
                try {
                    client.on(event.name, (...args) => event.execute(...args));
                    console.log(`Loaded event '${event.name}'`);
                } catch (error) {
                    await hooker.commandErrorHooker(client, 'event handler loader', 'Loading event handler file', error);
                    console.error(colors.red(`Error occurred while loading event '${event.name}':`, error.stack));
                }
            }
        }
    }
};
