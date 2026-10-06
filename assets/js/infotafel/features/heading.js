/*
 * ANFÄNGER-HINWEIS – assets/js/infotafel/features/heading.js
 * ----------------------------------------
 * Diese Datei gehört zum handgeschriebenen Quellcode von Planet Zoo 2 Tools.
 * Die grossen Abschnittskommentare darunter zeigen, welcher Teil welche
 * Aufgabe übernimmt. Beim Ändern möglichst nur den passenden Abschnitt
 * bearbeiten und danach das Browser-Bundle neu bauen/testen.
 */

import { getConservationLabel } from "../../features/animalLabels.js";

import { getTierName, setText, ui } from "./ui.js";

export function renderHeading(tier) {
  setText("[data-animal-name]", getTierName(tier));

  setText(
    "[data-scientific-name]",

    tier.wissenschaftlicherName ?? tier.originalDaten?.id ?? tier.id,
  );

  const status = tier.filter?.schutzstatus
    ? getConservationLabel(tier.filter.schutzstatus)
    : ui("noData");

  setText("[data-conservation-status]", status);
}
