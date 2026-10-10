#!/usr/bin/env node
/*
 * Erstellt pixelgenaue Kartendaten aus lokalen oder per URL verlinkten
 * Zoopedia-PNGs. Nur ausgelesene 0/1-Pixelmasken werden gespeichert.
 * Die originale Bilddatei wird weder gespeichert noch ins Bundle eingebettet.
 *
 * Aufruf: node tools/build-map-masks.js
 *         node tools/build-map-masks.js --offline
 * Benötigt nur Node.js; kein Browser, keine zusätzlichen npm-Pakete.
 */
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const vm = require("node:vm");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const outputFile = path.join(root, "assets/js/map/generated/mapMasks.js");
const offline = process.argv.includes("--offline");
const refresh = process.argv.includes("--refresh");
const SIZE = 540 * 267;
const WORLD = { x: 127, y: 15, width: 540, height: 267 };

// PNG-Decoder für 8-Bit-RGB/RGBA/Graustufen/Palette (nicht interlaced).
// Keine zusätzliche Abhängigkeit wie sharp oder pngjs erforderlich.
function decodePng(bytes) {
  if (
    !Buffer.isBuffer(bytes) ||
    !bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
  )
    throw new Error("Keine gültige PNG-Datei");
  let pos = 8,
    width = 0,
    height = 0,
    depth = 0,
    type = 0,
    interlace = 0,
    palette = null,
    transparency = null;
  const idats = [];
  while (pos + 12 <= bytes.length) {
    const len = bytes.readUInt32BE(pos),
      name = bytes.toString("ascii", pos + 4, pos + 8);
    if (len > bytes.length - pos - 12)
      throw new Error("Beschädigter PNG-Chunk");
    const data = bytes.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;
    if (name === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      type = data[9];
      interlace = data[12];
    } else if (name === "IDAT") idats.push(data);
    else if (name === "PLTE") palette = data;
    else if (name === "tRNS") transparency = data;
    else if (name === "IEND") break;
  }
  if (width < 1 || height < 1 || width > 4096 || height > 4096)
    throw new Error("Ungewöhnliche PNG-Grösse");
  if (interlace !== 0 || depth !== 8 || ![0, 2, 3, 4, 6].includes(type))
    throw new Error(
      `PNG-Format noch nicht unterstützt (Tiefe ${depth}, Typ ${type}, Interlace ${interlace})`,
    );
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type],
    stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idats), {
    maxOutputLength: (stride + 1) * height + 4096,
  });
  const pixels = new Uint8ClampedArray(width * height * 4);
  let prior = Buffer.alloc(stride),
    cursor = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c,
      pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    if (cursor + 1 + stride > raw.length)
      throw new Error("Ungültige PNG-Zeilendaten");
    const filter = raw[cursor++],
      line = Buffer.from(raw.subarray(cursor, cursor + stride));
    cursor += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0,
        b = prior[x],
        c = x >= channels ? prior[x - channels] : 0;
      if (filter === 1) line[x] = (line[x] + a) & 255;
      else if (filter === 2) line[x] = (line[x] + b) & 255;
      else if (filter === 3)
        line[x] = (line[x] + Math.floor((a + b) / 2)) & 255;
      else if (filter === 4) line[x] = (line[x] + paeth(a, b, c)) & 255;
      else if (filter !== 0) throw new Error("Unbekannter PNG-Filter");
    }
    for (let x = 0; x < width; x++) {
      const src = x * channels,
        dst = (y * width + x) * 4;
      if (type === 6) {
        pixels[dst] = line[src];
        pixels[dst + 1] = line[src + 1];
        pixels[dst + 2] = line[src + 2];
        pixels[dst + 3] = line[src + 3];
      }
      if (type === 2) {
        pixels[dst] = line[src];
        pixels[dst + 1] = line[src + 1];
        pixels[dst + 2] = line[src + 2];
        pixels[dst + 3] = 255;
      }
      if (type === 0) {
        pixels[dst] = pixels[dst + 1] = pixels[dst + 2] = line[src];
        pixels[dst + 3] = 255;
      }
      if (type === 4) {
        pixels[dst] = pixels[dst + 1] = pixels[dst + 2] = line[src];
        pixels[dst + 3] = line[src + 1];
      }
      if (type === 3) {
        const n = line[src];
        pixels[dst] = palette?.[3 * n] ?? 0;
        pixels[dst + 1] = palette?.[3 * n + 1] ?? 0;
        pixels[dst + 2] = palette?.[3 * n + 2] ?? 0;
        pixels[dst + 3] = transparency?.[n] ?? 255;
      }
    }
    prior = line;
  }
  return { width, height, pixels };
}

