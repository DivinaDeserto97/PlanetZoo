/* ======================================== */
/* ZENTRALE TOOL-LISTE                      */
/* ======================================== */

export const TOOL_IDS = {
  MAP: "map",
  INFOTAFEL: "infotafel",
  AUDIO: "audio",
  KINO: "kino",
  SYSTEMATIK: "systematik",
  NAHRUNGSNETZ: "nahrungsnetz",
  RECHNER: "rechner",
};


export const TOOLS = [
  {
    id: TOOL_IDS.MAP,
    page: "map",
    standard: "wichtig",
    label: {
      de: "Karte",
      en: "Map",
      "en-US": "Map",
      es: "Mapa",
      fr: "Carte",
      it: "Mappa",
      "pt-BR": "Mapa",
      ja: "マップ",
      "zh-Hans": "地图",
    },
  },

  {
    id: TOOL_IDS.INFOTAFEL,
    page: "infotafel",
    standard: "wichtig",
    label: {
      de: "Infotafel",
      en: "Info board",
      "en-US": "Info board",
      es: "Panel informativo",
      fr: "Panneau d’information",
      it: "Pannello informativo",
      "pt-BR": "Painel informativo",
      ja: "情報パネル",
      "zh-Hans": "信息板",
    },
  },

  {
    id: TOOL_IDS.AUDIO,
    page: null,
    standard: "nichtWichtig",
    label: {
      de: "Audio",
      en: "Audio",
      "en-US": "Audio",
      es: "Audio",
      fr: "Audio",
      it: "Audio",
      "pt-BR": "Áudio",
      ja: "音声",
      "zh-Hans": "音频",
    },
  },

  {
    id: TOOL_IDS.KINO,
    page: "kino",
    standard: "unsichtbar",
    label: {
      de: "Kino",
      en: "Cinema",
      "en-US": "Movie theater",
      es: "Cine",
      fr: "Cinéma",
      it: "Cinema",
      "pt-BR": "Cinema",
      ja: "映画館",
      "zh-Hans": "电影院",
    },
  },

  {
    id: TOOL_IDS.SYSTEMATIK,
    page: "systematik",
    standard: "unsichtbar",
    label: {
      de: "Systematik",
      en: "Taxonomy",
      "en-US": "Taxonomy",
      es: "Taxonomía",
      fr: "Taxonomie",
      it: "Tassonomia",
      "pt-BR": "Taxonomia",
      ja: "分類",
      "zh-Hans": "分类",
    },
  },

  {
    id: TOOL_IDS.NAHRUNGSNETZ,
    page: "nahrungsnetz",
    standard: "unsichtbar",
    label: {
      de: "Nahrungsnetz",
      en: "Food web",
      "en-US": "Food web",
      es: "Red trófica",
      fr: "Réseau trophique",
      it: "Rete alimentare",
      "pt-BR": "Teia alimentar",
      ja: "食物網",
      "zh-Hans": "食物网",
    },
  },

  {
    id: TOOL_IDS.RECHNER,
    page: "rechner",
    standard: "unsichtbar",
    label: {
      de: "Rechner",
      en: "Calculator",
      "en-US": "Calculator",
      es: "Calculadora",
      fr: "Calculateur",
      it: "Calcolatore",
      "pt-BR": "Calculadora",
      ja: "計算機",
      "zh-Hans": "计算器",
    },
  },
];


export function getTool(toolId) {
  return (
    TOOLS.find(
      (tool) => tool.id === toolId,
    ) ?? null
  );
}
