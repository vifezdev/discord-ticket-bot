const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const db = require('../database/sqlite');
const { createErrorEmbed } = require('../utils/embeds');
const { lockClosedChannel } = require('../tickets/create');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage support tickets for Conquest Assistant')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Configure the ticket system')
        .addChannelOption((option) =>
          option
            .setName('panel')
            .setDescription('Channel for the ticket panel')
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
          option
            .setName('category')
            .setDescription('Category for ticket channels')
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addChannelOption((option) =>
          option
            .setName('transcript')
            .setDescription('Channel for transcript logs')
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setsupport')
        .setDescription('Set the support role')
        .addRoleOption((option) => option.setName('role').setDescription('Support role').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setadmin')
        .setDescription('Set the admin role')
        .addRoleOption((option) => option.setName('role').setDescription('Admin role').setRequired(true))
    )
    .addSubcommand((subcommand) => subcommand.setName('close').setDescription('Close the current ticket'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption((option) => option.setName('user').setDescription('User to add').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption((option) => option.setName('user').setDescription('User to remove').setRequired(true))
    )
    .addSubcommandGroup((group) =>
      group
        .setName('category')
        .setDescription('Manage ticket categories')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Add a ticket category')
            .addStringOption((option) => option.setName('name').setDescription('Category name').setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Remove a ticket category')
            .addStringOption((option) => option.setName('name').setDescription('Category name').setRequired(true))
        )
        .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List ticket categories'))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    
    // Command Router
    try {
      if (subcommand === 'setup') {
        const executeSetup = require('./ticket/setup');
        return await executeSetup(interaction);
      }
      
      if (subcommand === 'setsupport' || subcommand === 'setadmin') {
        const executeRoles = require('./ticket/roles');
        return await executeRoles(interaction);
      }
      
      if (subcommandGroup === 'category') {
        const executeCategory = require('./ticket/category');
        return await executeCategory(interaction);
      }
      

      if (subcommand === 'close') {
        const executeClose = require('./ticket/close');
        return await executeClose(interaction);
      }
      
      if (subcommand === 'add' || subcommand === 'remove') {
        const executeMembers = require('./ticket/members');
        return await executeMembers(interaction);
      }

      return interaction.reply({ embeds: [require('../utils/embeds').createErrorEmbed('Unknown command', 'Please use one of the available ticket subcommands.')] });
    } catch (error) {
      console.error(error);
      const reply = { embeds: [require('../utils/embeds').createErrorEmbed('Command Failed', 'An error occurred while executing this command.')], ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
