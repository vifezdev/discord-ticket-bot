const db = require('./sqlite');

function getTicketByChannel(guildId, channelId) {
  return db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ? AND status = ?').get(guildId, channelId, 'open');
}

function createTicket(guildId, ticketNumber, channelId, creatorId, categoryName) {
  const info = db.prepare(`
    INSERT INTO tickets (guild_id, ticket_number, channel_id, creator_id, category_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(guildId, ticketNumber, channelId, creatorId, categoryName);
  return info.lastInsertRowid;
}

function closeTicket(ticketId) {
  db.prepare('UPDATE tickets SET status = ?, closed_at = ? WHERE id = ?').run('closed', new Date().toISOString(), ticketId);
}

function addParticipant(ticketId, userId) {
  db.prepare('INSERT OR IGNORE INTO ticket_participants (ticket_id, user_id) VALUES (?, ?)').run(ticketId, userId);
}

function removeParticipant(ticketId, userId) {
  db.prepare('DELETE FROM ticket_participants WHERE ticket_id = ? AND user_id = ?').run(ticketId, userId);
}

module.exports = {
  getTicketByChannel,
  createTicket,
  closeTicket,
  addParticipant,
  removeParticipant,
};
