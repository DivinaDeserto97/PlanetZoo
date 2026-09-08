import {
  getLanguage,
} from "../../features/language.js";

import {
  getInfotafelAudioItems,
} from "../../features/tierMedien.js";

import {
  clampIndex,
  setText,
  ui,
  wrapIndex,
} from "./ui.js";


let audioIndex =
  0;

let audioItems =
  [];

const audioMetaCache =
  new Map();


export function resetAudioState() {
  audioIndex =
    0;

  audioItems =
    [];
}


export function bindAudioEvents(
  signal,
) {
  const audio =
    document.querySelector(
      "[data-audio-element]",
    );


  audio?.addEventListener(
    "play",
    () =>
      setAudioPlayIcon(
        "■",
      ),
    { signal },
  );


  audio?.addEventListener(
    "pause",
    () =>
      setAudioPlayIcon(
        "▶",
      ),
    { signal },
  );


  audio?.addEventListener(
    "ended",
    () =>
      setAudioPlayIcon(
        "▶",
      ),
    { signal },
  );
}


export async function renderAudio(
  tier,
  getActiveTier,
) {
  const requestedTierId =
    tier.id;


  audioItems =
    getInfotafelAudioItems(
      tier,
    );


  audioIndex =
    clampIndex(
      audioIndex,
      audioItems.length,
    );


  const audio =
    document.querySelector(
      "[data-audio-element]",
    );

  const play =
    document.querySelector(
      "[data-audio-play]",
    );

  const left =
    document.querySelector(
      "[data-audio-left]",
    );

  const right =
    document.querySelector(
      "[data-audio-right]",
    );


  if (
    !audio ||
    !play ||
    !left ||
    !right
  ) {
    return;
  }


  setAudioUiVisible(
    audioItems.length >
      0,
  );


  audio.pause();

  setAudioPlayIcon(
    "▶",
  );


  if (
    !audioItems.length
  ) {
    audio.removeAttribute(
      "src",
    );

    audio.load();

    play.disabled =
      true;

    left.disabled =
      true;

    right.disabled =
      true;


    setText(
      "[data-audio-title]",
      ui(
        "audio",
      ),
    );


    setText(
      "[data-audio-description]",
      ui(
        "noAudio",
      ),
    );


    return;
  }


  play.disabled =
    false;

  left.disabled =
    false;

  right.disabled =
    false;


  const item =
    audioItems[
      audioIndex
    ];


  audio.src =
    item.src;

  audio.load();


  setText(
    "[data-audio-title]",
    `${item.typ} · ${audioIndex + 1}/${audioItems.length}`,
  );


  setText(
    "[data-audio-description]",
    item.typ,
  );


  const meta =
    await loadAudioMetadata(
      item.metaPath,
    );


  if (
    getActiveTier()?.id !==
      requestedTierId ||
    audioItems[
      audioIndex
    ]?.key !==
      item.key
  ) {
    return;
  }


  const description =
    getAudioDescription(
      meta,
    ) ||
    item.typ;


  setText(
    "[data-audio-description]",
    description,
  );
}


function setAudioUiVisible(
  visible,
) {
  [
    "[data-audio-left]",
    "[data-audio-right]",
    "[data-audio-play]",
    "[data-audio-panel]",
  ].forEach(
    (selector) => {
      const element =
        document.querySelector(
          selector,
        );


      if (element) {
        element.hidden =
          !visible;
      }
    },
  );
}


async function loadAudioMetadata(
  path,
) {
  if (!path) {
    return null;
  }


  if (
    audioMetaCache.has(
      path,
    )
  ) {
    return audioMetaCache.get(
      path,
    );
  }


  try {
    const response =
      await fetch(
        path,
      );


    if (!response.ok) {
      throw new Error(
        `${response.status} ${response.statusText}`,
      );
    }


    const data =
      await response.json();


    const meta =
      Array.isArray(
        data,
      )
        ? data[0] ??
          null
        : data;


    audioMetaCache.set(
      path,
      meta,
    );


    return meta;
  }

  catch (error) {
    console.warn(
      `Audio-Metadaten konnten nicht geladen werden: ${path}`,
      error,
    );


    audioMetaCache.set(
      path,
      null,
    );


    return null;
  }
}


function getAudioDescription(
  meta,
) {
  if (
    !meta ||
    typeof meta !==
      "object"
  ) {
    return "";
  }


  const language =
    getLanguage();


  if (
    language.startsWith(
      "en",
    ) &&
    meta.description_en
  ) {
    return meta.description_en;
  }


  return (
    meta.description ??
    meta.description_en ??
    ""
  );
}


export async function toggleAudio() {
  const audio =
    document.querySelector(
      "[data-audio-element]",
    );

  const play =
    document.querySelector(
      "[data-audio-play]",
    );


  if (
    !audio ||
    !play ||
    !audio.src
  ) {
    return;
  }


  if (audio.paused) {
    try {
      await audio.play();

      setAudioPlayIcon(
        "■",
      );
    }

    catch (error) {
      console.warn(
        "Audio konnte nicht abgespielt werden.",
        error,
      );
    }
  }

  else {
    audio.pause();

    setAudioPlayIcon(
      "▶",
    );
  }
}


export function handleAudioSide(
  direction,
  getActiveTier,
) {
  const audio =
    document.querySelector(
      "[data-audio-element]",
    );


  if (
    !audio ||
    !audioItems.length
  ) {
    return;
  }


  if (
    !audio.paused &&
    !audio.ended
  ) {
    const duration =
      Number.isFinite(
        audio.duration,
      )
        ? audio.duration
        : Infinity;


    if (
      direction <
      0
    ) {
      audio.currentTime =
        Math.min(
          duration,
          audio.currentTime +
            10,
        );

      return;
    }


    audio.currentTime =
      Math.max(
        0,
        audio.currentTime -
          10,
      );


    return;
  }


  audioIndex =
    wrapIndex(
      audioIndex +
        direction,

      audioItems.length,
    );


  const tier =
    getActiveTier();


  if (tier) {
    renderAudio(
      tier,
      getActiveTier,
    );
  }
}


function setAudioPlayIcon(
  icon,
) {
  const iconElement =
    document.querySelector(
      "[data-audio-play-icon]",
    );


  if (iconElement) {
    iconElement.textContent =
      icon;
  }
}