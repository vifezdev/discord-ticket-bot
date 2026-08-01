require('dotenv').config();

function validateConfig() {
  const missing = [];
  if (!process.env.DISCORD_TOKEN) missing.push('DISCORD_TOKEN');
  if (!process.env.CLIENT_ID) missing.push('CLIENT_ID');

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  botName: process.env.BOT_NAME || 'Ticket bot',
  embedFooter: process.env.EMBED_FOOTER || 'Vifez Tickets',
  transcriptMaxMessages: parseInt(process.env.TRANSCRIPT_MAX_MESSAGES, 10) || 5000,
  defaultColor: 0xD4AF37,
  accentColor: 0xB8860B,
  validateConfig,
};
