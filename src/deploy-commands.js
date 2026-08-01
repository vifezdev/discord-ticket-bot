const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, clientId, guildId } = require('./config/config');

async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');

  for (const file of fs.readdirSync(commandsPath).filter((entry) => entry.endsWith('.js'))) {
    const command = require(path.join(commandsPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }

  if (!commands.length) {
    console.warn('No slash commands found to register.');
    return;
  }

  const rest = new REST().setToken(token);

  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`Registered ${commands.length} guild command(s).`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`Registered ${commands.length} global command(s).`);
    }
  } catch (error) {
    console.error('Failed to register slash commands:', error);
    throw error;
  }
}

module.exports = { deployCommands };
