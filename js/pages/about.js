// About: the method, what the translations are (and are not), and where data lives.
// Glass panels in columns over the drifting library, like My Collection.
import { href, PUBLISHED } from "../lib/library.js?v=202611161643";

const SECTIONS = [
  ["Become a Material", "Each record documents one everyday material under a physical action. Workshop participants watched the material change, watched how others embodied that action with their bodies, imagined becoming the material, and said what it might say, in the first person."],
  ["What a translation is", "Translations are human interpretations. They are not scientific claims that materials have emotions or consciousness, and they are not personality tests. Observed facts and interpretations are kept apart on every record, and every translation carries its source."],
  ["Your translations and privacy", "What you write in Become a Material is saved only in your own browser, in My Collection. Nothing is sent anywhere unless you choose Contribute to the Lab and tick the consent box. Contributions are reviewed before they appear, can be anonymous, and can be withdrawn from My Collection at any time."],
  ["Images", "Object images are cut out from 4K studio footage and photographs of the actual objects. Physical states are real frames from the Workshop B videos."]
];
const STEPS = ["Material", "Physical action", "Embodied interpretation", "Material translation"];

export function render(main) {
  const objs = PUBLISHED.filter(o => o.heroImage);
  const drift = objs.map(o => `<span><img src="${o.heroImage}" alt="" decoding="async"></span>`).join("");
  const refract = /Chrome\//.test(navigator.userAgent) ? " lg--refract" : "";
  main.innerHTML = `
  <div class="h-drift c-drift" aria-hidden="true"><div class="h-row" style="--k:0"><div class="h-track">${drift}${drift}</div></div></div>
  <svg class="lg-defs" aria-hidden="true" focusable="false" width="0" height="0"><filter id="lg-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n"/>
    <feGaussianBlur in="n" stdDeviation="2" result="nb"/>
    <feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/>
  </filter></svg>
  <article class="about2" aria-labelledby="a-title">
    <header class="ab-head lg${refract}">
      <p class="ab-eyebrow"><span class="dot-ring" aria-hidden="true"></span>I.A.M. · Institute of Animate Matter</p>
      <h1 id="a-title" class="ab-title">About the Library</h1>
      <ol class="ab-seq" aria-label="Method">${STEPS.map((s, i) => `<li><span class="ab-n">0${i + 1}</span>${s}</li>`).join("")}</ol>
    </header>
    <div class="ab-grid">
      ${SECTIONS.map(([h, t], i) => `<section class="ab-card lg${refract}" style="--i:${i}"><h2><span class="ab-n">0${i + 1}</span>${h}</h2><p>${t}</p></section>`).join("")}
    </div>
    <footer class="ab-foot">
      <p>A graduation project by Lynn Zhong · MA User Experience Design · London College of Communication, UAL · 2026</p>
      <a class="h3-go" href="${href.library}"><i class="h3-pulse" aria-hidden="true"></i>Explore the Library</a>
    </footer>
  </article>`;
}
