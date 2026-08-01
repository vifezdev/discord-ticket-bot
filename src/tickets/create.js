const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ticketService = require('../database/ticketService');
const { createMainEmbed } = require('../utils/embeds');
const { nextTicketNumber, createTicketChannelName, formatTicketNumber } = require('./helpers');

function buildTicketEmbed(ticketNumber, userId, categoryName) {
  const padded = formatTicketNumber(ticketNumber);
  const description = [
    `**Customer:**`,
    `<@${userId}>`,
    '',
    `**Service:**`,
    categoryName,
    '',
    '**Status:**',
    'Awaiting Response',
    '',
    'A member of our support team will assist shortly.'
  ];

  return createMainEmbed(`◆ Support Request #${padded}`, description.join('\n'));
}

async function createTicketChannel(interaction, settings, categoryName) {
  const ticketNumber = nextTicketNumber(interaction.guildId);
  const channelName = createTicketChannelName(ticketNumber);
  const parent = interaction.guild.channels.cache.get(settings.category_id)
    ?? await interaction.guild.channels.fetch(settings.category_id).catch(() => null);

  const permissionOverwrites = [
    { id: interaction.guild.roles.everyone.id, deny: ['ViewChannel'] },
    { id: interaction.client.user.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels', 'ManageMessages', 'ReadMessageHistory'] },
    { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks'] },
  ];

  if (settings.support_role_id) {
    permissionOverwrites.push({
      id: settings.support_role_id,
      allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks'],
    });
  }

  if (settings.admin_role_id) {
    permissionOverwrites.push({
      id: settings.admin_role_id,
      allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels', 'ManageMessages', 'AttachFiles', 'EmbedLinks'],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: parent ?? undefined,
    permissionOverwrites,
    topic: `Support ticket #${formatTicketNumber(ticketNumber)} — ${categoryName}`,
  });

  const ticketEmbed = buildTicketEmbed(ticketNumber, interaction.user.id, categoryName);
  const notifyContent = settings.support_role_id ? `<@&${settings.support_role_id}>` : undefined;

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('btn_add_user')
      .setLabel('Add User')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👤')
  );

  await channel.send({ content: notifyContent, embeds: [ticketEmbed], components: [actionRow] });

  try {
    const ticketId = ticketService.createTicket(
      interaction.guildId,
      ticketNumber,
      channel.id,
      interaction.user.id,
      categoryName
    );
    ticketService.addParticipant(ticketId, interaction.user.id);
  } catch (error) {
    console.error(error);
  }

  return { channel, ticketNumber };
}



module.exports = {
  buildTicketEmbed,
  createTicketChannel,
};
