const { createMainEmbed, createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const guildService = require('../../database/guildService');

module.exports = async function executeProduct(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  if (subcommand === 'add') {
    const name = interaction.options.getString('name').trim();
    if (!name) {
      return interaction.reply({ embeds: [createErrorEmbed('Invalid name', 'Product name cannot be empty.')], ephemeral: true });
    }
    try {
      guildService.addProduct(guildId, name);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return interaction.reply({ embeds: [createErrorEmbed('Product exists', `${name} is already configured.`)], ephemeral: true });
      }
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to add product.')], ephemeral: true });
    }
    return interaction.reply({ embeds: [createSuccessEmbed('Product added', `${name} is now available for Product Support tickets.`)], ephemeral: true });
  }

  if (subcommand === 'remove') {
    const name = interaction.options.getString('name').trim();
    try {
      const result = guildService.removeProduct(guildId, name);
      if (!result.changes) {
        return interaction.reply({ embeds: [createErrorEmbed('Product not found', `${name} was not found.`)], ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to remove product.')], ephemeral: true });
    }
    return interaction.reply({ embeds: [createSuccessEmbed('Product removed', `${name} was removed.`)] });
  }

  if (subcommand === 'list') {
    try {
      const products = guildService.getProducts(guildId);
      if (!products.length) {
        return interaction.reply({ embeds: [createMainEmbed('Products', 'No products have been configured yet.')], ephemeral: true });
      }
      const list = products.map((product, index) => `${index + 1}. ${product.name}`).join('\n');
      return interaction.reply({ embeds: [createMainEmbed('Products', list)], ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to fetch products.')], ephemeral: true });
    }
  }
};
