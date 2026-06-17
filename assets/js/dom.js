export function setText(id, wert) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = wert || "";
}

export function setTitle(id, wert) {
  const el = document.getElementById(id);
  if (!el) return;
  el.title = wert || "";
}

export function setBild(id, src, alt) {
  const img = document.getElementById(id);
  if (!img) return;

  img.src = src || "";
  img.alt = alt || "";
}