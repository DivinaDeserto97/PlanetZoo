import { getTierAuswahl } from "../../js/features/tierAuswahl.js";
import { getCurrentPage } from "../../js/pages.js";

let controller = null;

function updateSelectionCount() {
  const count = document.querySelector("[data-footer-selection-count]");

  if (count) {
    count.textContent = String(getTierAuswahl().length);
  }
}

function updateActivePage() {
  const currentPage = getCurrentPage();

  document.querySelectorAll("[data-footer-page]").forEach((link) => {
    link.classList.toggle("active", link.dataset.footerPage === currentPage);
  });
}

export function init() {
  controller?.abort();
  controller = new AbortController();

  const { signal } = controller;

  document.addEventListener("tierAuswahlChanged", updateSelectionCount, {
    signal,
  });

  document.addEventListener("pageLoaded", updateActivePage, { signal });

  updateSelectionCount();
  updateActivePage();
}
