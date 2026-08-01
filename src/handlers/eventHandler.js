const fs = require('fs');
const path = require('path');

module.exports = function registerEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');

  for (const file of fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'))) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
};
