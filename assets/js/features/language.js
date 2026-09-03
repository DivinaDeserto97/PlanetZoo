export const DEFAULT_LANGUAGE = "de";

export const LANGUAGES = [
  "de",
  "en",
  "en-US",
  "es",
  "fr",
  "it",
  "pt-BR",
  "ja",
  "zh-Hans",
];

/* ======================================== */
/* SPRACHE LADEN                            */
/* ======================================== */

export function getLanguage() {
  const language = localStorage.getItem("language");

  if (language && LANGUAGES.includes(language)) {
    return language;
  }

  return DEFAULT_LANGUAGE;
}

/* ======================================== */
/* FALLBACK-REIHENFOLGE                     */
/* ======================================== */

export function getLanguageFallbacks(language = getLanguage()) {
  const fallbacks = [language];

  if (language === "en-US") {
    fallbacks.push("en");
  }

  if (language === "zh-Hans") {
    fallbacks.push("zh-CN");
  }

  fallbacks.push("de", "en");

  return [...new Set(fallbacks)];
}

/* ======================================== */
/* OBJEKT ÜBERSETZEN                        */
/* ======================================== */

export function getLocalizedValue(values, language = getLanguage()) {
  if (!values || typeof values !== "object") {
    return null;
  }

  for (const fallback of getLanguageFallbacks(language)) {
    if (values[fallback] !== undefined && values[fallback] !== null) {
      return values[fallback];
    }
  }

  return null;
}

/* ======================================== */
/* SPRACHE SETZEN                           */
/* ======================================== */

export function setLanguage(language) {
  if (!LANGUAGES.includes(language)) {
    console.error(`Sprache "${language}" existiert nicht.`);
    return;
  }

  localStorage.setItem("language", language);
  document.documentElement.lang = language;

  translate();
  updateLanguageSelect();

  document.dispatchEvent(
    new CustomEvent("languageChanged", {
      detail: {
        language,
      },
    }),
  );
}

/* ======================================== */
/* DATA-ATTRIBUT AUSLESEN                   */
/* ======================================== */

function getTranslatedAttribute(element, prefix, language) {
  for (const fallback of getLanguageFallbacks(language)) {
    const value = element.getAttribute(`data-${prefix}${fallback}`);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

/* ======================================== */
/* HTML ÜBERSETZEN                          */
/* ======================================== */

export function translate() {
  const language = getLanguage();

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const text = getTranslatedAttribute(element, "", language);

    if (text !== null) {
      element.textContent = text;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const text = getTranslatedAttribute(element, "placeholder-", language);

    if (text !== null) {
      element.setAttribute("placeholder", text);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const text = getTranslatedAttribute(element, "title-", language);

    if (text !== null) {
      element.setAttribute("title", text);
    }
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const text = getTranslatedAttribute(element, "aria-label-", language);

    if (text !== null) {
      element.setAttribute("aria-label", text);
    }
  });
}

/* ======================================== */
/* SPRACH-SELECT AKTUALISIEREN              */
/* ======================================== */

function updateLanguageSelect() {
  const language = getLanguage();

  document.querySelectorAll("[data-language-select]").forEach((select) => {
    select.value = language;
  });
}

/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export function initLanguage() {
  document.documentElement.lang = getLanguage();

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-language-select]");

    if (!select) {
      return;
    }

    setLanguage(select.value);
  });

  document.addEventListener("pageLoaded", () => {
    translate();
    updateLanguageSelect();
  });

  document.addEventListener("componentLoaded", () => {
    translate();
    updateLanguageSelect();
  });

  translate();
  updateLanguageSelect();
}
