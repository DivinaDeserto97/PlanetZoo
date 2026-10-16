import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getRechnerDaten, berechneFlaechen } from '../assets/js/rechner/rechnerBerechnung.js';
import { profilAusZoopedia, pruefeZonen, umweltUeberschneidung, pruefeZonenKapazitaet } from '../assets/js/rechner/zonenLogik.js';
const base=new URL('../assets/daten/lebewesen/tiere/',import.meta.url).pathname;
function findeDatei(wissenschaftlicherName) {
  const queue=[base];
  while(queue.length) {
    const dir=queue.shift();
    for(const f of fs.readdirSync(dir,{withFileTypes:true})) {
      const ziel=path.join(dir,f.name);
      if(f.isDirectory())queue.push(ziel);
      else if(f.name===wissenschaftlicherName+'.json')return ziel;
    }
  }
  throw new Error('Art nicht gefunden: '+wissenschaftlicherName);
}
function art(name,erwachsene=1) {
  const data=JSON.parse(fs.readFileSync(findeDatei(name),'utf8'));
  const tier={id:name,datenId:name,wissenschaftlicherName:name,originalDaten:data};
  return {tier,name,anzahl:erwachsene,maennchen:1,weibchen:erwachsene-1,jungtiere:0,rechner:getRechnerDaten(tier)};
}
const flamingo=art('Phoenicopterus roseus',500);
const buffalo=art('Syncerus caffer caffer',15);
const fish=art('Hydrocynus vittatus',5);
const kata=art('Lemur catta',3);
assert.equal(berechneFlaechen([flamingo]).wasser.wert,1577,'Flamingo: offizieller Messpunkt bei 500');
assert.equal(berechneFlaechen([flamingo,buffalo]).land.wert,3094,'Keine Addition gemeinsamer Landflächen');
assert.equal(berechneFlaechen([buffalo]).wasser.wert,160);
assert.equal(berechneFlaechen([fish]).tauchflaeche.wert,220);
assert.equal(profilAusZoopedia(kata).faehigkeiten.klettern,true);
assert.equal(profilAusZoopedia(kata).faehigkeiten.springen,null,'Keine erfundene Sprungweite');
assert.equal(profilAusZoopedia(buffalo).faehigkeiten.klettern,null,'Klettern ist nicht aus Abwesenheit negierbar');
assert.equal(profilAusZoopedia(flamingo).faehigkeiten.fliegen,true);
assert.equal(umweltUeberschneidung([kata,buffalo]).temperatur.min,18);
assert.equal(umweltUeberschneidung([kata,buffalo]).temperatur.max,33);
const zonen=[
  {id:'land',name:'Weide',typ:'land',flaeche:3200,startArten:[kata.tier.id,buffalo.tier.id]},
  {id:'besucher',name:'Besucher',typ:'besucher',flaeche:100,startArten:[]},
  {id:'tief',name:'Tiefwasser',typ:'tiefwasser',flaeche:220,startArten:[fish.tier.id]},
];
let analyse=pruefeZonen([kata,buffalo,fish],zonen,[{von:'land',nach:'besucher',art:'klettern',getestet:false,beidseitig:true}]);
assert.equal(analyse.bewegung[kata.tier.id].zonen.besucher,1,'Ungetesteter Kletterweg nicht bestätigt');
assert.equal(analyse.bewegung[buffalo.tier.id].zonen.besucher,1,'Unbekanntes Büffel-Klettern nicht als Nein ausgeben');
assert.ok(analyse.besucher[0].verboten.includes(buffalo.name),'Warnung wenn Büffel möglicherweise Besucher erreicht');
assert.equal(analyse.bewegung[fish.tier.id].zonen.land,0,'Fisch erreicht Weide nicht ohne Weg');
assert.equal(analyse.bewegung[fish.tier.id].zonen.tief,2,'Aquarium-Startzone zugewiesen');
let capacity=pruefeZonenKapazitaet([fish],zonen,[]);
assert.equal(capacity.find((x)=>x.art==='tauchflaeche').status,'rechnerisch-ausreichend');
analyse=pruefeZonen([kata,buffalo,fish],zonen,[{von:'land',nach:'besucher',art:'gesperrt',getestet:true}]);
assert.equal(analyse.bewegung[buffalo.tier.id].zonen.besucher,0,'Geschlossene Barriere verhindert Weg');
console.log('Alle Zonentests erfolgreich.');
