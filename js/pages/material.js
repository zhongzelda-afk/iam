// 03 Material Detail: large object + frosted information panel (Reference B), then the research record.
import { esc, $, $$ } from "../lib/util.js?v=202611041513";
import { href, neighbours, workshopTranslations } from "../lib/library.js?v=202611041513";
import { publishedFor } from "../lib/contributions.js?v=202611041513";
import { archiveStatus } from "../components/status.js?v=202611041513";
import { objectFigure } from "../components/figure.js?v=202611041513";
import { stateViewer, mountStateViewer } from "../components/stateViewer.js?v=202611041513";
import { videoPlayer, mountVideo } from "../components/videoPlayer.js?v=202611041513";
import { translationRecord } from "../components/translationRecord.js?v=202611041513";

const row = (k, v) => `<div class="kv"><dt>${k}</dt><dd>${v ?? '<span class="muted">Not recorded</span>'}</dd></div>`;
const the = o => `the ${o.name}`;
// SVG refraction inside backdrop-filter only renders in Chromium browsers; others get the frosted glass alone
const refractOK = () => /Chrome\//.test(navigator.userAgent);

export function render(main, o) {
  const p = o.physicalProfile || {}, obs = o.observation || {};
  const { prev, next } = neighbours(o.slug);
  const images = [
    o.heroImage && { src: o.heroImage, alt: `${o.name}, object ${o.no}`, cap: o.imageTemporary ? "Temporary cut-out from a Workshop B video frame" : "Object photograph", cut: true },
    o.experimentVideo && o.experimentVideo.poster && { src: o.experimentVideo.poster, alt: `${o.name} on the experiment table`, cap: "Experiment set-up, Workshop B" }
  ].filter(Boolean);
  const tr = workshopTranslations(o.slug);

  main.innerHTML = `
  <article class="detail" aria-labelledby="d-title">
    <section class="d-hero">
      ${o.heroImage ? `<div class="d-pattern" aria-hidden="true" style="background-image:url('${esc(o.heroImage)}')"></div>` : ""}
      <svg class="lg-defs" aria-hidden="true" focusable="false" width="0" height="0"><filter id="lg-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n"/>
        <feGaussianBlur in="n" stdDeviation="2" result="nb"/>
        <feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/>
      </filter></svg>
      <div class="d-stage" data-stage>
        ${images.map((im, i) => `<figure class="d-img${im.cut ? " is-cut" : ""}${i ? "" : " is-on"}" data-img="${i}" ${i ? "aria-hidden=\"true\"" : ""}>${im.cut ? objectFigure(o, { eager: true, alt: im.alt }) : `<img src="${esc(im.src)}" alt="${esc(im.alt)}" loading="lazy">`}<figcaption class="mono">${esc(im.cap)}</figcaption></figure>`).join("")}
        ${images.length > 1 ? `<div class="d-stage-nav"><button type="button" class="arrow" data-img-step="-1" aria-label="Previous image">‹</button><span class="mono" data-img-count>01 / ${String(images.length).padStart(2, "0")}</span><button type="button" class="arrow" data-img-step="1" aria-label="Next image">›</button></div>` : ""}
        <p class="d-bignum" aria-hidden="true">${o.no}</p>
      </div>
      <div class="d-panel lg${refractOK() ? " lg--refract" : ""}">
        <a class="mono back" href="${href.library}">← Material Library</a>
        <p class="mono d-obj">Object ${o.no}</p>
        <h1 id="d-title" class="d-title">${esc(o.name)}</h1>
        <section aria-labelledby="sa"><h2 id="sa" class="mono sec-k">A · Catalogue metadata</h2>
          <dl class="kvs mono">
            ${row("Object", o.no)}${row("Name", esc(o.name).toUpperCase())}${row("Category", esc(o.category).toUpperCase())}
            ${row("Action", esc(o.primaryAction).toUpperCase())}${row("Collection", esc(o.collection).toUpperCase())}${row("Status", archiveStatus(o.status))}
          </dl>
        </section>
        <details class="acc" open><summary><span class="mono sec-k">B · Physical profile</span><span class="acc-i" aria-hidden="true"></span></summary>
          <dl class="kvs kvs--text">
            ${row("Colour", p.colour && esc(p.colour))}${row("Shape &amp; surface texture", p.shape && esc(p.shape))}
            ${row("Lifespan", p.lifespan && esc(p.lifespan))}${row("Response to pressure", p.pressure && esc(p.pressure))}
          </dl>
        </details>
        <a class="mono panel-jump" href="#d-translations" data-jump>Read ${tr.length ? tr.length + " " : ""}translations ↓</a>
      </div>
    </section>

    <section class="d-sec" aria-labelledby="sc">
      <header class="d-sec-head"><p class="mono sec-k">C</p><h2 id="sc">Physical states</h2><p class="muted">Four documented states from the experiment video. Fold the booklet to stack them, unfold to read them side by side.</p></header>
      ${stateViewer(o)}
    </section>

    <section class="d-sec" aria-labelledby="sd">
      <header class="d-sec-head"><p class="mono sec-k">D</p><h2 id="sd">Video evidence</h2><p class="muted">Documentation of the actual material being handled.</p></header>
      ${o.experimentVideo ? videoPlayer(o.experimentVideo, { id: "exp-video", states: o.states }) : `<p class="missing">Experiment video not yet filmed.</p>`}
    </section>

    <section class="d-sec" aria-labelledby="se">
      <header class="d-sec-head"><p class="mono sec-k">E</p><h2 id="se">I.A.M. observation</h2><p class="muted">Observed facts first, interpretation kept apart.</p></header>
      <div class="report">
        <div class="report-row"><h3 class="mono">Action applied</h3><p>${obs.action ? esc(obs.action) : '<span class="muted">Not recorded</span>'}</p></div>
        <div class="report-row"><h3 class="mono">Physical response</h3><p>${obs.response ? esc(obs.response) : '<span class="muted">Not yet written</span>'}</p></div>
        <div class="report-row report-row--interp"><h3 class="mono">I.A.M. interpretation</h3><p>${obs.interpretation ? esc(obs.interpretation) : '<span class="muted">Not yet written</span>'}</p><p class="mono report-note">An interpretation, not a claim that the material feels.</p></div>
      </div>
    </section>

    <section class="d-sec" id="d-translations" tabindex="-1" aria-labelledby="sf">
      <header class="d-sec-head"><p class="mono sec-k">F</p><h2 id="sf">Material translations</h2><p class="muted">People imagining they are the ${esc(o.name.toLowerCase())} and speaking as it. Human voices, not the material's.</p></header>
      <ul class="trs" data-trs>${tr.map(t => translationRecord(t, o)).join("") || `<li class="missing" data-empty>No translations recorded yet.</li>`}</ul>
    </section>

    <section class="d-become">
      <p class="mono">Object ${o.no} / ${esc(o.name)} / ${esc(o.primaryAction)}</p>
      <a class="cta cta--big" href="${href.become(o)}">Become ${esc(the(o))} <span aria-hidden="true">→</span></a>
    </section>

    <nav class="d-nextprev mono" aria-label="Other materials">
      <a href="${href.object(prev)}">← Object ${prev.no} ${esc(prev.name)}</a>
      <a href="${href.library}">All materials</a>
      <a href="${href.object(next)}">Object ${next.no} ${esc(next.name)} →</a>
    </nav>
  </article>`;

  // image navigation
  let at = 0;
  $$("[data-img-step]", main).forEach(b => b.addEventListener("click", () => {
    at = (at + +b.dataset.imgStep + images.length) % images.length;
    $$("[data-img]", main).forEach((f, i) => { f.classList.toggle("is-on", i === at); f.setAttribute("aria-hidden", i !== at); });
    $("[data-img-count]", main).textContent = `${String(at + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;
  }));
  $("[data-jump]", main).addEventListener("click", ev => { ev.preventDefault(); const s = $("#d-translations", main); s.scrollIntoView({ behavior: "smooth" }); s.focus({ preventScroll: true }); });

  const video = $("#exp-video", main);
  const cleanup = mountStateViewer(main, o, { onSelect: s => { if (video && video.paused && video.readyState > 0) video.currentTime = s.t; } });
  mountVideo(main);

  // approved public contributions (if the database is switched on)
  publishedFor(o).then(list => {
    if (!list.length || !main.contains($("[data-trs]", main))) return;
    const ul = $("[data-trs]", main); const empty = $("[data-empty]", ul); if (empty) empty.remove();
    ul.insertAdjacentHTML("beforeend", list.map(t => translationRecord(t, o)).join(""));
  });
  return cleanup;
}
