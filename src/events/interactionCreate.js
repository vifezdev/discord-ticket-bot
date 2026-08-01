const {
  Events,
  ActionRowBuilder,
  UserSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const {
  ensureGuildSettings,
  getCategoryById,
} = require('../tickets/helpers');
const { resetPanelSelect } = require('../tickets/panel');
const { createMainEmbed, createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');
const { createTicketChannel } = require('../tickets/create');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        const reply = {
          embeds: [createErrorEmbed('Unexpected error', 'The bot encountered an issue while processing that command.')],
          ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
      return;
    }

    if (!interaction.guild) return;

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_panel_category') {
      const settings = ensureGuildSettings(interaction.guildId);

      if (!settings.panel_channel_id || !settings.category_id || !settings.transcript_channel_id) {
        await interaction.deferUpdate();
        await resetPanelSelect(interaction);
        return interaction.followUp({
          embeds: [createErrorEmbed('Setup required', 'The support portal has not been fully configured yet.')],
          ephemeral: true,
        });
      }

      const categoryId = parseInt(interaction.values[0], 10);
      const category = getCategoryById(interaction.guildId, categoryId);

      if (!category) {
        await interaction.deferUpdate();
        await resetPanelSelect(interaction);
        return interaction.followUp({
          embeds: [createErrorEmbed('Category unavailable', 'That category is no longer available. Please choose another.')],
          ephemeral: true,
        });
      }

      await interaction.deferUpdate();
      await resetPanelSelect(interaction);

      try {
        const { channel } = await createTicketChannel(interaction, settings, category.name);
        await interaction.followUp({
          embeds: [createSuccessEmbed('Ticket created', `Your request has been opened in ${channel}.`)],
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await interaction.followUp({
          embeds: [createErrorEmbed('Unable to create ticket', 'Something went wrong while opening your request. Please try again.')],
          ephemeral: true,
        });
      }
      return;
    }

    if (interaction.isButton() && interaction.customId === 'btn_close_ticket') {
      const { getGuildSettings, isSupport } = require('../tickets/helpers');
      const settings = getGuildSettings(interaction.guildId);
      if (!isSupport(interaction.member, settings)) {
        return interaction.reply({ embeds: [createErrorEmbed('Access denied', 'Only support or admin staff can close tickets.')], ephemeral: true });
      }

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_confirm_close')
          .setLabel('Confirm')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('btn_cancel_close')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        embeds: [createMainEmbed('Close Ticket', 'Are you sure you want to close this ticket? This action cannot be undone.')],
        components: [confirmRow],
        ephemeral: true,
      });
    }

    if (interaction.isButton() && interaction.customId === 'btn_confirm_close') {
      const executeClose = require('../commands/ticket/close');
      return await executeClose(interaction);
    }

    if (interaction.isButton() && interaction.customId === 'btn_cancel_close') {
      return interaction.update({ embeds: [createSuccessEmbed('Cancelled', 'Ticket closure cancelled.')], components: [] });
    }

    if (interaction.isButton() && interaction.customId === 'btn_add_user') {
      const { getGuildSettings, isSupport } = require('../tickets/helpers');
      const settings = getGuildSettings(interaction.guildId);
      if (!isSupport(interaction.member, settings)) {
        return interaction.reply({ embeds: [createErrorEmbed('Access denied', 'Only support or admin staff can add users.')], ephemeral: true });
      }

      const selectMenu = new UserSelectMenuBuilder()
        .setCustomId('select_add_user')
        .setPlaceholder('Select a user to add to the ticket')
        .setMinValues(1)
        .setMaxValues(1);

      return interaction.reply({
        content: 'Please select a user to add to this ticket:',
        components: [new ActionRowBuilder().addComponents(selectMenu)],
        ephemeral: true,
      });
    }

    if (interaction.isUserSelectMenu() && interaction.customId === 'select_add_user') {
      const { getGuildSettings, isSupport, getTicketByChannel } = require('../tickets/helpers');
      const ticketService = require('../database/ticketService');
      const settings = getGuildSettings(interaction.guildId);

      if (!isSupport(interaction.member, settings)) {
        return interaction.reply({ embeds: [createErrorEmbed('Access denied', 'Only support or admin staff can manage ticket members.')], ephemeral: true });
      }

      const ticket = getTicketByChannel(interaction.guildId, interaction.channelId);
      if (!ticket) {
        return interaction.reply({ embeds: [createErrorEmbed('Not a ticket', 'This channel is not an active ticket.')], ephemeral: true });
      }

      const targetUserId = interaction.values[0];
      const member = interaction.guild.members.cache.get(targetUserId)
        ?? await interaction.guild.members.fetch(targetUserId).catch(() => null);

      if (!member) {
        return interaction.reply({ embeds: [createErrorEmbed('User not found', 'The selected user could not be resolved.')], ephemeral: true });
      }

      try {
        ticketService.addParticipant(ticket.id, targetUserId);
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

      await interaction.update({ content: 'User added successfully.', components: [] });
      return interaction.channel.send({ embeds: [createSuccessEmbed('Member added', `${member} was added to the ticket by ${interaction.user}.`)] });
    }
  },
};
