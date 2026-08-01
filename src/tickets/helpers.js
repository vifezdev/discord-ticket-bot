const { PermissionFlagsBits } = require('discord.js');
const settingsService = require('../database/settingsService');
const guildService = require('../database/guildService');
const ticketService = require('../database/ticketService');

function isAdmin(member, settings) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  return Boolean(settings?.admin_role_id && member.roles.cache.has(settings.admin_role_id));
}

function isSupport(member, settings) {
  if (isAdmin(member, settings)) {
    return true;
  }
  return Boolean(settings?.support_role_id && member.roles.cache.has(settings.support_role_id));
}

function createTicketChannelName(number) {
  return `ticket-${String(number).padStart(4, '0')}`;
}

function formatTicketNumber(number) {
  return String(number).padStart(4, '0');
}



module.exports = {
  isAdmin,
  isSupport,
  createTicketChannelName,
  formatTicketNumber,
  getGuildSettings: settingsService.getGuildSettings,
  ensureGuildSettings: settingsService.ensureGuildSettings,
  getCategories: guildService.getCategories,
  getCategoryByName: guildService.getCategoryByName,
  getCategoryById: guildService.getCategoryById,
  nextTicketNumber: settingsService.nextTicketNumber,
  getTicketByChannel: ticketService.getTicketByChannel,
};
