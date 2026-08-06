const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { token, validateConfig } = require('./config/config');
const db = require('./database/sqlite');
const registerCommands = require('./handlers/commandHandler');
const registerEvents = require('./handlers/eventHandler');
const { deployCommands } = require('./deploy-commands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

function shutdown() {
  db.close();
  process.exit(0);
} // test

(async () => {
  try {
    validateConfig();
    await registerCommands(client);
    registerEvents(client);
    await deployCommands();
    await client.login(token);
  } catch (error) {
    console.error('Failed to start the bot:', error);
    process.exit(1);
  }
})();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
