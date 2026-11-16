// 05 My Collection: the visitor's own translations, a private reading room (voice-led, not object-led).
import { $ } from "../lib/util.js?v=202611162135";
import { href, PUBLISHED } from "../lib/library.js?v=202611162135";
import * as col from "../lib/collection.js?v=202611162135";
import { sync } from "../lib/contributions.js?v=202611162135";
import { recordCard } from "../components/recordCard.js?v=202611162135";

export function render(main) {
  const items = col.list();
  const pending = items.filter(t => t.submissionStatus === "PENDING_REVIEW").length;
  const pub = items.filter(t => t.submissionStatus === "PUBLISHED").length;
  const objs = PUBLISHED.filter(o => o.heroImage);
  const drift = objs.map(o => `<a href="${href.object(o)}" tabindex="-1"><img src="${o.heroImage}" alt="" decoding="async"></a>`).join("");
  const refract = /Chrome\//.test(navigator.userAgent) ? " lg--refract" : "";
  main.innerHTML = `
  <div class="h-drift c-drift" aria-hidden="true"><div class="h-row" style="--k:0"><div class="h-track">${drift}${drift}</div></div></div>
  <svg class="lg-defs" aria-hidden="true" focusable="false" width="0" height="0"><filter id="lg-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n"/>
    <feGaussianBlur in="n" stdDeviation="2" result="nb"/>
    <feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/>
  </filter></svg>
  <section class="mycol" aria-labelledby="c-title">
    <header class="c-head lg${refract}">
      <p class="mono c-eyebrow"><span class="dot-ring" aria-hidden="true"></span>Private reading room</p>
      <h1 id="c-title" class="c-title">My Collection</h1>
      ${items.length ? `<p class="mono c-count">${items.length} translation${items.length === 1 ? "" : "s"} · ${items.length - pending - pub} private · ${pending} pending review · ${pub} published</p>` : ""}
      <p class="muted small c-note">Kept only in this browser, on this device. No one else can see it. Clearing your browser data removes it.</p>
    </header>
    ${items.length ? `
      <ul class="rcs">${items.map(recordCard).join("")}</ul>
      <p class="c-more"><a class="h3-go" href="${href.library}"><i class="h3-pulse" aria-hidden="true"></i>Translate another material</a></p>` : `
      <div class="c-empty lg${refract}">
        <p class="c-empty-k">Your collection is empty.</p>
        <p class="c-empty-q">“Every material has a possible voice. Your first translation is waiting to be written.”</p>
        <a class="h3-go" href="${href.library}"><i class="h3-pulse" aria-hidden="true"></i>Explore the Material Library</a>
      </div>`}
  </section>`;
  // resend held submissions and pick up Lynn's approvals, then redraw if anything changed
  const before = JSON.stringify(items.map(t => [t.id, t.submissionStatus, t.contribution && t.contribution.queue]));
  sync().then(() => {
    const after = JSON.stringify(col.list().map(t => [t.id, t.submissionStatus, t.contribution && t.contribution.queue]));
    if (after !== before && $(".mycol", main)) render(main);
  }).catch(() => {});
}
