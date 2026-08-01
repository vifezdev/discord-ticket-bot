const { createMainEmbed, createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const guildService = require('../../database/guildService');
const settingsService = require('../../database/settingsService');
const { refreshPanel } = require('../../tickets/panel');

module.exports = async function executeCategory(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  if (subcommand === 'add') {
    const name = interaction.options.getString('name').trim();
    
    if (!name) {
      return interaction.reply({ embeds: [createErrorEmbed('Invalid name', 'Category name cannot be empty.')], ephemeral: true });
    }
    try {
      guildService.addCategory(guildId, name);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return interaction.reply({ embeds: [createErrorEmbed('Category exists', `${name} is already configured.`)], ephemeral: true });
      }
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to add category.')], ephemeral: true });
    }
    await refreshPanel(interaction.guild, settingsService.getGuildSettings(guildId));
    return interaction.reply({ embeds: [createSuccessEmbed('Category added', `${name} is now available on the support panel.`)], ephemeral: true });
  }

  if (subcommand === 'remove') {
    const name = interaction.options.getString('name').trim();
    try {
      const result = guildService.removeCategory(guildId, name);
      if (!result.changes) {
        return interaction.reply({ embeds: [createErrorEmbed('Category not found', `${name} was not found.`)], ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to remove category.')], ephemeral: true });
    }
    await refreshPanel(interaction.guild, settingsService.getGuildSettings(guildId));
    return interaction.reply({ embeds: [createSuccessEmbed('Category removed', `${name} was removed from the support panel.`)] });
  }

  if (subcommand === 'list') {
    try {
      const categories = guildService.getCategories(guildId);
      if (!categories.length) {
        return interaction.reply({ embeds: [createMainEmbed('Ticket Categories', 'No categories have been configured yet.')], ephemeral: true });
      }
      const list = categories.map((category, index) => `${index + 1}. ${category.name}`).join('\n');
      return interaction.reply({ embeds: [createMainEmbed('Ticket Categories', list)], ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to fetch categories.')], ephemeral: true });
    }
  }
};
