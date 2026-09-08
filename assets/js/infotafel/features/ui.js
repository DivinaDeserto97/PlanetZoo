import {
  getLanguage,
  getLocalizedValue,
} from "../../features/language.js";


const UI = {
  de: {
    map: "Karte",
    openMap: "Zum Vergrößern anklicken",
    animalName: "Tiername",
    scientificName: "Wissenschaftlicher Name",
    conservationStatus: "Gefährdungsgrad",
    zoopedia: "Zoopedia",
    facts: "Tierfakten",
    foodWeb: "Nahrungsnetz",
    eats: "Frisst",
    eatenBy: "Wird gefressen von",
    young: "Jungtier",
    adult: "Erwachsen",
    noData: "Keine Angabe",
    placeholder: "Platzhalter",
    social: "Soziale Struktur",
    biome: "Biome",
    bodyLength: "Körperlänge",
    wingspan: "Flügelspannweite",
    weight: "Gewicht",
    wildPopulation: "Wildpopulation",
    maturity: "Geschlechtsreife",
    lifespan: "Lebensspanne",
    speed: "Geschwindigkeit",
    upTo: "Bis zu",
    from: "Ab",
    activity: "Aktivität",
    dietType: "Fressverhalten",
    noImage: "Kein Bild",
    noMap: "Keine Karte",
    noAudio: "Keine Audiodaten",
    noFacts: "Keine Tierfakten",
    noFoodData: "Keine Daten für diese Auswahl.",
    noNaturalPredators: "Keine natürlichen Fressfeinde angegeben.",
    image: "Bild",
    audio: "Audio",
    years: "Jahre",
  },

  en: {
    map: "Map",
    openMap: "Click to enlarge",
    animalName: "Animal name",
    scientificName: "Scientific name",
    conservationStatus: "Conservation status",
    zoopedia: "Zoopedia",
    facts: "Animal facts",
    foodWeb: "Food web",
    eats: "Eats",
    eatenBy: "Eaten by",
    young: "Young",
    adult: "Adult",
    noData: "No data",
    placeholder: "Placeholder",
    social: "Social structure",
    biome: "Biomes",
    bodyLength: "Body length",
    wingspan: "Wingspan",
    weight: "Weight",
    wildPopulation: "Wild population",
    maturity: "Sexual maturity",
    lifespan: "Lifespan",
    speed: "Speed",
    upTo: "Up to",
    from: "From",
    activity: "Activity",
    dietType: "Diet",
    noImage: "No image",
    noMap: "No map",
    noAudio: "No audio data",
    noFacts: "No animal facts",
    noFoodData: "No data for this selection.",
    noNaturalPredators: "No natural predators listed.",
    image: "Image",
    audio: "Audio",
    years: "years",
  },
};


