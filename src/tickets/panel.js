const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { createMainEmbed } = require('../utils/embeds');
const { getCategories } = require('./helpers');
const { botName } = require('../config/config');

const PANEL_DESCRIPTION = [
  'Welcome to our support portal.',
  '',
  'Our team provides assistance with:',
  '• Product enquiries',
  '• Technical support',
  '• Licensing',
  '• Development requests',
  '',
  'Please select your request type below.',
].join('\n');

function buildPanelPayload(guildId) {
  const categories = getCategories(guildId);

  const embed = createMainEmbed(`◆ ${botName} Services`, PANEL_DESCRIPTION);

  if (!categories.length) {
    return { embeds: [embed], components: [] };
  }

  const options = categories.slice(0, 25).map((category) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(category.name)
      .setValue(category.id.toString())
      .setDescription(`Open a ${category.name} request`)
  );

  const selectMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_panel_category')
      .setPlaceholder('Select your request type')
      .addOptions(options)
  );

  return { embeds: [embed], components: [selectMenu] };
}

async function resetPanelSelect(interaction) {
  if (!interaction.message?.editable) {
    return null;
  }

  const payload = buildPanelPayload(interaction.guildId);
  return interaction.message.edit(payload);
}

async function refreshPanel(guild, settings) {
  if (!settings?.panel_channel_id) {
    return null;
  }

  const channel = guild.channels.cache.get(settings.panel_channel_id)
    ?? await guild.channels.fetch(settings.panel_channel_id).catch(() => null);

  if (!channel?.isTextBased()) {
    return null;
  }

  const payload = buildPanelPayload(guild.id);

  if (settings.panel_message_id) {
    const existing = await channel.messages.fetch(settings.panel_message_id).catch(() => null);
    if (existing) {
      return existing.edit(payload);
    }
  }

  const message = await channel.send(payload);
  const settingsService = require('../database/settingsService');
  settingsService.updatePanelMessage(guild.id, message.id);
  return message;
}

module.exports = {
  buildPanelPayload,
  resetPanelSelect,
  refreshPanel,
  PANEL_DESCRIPTION,
};
