import {
  clampIndex,
  getTextEntries,
  ui,
  wrapIndex,
} from "./ui.js";


let factIndex =
  0;


export function resetFactState() {
  factIndex =
    0;
}


export function renderFacts(
  tier,
) {
  const facts =
    getTextEntries(
      tier,
      "tierfakten",
    );


  factIndex =
    clampIndex(
      factIndex,
      facts.length,
    );


  const text =
    document.querySelector(
      "[data-fact-text]",
    );

  const counter =
    document.querySelector(
      "[data-fact-counter]",
    );

  const prev =
    document.querySelector(
      "[data-fact-prev]",
    );

  const next =
    document.querySelector(
      "[data-fact-next]",
    );


  if (text) {
    text.textContent =
      facts[
        factIndex
      ]?.inhalt ??
      ui(
        "noFacts",
      );
  }


  if (counter) {
    counter.textContent =
      facts.length
        ? `${factIndex + 1} / ${facts.length}`
        : "";
  }


  if (prev) {
    prev.hidden =
      facts.length <=
      1;
  }


  if (next) {
    next.hidden =
      facts.length <=
      1;
  }
}


export function changeFact(
  direction,
  tier,
) {
  if (!tier) {
    return;
  }


  const facts =
    getTextEntries(
      tier,
      "tierfakten",
    );


  if (
    facts.length <=
    1
  ) {
    return;
  }


  factIndex =
    wrapIndex(
      factIndex +
        direction,

      facts.length,
    );


  renderFacts(
    tier,
  );
}