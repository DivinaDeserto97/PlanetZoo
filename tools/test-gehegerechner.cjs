#!/usr/bin/env node
// Node-Tests für die zentrale Berechnung ohne Browser/Netzwerk.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'assets/js/rechner/rechnerBerechnung.js'), 'utf8');
const js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, {
  module: mod, exports: mod.exports,
  require: () => ({ getAlleNahrungsBeziehungen: () => [], getTierIds: () => [] }),
});
const { getRechnerDaten, berechneFlaechen, sozialeGruppen } = mod.exports;
function tier(id) {
  const file = findFile(path.join(root, 'assets/daten/lebewesen/tiere'), id + '.json');
  assert(file, `Tierdatei ${id} fehlt`);
  return { id, originalDaten: JSON.parse(fs.readFileSync(file, 'utf8')) };
}
function findFile(dir, name) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const file = findFile(p, name); if (file) return file; }
    else if (e.name === name && path.basename(dir) === name.slice(0, -5)) return p;
  }
  return null;
}
function entry(id, males, females, young=0) {
  const t = tier(id);
  return { tier:t, name:id, maennchen:males, weibchen:females,
    jungtiere:young, anzahl:males+females+young, rechner:getRechnerDaten(t) };
}
function eq(value, expected, message) { assert.equal(value, expected, message); }
const b = entry('Arctictis binturong',1,1);
const areasB = berechneFlaechen([b]);
eq(areasB.land.wert,200,'Binturong 2: 182 + 18');
eq(areasB.klettern.wert,76,'Binturong: 60 + 16');
eq(areasB.schutz.wert,8,'Binturong: 4 m² pro Tier');
eq(sozialeGruppen(b.tier,b.rechner).max,5,'Binturong Maximum laut Quelle');
const lion=entry('Panthera leo',2,2);
eq(berechneFlaechen([lion]).land.wert,1140,'Vier Löwen');
eq(berechneFlaechen([lion]).schutz.wert,40,'Vier Löwen Unterschlupf');
const mixed=berechneFlaechen([lion,b]);
eq(mixed.land.wert,1140,'Unterschiedliche Tierarten: Maximum statt Summe');
eq(mixed.klettern.wert,76,'Kletterfläche separat');
const wolf=entry('Canis lupus',2,2,4);
eq(berechneFlaechen([wolf]).land.wert,1162+7*92,'Jungtiere bei Bedarf einrechnen');
const flamingo=entry('Phoenicopterus roseus',10,10);
eq(berechneFlaechen([flamingo]).flug.wert,60+19*2,'Flugfläche Flamingo');
eq(berechneFlaechen([flamingo]).wasser.unvollstaendig,true,'Flamingo-Wasserzuschlag unbekannt');
const shark=entry('Carcharias taurus',1,1);
eq(berechneFlaechen([shark]).tauchflaeche.wert,660,'Hai: Tiefwasser 420+240');
eq(berechneFlaechen([shark]).land.wert,0,'Aquarium braucht keine Landfläche');
const koi=entry('Cyprinus sp.',2,3);
eq(berechneFlaechen([koi]).tauchflaeche.wert,110,'Koi: 50+4*15');
eq(sozialeGruppen(koi.tier,koi.rechner).max,5,'Koi-Zoopedia-Gruppenwert statt alter Beispielwert');
// Vollständigkeitskontrolle der Stammdaten.
let count=0;
(function walk(dir){ for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
  const p=path.join(dir,e.name);
  if(e.isDirectory())walk(p);
  else if(e.name.endsWith('.json') && path.basename(dir)===e.name.slice(0,-5)){
    const d=JSON.parse(fs.readFileSync(p,'utf8'));
    assert(d.planetZoo2?.rechner?.quelle?.url,'fehlende Quellenangabe: '+p);
    assert(d.planetZoo2.rechner.gruppe?.min != null,'fehlender Gruppenwert: '+p);
    count++;
  }
}})(path.join(root,'assets/daten/lebewesen/tiere'));
eq(count,136,'136 Tier-JSON-Dateien mit Rechnerwerten');
console.log(`OK: Berechnung, Jungtiere, Flug-/Wasser-/Landfläche, 136 Tierdaten (${count})`);
