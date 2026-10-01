#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(
  PROJECT_ROOT,
  "assets",
  "js",
  "browser.bundle.js",
);

function loadTypeScript() {
  try {
    return require("typescript");
  } catch (_) {
    // Falls TypeScript nur global installiert ist, dort ebenfalls suchen.
  }

  try {
    const globalRoot = childProcess
      .execFileSync("npm", ["root", "-g"], { encoding: "utf8" })
      .trim();
    return require(path.join(globalRoot, "typescript"));
  } catch (_) {
    throw new Error(
      'TypeScript wurde nicht gefunden. Einmal "npm install" ausführen oder TypeScript installieren.',
    );
  }
}

const ts = loadTypeScript();

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativeProjectPath(filePath) {
  return toPosix(path.relative(PROJECT_ROOT, filePath));
}

function walk(dir, predicate) {
  const result = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === ".git" ||
        entry.name === "share" ||
        entry.name === "node_modules"
      ) {
        continue;
      }
      result.push(...walk(full, predicate));
      continue;
    }

    if (predicate(full)) {
      result.push(full);
    }
  }

  return result;
}

function compileModule(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filePath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      allowJs: true,
      checkJs: false,
      removeComments: false,
      newLine: ts.NewLineKind.LineFeed,
    },
  });

  return output.outputText;
}

const moduleFiles = walk(
  path.join(PROJECT_ROOT, "assets"),
  (filePath) =>
    filePath.endsWith(".js") && !filePath.endsWith("browser.bundle.js"),
);

// Nur Dateien der eigentlichen Web-App in das Browser-Bundle aufnehmen.
// Lokale Entwicklerdaten wie bot/.env, Scans oder andere Projektdateien
// dürfen niemals versehentlich im ausgelieferten Bundle landen.
const webRoots = [
  path.join(PROJECT_ROOT, "assets"),
  path.join(PROJECT_ROOT, "pages"),
];

const resourceFiles = webRoots.flatMap((dir) =>
  walk(dir, (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".html" || ext === ".json";
  }),
);

const allFiles = webRoots
  .flatMap((dir) => walk(dir, () => true))
  .map(relativeProjectPath)
  .filter((name) => name !== "assets/js/browser.bundle.js");

const moduleEntries = moduleFiles
  .map((filePath) => {
    const id = relativeProjectPath(filePath);
    const compiled = compileModule(filePath);
    return `${JSON.stringify(id)}: function(module, exports, require, __filename, __dirname) {\n${compiled}\n}`;
  })
  .join(",\n");

const resources = {};
for (const filePath of resourceFiles) {
  resources[relativeProjectPath(filePath)] = fs.readFileSync(filePath, "utf8");
}

const runtime = `/*
 * PlanetZoo2 Browser-Bundle
 * Automatisch erzeugt durch tools/build-browser-bundle.js
 *
 * Zweck:
 * - index.html funktioniert per Doppelklick (file://)
 * - dieselbe index.html funktioniert weiterhin über HTTP/HTTPS
 * - lokale HTML- und JSON-Dateien werden bei file:// aus diesem Bundle bereitgestellt
 */
(function () {
  'use strict';

  const MODULES = {
${moduleEntries}
  };

  const RESOURCES = ${JSON.stringify(resources)};
  const FILES = new Set(${JSON.stringify(allFiles)});
  const CACHE = Object.create(null);
  const nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;

  function normalizePath(value) {
    const parts = String(value).replace(/\\\\/g, '/').split('/');
    const out = [];

    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') {
        out.pop();
        continue;
      }
      out.push(part);
    }

    return out.join('/');
  }

  function dirname(file) {
    const normalized = normalizePath(file);
    const index = normalized.lastIndexOf('/');
    return index >= 0 ? normalized.slice(0, index) : '';
  }

  function resolveModule(request, parentId) {
    let resolved;

    if (request.startsWith('./') || request.startsWith('../')) {
      resolved = normalizePath(dirname(parentId) + '/' + request);
    } else {
      resolved = normalizePath(request);
    }

    if (!resolved.endsWith('.js')) resolved += '.js';
    return resolved;
  }

  function requireModule(id, parentId) {
    const resolved = parentId ? resolveModule(id, parentId) : normalizePath(id);

    if (CACHE[resolved]) {
      return CACHE[resolved].exports;
    }

    const factory = MODULES[resolved];
    if (!factory) {
      throw new Error('Browser-Bundle: Modul nicht gefunden: ' + resolved);
    }

    const module = { exports: {} };
    CACHE[resolved] = module;

    const localRequire = (request) => requireModule(request, resolved);
    factory(module, module.exports, localRequire, resolved, dirname(resolved));
    return module.exports;
  }

  function projectRelativePath(input) {
    let raw;

    if (typeof Request !== 'undefined' && input instanceof Request) {
      raw = input.url;
    } else if (input instanceof URL) {
      raw = input.href;
    } else {
      raw = String(input);
    }

    let url;
    try {
      url = new URL(raw, document.baseURI);
    } catch (_) {
      return null;
    }

    if (url.protocol !== 'file:') {
      return null;
    }

    const rootUrl = new URL('./', document.baseURI);
    let rootPath = decodeURIComponent(rootUrl.pathname).replace(/\\\\/g, '/');
    let filePath = decodeURIComponent(url.pathname).replace(/\\\\/g, '/');

    if (!rootPath.endsWith('/')) rootPath += '/';

    // Windows file:// URLs sind nicht immer in derselben Gross-/Kleinschreibung.
    if (filePath.toLowerCase().startsWith(rootPath.toLowerCase())) {
      return normalizePath(filePath.slice(rootPath.length));
    }

    return null;
  }

  function contentTypeFor(pathName) {
    if (pathName.endsWith('.json')) return 'application/json; charset=utf-8';
    if (pathName.endsWith('.html')) return 'text/html; charset=utf-8';
    return 'text/plain; charset=utf-8';
  }

  async function fileFetch(input, init = {}) {
    const rel = projectRelativePath(input);

    if (rel === null) {
      if (!nativeFetch) throw new Error('fetch() ist in diesem Browser nicht verfügbar.');
      return nativeFetch(input, init);
    }

    const requestMethod =
      (init && init.method) ||
      (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET');
    const method = String(requestMethod || 'GET').toUpperCase();

    if (method === 'HEAD') {
      return new Response(null, {
        status: FILES.has(rel) || Object.prototype.hasOwnProperty.call(RESOURCES, rel) ? 200 : 404,
        statusText: FILES.has(rel) ? 'OK' : 'Not Found',
      });
    }

    if (Object.prototype.hasOwnProperty.call(RESOURCES, rel)) {
      return new Response(RESOURCES[rel], {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': contentTypeFor(rel) },
      });
    }

    // Für Existenzprüfungen lokaler Medien reicht eine leere erfolgreiche Antwort.
    if (FILES.has(rel)) {
      return new Response('', { status: 200, statusText: 'OK' });
    }

    return new Response('', { status: 404, statusText: 'Not Found' });
  }

  if (location.protocol === 'file:') {
    window.fetch = fileFetch;
  }

  requireModule('assets/js/main.js');
})();
`;

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, runtime, "utf8");
console.log(`Browser-Bundle erstellt: ${relativeProjectPath(OUTPUT_FILE)}`);
