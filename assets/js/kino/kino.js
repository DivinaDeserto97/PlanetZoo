import { datenImportieren } from "../../daten/lebewesen/tiere/datenImport.js";
import { getLanguage, getLocalizedValue } from "../features/language.js";
import { getTierAuswahl } from "../features/tierAuswahl.js";

let controller = null;
let tiere = [];

export async function init() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  tiere = await datenImportieren();

  document.addEventListener("languageChanged", render, { signal });
  document.addEventListener("tierAuswahlChanged", render, { signal });

  render();
}

function render() {
  const list = document.querySelector("[data-calculator-animal-list]");

  if (!list) {
    return;
  }

  const selected = new Set(getTierAuswahl());
  const selectedTiere = tiere.filter((tier) => selected.has(tier.id));

  list.replaceChildren();

  if (!selectedTiere.length) {
    const empty = document.createElement("span");
    empty.className = "calculator-animal-chip";
    empty.textContent = {
      de: "Keine Tiere ausgewählt",
      en: "No animals selected",
      "en-US": "No animals selected",
      es: "No hay animales seleccionados",
      fr: "Aucun animal sélectionné",
      it: "Nessun animale selezionato",
      "pt-BR": "Nenhum animal selecionado",
      ja: "動物が選択されていません",
      "zh-Hans": "未选择动物",
    }[getLanguage()] ?? "Keine Tiere ausgewählt";
    list.appendChild(empty);
    return;
  }

  selectedTiere.forEach((tier) => {
    const chip = document.createElement("span");
    chip.className = "calculator-animal-chip";
    chip.textContent =
      getLocalizedValue(tier.namen, getLanguage()) ?? tier.wissenschaftlicherName;
    list.appendChild(chip);
  });
}
