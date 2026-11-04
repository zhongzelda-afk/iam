// One object in the Material Library gallery: isolated object, rotated number, compact label.
import { esc } from "../lib/util.js?v=202611042152";
import { href, isOpen } from "../lib/library.js?v=202611042152";
import { objectFigure } from "./figure.js?v=202611042152";
import { archiveStatus } from "./status.js?v=202611042152";

export function galleryItem(o) {
  const open = isOpen(o);
  const name = o.reserved ? "Reserved" : o.name;
  const sub = o.reserved ? "Awaiting cataloguing" : open ? o.category : o.note || "Under observation";
  const label = `
    <span class="g-label">
      <span class="g-no" aria-hidden="true">${o.no}</span>
      <span class="g-rule" aria-hidden="true"></span>
      <span class="g-text">
        <span class="g-obj">Object ${o.no}</span>
        <span class="g-name">${esc(name)}</span>
        <span class="g-sub">${esc(sub)}</span>
      </span>
    </span>`;
  const status = open ? "" : `<span class="g-status">${archiveStatus(o.status)}</span>`;
  const filter = open ? "published" : "progress";
  if (open) return `<li class="g-item" data-filter="${filter}"><a class="g-link" href="${href.object(o)}" aria-label="Object ${o.no}, ${esc(o.name)}, ${esc(o.category)}">${objectFigure(o)}${label}</a></li>`;
  return `<li class="g-item g-item--closed" data-filter="${filter}"><div class="g-link" role="group" aria-label="Object ${o.no}, ${esc(name)}: ${esc(sub)}. Record not yet available.">${objectFigure(o)}${label}${status}</div></li>`;
}
