const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.DiscordToken);

const commandId = '1207802672690765907'

// for single command in global commands
rest.delete(Routes.applicationCommand(process.env.DiscordSlashClientId, commandId))
    .then(() => console.log('Successfully deleted application command'))
    .catch(console.error);


// delete all global commands
// rest.put(Routes.applicationCommands(process.env.DiscordSlashClientId), { body: [] })
//     .then(() => console.log('Successfully deleted all application commands.'))
//     .catch(console.error);