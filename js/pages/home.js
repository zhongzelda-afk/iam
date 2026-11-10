// 01 Home: one material at the centre, held in a ring of force (after the hero image),
// the rest drifting past behind it; a small glass plate carries the name and the way in.
import { esc, reduceMotion } from "../lib/util.js?v=202611101559";
import { PUBLISHED, href } from "../lib/library.js?v=202611101559";

const refractOK = () => /Chrome\//.test(navigator.userAgent);
let at = 0;

export function render(main) {
  const objs = PUBLISHED.filter(o => o.heroImage);
  const items = objs.map(o => `<a href="${href.object(o)}" tabindex="-1" title="Object ${o.no} ${esc(o.name)}"><img src="${esc(o.heroImage)}" alt="" decoding="async"></a>`).join("");
  const o = objs[at % objs.length];
  main.innerHTML = `
  <section class="home2" aria-labelledby="home-title">
    <div class="h-drift" aria-hidden="true"><div class="h-row" style="--k:0"><div class="h-track">${items}${items}</div></div></div>
    <a class="h-stage brackets" href="${href.object(o)}" data-stage aria-label="Open Object ${o.no}, ${esc(o.name)}">
      <span class="h-glow" aria-hidden="true"></span>
      <span class="h-rings" aria-hidden="true"></span>
      ${objs.map((x, i) => `<img class="h-obj${x === o ? " is-on" : ""}" src="${esc(x.heroImage)}" alt="" data-i="${i}" decoding="async">`).join("")}
      <span class="h-force" aria-hidden="true"></span>
      <i class="h-dot h-dot--1" aria-hidden="true"></i><i class="h-dot h-dot--2" aria-hidden="true"></i><i class="h-dot h-dot--3" aria-hidden="true"></i>
      <span class="h-label mono" data-label>Object ${o.no} / ${esc(o.name)}</span>
    </a>
    <svg class="lg-defs" aria-hidden="true" focusable="false" width="0" height="0"><filter id="lg-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n"/>
      <feGaussianBlur in="n" stdDeviation="2" result="nb"/>
      <feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/>
    </filter></svg>
    <div class="h-plate lg${refractOK() ? " lg--refract" : ""}">
      <p class="h-inst mono"><span class="dot-ring" aria-hidden="true"></span>I.A.M. · Institute of Animate Matter</p>
      <h1 id="home-title" class="h-title">The Living Material Library</h1>
      <p class="h-motto"><span>We shape materials.</span><i class="h-ball" aria-hidden="true"></i><span>Materials shape us.</span></p>
      <a class="h-cta h-cta--home" href="${href.library}"><i class="h-cta-ball" aria-hidden="true"></i><span class="h-cta-t">Explore the Material Library</span><span class="h-cta-arr" aria-hidden="true">→</span></a>
    </div>
  </section>`;

  // the centre changes material every few seconds
  const stage = main.querySelector("[data-stage]"), label = main.querySelector("[data-label]"), imgs = [...main.querySelectorAll(".h-obj")];
  const show = i => {
    at = i; const x = objs[i];
    imgs.forEach((im, j) => im.classList.toggle("is-on", j === i));
    stage.href = href.object(x); stage.setAttribute("aria-label", `Open Object ${x.no}, ${x.name}`);
    label.textContent = `Object ${x.no} / ${x.name}`;
  };
  const timer = reduceMotion() ? 0 : setInterval(() => show((at + 1) % objs.length), 4200);
  return () => clearInterval(timer);
}
