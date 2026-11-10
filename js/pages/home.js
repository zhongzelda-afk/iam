// 01 Home: every published object drifting across the room at one steady speed,
// with a clear liquid glass plate in front carrying the name and the way in.
import { esc } from "../lib/util.js?v=202611101243";
import { PUBLISHED, href } from "../lib/library.js?v=202611101243";

// SVG refraction inside backdrop-filter only renders in Chromium browsers; others get the clear glass alone
const refractOK = () => /Chrome\//.test(navigator.userAgent);

export function render(main) {
  const objs = PUBLISHED.filter(o => o.heroImage);
  const row = k => {
    const list = objs.map((_, i) => objs[(i + k * 3) % objs.length]);
    const items = list.map(o => `<a href="${href.object(o)}" tabindex="-1" title="Object ${o.no} ${esc(o.name)}"><img src="${esc(o.heroImage)}" alt="" loading="${k ? "lazy" : "eager"}" decoding="async"></a>`).join("");
    return `<div class="h-row" style="--k:${k}"><div class="h-track">${items}${items}</div></div>`;
  };
  main.innerHTML = `
  <section class="home2" aria-labelledby="home-title">
    <div class="h-drift" aria-hidden="true">${row(0)}</div>
    <svg class="lg-defs" aria-hidden="true" focusable="false" width="0" height="0"><filter id="lg-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n"/>
      <feGaussianBlur in="n" stdDeviation="2" result="nb"/>
      <feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/>
    </filter></svg>
    <div class="h-plate lg${refractOK() ? " lg--refract" : ""}">
      <p class="h-inst mono"><span class="dot-ring" aria-hidden="true"></span>Institute of Animate Matter</p>
      <p class="h-iam" aria-hidden="true">I.A.M.</p>
      <h1 id="home-title" class="h-title">The Living Material Library</h1>
      <p class="h-motto"><span>We shape materials.</span><i class="h-ball" aria-hidden="true"></i><span>Materials shape us.</span></p>
      <a class="h-cta" href="${href.library}">Explore the Material Library <span aria-hidden="true">→</span></a>
      <p class="h-count mono">${String(PUBLISHED.length).padStart(2, "0")} materials on record · One material, many meanings</p>
    </div>
  </section>`;
}
