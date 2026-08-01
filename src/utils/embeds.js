const { EmbedBuilder } = require('discord.js');
const { defaultColor, accentColor, embedFooter } = require('../config/config');

const FOOTER = { text: embedFooter };

function createMainEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(defaultColor)
    .setTitle(title)
    .setDescription(description)
    .setFooter(FOOTER)
    .setTimestamp();
}

function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(accentColor)
    .setTitle(`✓ ${title}`)
    .setDescription(description)
    .setFooter(FOOTER)
    .setTimestamp();
}

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x8B0000)
    .setTitle(title)
    .setDescription(description)
    .setFooter(FOOTER)
    .setTimestamp();
}

module.exports = {
  createMainEmbed,
  createSuccessEmbed,
  createErrorEmbed,
};
