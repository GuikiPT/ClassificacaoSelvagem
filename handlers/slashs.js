const fs = require('fs');
const { promisify } = require('util');
const colors = require('colors/safe');
const hooker = require('../functions/hooker');

module.exports = async function (client) {
    try {
        const slashFolders = await fs.readdirSync(__dirname + '/../commands/slashs');

        for (const folder of slashFolders) {
            const slashFiles = await fs.readdirSync(__dirname + `/../commands/slashs/${folder}`).filter(file => file.endsWith('.js'));;
            for (const file of slashFiles) {
                const slashPath = __dirname + `/../commands/slashs/${folder}/${file}`;
                try {
                    const slash = require(slashPath);
                    if ('data' in slash && 'execute' in slash) {
                        client.slashCommands.set(slash.data.name, slash);
                        console.log(`Loaded slash command '${slash.data.name}'`);
                    } else {
                        await hooker.commandErrorHooker(client, 'slash handler -> ' + slashPath, 'Loading ' + slashPath + ' file.', `[WARNING] The slash command at ${slashPath} is missing a required "data" or "execute" property.`);
                        console.warn(colors.yellow(`[WARNING] The slash command at ${slashPath} is missing a required "data" or "execute" property.`));
                    }
                } catch (error) {
                    console.error(colors.red(`Error occurred while loading slash command at ${slashPath}:\n`, error.stack));
                }
            }
        }
    } catch (error) {
        await hooker.commandErrorHooker(client, 'slash handler loader', 'Loading slash handler file', error);
        console.error(colors.red('Error occurred during slash command loading:\n', error.stack));
    }
};