const VALUE_LABELS = {
  solitaryOrPair: {
    de: "Einzelgänger / Paar",
    en: "Solitary / pair",
  },

  temperateGrassland: {
    de: "Gemäßigte Graslandschaft",
    en: "Temperate grassland",
  },

  wetland: {
    de: "Feuchtgebiete",
    en: "Wetlands",
  },

  openOcean: {
    de: "Offenes Meer",
    en: "Open ocean",
  },

  reef: {
    de: "Riff",
    en: "Reef",
  },

  lakesAndRivers: {
    de: "Seen und Flüsse",
    en: "Lakes and rivers",
  },

  taiga: {
    de: "Taiga",
    en: "Taiga",
  },

  tropical: {
    de: "Tropen",
    en: "Tropical",
  },

  tundra: {
    de: "Tundra",
    en: "Tundra",
  },

  desert: {
    de: "Wüste",
    en: "Desert",
  },

  diurnal: {
    de: "Tagaktiv",
    en: "Diurnal",
  },

  nocturnal: {
    de: "Nachtaktiv",
    en: "Nocturnal",
  },

  crepuscular: {
    de: "Dämmerungsaktiv",
    en: "Crepuscular",
  },

  carnivore: {
    de: "Carnivor",
    en: "Carnivore",
  },

  herbivore: {
    de: "Herbivor",
    en: "Herbivore",
  },

  omnivore: {
    de: "Omnivor",
    en: "Omnivore",
  },

  lagomorpha: {
    de: "Hasenartige",
    en: "Lagomorphs",
  },

  smallAndMediumMammals: {
    de: "Kleine und mittelgroße Säugetiere",
    en: "Small and medium-sized mammals",
  },

  reptiles: {
    de: "Reptilien",
    en: "Reptiles",
  },

  birds: {
    de: "Vögel",
    en: "Birds",
  },

  largerMammals: {
    de: "Größere Säugetiere",
    en: "Larger mammals",
  },

  hare: {
    de: "Hase",
    en: "Hare",
  },

  rabbit: {
    de: "Kaninchen",
    en: "Rabbit",
  },

  marmot: {
    de: "Murmeltier",
    en: "Marmot",
  },

  chamois: {
    de: "Gämse",
    en: "Chamois",
  },

  foodShortage: {
    de: "bei Nahrungsknappheit",
    en: "during food shortage",
  },

  muttermilch: {
    de: "Muttermilch",
    en: "Mother's milk",
  },

  tierischeNahrung: {
    de: "Tierische Nahrung",
    en: "Animal food",
  },

  plantFood: {
    de: "Pflanzliche Nahrung",
    en: "Plant food",
  },

  grass: {
    de: "Gras",
    en: "Grass",
  },

  leaves: {
    de: "Blätter",
    en: "Leaves",
  },

  fruit: {
    de: "Früchte",
    en: "Fruit",
  },

  roots: {
    de: "Wurzeln",
    en: "Roots",
  },

  twigs: {
    de: "Zweige",
    en: "Twigs",
  },

  bark: {
    de: "Rinde",
    en: "Bark",
  },

  shrubs: {
    de: "Sträucher",
    en: "Shrubs",
  },

  ants: {
    de: "Ameisen",
    en: "Ants",
  },

  termites: {
    de: "Termiten",
    en: "Termites",
  },

  insects: {
    de: "Insekten",
    en: "Insects",
  },

  aas: {
    de: "Aas",
    en: "Carrion",
  },

  nahrung: {
    de: "Nahrung",
    en: "Food",
  },

  jungtier: {
    de: "Jungtier",
    en: "Young",
  },

  erwachsen: {
    de: "Erwachsen",
    en: "Adult",
  },

  calf: {
    de: "Jungtier",
    en: "Calf",
  },

  bisEtwa3Monate: {
    de: "bis etwa 3 Monate",
    en: "until about 3 months",
  },

  abEtwa3Monaten: {
    de: "ab etwa 3 Monaten",
    en: "from about 3 months",
  },

  bisEtwa6Monate: {
    de: "bis etwa 6 Monate",
    en: "until about 6 months",
  },

  increasingWithAge: {
    de: "mit zunehmendem Alter",
    en: "increasing with age",
  },

  geschwaecht: {
    de: "geschwächt",
    en: "weakened",
  },

  krank: {
    de: "krank",
    en: "sick",
  },

  verletzt: {
    de: "verletzt",
    en: "injured",
  },

  geeigneterZustand: {
    de: "geeigneter Zustand",
    en: "suitable condition",
  },
};


export function renderUiText() {
  document
    .querySelectorAll(
      "[data-ui]",
    )
    .forEach(
      (element) => {
        element.textContent =
          ui(
            element.dataset.ui,
          );
      },
    );
}


export function ui(
  key,
) {
  const language =
    getLanguage();

  const base =
    language.startsWith(
      "en",
    )
      ? "en"
      : "de";

  return (
    UI[base]?.[key] ??
    UI.de[key] ??
    key
  );
}


export function enumLabel(
  key,
) {
  if (
    key === undefined ||
    key === null
  ) {
    return "";
  }


  const language =
    getLanguage();

  const values =
    VALUE_LABELS[key];


  if (!values) {
    return String(
      key,
    );
  }


  if (
    language.startsWith(
      "en",
    )
  ) {
    return (
      values.en ??
      values.de ??
      key
    );
  }


  return (
    values[language] ??
    values.de ??
    values.en ??
    key
  );
}


export function getTextEntries(
  tier,
  key,
) {
  const value =
    getLocalizedValue(
      tier
        ?.originalDaten
        ?.texte
        ?.[key],

      getLanguage(),
    );


  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }


  return value.filter(
    (entry) =>
      entry &&
      typeof entry.inhalt ===
        "string" &&
      entry.inhalt.trim(),
  );
}


export function getTierName(
  tier,
) {
  if (!tier) {
    return "";
  }


  return (
    getLocalizedValue(
      tier.namen,
      getLanguage(),
    ) ??
    tier.wissenschaftlicherName ??
    tier.id ??
    ""
  );
}


export function setText(
  selector,
  value,
) {
  const element =
    document.querySelector(
      selector,
    );


  if (element) {
    element.textContent =
      value ??
      "";
  }
}


export function formatNumber(
  value,
) {
  if (
    typeof value !==
    "number"
  ) {
    return String(
      value ??
      "",
    );
  }


  return new Intl.NumberFormat(
    getLanguage(),
    {
      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}


export function clampIndex(
  index,
  length,
) {
  if (!length) {
    return 0;
  }


  return Math.max(
    0,
    Math.min(
      index,
      length - 1,
    ),
  );
}


export function wrapIndex(
  index,
  length,
) {
  if (!length) {
    return 0;
  }


  return (
    index +
    length
  ) % length;
}