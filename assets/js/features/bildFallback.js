/*
 * ANFÄNGER-HINWEIS – assets/js/features/bildFallback.js
 * ----------------------------------------
 * Diese Datei gehört zum handgeschriebenen Quellcode von Planet Zoo 2 Tools.
 * Die grossen Abschnittskommentare darunter zeigen, welcher Teil welche
 * Aufgabe übernimmt. Beim Ändern möglichst nur den passenden Abschnitt
 * bearbeiten und danach das Browser-Bundle neu bauen/testen.
 */

/*
 * BILD-FALLBACK
 * -------------
 * Diese kleine Hilfsfunktion hält die Bildlogik an einer Stelle.
 *
 * Reihenfolge:
 * 1. Zuerst wird immer der lokale Pfad aus der Tier-JSON benutzt.
 * 2. Schlägt das Laden fehl, wird einmal die externe URL versucht.
 * 3. Schlägt auch diese fehl, wird die übergebene Fehlerfunktion aufgerufen.
 *
 * Dadurch kann das Projekt lokal mit eigenen Bildern arbeiten, bleibt aber
 * auch benutzbar, wenn ein nicht mitgeliefertes Bild nur als externe URL
 * in der Tier-JSON vorhanden ist. Die Tier-JSON bleibt dabei die einzige
 * Datenquelle: Es gibt keine zweite manuell gepflegte Bildliste.
 */

function hatText(wert) {
  return typeof wert === "string" && wert.trim().length > 0;
}

export function setzeBildMitFallback(
  image,
  lokalerPfad,
  externeUrl,
  beiFehler = null,
) {
  if (!image) {
    return false;
  }

  const lokal = hatText(lokalerPfad) ? lokalerPfad.trim() : "";
  const extern = hatText(externeUrl) ? externeUrl.trim() : "";

  // Kein Bild vorhanden: direkt den normalen Platzhalter verwenden.
  if (!lokal && !extern) {
    beiFehler?.();
    return false;
  }

  let fallbackBereitsVersucht = false;

  image.onerror = () => {
    // Der lokale Pfad hatte Priorität. Erst bei einem Ladefehler wechseln wir
    // auf die externe URL. Gleiche URLs werden nicht zweimal geladen.
    if (!fallbackBereitsVersucht && extern && extern !== image.src) {
      fallbackBereitsVersucht = true;
      image.src = extern;
      return;
    }

    image.onerror = null;
    beiFehler?.();
  };

  image.src = lokal || extern;
  return true;
}
