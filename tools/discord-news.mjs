#!/usr/bin/env node

import fs from 'node:fs';

const mode = process.env.NEWS_MODE;
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const eventPath = process.env.GITHUB_EVENT_PATH;
const dryRun = process.env.DISCORD_NEWS_DRY_RUN === '1';

if (!['developer', 'main'].includes(mode)) {
  console.error('❌ NEWS_MODE muss "developer" oder "main" sein.');
  process.exit(1);
}

if (!eventPath || !fs.existsSync(eventPath)) {
  console.error('❌ GITHUB_EVENT_PATH fehlt oder ist ungültig.');
  process.exit(1);
}

if (!webhookUrl && !dryRun) {
  console.error('❌ DISCORD_WEBHOOK_URL fehlt. GitHub-Secret prüfen.');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

const truncate = (value, max) => {
  const text = String(value ?? '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
};

const firstLine = (message = '') => String(message).split(/\r?\n/, 1)[0].trim();

const messageBody = (message = '') => {
  const lines = String(message).split(/\r?\n/).slice(1);
  return lines
    .filter((line) => !/^Source-Branch:/i.test(line.trim()))
    .join('\n')
    .trim();
};

const sourceBranchFromMessage = (message = '') => {
  const explicit = String(message).match(/^Source-Branch:\s*(.+)$/im);
  if (explicit) return explicit[1].trim();

  const commonMerge = String(message).match(/Merge(?: branch)? ['"]?([^'"\s]+)['"]?(?: into main)?/i);
  return commonMerge?.[1]?.trim() || null;
};

const changedFilesSummary = (commit) => {
  if (!commit) return '';

  const changed = [
    ...(commit.added ?? []),
    ...(commit.modified ?? []),
    ...(commit.removed ?? []),
  ];

  const unique = [...new Set(changed)];
  if (unique.length === 0) return '';

  const shown = unique.slice(0, 6).map((file) => `\`${file}\``).join(', ');
  const rest = unique.length > 6 ? ` (+${unique.length - 6} weitere)` : '';
  return `Geänderte Dateien: ${shown}${rest}`;
};

const repository = event.repository?.full_name ?? process.env.GITHUB_REPOSITORY ?? 'Planet Zoo 2 Tools';
const repositoryUrl = event.repository?.html_url ?? `https://github.com/${repository}`;
const branch = String(event.ref ?? '').replace(/^refs\/heads\//, '') || 'unbekannt';
const sender = event.sender?.login ?? event.pusher?.name ?? 'Unbekannt';
const commits = Array.isArray(event.commits) ? event.commits : [];
const headCommit = event.head_commit ?? commits.at(-1) ?? null;

let payload;

if (mode === 'developer') {
  const title = firstLine(headCommit?.message) || 'Commit ohne Titel';
  const summary = messageBody(headCommit?.message) || changedFilesSummary(headCommit) || 'Keine zusätzliche Zusammenfassung angegeben.';
  const developer = headCommit?.author?.username ?? headCommit?.author?.name ?? sender;
  const commitUrl = headCommit?.url ?? `${repositoryUrl}/commit/${event.after}`;
  const shortSha = String(headCommit?.id ?? event.after ?? '').slice(0, 7) || 'unbekannt';

  payload = {
    username: 'Planet Zoo 2 Tools – GitHub',
    embeds: [
      {
        title: '🛠️ Entwickler-News',
        description: `Neuer Commit auf **${truncate(branch, 120)}**`,
        url: commitUrl,
        color: 0x2ecc71,
        fields: [
          { name: '🌿 Branch', value: truncate(branch, 1024), inline: true },
          { name: '👤 Entwickler', value: truncate(developer, 1024), inline: true },
          { name: '🔖 Commit', value: `\`${shortSha}\``, inline: true },
          { name: '📝 Commit-Titel', value: truncate(title, 1024) || '–', inline: false },
          { name: '📋 Zusammenfassung', value: truncate(summary, 1024) || '–', inline: false },
        ],
        footer: { text: repository },
        timestamp: headCommit?.timestamp ?? new Date().toISOString(),
      },
    ],
  };
} else {
  const sourceBranch = sourceBranchFromMessage(headCommit?.message);
  const visibleCommits = commits
    .filter((commit) => !/^Merge(?: branch)?\b/i.test(firstLine(commit.message)))
    .slice(-8);

  let changes = visibleCommits
    .map((commit) => {
      const title = firstLine(commit.message) || 'Commit ohne Titel';
      const sha = String(commit.id ?? '').slice(0, 7);
      return `• ${sha ? `\`${sha}\` ` : ''}${title}`;
    })
    .join('\n');

  if (!changes) {
    const body = messageBody(headCommit?.message);
    changes = body || changedFilesSummary(headCommit) || firstLine(headCommit?.message) || 'main wurde aktualisiert.';
  }

  const compareUrl = event.compare || headCommit?.url || repositoryUrl;

  payload = {
    username: 'Planet Zoo 2 Tools – GitHub',
    embeds: [
      {
        title: '🚀 Planet Zoo 2 Tools – Update',
        description: '**main** wurde aktualisiert.',
        url: compareUrl,
        color: 0x3498db,
        fields: [
          ...(sourceBranch
            ? [{ name: '🌿 Gemergter Branch', value: truncate(sourceBranch, 1024), inline: true }]
            : []),
          { name: '👤 Veranlasst von', value: truncate(sender, 1024), inline: true },
          { name: '🧩 Enthaltene Änderungen', value: truncate(changes, 1024) || '–', inline: false },
        ],
        footer: { text: repository },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`❌ Discord Webhook fehlgeschlagen: HTTP ${response.status}`);
  console.error(body);
  process.exit(1);
}

console.log(`✅ Discord-${mode === 'developer' ? 'Entwickler-News' : 'Update'} gesendet.`);
