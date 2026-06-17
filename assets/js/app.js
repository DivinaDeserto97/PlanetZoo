import { ladeTier, ladeSymbolDaten } from "./api.js";
import { renderTier } from "./renderTier.js";

const params = new URLSearchParams(window.location.search);
const tierId = params.get("id") || "Ramphastos-toco";

main();

async function main() {
  const [tier, symbole] = await Promise.all([
    ladeTier(tierId),
    ladeSymbolDaten()
  ]);

  if (!tier) return;

  renderTier(tier, symbole);
}