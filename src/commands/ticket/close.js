const { createMainEmbed, createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getGuildSettings, isSupport, getTicketByChannel, formatTicketNumber, createTicketChannelName } = require('../../tickets/helpers');
const ticketService = require('../../database/ticketService');
const { fetchAllMessages, createTranscriptHtml } = require('../../tickets/transcript');

module.exports = async function executeClose(interaction) {
  const guildId = interaction.guildId;
  const settings = getGuildSettings(guildId);

  if (!isSupport(interaction.member, settings)) {
    return interaction.reply({ embeds: [createErrorEmbed('Access denied', 'Only support or admin staff can close tickets.')], ephemeral: true });
  }

  const ticket = getTicketByChannel(guildId, interaction.channelId);
  if (!ticket) {
    return interaction.reply({ embeds: [createErrorEmbed('Not a ticket', 'This channel is not an active ticket.')], ephemeral: true });
  }

  await interaction.deferReply();

  const paddedNumber = formatTicketNumber(ticket.ticket_number);
  const creator = await interaction.client.users.fetch(ticket.creator_id);
  const transcriptChannel = settings.transcript_channel_id
    ? interaction.guild.channels.cache.get(settings.transcript_channel_id)
      ?? await interaction.guild.channels.fetch(settings.transcript_channel_id).catch(() => null)
    : null;
  const channelMessages = await fetchAllMessages(interaction.channel);
  const html = createTranscriptHtml(ticket, creator, channelMessages, interaction.user);
  const file = { attachment: Buffer.from(html, 'utf8'), name: `transcript-${paddedNumber}.html` };

  const transcriptEmbed = createMainEmbed('Support Transcript', `Ticket #${paddedNumber} has been closed and archived.`);
  transcriptEmbed.addFields(
    { name: 'Customer', value: `<@${ticket.creator_id}>`, inline: true },
    { name: 'Service', value: ticket.category_name, inline: true },
    { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true }
  );

  if (transcriptChannel?.isTextBased()) {
    await transcriptChannel.send({ embeds: [transcriptEmbed], files: [file] });
  }

  await creator.send({
    embeds: [createMainEmbed('Support Transcript', `Your transcript for ticket #${paddedNumber} is attached. Thank you for contacting us.`)],
    files: [file],
  }).catch(() => {});

  try {
    ticketService.closeTicket(ticket.id);
  } catch (error) {
    console.error(error);
    return interaction.editReply({ embeds: [createErrorEmbed('Database Error', 'Failed to update ticket status.')] });
  }

  await interaction.editReply({ embeds: [createSuccessEmbed('Ticket closed', `Ticket #${paddedNumber} has been closed and will be deleted in 3 seconds.`)] }).catch(() => {});
  
  setTimeout(async () => {
    await interaction.channel.delete().catch(() => {});
  }, 3000);
};
