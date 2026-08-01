const { transcriptMaxMessages } = require('../config/config');

async function fetchAllMessages(channel) {
  const messages = [];
  let lastId;

  while (true) {
    const options = { limit: 100 };
    if (lastId) {
      options.before = lastId;
    }

    const batch = await channel.messages.fetch(options);
    if (!batch.size) {
      break;
    }

    batch.forEach((message) => messages.push(message));
    lastId = batch.last().id;

    if (batch.size < 100) {
      break;
    }

    if (messages.length >= transcriptMaxMessages) {
      console.warn(`Transcript for channel ${channel.id} exceeded max messages limit (${transcriptMaxMessages}). Truncating.`);
      messages.splice(transcriptMaxMessages);
      break;
    }
  }

  return messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMessageContent(message) {
  const parts = [];

  if (message.content) {
    parts.push(escapeHtml(message.content));
  }

  if (message.attachments.size) {
    const links = [...message.attachments.values()]
      .map((attachment) => `<a href="${escapeHtml(attachment.url)}" target="_blank">${escapeHtml(attachment.name || 'Attachment')}</a>`)
      .join('<br>');
    parts.push(links);
  }

  if (message.embeds.length && !message.content) {
    parts.push('<em>[Embed content]</em>');
  }

  return parts.join('<br>') || '<em>(no text)</em>';
}

function createTranscriptHtml(ticket, creator, messages, closedBy) {
  const messageRows = messages
    .filter((message) => !message.author.bot || message.content || message.attachments.size)
    .map((message) => {
      const author = escapeHtml(message.member?.displayName || message.author.displayName || message.author.username);
      const timestamp = new Date(message.createdTimestamp).toISOString();
      const content = formatMessageContent(message);
      return `<div class="message"><p class="meta"><strong>${author}</strong> <span>${timestamp}</span></p><div class="body">${content}</div></div>`;
    })
    .join('\n');

  const closedByBlock = closedBy
    ? `<p><strong>Closed by:</strong> ${escapeHtml(closedBy.displayName || closedBy.username)}</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket #${String(ticket.ticket_number).padStart(4, '0')} Transcript</title>
  <style>
    body { font-family: Segoe UI, sans-serif; background: #f5f0e6; color: #1f2937; padding: 32px; margin: 0; }
    .card { max-width: 860px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    h1 { color: #b8860b; margin-top: 0; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .message { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; }
    .meta span { color: #6b7280; font-size: 12px; }
    .body { margin-top: 4px; line-height: 1.5; white-space: pre-wrap; }
    a { color: #b8860b; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(require('../config/config').botName)} Transcript</h1>
    <p><strong>Ticket:</strong> #${String(ticket.ticket_number).padStart(4, '0')}</p>
    <p><strong>Customer:</strong> ${escapeHtml(creator.displayName || creator.username)}</p>
    <p><strong>Service:</strong> ${escapeHtml(ticket.category_name)}</p>
    ${closedByBlock}
    <hr>
    ${messageRows || '<p><em>No messages recorded.</em></p>'}
  </div>
</body>
</html>`;
}

module.exports = {
  fetchAllMessages,
  createTranscriptHtml,
};
