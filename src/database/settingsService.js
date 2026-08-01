const db = require('./sqlite');

function getGuildSettings(guildId) {
  return db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
}

function ensureGuildSettings(guildId) {
  const existing = getGuildSettings(guildId);
  if (!existing) {
    db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
  }
  return getGuildSettings(guildId);
}

function updatePanelChannel(guildId, channelId) {
  db.prepare('UPDATE guild_settings SET panel_channel_id = ? WHERE guild_id = ?').run(channelId, guildId);
}

function updateCategoryChannel(guildId, channelId) {
  db.prepare('UPDATE guild_settings SET category_id = ? WHERE guild_id = ?').run(channelId, guildId);
}

function updateTranscriptChannel(guildId, channelId) {
  db.prepare('UPDATE guild_settings SET transcript_channel_id = ? WHERE guild_id = ?').run(channelId, guildId);
}

function updateSupportRole(guildId, roleId) {
  db.prepare('UPDATE guild_settings SET support_role_id = ? WHERE guild_id = ?').run(roleId, guildId);
}

function updateAdminRole(guildId, roleId) {
  db.prepare('UPDATE guild_settings SET admin_role_id = ? WHERE guild_id = ?').run(roleId, guildId);
}

function nextTicketNumber(guildId) {
  const result = db.prepare('UPDATE guild_settings SET last_ticket_number = COALESCE(last_ticket_number, 0) + 1 WHERE guild_id = ? RETURNING last_ticket_number').get(guildId);
  return result.last_ticket_number;
}

function updatePanelMessage(guildId, messageId) {
  db.prepare('UPDATE guild_settings SET panel_message_id = ? WHERE guild_id = ?').run(messageId, guildId);
}

module.exports = {
  getGuildSettings,
  ensureGuildSettings,
  updatePanelChannel,
  updateCategoryChannel,
  updateTranscriptChannel,
  updateSupportRole,
  updateAdminRole,
  nextTicketNumber,
  updatePanelMessage,
};