// Der Quellcode der Kartenlogik wird unverändert auch beim Erstellen der
// Masken benutzt (einschliesslich Zoopedia-Detailkarte/Axolotl-Sonderfall).
// Dazu wird lediglich die minimale Canvas-API für Pixelzugriffe bereitgestellt.
function createMaskAnalyzer() {
  class PixelCanvas {
    constructor() {
      this.width = 0;
      this.height = 0;
      this.data = null;
    }
    getContext() {
      const parent = this;
      return {
        drawImage(image, ...args) {
          let sx = 0,
            sy = 0,
            sw = image.width,
            sh = image.height,
            dx = 0,
            dy = 0,
            dw = sw,
            dh = sh;
          if (args.length === 2) [dx, dy] = args;
          else if (args.length === 4) [dx, dy, dw, dh] = args;
          else if (args.length === 8) [sx, sy, sw, sh, dx, dy, dw, dh] = args;
          else throw new Error("Unbekannte Canvas-Aufrufsignatur");
          const out = new Uint8ClampedArray(parent.width * parent.height * 4);
          for (let yy = 0; yy < dh; yy++)
            for (let xx = 0; xx < dw; xx++) {
              const sourceX = Math.floor(sx + ((xx + 0.5) * sw) / dw);
              const sourceY = Math.floor(sy + ((yy + 0.5) * sh) / dh);
              const targetX = dx + xx,
                targetY = dy + yy;
              if (
                sourceX < 0 ||
                sourceY < 0 ||
                sourceX >= image.width ||
                sourceY >= image.height ||
                targetX < 0 ||
                targetY < 0 ||
                targetX >= parent.width ||
                targetY >= parent.height
              )
                continue;
              const src = (sourceY * image.width + sourceX) * 4,
                dst = (targetY * parent.width + targetX) * 4;
              out[dst] = image.pixels[src];
              out[dst + 1] = image.pixels[src + 1];
              out[dst + 2] = image.pixels[src + 2];
              out[dst + 3] = image.pixels[src + 3];
            }
          parent.data = out;
        },
        getImageData(x, y, w, h) {
          const data = new Uint8ClampedArray(w * h * 4);
          for (let yy = 0; yy < h; yy++)
            for (let xx = 0; xx < w; xx++) {
              const src = ((y + yy) * parent.width + x + xx) * 4,
                dst = (yy * w + xx) * 4;
              if (src >= 0 && src + 3 < (parent.data?.length ?? 0))
                data.set(parent.data.subarray(src, src + 4), dst);
            }
          return { data };
        },
      };
    }
  }
  let source = fs.readFileSync(
    path.join(root, "assets/js/map/features/mapRenderer.js"),
    "utf8",
  );
  source = source.replace(/^import\s+[\s\S]*?;\s*$/gm, "");
  source = source.replace(/export\s+async\s+function/g, "async function");
  const sandbox = {
    document: {
      createElement: (name) => {
        if (name !== "canvas") throw Error("Canvas erwartet");
        return new PixelCanvas();
      },
    },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(
    source + "\nthis.__mapAnalyzer={createRangeMask,isLandPixel};",
    sandbox,
    { timeout: 30000 },
  );
  return sandbox.__mapAnalyzer;
}

function encodeMask(mask) {
  if (!mask || mask.length !== SIZE) throw Error("Falsche Maskengrösse");
  const runs = [];
  let last = 0,
    length = 0;
  for (const value of mask) {
    const next = value ? 1 : 0;
    if (next !== last) {
      runs.push(length.toString(36));
      length = 0;
      last = next;
    }
    length++;
  }
  runs.push(length.toString(36));
  return runs.join(".");
}
function decodeMask(s) {
  const mask = new Uint8Array(SIZE);
  if (!s) return mask;
  let offset = 0,
    value = 0;
  for (const run of s.split(".")) {
    const len = parseInt(run, 36);
    if (value) mask.fill(1, offset, offset + len);
    offset += len;
    value ^= 1;
  }
  if (offset !== SIZE) throw Error("Maskendatei beschädigt");
  return mask;
}
function localPath(p) {
  if (typeof p !== "string" || !p || path.isAbsolute(p) || p.includes(".."))
    return null;
  const filename = path.join(root, p);
  return fs.existsSync(filename) ? filename : null;
}
const failedHosts = new Map();
async function fetchPng(url) {
  if (offline) throw Error("Offline-Modus");
  const u = new URL(url);
  if (!["https:", "http:"].includes(u.protocol))
    throw Error("Nur HTTP/HTTPS erlaubt");
  // Kein minutenlanges Warten, falls ein Bildserver gerade nicht erreichbar ist.
  if ((failedHosts.get(u.host) ?? 0) >= 3)
    throw Error(`Bildserver vorübergehend nicht erreichbar: ${u.host}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(u, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw Error(`HTTP ${res.status}`);
    if (Number(res.headers.get("content-length")) > 12 * 1024 * 1024)
      throw Error("PNG zu gross");
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 12 * 1024 * 1024) throw Error("PNG zu gross");
    return bytes;
  } catch (err) {
    if (
      err.name === "AbortError" ||
      err.name === "TimeoutError" ||
      err.message === "fetch failed"
    ) {
      failedHosts.set(u.host, (failedHosts.get(u.host) ?? 0) + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
// Die Landform ist unabhängig von einem Tier. Falls die Weltreferenz im
// Projekt nicht vorhanden ist, wird sie aus der Hintergrundfarbe einer
// tatsächlich ausgelesenen Zoopedia-Karte zusammengesetzt.
function addLandFromAnimal(image, landMask, renderer) {
  if (
    image.width < WORLD.x + WORLD.width ||
    image.height < WORLD.y + WORLD.height
  )
    return;
  for (let y = 0; y < WORLD.height; y++)
    for (let x = 0; x < WORLD.width; x++) {
      const i = ((WORLD.y + y) * image.width + WORLD.x + x) * 4;
      if (
        renderer.isLandPixel({
          r: image.pixels[i],
          g: image.pixels[i + 1],
          b: image.pixels[i + 2],
        })
      )
        landMask[y * WORLD.width + x] = 1;
    }
}
function hash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 20);
}
function animalId(animal) {
  return String(
    animal.id ??
      animal.WissenschaftlicherName ??
      animal.wissenschaftlicherName ??
      "",
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
async function main() {
  const renderer = createMaskAnalyzer();
  const importText = fs.readFileSync(
    path.join(root, "assets/daten/lebewesen/tiere/datenImport.js"),
    "utf8",
  );
  const names = [
    ...importText.matchAll(
      /"(assets\/daten\/lebewesen\/tiere\/[^"\n]+\.json)"/g,
    ),
  ].map((m) => m[1]);
  const previous = fs.existsSync(outputFile)
    ? fs.readFileSync(outputFile, "utf8")
    : "";
  const readOld = (name) => {
    const m = previous.match(new RegExp(`export const ${name} = ([^;]+);`));
    try {
      return m ? JSON.parse(m[1]) : name === "MAP_MASKS" ? {} : "";
    } catch {
      return name === "MAP_MASKS" ? {} : "";
    }
  };
  const oldMasks = readOld("MAP_MASKS");
  const oldLand = readOld("LAND_MASK");
  const masks = {};
  let successes = 0,
    reused = 0,
    failed = 0,
    downloaded = 0,
    missing = 0,
    localCount = 0;
  let landMask = null;
  let referenceLoaded = false;
  const reference = localPath(
    "assets/daten/Weltkarte/Weltkartenreferenz_map.png",
  );
  if (reference) {
    try {
      const image = decodePng(fs.readFileSync(reference));
      landMask = new Uint8Array(SIZE);
      addLandFromAnimal(image, landMask, renderer);
      referenceLoaded = true;
      console.log("Weltreferenz: lokales PNG ausgelesen.");
    } catch (err) {
      console.warn("Weltreferenz nicht lesbar:", err.message);
    }
  }
  if (!landMask && oldLand) {
    try {
      landMask = decodeMask(oldLand);
      console.log("Weltreferenz: frühere Landmaske wiederverwendet.");
    } catch (err) {
      console.warn("Frühere Landmaske ungültig:", err.message);
    }
  }
  // Node.js führt die HTTP-Downloads unabhängig von Browser-CORS durch.
  // Beim anschliessenden Doppelklick werden ausschliesslich die generierten
  // 1-Bit-Masken verwendet, nicht die fremden Original-PNG-Pixel via Canvas.
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      while (cursor < names.length) {
        const jsonPath = names[cursor++];
        let animal;
        try {
          animal = JSON.parse(
            fs.readFileSync(path.join(root, jsonPath), "utf8"),
          );
        } catch (err) {
          console.warn(`Ungültige Tier-JSON: ${jsonPath}: ${err.message}`);
          continue;
        }
        const card = animal?.karte ?? animal?.Karte;
        const id = animalId(animal);
        if (!card || !id) {
          missing++;
          continue;
        }
        const list = Array.isArray(card.dateien) ? card.dateien : [];
        const local =
          list.find(
            (f) =>
              f?.typ === "original" &&
              String(f.dateityp).toLowerCase() === "png" &&
              f.pfad,
          )?.pfad ??
          list.find(
            (f) => String(f?.dateityp).toLowerCase() === "png" && f?.pfad,
          )?.pfad ??
          card.pfad ??
          card.Pfad;
        const file = localPath(local);
        const url =
          typeof card.url === "string" && /^https?:\/\//i.test(card.url)
            ? card.url
            : null;
        const signature = `pixel-v3|${local ?? ""}|${url ?? ""}`;
        const old = oldMasks[id];
        const remember = (image, source, sourceType) => {
          const mask = renderer.createRangeMask(image);
          if (!mask.some(Boolean))
            throw Error("Kein pinkes Verbreitungsgebiet erkannt");
          masks[id] = {
            source: signature,
            sourceType,
            hash: sourceType === "local" ? hash(source) : undefined,
            data: encodeMask(mask),
          };
          successes++;
          if (!landMask) landMask = new Uint8Array(SIZE);
          if (!referenceLoaded) addLandFromAnimal(image, landMask, renderer);
        };
        let done = false;
        // Priorität 1: lokale PNG. Auch bei vorhandenem URL-Fallback
        // wird IMMER zuerst die PNG geprüft und vollständig pixelanalysiert.
        if (file) {
          try {
            const bytes = fs.readFileSync(file);
            remember(decodePng(bytes), bytes, "local");
            localCount++;
            done = true;
          } catch (err) {
            console.warn(
              `Lokale PNG unbrauchbar (${id}), versuche URL: ${err.message}`,
            );
          }
        }
        // Priorität 2: URL. Eine bereits korrekt verarbeitete URL wird
        // wiederverwendet, sodass ein Offline-Build möglich bleibt.
        if (!done && url) {
          if (
            !refresh &&
            old?.source === signature &&
            old?.sourceType === "remote" &&
            old.data
          ) {
            try {
              decodeMask(old.data);
              masks[id] = old;
              reused++;
              done = true;
            } catch (err) {
              console.warn(`Alte Maske ungültig (${id}): ${err.message}`);
            }
          }
          if (!done && !offline) {
            try {
              const bytes = await fetchPng(url);
              remember(decodePng(bytes), bytes, "remote");
              downloaded++;
              done = true;
            } catch (err) {
              console.warn(`Online-Karte nicht lesbar (${id}): ${err.message}`);
            }
          }
        }
        // Wenn die Verbindung später ausfällt, die letzte gültige Maske
        // erhalten, statt eine früher korrekte Karte leer zu machen.
        if (!done && old?.source === signature && old.data) {
          try {
            decodeMask(old.data);
            masks[id] = old;
            reused++;
            done = true;
          } catch {}
        }
        if (!done) {
          if (file || url) failed++;
          else missing++;
        }
      }
    }),
  );
  const found = Object.keys(masks).length;
  console.log(
    `Pixelkarten: ${found} von ${names.length} Tier-JSONs (${localCount} lokal, ${downloaded} URL, ${reused} aus letztem Build, ${failed} fehlgeschlagen, ${missing} ohne Kartenquelle).`,
  );
  if (!found) {
    console.error(
      "ABBRUCH: Keine einzige Pixelmaske erstellt. Bestehende Kartenmasken bleiben unverändert.",
    );
    process.exitCode = 2;
    return;
  }
  if (!landMask || !landMask.some(Boolean)) {
    console.error(
      "ABBRUCH: Keine Landmaske vorhanden. Lege Weltkartenreferenz_map.png bereit oder ermögliche den Download mindestens eines Kartenbildes.",
    );
    process.exitCode = 3;
    return;
  }
  if (failed) {
    console.warn(
      `ACHTUNG: ${failed} Karten ohne Pixelmaske. Diese Tiere werden auf der Karte als fehlend angezeigt.`,
    );
  }
  const result = `/* Automatisch generierte Kartenpixel, erstellt mit tools/build-map-masks.js.\n * Keine Original-PNGs. Ändern nur durch erneutes Builden. */\nexport const MAP_MASKS = ${JSON.stringify(masks)};\nexport const LAND_MASK = ${JSON.stringify(encodeMask(landMask))};\n`;
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  const temporary = outputFile + ".tmp";
  fs.writeFileSync(temporary, result);
  fs.renameSync(temporary, outputFile);
  console.log("Gespeichert:", path.relative(root, outputFile));
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
