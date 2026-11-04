// My Collection record card: text led, the visitor's voice is the hero.
import { esc, fmtDate } from "../lib/util.js?v=202611042302";
import { href } from "../lib/library.js?v=202611042302";
import { submissionStatus } from "./status.js?v=202611042302";

export function recordCard(t) {
  return `
  <li class="rc">
    <a class="rc-link" href="${href.record(t.id)}">
      <span class="rc-head mono"><span>${esc(t.id)} / Object ${esc(t.objectNo)}</span><span>${fmtDate(t.createdAt)}</span></span>
      <span class="rc-mat mono">${esc(t.materialName)} / ${esc(t.action)}</span>
      <span class="rc-text">“${esc(t.text)}”</span>
      <span class="rc-foot">${submissionStatus(t)}</span>
    </a>
  </li>`;
}
