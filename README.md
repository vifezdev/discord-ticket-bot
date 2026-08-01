# Conquest Assistant

A free Discord ticket bot built with Node.js, discord.js v14, and SQLite.

## Features
- Premium ticket panel with category selection
- Persistent SQLite storage for settings, categories, and tickets
- Support and admin role configuration
- Ticket creation, add/remove user, and close workflows
- HTML transcript generation and delivery to the configured log channel and ticket creator

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment file:
   ```bash
   copy .env.example .env
   ```
3. Fill in your Discord bot credentials in `.env`.
4. Start the bot:
   ```bash
   npm start
   ```
5. Use `/ticket setup` in your server to configure the bot.

## Production Notes
- The bot persists all configuration and ticket data in `data/conquest-assistant.db`.
- On restart, ticket panels are automatically refreshed from the database.

## Slash Commands
- `/ticket setup`
- `/ticket setsupport`
- `/ticket setadmin`
- `/ticket close`
- `/ticket add`
- `/ticket remove`
- `/ticket category add`
- `/ticket category remove`
- `/ticket category list`
- `/ticket product add`
- `/ticket product remove`
- `/ticket product list`
