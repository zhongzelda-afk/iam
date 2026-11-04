// Object image: a cut-out photograph, a dotted tracing outline (no footage yet), or an empty reserved slot.
import { esc } from "../lib/util.js?v=202611041335";

const OUTLINES = {
  sheet: '<path d="M22 70 L38 34 L61 41 L80 27 L97 47 L88 72 L63 80 L44 74 Z M38 34 L44 74 M61 41 L63 80 M80 27 L88 72"/>',
  block: '<rect x="24" y="38" width="72" height="44" rx="5"/><path d="M24 50 L96 50"/><g class="dots"><circle cx="38" cy="64" r="1.6"/><circle cx="52" cy="70" r="1.6"/><circle cx="66" cy="62" r="1.6"/><circle cx="80" cy="69" r="1.6"/><circle cx="46" cy="58" r="1.2"/><circle cx="74" cy="56" r="1.2"/></g>',
  pear: '<path d="M60 20 C56 20 54 26 54 32 C54 40 46 44 42 54 C36 68 42 86 60 86 C78 86 84 68 78 54 C74 44 66 40 66 32 C66 26 64 20 60 20 Z"/><path d="M60 20 L62 12"/>',
  mound: '<path d="M22 80 C24 64 36 60 42 54 C46 42 58 38 66 44 C76 42 86 52 86 60 C96 64 98 76 96 80 Z"/>',
  shell: '<path d="M26 74 C26 46 44 30 60 30 C76 30 94 46 94 74 Z"/><path d="M60 30 L60 74 M44 36 L50 74 M76 36 L70 74 M34 50 L42 74 M86 50 L78 74"/>',
  round: '<circle cx="60" cy="56" r="28"/>'
};

export function outline(name = "round") {
  return `<svg class="outline" viewBox="0 0 120 100" aria-hidden="true" focusable="false">${OUTLINES[name] || OUTLINES.round}</svg>`;
}

export function reservedMark() {
  return `<svg class="outline reserved-mark" viewBox="0 0 120 100" aria-hidden="true" focusable="false">
    <circle cx="60" cy="54" r="26"/><path d="M60 18 L60 30 M60 78 L60 90 M24 54 L36 54 M84 54 L96 54"/></svg><span class="scan" aria-hidden="true"></span>`;
}

// object figure for gallery, home and detail hero
export function objectFigure(o, { eager = false, alt } = {}) {
  if (o.reserved) return `<span class="figure figure--reserved">${reservedMark()}</span>`;
  const img = o.galleryImage || o.heroImage;
  if (!img) return `<span class="figure figure--outline">${outline(o.outline)}</span>`;
  return `<span class="figure${o.status === "published" ? "" : " figure--faint"}"><img src="${esc(img)}" alt="${esc(alt ?? "")}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><span class="figure-shadow" aria-hidden="true"></span></span>`;
}
