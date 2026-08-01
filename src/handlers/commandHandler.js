const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

module.exports = async function registerCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');

  for (const file of fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))) {
    const command = require(path.join(commandsPath, file));
    if (!command.data || !command.execute) {
      continue;
    }
    client.commands.set(command.data.name, command);
  }
};
