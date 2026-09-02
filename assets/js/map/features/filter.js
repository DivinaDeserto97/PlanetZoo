import { getTierName } from "./tierListe.js";

/* ======================================== */
/* FILTER INITIALISIEREN                    */
/* ======================================== */

export function initFilter(tiere, tierListe, signal) {
  if (!tierListe) {
    return;
  }

  const search = document.querySelector("[data-animal-search]");

  const selectedOnly = document.querySelector("[data-filter-selected]");

  const reset = document.querySelector("[data-filter-reset]");

  /* ==================================== */
  /* FILTER ANWENDEN                      */
  /* ==================================== */

  function applyFilter() {
    const query = search?.value.trim().toLowerCase() ?? "";

    const onlySelected = selectedOnly?.checked ?? false;

    const filtered = tiere.filter((tier) => {
      /* ==================== */
      /* NAME                 */
      /* ==================== */

      const name = getTierName(tier).toLowerCase();

      const scientific = tier.wissenschaftlicherName.toLowerCase();

      const matchesSearch =
        !query || name.includes(query) || scientific.includes(query);

      /* ==================== */
      /* AUSGEWÄHLT           */
      /* ==================== */

      const matchesSelected = !onlySelected || tierListe.selected.has(tier.id);

      return matchesSearch && matchesSelected;
    });

    tierListe.render(filtered);
  }

  /* ==================================== */
  /* EVENTS                               */
  /* ==================================== */

  search?.addEventListener("input", applyFilter, {
    signal,
  });

  selectedOnly?.addEventListener("change", applyFilter, {
    signal,
  });

  reset?.addEventListener(
    "click",
    () => {
      if (search) {
        search.value = "";
      }

      if (selectedOnly) {
        selectedOnly.checked = false;
      }

      applyFilter();
    },
    {
      signal,
    },
  );

  document.addEventListener("languageChanged", applyFilter, {
    signal,
  });
}
