/*
 * Automatische, gerichtete Trennvorschläge aus den vorhandenen Zoopedia-Profilen.
 * Der Nutzer wählt Tiere – NICHT zwingend zuerst Zonen oder Übergänge.
 * Fähigkeit = ja/nein/unbekannt. Klettern und Fliegen haben absichtlich
 * keine künstliche Höhen- oder Distanzgrenze. Die Geometrie muss stimmen.
 * "Fehlt in der Zoopedia" ist ausdrücklich KEIN bestätigtes "kann nicht".
 */
import { profilAusZoopedia, paarStatus } from './zonenLogik.js';
import { analysiereBeziehungen } from './rechnerBerechnung.js';

const AKTIONEN = [
  { key:'klettern', titel:'Kletterverbindung', beschreibung:'Eine kletterbare Verbindung, die nur die gewünschte Art nutzen soll (Felsen, Kletterstruktur oder Brücke).', bau:'Kletterroute mit ansonsten unpassierbarer Umrandung anlegen. Die gesamte alternative Wegführung muss geschlossen sein.' },
  { key:'fliegen', titel:'Flugverbindung', beschreibung:'Eine überfliegbare Verbindung zu einem Landeplatz; die andere Art soll weder hinlaufen noch anders hinübergelangen.', bau:'Landeplatz und Luftweg frei lassen, Bodenwege, Sprungwege und Umgehungen für die andere Art unterbrechen.' },
  { key:'flattern', titel:'Flatterverbindung', beschreibung:'Eine kurze Überwindung durch Flattern statt eines Bodenwegs.', bau:'Niedrigen getrennten Übergang vorsehen und im Spiel prüfen, ob die flatternde Art tatsächlich landet.' },
  { key:'tauchen', titel:'Unterwasser-Durchgang', beschreibung:'Ein Tauchweg unter einer durchgehenden Trennwand, der keine Boden- oder Schwimmverbindung bietet.', bau:'Tauchtunnel mit versperrtem Oberflächen- und Landweg planen; Tiefe und freier Durchlass müssen im Spiel passen.' },
  { key:'schwimmen', titel:'Schwimmverbindung', beschreibung:'Eine Wasserverbindung zwischen zwei Ufern, die nur schwimmfähige Arten nutzen sollen.', bau:'Wasserweg ohne Land-, Kletter-, Flug- oder Sprung-Umgehung anlegen.' },
];
function statusDerGegenart(profil,key) {
  return profil.faehigkeiten[key] === false ? 'ausgeschlossen'
    : profil.faehigkeiten[key] === true ? 'ebenfalls' : 'unbekannt';
}
function richtungsIdeen(von,gegen) {
  const pVon=profilAusZoopedia(von), pGegen=profilAusZoopedia(gegen);
  const result=[];
  for(const art of AKTIONEN) {
    if(pVon.faehigkeiten[art.key] !== true) continue;
    const status=statusDerGegenart(pGegen,art.key);
    if(status==='ebenfalls') continue; // Beide können die Verbindung benutzen: KEINE Trennoption.
    result.push({
      typ:art.key,
      titel:`${art.titel}: ${von.name} → eigener Bereich`,
      richtung:`${von.name} erreicht die andere Seite, ${gegen.name} soll zurückbleiben`,
      sicherheit:status==='ausgeschlossen'?'datenbasiert':'unbestaetigt',
      begruendung:status==='ausgeschlossen'
        ? `${von.name}: ${art.key} laut Tierprofil möglich. ${gegen.name}: laut Tierprofil nicht möglich.`
        : `${von.name}: ${art.key} laut Tierprofil möglich. Ob ${gegen.name} das ebenfalls kann, ist nicht belegt.`,
      beschreibung:art.beschreibung,
      bau:art.bau,
      bedingung:status==='ausgeschlossen'
        ? 'Bewegungsunterschied ist dokumentiert. Die konkrete Barriere, alternative Wege und Jungtiere müssen trotzdem geprüft werden.'
        : 'Noch KEINE bestätigte Trennung: fehlende Fähigkeit der anderen Art durch Spieldaten/Test klären.',
    });
  }
  return result;
}
function istAquatisch(e) {
  return e.rechner.art === 'aquarium' ||
    (e.rechner.flaechen.tauchflaeche?.basis ?? 0)>0;
}
function istLandtier(e) { return profilAusZoopedia(e).faehigkeiten.landgang===true; }
function wasserNebeneinander(a,b) {
  const aquatisch=istAquatisch(a)?a:istAquatisch(b)?b:null;
  const land= aquatisch===a?b:a;
  if(!aquatisch || !istLandtier(land))return null;
  return {
    typ:'ufer-tiefwasser', titel:'Gemeinsames Gehege mit Ufer und Tiefwasser',
    richtung:`${land.name} am Ufer, ${aquatisch.name} im Wasser`,
    sicherheit:'unbestaetigt',
    begruendung:`${aquatisch.name} hat Aquarien-/Tiefwasserbedarf; ${land.name} hat Landflächenbedarf. Das zeigt unterschiedliche Aufenthaltsbereiche, nicht zwingend zwei abgeschlossene Gehege.`,
    beschreibung:'Landtiere können am Ufer trinken, während Fische tiefer schwimmen. Watende, schwimmende und tauchende Tiere können denselben Wasserbereich erreichen.',
    bau:'Land und flaches Ufer mit tieferem Wasser verbinden. Eine gemeinsame Haltung erst zulassen, wenn Begegnungs- und Jagdverhalten im Spiel geklärt sind.',
    bedingung:'Kein automatischer Sicherheitsnachweis: Uferkontakt, Tiere im Wasser, weitere Wege und konkrete Räuber-Beute-Beziehungen prüfen.',
  };
}
function koerperlaengeMeter(e) {
  const werte=e.tier.originalDaten?.daten?.koerperlaenge?.werte??[];
  return werte.filter((v)=>Number.isFinite(v.min)&&Number.isFinite(v.max)&&
    (v.einheit==='m'||v.einheit==='cm') &&
    ['erwachsen','ausgewachsen'].includes(v.typ)).map((v)=>({
      min:v.min*(v.einheit==='cm'?0.01:1),max:v.max*(v.einheit==='cm'?0.01:1),
      quelle:v.quelle??'unbekannt',
    }))[0]??null;
}
function engstelle(a,b) {
  const aMass=koerperlaengeMeter(a),bMass=koerperlaengeMeter(b);
  const kleinere=aMass&&bMass?(aMass.max<bMass.min?a:bMass.max<aMass.min?b:null):null;
  const groessere=kleinere===a?b:kleinere===b?a:null;
  const differenz=kleinere
    ? `${kleinere.name} ist nach den hinterlegten Körperlängen kleiner als ${groessere.name}; das ist nur ein Hinweis auf einen möglichen Durchgang, keine gemessene Öffnungsbreite. `
    : 'Es liegt kein eindeutiger Grössenunterschied in den hinterlegten Körperlängen vor. ';
  return {
    typ:'engstelle', titel:kleinere?`Engstelle: Zugang für ${kleinere.name} prüfen`:'Engstelle oder selektiver Durchgang prüfen',
    richtung:kleinere?`${kleinere.name} soll passieren; ${groessere.name} soll zurückbleiben`:
      `Mögliche unterschiedliche Zugänglichkeit für ${a.name} und ${b.name}`,
    sicherheit:'unbestaetigt',
    begruendung:differenz+'Körperlänge und Gewicht liefern keine zuverlässige Kollisionsbreite oder Spiel-Wegfindung. Auch bei zwei Kletterern kann aber eine geometrische Durchgangstrennung möglich sein.',
    beschreibung:'Eine schmale Öffnung, ein verwinkelter Spalt oder ein einseitig erreichbarer Übergang könnte nur eine Art durchlassen.',
    bau:'Durchgang im Spiel für beide Tierarten und die jeweiligen Jungtiere testen. Alternative Sprung-, Flug-, Kletter- und Wasserwege ausschliessen.',
    bedingung:'Aus den vorhandenen Daten nicht als funktionierende Trennung belegbar. Körpergrösse allein gilt nicht als Beweis.',
  };
}
function aussengrenze(a,b) {
  const as=[a.rechner.barriere,b.rechner.barriere];
  if(!as.every((v)=>Number.isFinite(v?.stufe)&&Number.isFinite(v?.hoeheMeter)))return null;
  const stufe=Math.max(...as.map((v)=>v.stufe));
  const hoehe=Math.max(...as.map((v)=>v.hoeheMeter));
  return {
    typ:'separate-barriere',titel:`Abgeschlossene Teilgehege – Grundanforderung Stufe ${stufe}, ${hoehe} m`,
    richtung:'Keine gewollte Verbindung zwischen den beiden Tierbereichen',
    sicherheit:'unbestaetigt',
    begruendung:'Höchste dokumentierte Zoopedia-Mindestanforderungen der beiden Arten.',
    beschreibung:'Eine physische Trennbarriere ist die Rückfalllösung, wenn keine selektive Verbindung ausreichend belegt ist.',
    bau:'Geeignete geschlossene Barriere mit mindestens den angegebenen Spielwerten bauen, alle Kletter-, Flug-, Unterwasser- und Umgehungsmöglichkeiten sichern.',
    bedingung:'Die Zoopedia-Mindestbarriere ist kein eigenständiger Beweis für sichere innere Trennung; offene Oberseite und Kletterhilfen beachten.',
  };
}
function prioritaet(typ) { return typ==='datenbasiert' ? 0:1; }
function paarEmpfehlung(a,b,beziehungen) {
  const relation=paarStatus(a,b,beziehungen);
  const vorschlaege=[...richtungsIdeen(a,b),...richtungsIdeen(b,a)];
  const wasser=wasserNebeneinander(a,b);
  if(wasser)vorschlaege.push(wasser);
  vorschlaege.push(engstelle(a,b));
  const grenze=aussengrenze(a,b);
  if(grenze)vorschlaege.push(grenze);
  vorschlaege.sort((x,y)=>prioritaet(x.sicherheit)-prioritaet(y.sicherheit));
  const pruefung=relation.status==='gefahr'?'Gefährliche ökologische Beziehung dokumentiert; getrennte erreichbare Bereiche einplanen.'
    : relation.status==='neutral'?'Zoopedia-Beziehung neutral: keine Trennung allein aufgrund dieser Beziehung erforderlich.'
    : relation.status==='erfolgreich'?'Zoopedia-Beziehung erfolgreich: gemeinsame Zone grundsätzlich naheliegend.'
    : 'Keine bestätigte Verträglichkeit. Nicht automatisch als Gefahr oder als sicher einstufen.';
  const ap=profilAusZoopedia(a).faehigkeiten, bp=profilAusZoopedia(b).faehigkeiten;
  const gemeinsam=AKTIONEN.filter((v)=>ap[v.key]===true&&bp[v.key]===true).map((v)=>v.key);
  return { a:a.name,b:b.name,relation,pruefung,varianten:vorschlaege,
    gemeinsam, bevorzugt:vorschlaege.find((v)=>v.sicherheit==='datenbasiert')??null };
}
export function automatischeTrennVorschlaege(eintraege) {
  const arten=eintraege.filter((e)=>e.anzahl>0), beziehungen=analysiereBeziehungen(arten),paare=[];
  for(let i=0;i<arten.length;i++)for(let j=i+1;j<arten.length;j++)
    paare.push(paarEmpfehlung(arten[i],arten[j],beziehungen));
  const besucher=arten.filter((e)=>e.rechner.besucherBetretbar===true).flatMap((betretbar)=>
    arten.filter((e)=>e.tier.id!==betretbar.tier.id&&e.rechner.besucherBetretbar===false)
      .map((nicht)=>({ tier:betretbar.name,fernzuhalten:nicht.name,
        varianten:richtungsIdeen(betretbar,nicht),
        hinweis:'Diese Art darf laut Zoopedia zum Besucher, die andere nicht. Ohne belegte selektive Verbindung muss der Besucherbereich vollständig abgetrennt werden.'})));
  return {paare,besucher,arten:arten.length};
}
