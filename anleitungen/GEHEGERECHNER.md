# Planet Zoo 2 Tools – Gehegerechner

Der Gehegerechner unter **Rechner** benutzt die bestehende Tierauswahl aus `assets/js/features/tierAuswahl.js`. Er ist lokal nutzbar und kann Tiere mit derselben Such- und Filterlogik wie die anderen Werkzeuge ergänzen oder entfernen.

## Welche Daten bereits vorhanden sind

- Tiernamen, Edition, Gehegetyp, Kontinente, Biome, Schutzstatus: vorhandene Tier-JSON-Dateien.
- Räuber–Beute, Konkurrenz, Symbiose und gegenseitiger Nutzen: vorhandenes `daten.ernaehrung.nahrungsnetz` (soweit Beziehungen mit einer anderen gewählten Tierart vorhanden sind).
- Gruppengrössen: `daten.sozialeStruktur.werte`, **sofern Einträge min/max enthalten**. Diese beschreiben häufig biologische Sozialformen und sind **keine bestätigten Spielwerte**. Bei mehreren Sozialformen zeigt der Rechner die kleinste dokumentierte Untergrenze und die grösste dokumentierte Obergrenze.
- `planetZoo2.rechner`: in der gelieferten Version bei allen Tieren bisher `null`! Deswegen sind die Flächen, Besucherbetretbarkeit und die meisten Fortbewegungsdaten noch unbekannt. Die Software erfindet diese Werte nicht.

## Neue Daten dauerhaft eintragen

Im JSON der Art kann `planetZoo2.rechner` so aussehen (nur **Schema-Beispiel**, die Werte sind **erfunden** und dürfen **nicht** als reale Werte übernommen werden):

```json
{
  "rechner": {
    "gruppe": { "min": null, "max": null },
    "flaechen": {
      "land": { "basis": null, "jeWeiteresTier": null },
      "wasser": { "basis": null, "jeWeiteresTier": null },
      "klettern": { "basis": null, "jeWeiteresTier": null }
    },
    "fortbewegung": {
      "fliegen": null,
      "klettern": null,
      "tauchen": null,
      "schwimmen": null,
      "landgang": null,
      "springen": null
    },
    "sprungHoeheMeter": null,
    "besucherBetretbar": null
  }
}
```

Die äußere `{ "rechner": ... }`-Struktur ist **innerhalb** von `planetZoo2` einzufügen. Alle Werte müssen über vertrauenswürdige Quellen bestätigt werden; bei fehlenden Angaben `null` belassen. Für unbekannte und nicht benötigte Flächen kann `null` belassen werden; der Rechner kennzeichnet das gesamte Ergebnis dann konservativ als unvollständig.

### Berechnungsregel (gewünschtes Maximalprinzip)

Für jede ausgewählte Art mit `n` Individuen:

`Artfläche = basis + max(0, n - 1) × jeWeiteresTier`

Pro **Land**, **Wasser** und **Klettern** separat:

`Gehegefläche = max(Artfläche 1, Artfläche 2, …)`

Die Flächen unterschiedlicher Arten werden ausdrücklich **nicht summiert**. Nur bekannte Flächen dürfen ausgewiesen werden. Sobald Werte fehlen, erscheint der Hinweis _Unvollständig_ und die angezeigte Fläche ist **keine endgültige Mindestanforderung**.

### Gruppen / Geschlechter

Die Auswahl einer Tierart schlägt zunächst 1 Männchen und 1 Weibchen vor. Die Anzahl ist änderbar. Ein Gruppenlimit aus `planetZoo2.rechner.gruppe` hat Vorrang vor biologischen Angaben. Wenn kein Spielwert vorliegt, ist die Biologie als solche gekennzeichnet.

### Beziehungen und Sicherheitsprüfung

- Ökologische Beziehungen aus dem Nahrungsnetz sind **keine** bestätigten Werte zur gemeinsamen Haltung in Planet Zoo 2.
- Keine gespeicherte Beziehung bedeutet **nicht** Verträglichkeit oder Sicherheit.
- Besucherbetretbarkeit ist nur dann positiv, wenn **jede** ausgewählte Art explizit als betretbar gekennzeichnet wurde.
- Für Fliegen, Klettern, Tauchen, Schwimmen, Landgang, Springen und Sprunghöhe können keine pauschal sicheren Zäune berechnet werden, wenn die Daten fehlen. Eingetragene Sprunghöhe ist keine vollständige Barriere-Empfehlung.

## Lokale Zwischeneingaben

Über **Flächen, Fähigkeiten & Besuchersicherheit eintragen** können die Werte für eine Art auch im Rechner eingetragen werden. Diese Eingaben werden separat in `localStorage` unter `planetZoo2-gehegerechner-v1` gespeichert; Tier-JSON-Dateien werden dabei nicht verändert. Die gemeinsame Tierauswahl bleibt wie bisher unter `planetZoo2-tierAuswahl` gespeichert. In einem anderen Browser sind die manuellen Daten nicht automatisch vorhanden.

Nach Quellcode- oder HTML-Änderungen immer `npm run build:browser` ausführen, damit die `index.html` auch beim direkten Doppelklick weiter funktioniert.
