#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

/**
 * Kleine .env-Lesehilfe ohne externe Abhängigkeit.
 * Lokal wird bot/.env verwendet. Auf GitHub Actions kommen die Werte
 * über Secret/Repository-Variables in process.env.
 */
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const result = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }
  return result;
}

const localEnv = readEnvFile(path.resolve('bot/.env'));
const getEnv = (name) => process.env[name] || localEnv[name] || '';

const cliMode = process.argv[2]?.trim();
const cliMessage = process.argv.slice(3).join(' ').trim();

const mode = process.env.NEWS_MODE || cliMode;
const botToken = getEnv('DISCORD_TOKEN') || getEnv('DISCORD_BOT_TOKEN');
const guildId = getEnv('GUILD_ID');
const developerChannelId = getEnv('ENTWICKLER_NEWS_ID');
const updatesChannelId = getEnv('UPDATES_ID');
const channelId =
  process.env.DISCORD_CHANNEL_ID ||
  (mode === 'main' ? updatesChannelId : developerChannelId);

const eventPath = process.env.GITHUB_EVENT_PATH;
const dryRun = process.env.DISCORD_NEWS_DRY_RUN === '1';
const testMessage =
  process.env.DISCORD_NEWS_TEST_MESSAGE?.trim() || cliMessage || '';

if (!['developer', 'main'].includes(mode)) {
  console.error('❌ NEWS_MODE muss "developer" oder "main" sein.');
  console.error('Lokal z. B.: node tools/discord-news.mjs developer "Test"');
  process.exit(1);
}

if ((!botToken || !channelId) && !dryRun) {
  if (!botToken) {
    console.error('❌ DISCORD_TOKEN fehlt. Lokal: bot/.env; GitHub: Secret prüfen.');
  }
  if (!channelId) {
    console.error(
      `❌ ${mode === 'main' ? 'UPDATES_ID' : 'ENTWICKLER_NEWS_ID'} fehlt.`,
    );
  }
  process.exit(1);
}

let event = {
  ref: `refs/heads/${process.env.GITHUB_REF_NAME || 'lokal'}`,
  repository: {
    full_name: process.env.GITHUB_REPOSITORY || 'Planet Zoo 2 Tools',
    html_url: process.env.GITHUB_SERVER_URL
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
      : 'https://github.com/DivinaDeserto97/PlanetZoo',
  },
  sender: { login: process.env.GITHUB_ACTOR || 'lokaler Test' },
  commits: [],
  head_commit: null,
};

if (eventPath && fs.existsSync(eventPath)) {
  event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
} else if (!testMessage && !dryRun) {
  console.error('❌ Kein GitHub-Event vorhanden. Für lokalen Test eine Nachricht angeben.');
  console.error('Beispiel: node tools/discord-news.mjs developer "Lokaler Test"');
  process.exit(1);
}

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

  const commonMerge = String(message).match(
    /Merge(?: branch)? ['"]?([^'"\s]+)['"]?(?: into main)?/i,
  );
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

  const shown = unique
    .slice(0, 6)
    .map((file) => `\`${file}\``)
    .join(', ');
  const rest = unique.length > 6 ? ` (+${unique.length - 6} weitere)` : '';
  return `Geänderte Dateien: ${shown}${rest}`;
};

const repository =
  event.repository?.full_name ??
  process.env.GITHUB_REPOSITORY ??
  'Planet Zoo 2 Tools';
const repositoryUrl =
  event.repository?.html_url ?? `https://github.com/${repository}`;
