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
      "land": { "basis": null, "jeWeiteresTier": null, "jeJungtier": null },
      "wasser": { "basis": null, "jeWeiteresTier": null, "jeJungtier": null },
      "tauchflaeche": {
        "basis": null,
        "jeWeiteresTier": null,
        "jeJungtier": null
      },
      "klettern": { "basis": null, "jeWeiteresTier": null, "jeJungtier": null }
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

Für jede ausgewählte Art mit `n` Individuen (einschliesslich Jungtieren):

`Artfläche = basis + weitereErwachsene × jeWeiteresTier + weitereJungtiere × (jeJungtier ?? jeWeiteresTier)`

Die erste vorhandene Person eines Tieres (erwachsen **oder** jung) beansprucht die Grundfläche. Wenn mindestens ein erwachsenes Tier vorhanden ist, zählen **alle Jungtiere zusätzlich**. Gibt es nur Jungtiere, zählt das erste als Grundtier. `jeJungtier` ist optional; fehlt dieser Wert, wird `jeWeiteresTier` verwendet. Fehlen auch diese Zuschläge bei zusätzlichen Tieren, bleibt die Rechnung unvollständig.

Pro **Land**, **Wasser**, **Tauchfläche (tiefes Wasser)** und **Klettern** separat:

`Gehegefläche = max(Artfläche 1, Artfläche 2, …)`

Die Flächen unterschiedlicher Arten werden ausdrücklich **nicht summiert**. Nur bekannte Flächen dürfen ausgewiesen werden. Sobald Werte fehlen, erscheint der Hinweis _Unvollständig_ und die angezeigte Fläche ist **keine endgültige Mindestanforderung**.

### Gruppen / Geschlechter

Die Auswahl einer Tierart schlägt zunächst 1 Männchen, 1 Weibchen und 0 Jungtiere vor. Die Anzahl ist änderbar. Min/Max-Knöpfe stellen die Zahl der erwachsenen Tiere auf die bekannte Gruppengrenze und erhalten, soweit möglich, die bisherige Zahl der Männchen. Die Geschlechterverträglichkeit wird dadurch **nicht** automatisch geprüft. Die Gruppenprüfung zählt Erwachsene; der Flächenrechner zählt alle Individuen einschliesslich Jungtiere. Ein Gruppenlimit aus `planetZoo2.rechner.gruppe` hat Vorrang vor biologischen Angaben. Wenn kein Spielwert vorliegt, ist die Biologie als solche gekennzeichnet.

### Beziehungen und Sicherheitsprüfung

- Ökologische Beziehungen aus dem Nahrungsnetz sind **keine** bestätigten Werte zur gemeinsamen Haltung in Planet Zoo 2.
- Keine gespeicherte Beziehung bedeutet **nicht** Verträglichkeit oder Sicherheit.
- Besucherbetretbarkeit ist nur dann positiv, wenn **jede** ausgewählte Art explizit als betretbar gekennzeichnet wurde.
- Für Fliegen, Klettern, Tauchen, Schwimmen, Landgang, Springen und Sprunghöhe können keine pauschal sicheren Zäune berechnet werden, wenn die Daten fehlen. Eingetragene Sprunghöhe ist keine vollständige Barriere-Empfehlung.

## Lokale Zwischeneingaben

Über **Flächen, Fähigkeiten & Besuchersicherheit eintragen** können die Werte für eine Art auch im Rechner eingetragen werden. Diese Eingaben werden separat in `localStorage` unter `planetZoo2-gehegerechner-v1` gespeichert; Tier-JSON-Dateien werden dabei nicht verändert. Die gemeinsame Tierauswahl bleibt wie bisher unter `planetZoo2-tierAuswahl` gespeichert. In einem anderen Browser sind die manuellen Daten nicht automatisch vorhanden.

Nach Quellcode- oder HTML-Änderungen immer `npm run build:browser` ausführen, damit die `index.html` auch beim direkten Doppelklick weiter funktioniert.

