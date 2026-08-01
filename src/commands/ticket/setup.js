const { createMainEmbed, createErrorEmbed } = require('../../utils/embeds');
const settingsService = require('../../database/settingsService');
const { refreshPanel } = require('../../tickets/panel');

module.exports = async function executeSetup(interaction) {
  const guildId = interaction.guildId;
  const panelChannel = interaction.options.getChannel('panel');
  const categoryChannel = interaction.options.getChannel('category');
  const transcriptChannel = interaction.options.getChannel('transcript');

  if (!panelChannel && !categoryChannel && !transcriptChannel) {
    return interaction.reply({
      embeds: [createErrorEmbed('Nothing to update', 'Provide at least one channel option to configure.')],
      ephemeral: true,
    });
  }

  try {
    settingsService.ensureGuildSettings(guildId);

    if (panelChannel) settingsService.updatePanelChannel(guildId, panelChannel.id);
    if (categoryChannel) settingsService.updateCategoryChannel(guildId, categoryChannel.id);
    if (transcriptChannel) settingsService.updateTranscriptChannel(guildId, transcriptChannel.id);
  } catch (error) {
    console.error(error);
    return interaction.reply({ embeds: [createErrorEmbed('Database Error', 'Failed to update settings.')], ephemeral: true });
  }

  const updatedSettings = settingsService.getGuildSettings(guildId);
  const embed = createMainEmbed('Settings Updated', 'Your support portal has been configured.');
  embed.addFields(
    { name: 'Panel Channel', value: updatedSettings.panel_channel_id ? `<#${updatedSettings.panel_channel_id}>` : 'Not set', inline: true },
    { name: 'Ticket Category', value: updatedSettings.category_id ? `<#${updatedSettings.category_id}>` : 'Not set', inline: true },
    { name: 'Transcript Channel', value: updatedSettings.transcript_channel_id ? `<#${updatedSettings.transcript_channel_id}>` : 'Not set', inline: true }
  );

  if (updatedSettings.panel_channel_id) {
    await refreshPanel(interaction.guild, updatedSettings);
  }

  return interaction.reply({ embeds: [embed], ephemeral: true });
};