const branch =
  String(event.ref ?? '').replace(/^refs\/heads\//, '') || 'unbekannt';
const sender = event.sender?.login ?? event.pusher?.name ?? 'Unbekannt';
const commits = Array.isArray(event.commits) ? event.commits : [];
const headCommit = event.head_commit ?? commits.at(-1) ?? null;

let payload;

if (testMessage) {
  payload = {
    embeds: [
      {
        title: '🧪 Planet Zoo 2 Tools – Discord-Test',
        description: truncate(testMessage, 4096),
        color: 0xf1c40f,
        fields: [
          {
            name: '🎯 Ziel',
            value: mode === 'main' ? '#updates' : '#entwicklung-news',
            inline: true,
          },
          {
            name: '⚙️ Ausgeführt über',
            value: eventPath ? 'GitHub Actions' : 'lokaler Test',
            inline: true,
          },
        ],
        footer: { text: repository },
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: { parse: [] },
  };
} else if (mode === 'developer') {
  const title = firstLine(headCommit?.message) || 'Commit ohne Titel';
  const summary =
    messageBody(headCommit?.message) ||
    changedFilesSummary(headCommit) ||
    'Keine zusätzliche Zusammenfassung angegeben.';
  const developer =
    headCommit?.author?.username ?? headCommit?.author?.name ?? sender;
  const commitUrl = headCommit?.url ?? `${repositoryUrl}/commit/${event.after}`;
  const shortSha =
    String(headCommit?.id ?? event.after ?? '').slice(0, 7) || 'unbekannt';

  payload = {
    embeds: [
      {
        title: '🛠️ Entwickler-News',
        description: `Neuer Commit auf **${truncate(branch, 120)}**`,
        url: commitUrl,
        color: 0x2ecc71,
        fields: [
          { name: '🌿 Branch', value: truncate(branch, 1024), inline: true },
          {
            name: '👤 Entwickler',
            value: truncate(developer, 1024),
            inline: true,
          },
          { name: '🔖 Commit', value: `\`${shortSha}\``, inline: true },
          {
            name: '📝 Commit-Titel',
            value: truncate(title, 1024) || '–',
            inline: false,
          },
          {
            name: '📋 Zusammenfassung',
            value: truncate(summary, 1024) || '–',
            inline: false,
          },
        ],
        footer: { text: repository },
        timestamp: headCommit?.timestamp ?? new Date().toISOString(),
      },
    ],
    allowed_mentions: { parse: [] },
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
    changes =
      body ||
      changedFilesSummary(headCommit) ||
      firstLine(headCommit?.message) ||
      'main wurde aktualisiert.';
  }

  const compareUrl = event.compare || headCommit?.url || repositoryUrl;

  payload = {
    embeds: [
      {
        title: '🚀 Planet Zoo 2 Tools – Update',
        description: '**main** wurde aktualisiert.',
        url: compareUrl,
        color: 0x3498db,
        fields: [
          ...(sourceBranch
            ? [
                {
                  name: '🌿 Gemergter Branch',
                  value: truncate(sourceBranch, 1024),
                  inline: true,
                },
              ]
            : []),
          {
            name: '👤 Veranlasst von',
            value: truncate(sender, 1024),
            inline: true,
          },
          {
            name: '🧩 Enthaltene Änderungen',
            value: truncate(changes, 1024) || '–',
            inline: false,
          },
        ],
        footer: { text: repository },
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: { parse: [] },
  };
}

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

// Erst prüfen, ob die Kanal-ID erreichbar ist. Das macht 404-Fehler verständlicher.
const channelResponse = await fetch(
  `https://discord.com/api/v10/channels/${channelId}`,
  {
    headers: {
      Authorization: `Bot ${botToken}`,
      'User-Agent':
        'DiscordBot (https://github.com/DivinaDeserto97/PlanetZoo, 1.0)',
    },
  },
);

if (!channelResponse.ok) {
  const body = await channelResponse.text();
  console.error(`❌ Discord-Kanal nicht erreichbar: HTTP ${channelResponse.status}`);
  console.error(body);
  console.error(`Kanal-ID: ${channelId}`);
  if (guildId) console.error(`Erwartete Server-ID: ${guildId}`);
  console.error(
    'Hinweis: Kanal-ID prüfen UND sicherstellen, dass der Bot „Kanal ansehen“ darf.',
  );
  process.exit(1);
}

const channel = await channelResponse.json();
console.log(`✅ Discord-Ziel gefunden: #${channel.name ?? channel.id} (${channel.id})`);

if (guildId && channel.guild_id && channel.guild_id !== guildId) {
  console.error('❌ Der Kanal gehört nicht zur in GUILD_ID eingetragenen Discord-Gilde.');
  console.error(`GUILD_ID:        ${guildId}`);
  console.error(`Kanal guild_id:  ${channel.guild_id}`);
  process.exit(1);
}

const endpoint = `https://discord.com/api/v10/channels/${channelId}/messages`;
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    Authorization: `Bot ${botToken}`,
    'Content-Type': 'application/json',
    'User-Agent':
      'DiscordBot (https://github.com/DivinaDeserto97/PlanetZoo, 1.0)',
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`❌ Discord Bot-Nachricht fehlgeschlagen: HTTP ${response.status}`);
  console.error(body);

  if (response.status === 401) {
    console.error('Hinweis: DISCORD_TOKEN ist ungültig oder veraltet.');
  } else if (response.status === 403) {
    console.error('Hinweis: Der Bot darf in diesem Kanal nicht schreiben.');
  } else if (response.status === 404) {
    console.error(
      'Hinweis: Kanal-ID falsch oder der Bot darf den Kanal nicht sehen.',
    );
  }

  process.exit(1);
}

console.log(
  `✅ Discord-${mode === 'developer' ? 'Entwickler-News' : 'Update'} als Bot gesendet.`,
);
