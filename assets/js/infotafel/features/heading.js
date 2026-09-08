import {
  getConservationLabel,
} from "../../features/animalLabels.js";

import {
  getTierName,
  setText,
  ui,
} from "./ui.js";


export function renderHeading(
  tier,
) {
  setText(
    "[data-animal-name]",
    getTierName(
      tier,
    ),
  );


  setText(
    "[data-scientific-name]",

    tier.wissenschaftlicherName ??
      tier.originalDaten?.id ??
      tier.id,
  );


  const status =
    tier.filter
      ?.schutzstatus
      ? getConservationLabel(
          tier.filter
            .schutzstatus,
        )
      : ui(
          "noData",
        );


  setText(
    "[data-conservation-status]",
    status,
  );
}