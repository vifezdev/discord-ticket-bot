const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const settingsService = require('../../database/settingsService');

module.exports = async function executeRoles(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const role = interaction.options.getRole('role');
  const guildId = interaction.guildId;

  try {
    if (subcommand === 'setsupport') {
      settingsService.updateSupportRole(guildId, role.id);
      return interaction.reply({ embeds: [createSuccessEmbed('Support role updated', `Support role set to ${role}.`)], ephemeral: true });
    }

    if (subcommand === 'setadmin') {
      settingsService.updateAdminRole(guildId, role.id);
      return interaction.reply({ embeds: [createSuccessEmbed('Administrator role updated', `Admin role set to ${role}.`)], ephemeral: true });
    }
  } catch (error) {
    console.error(error);
    return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to update role settings.')], ephemeral: true });
  }
};
