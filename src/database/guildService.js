const db = require('./sqlite');

function getCategories(guildId) {
  return db.prepare('SELECT id, name FROM ticket_categories WHERE guild_id = ? ORDER BY id').all(guildId);
}

function getCategoryByName(guildId, categoryName) {
  return db.prepare('SELECT * FROM ticket_categories WHERE guild_id = ? AND name = ?').get(guildId, categoryName);
}

function getCategoryById(guildId, categoryId) {
  return db.prepare('SELECT * FROM ticket_categories WHERE guild_id = ? AND id = ?').get(guildId, categoryId);
}

function addCategory(guildId, name) {
  db.prepare('INSERT INTO ticket_categories (guild_id, name) VALUES (?, ?)').run(guildId, name);
}

function removeCategory(guildId, name) {
  return db.prepare('DELETE FROM ticket_categories WHERE guild_id = ? AND name = ?').run(guildId, name);
}



module.exports = {
  getCategories,
  getCategoryByName,
  getCategoryById,
  addCategory,
  removeCategory,
};