## Neue Bedienung (2026-10-11)

- Tierkarten sind beim Start geschlossen und zeigen Tiernamen, Gruppenstatus, **Min**, **Max**, **Entfernen** und **Aufklappen**. Min/Max sind deaktiviert, wenn keine passende Gruppengrenze existiert.
- Per Aufklappen erscheinen Männchen, Weibchen, Jungtiere und die bearbeitbaren Werte. Alle Hauptthemen (Flächen, Nahrungsnetz, Abtrennung) sind einklappbar.
- Problematische erfasste Beziehungen und überschrittene/unterschrittene Gruppengrenzen werden **rot** hervorgehoben. Nicht erfasste Tierkombinationen sind **unbekannt**, nicht automatisch problematisch.
- Die Nahrungsnetz-Auswertung bezieht weiter ihre Beziehungen aus `daten.ernaehrung.nahrungsnetz` über `getAlleNahrungsBeziehungen()`. Beziehungen zu Jungtieren erscheinen nur, wenn Jungtiere beteiligt sind.
- Die optionale `tauchflaeche` ist eine eigenständige m²-Anforderung und wird nicht mit der gesamten Wasserfläche verwechselt. Werte für Eintauchtiefe sind bisher nicht erfasst.

**Planet Zoo 1 als Beispiel:** `anleitungen/GEHEGERECHNER-BEISPIEL-PZ1.json` zeigt einen **Ausschnitt** der Aardvark-/Erdferkel-Daten mit PZ1-Anforderungen (330 m² Land + 60 m² je weiterem Tier). Das ist kein geprüfter Planet-Zoo-2-Wert. Zum direkten Einfügen darf nur das `rechner`-Objekt in die bereits existierenden Tierdaten übernommen werden, sofern die Werte für das Zielspiel bestätigt sind. Die ursprünglichen `daten.ernaehrung.nahrungsnetz` bleiben immer erhalten. Als Quellen für das Beispiel dienen https://planetzoopedia.com/zoopedia/ und https://planetzoo.fandom.com/wiki/Aardvark.

## Erweiterung Oktober 2026 – Bewegungs- und Zonenplaner

Die aktuelle Projektversion erweitert den Gehegerechner um **frei anlegbare Tier-, Wasser-, Flug-, Kletter-, Rückzugs- und Besucherzonen**. Diese sind Teil jedes einzeln gespeicherten Gehegeplans. Neue und kopierte Gehege übernehmen die passende Zonenstruktur; die JSON-Sicherung enthält alle Zonen und Übergänge.

### Bedienung

1. Tierarten für den aktuellen Gehegeplan auswählen und Zahlen für Männchen, Weibchen, Jungtiere einstellen.
2. Unter **Tierbewegung & frei planbare Zonen** die benötigten Bereiche anlegen (z. B. Land, Ufer, Flachwasser, Tiefwasser, Kletterbereich und Besucherbereich).
3. Für **jede Tierart eine oder mehrere Startzonen** markieren. Ohne Startzone kann das Tier nicht sinnvoll auf Erreichbarkeit geprüft werden.
4. Verbindungen zwischen zwei Zonen eintragen: offen, Klettern, Springen, Fliegen, Flattern, Schwimmen, Tauchen, schmaler Durchgang oder gesperrt. Optional nur eine Richtung erlauben. Nur **im Spiel bestätigte** Verbindungen als „Im Spiel getestet“ markieren.
5. Auswertung lesen: erreichbare und eventuell erreichbare Bereiche, mögliche Räuber-Beute-Kontakte, Besuchergefahren, Flächenbedarf jeder Tierart über ihre erreichbaren Bereiche sowie Gelände- und Temperaturüberschneidungen.

### Dreiwertige Bewegungsauswertung

