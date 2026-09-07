const STORAGE_KEY =
  "planetZoo2-aktivesTier";


export function getAktivesTierId() {
  const tierId =
    localStorage.getItem(
      STORAGE_KEY,
    );


  return (
    typeof tierId ===
      "string" &&
    tierId.trim()
      ? tierId
      : null
  );
}


export function setAktivesTierId(
  tierId,
) {
  if (
    typeof tierId !==
      "string" ||
    !tierId.trim()
  ) {
    localStorage.removeItem(
      STORAGE_KEY,
    );

    return;
  }


  localStorage.setItem(
    STORAGE_KEY,
    tierId,
  );
}


export function getAktivesTier(
  tiere,
) {
  const tierId =
    getAktivesTierId();


  return (
    tiere.find(
      (tier) =>
        tier.id ===
        tierId,
    ) ??
    null
  );
}
