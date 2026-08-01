const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getGuildSettings, isSupport, getTicketByChannel } = require('../../tickets/helpers');
const ticketService = require('../../database/ticketService');

module.exports = async function executeMembers(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  const settings = getGuildSettings(guildId);

  if (!isSupport(interaction.member, settings)) {
    return interaction.reply({ embeds: [createErrorEmbed('Access denied', 'Only support or admin staff can manage ticket members.')], ephemeral: true });
  }

  const ticket = getTicketByChannel(guildId, interaction.channelId);
  if (!ticket) {
    return interaction.reply({ embeds: [createErrorEmbed('Not a ticket', 'This channel is not an active ticket.')], ephemeral: true });
  }

  const targetUser = interaction.options.getUser('user');
  const member = interaction.guild.members.cache.get(targetUser.id)
    ?? await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    return interaction.reply({ embeds: [createErrorEmbed('User not found', 'The selected user could not be resolved.')], ephemeral: true });
  }

  if (subcommand === 'add') {
    try {
      ticketService.addParticipant(ticket.id, targetUser.id);
    } catch (error) {
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to add participant.')], ephemeral: true });
    }
    await interaction.channel.permissionOverwrites.edit(member, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true,
    });
    return interaction.reply({ embeds: [createSuccessEmbed('Member added', `${member} has access to this ticket.`)] });
  }

  if (subcommand === 'remove') {
    if (targetUser.id === ticket.creator_id) {
      return interaction.reply({ embeds: [createErrorEmbed('Cannot remove', 'The ticket creator cannot be removed from their ticket.')], ephemeral: true });
    }

    try {
      ticketService.removeParticipant(ticket.id, targetUser.id);
    } catch (error) {
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to remove participant.')], ephemeral: true });
    }
    await interaction.channel.permissionOverwrites.edit(member, { ViewChannel: false });
    return interaction.reply({ embeds: [createSuccessEmbed('Member removed', `${member} no longer has access.`)] });
  }
};