- **Bestätigt oder nachvollziehbar aus Zoopedia-Anforderungen abgeleitet:** Landbedarf unterstützt Landgang, Kletterflächenbedarf unterstützt Klettern, Flugflächenbedarf unterstützt Fliegen, Aquarien-Tiefwasserbedarf unterstützt Schwimmen/Tauchen. Die angegebenen Flächen **belegen keine konkreten Sprung-, Flug- oder Kletterdistanzen**.
- **Unbekannt:** fehlende Daten, nicht getestete Hindernisse, Sprungweiten, passierbare Öffnungen und Tauchtiefen. Unbekannt gilt nicht als „Nein“. Ein Übergang kann daher als _möglicherweise erreichbar_ erscheinen.
- **Vom Nutzer manuell im Spiel getestet:** Ein Übergang zählt erst mit Häkchen „Im Spiel getestet“ als bestätigt; die Fähigkeit der betreffenden Art muss dafür ebenfalls belegt sein. Ein einziger ungeprüfter Alternativweg verhindert die Freigabe einer Besuchersperre.

Ein Ufer, an dem ein Tier trinkt, ist **kein automatischer Zugang zu einem Tiefwasserbereich**. Land-, Schwimm-, Tauch-, Flug- und Kletterbereiche sind getrennte Raumtypen. Durch explizite Verbindungen können Arten mehr als eine Zone erreichen und gemeinsam an einem See leben; ein Aquarium ist nicht automatisch zwingend.

### Umwelt und Tiergruppen

- Wo zwei Arten denselben Bereich benutzen, berechnet die Software für Temperatur und Bodentypen `max(Mindestwerte)` und `min(Höchstwerte)`. Überlappen sie nicht, wird eine zusätzliche getrennte Zone empfohlen. Temperaturen dürfen nicht als sichere Sperren verwendet werden.
- Für einzelne aus der direkt vom Nutzer gelieferten Zoopedia bekannte Arten (Katta, Rosaflamingo, Schwarzbüffel, Tigersalmler) sind zusätzliche Gelände-, Geschlechter- und Besucherdaten eingetragen. Die Beziehungen Rosaflamingo–Schwarzbüffel werden als **neutral**, nicht als „nicht bekannt“, geführt.
- Beim Schwarzbüffel werden gemischte Herden und reine Männchengruppen unterschiedlich geprüft. Bei Arten ohne belastbare Geschlechterdetails bleibt diese Prüfung offen.
- Flug-, Kletter-, Sprung- und Engstellen können als Vorschläge ausprobiert werden, sind aber ohne passende Spieldaten kein Beweis einer sicheren Trennung. Jungtier-Grösse und Fähigkeiten sind noch nicht artweise belegt.

### Datenherkunft und bekannte Grenzen

Die numerischen Basis- und Zuwachswerte für 136 Arten stammen aus der vorher erstellten, **nicht pro Tier gegen die offizielle Zoopedia einzeln verifizierten Sekundärübersicht**. Die vier vom Nutzer vorgelegten Zoopedia-Auszüge wurden teilweise direkt überlagert. Zum Beispiel ist die Wasserfläche von **1'577 m² bei exakt 500 erwachsenen Rosaflamingos** als direkt belegter Messpunkt gespeichert; andere Gruppengrössen werden ohne belegten Wasserzuwachs weiter als unbekannt angezeigt. Eine unbekannte Wassertiefe wird nicht erfunden.

**Noch nicht vollständig implementiert:** nachgewiesene Sprung- und Durchgangsgrenzen, Jungtier-Pathfinding, reale Physik/Kollisionen des Spiels, volumetrische Tiefenprüfung, automatische Konstruktion optimaler Gehegetrennungen und durchgängig bestätigte erfolgreiche/neutrale Beziehungen für sämtliche 136 Arten. Die Zoneansicht ist ein datenbasierter Planer, **kein Ersatz für einen Spieltest**.

### Entwicklerprüfung

Für die neue reine Berechnungslogik (ohne Browser):

```bash
node --experimental-default-type=module tests/gehegerechner-zonen.test.mjs
```

Nach Änderung von JavaScript oder Tier-JSON immer das lokale Bundle neu bauen:

```bash
npm run build:browser
```
