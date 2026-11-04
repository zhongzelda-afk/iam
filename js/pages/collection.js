// 05 My Collection: the visitor's own translations, a private reading room (voice-led, not object-led).
import { $ } from "../lib/util.js?v=202611041523";
import { href } from "../lib/library.js?v=202611041523";
import * as col from "../lib/collection.js?v=202611041523";
import { sync } from "../lib/contributions.js?v=202611041523";
import { recordCard } from "../components/recordCard.js?v=202611041523";

export function render(main) {
  const items = col.list();
  const pending = items.filter(t => t.submissionStatus === "PENDING_REVIEW").length;
  const pub = items.filter(t => t.submissionStatus === "PUBLISHED").length;
  main.innerHTML = `
  <section class="mycol" aria-labelledby="c-title">
    <header class="c-head">
      <p class="mono eyebrow">Private reading room</p>
      <h1 id="c-title" class="page-title">My Collection</h1>
      ${items.length ? `<p class="mono c-count">${items.length} translation${items.length === 1 ? "" : "s"} · ${items.length - pending - pub} private · ${pending} pending review · ${pub} published</p>` : ""}
      <p class="muted small c-note">Kept only in this browser, on this device. No one else can see it. Clearing your browser data removes it.</p>
    </header>
    ${items.length ? `
      <ul class="rcs">${items.map(recordCard).join("")}</ul>
      <p class="c-more"><a class="cta" href="${href.library}">Translate another material <span aria-hidden="true">→</span></a></p>` : `
      <div class="c-empty">
        <p class="c-empty-k">Your collection is empty.</p>
        <p class="c-empty-q">“Every material has a possible voice. Your first translation is waiting to be written.”</p>
        <a class="cta cta--fill" href="${href.library}">Explore the Material Library <span aria-hidden="true">→</span></a>
      </div>`}
  </section>`;
  // resend held submissions and pick up Lynn's approvals, then redraw if anything changed
  const before = JSON.stringify(items.map(t => [t.id, t.submissionStatus, t.contribution && t.contribution.queue]));
  sync().then(() => {
    const after = JSON.stringify(col.list().map(t => [t.id, t.submissionStatus, t.contribution && t.contribution.queue]));
    if (after !== before && $(".mycol", main)) render(main);
  }).catch(() => {});
}
