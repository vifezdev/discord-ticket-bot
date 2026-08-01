const { Events } = require('discord.js');
const db = require('../database/sqlite');

const { refreshPanel } = require('../tickets/panel');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    const { botName } = require('../config/config');
    console.log(`${botName} is online as ${client.user.tag}`);

    (async () => {
      const guilds = db.prepare('SELECT guild_id FROM guild_settings').all();
      for (const row of guilds) {
        const guild = client.guilds.cache.get(row.guild_id);
        if (!guild) continue;

        const settings = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(row.guild_id);
        if (!settings?.panel_channel_id) continue;

        try {
          await refreshPanel(guild, settings);
          // 2 secs be tween panel refreshes
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Unable to refresh panel for guild ${row.guild_id}:`, error);
        }
      }
    })();
  },
};
