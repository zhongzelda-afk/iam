// 01 Home: one isolated object in a nearly white room, tiny labels, manual arrows (Reference A).
import { esc, $ } from "../lib/util.js?v=202611082312";
import { PUBLISHED, href } from "../lib/library.js?v=202611082312";
import { objectFigure } from "../components/figure.js?v=202611082312";

let at = 0;
export function render(main) {
  const o = PUBLISHED[at % PUBLISHED.length];
  main.innerHTML = `
  <section class="home" aria-labelledby="home-title">
    <div class="home-copy">
      <p class="mono eyebrow">I.A.M. · Institute of Animate Matter</p>
      <h1 id="home-title" class="home-title">The Living<br>Material Library</h1>
      <p class="home-tag">One Material. Many Meanings.</p>
      <p class="home-lede">Materials respond to the world through their physical behaviours. Through observation and embodied imagination, I.A.M. explores how these responses can be translated into many different voices.</p>
      <a class="cta" href="${href.library}">Explore the Library <span aria-hidden="true">→</span></a>
    </div>
    <div class="home-stage">
      <a class="home-object" href="${href.object(o)}" data-home-object aria-label="Open Object ${o.no}, ${esc(o.name)}">${objectFigure(o, { eager: true, alt: "" })}</a>
      <div class="home-caption">
        <button type="button" class="arrow" data-step="-1" aria-label="Previous material">‹</button>
        <p class="mono home-label" aria-live="polite"><span>Object ${o.no}</span><span class="home-name">${esc(o.name)}</span><span>${esc(o.category)}</span></p>
        <button type="button" class="arrow" data-step="1" aria-label="Next material">›</button>
      </div>
      <p class="mono home-count"><span>${String((at % PUBLISHED.length) + 1).padStart(2, "0")}</span> / ${String(PUBLISHED.length).padStart(2, "0")} published</p>
    </div>
  </section>`;
  main.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => {
    at = (at + +b.dataset.step + PUBLISHED.length) % PUBLISHED.length;
    const fig = $("[data-home-object]", main);
    fig.classList.add("is-leaving");
    setTimeout(() => { render(main); const nb = main.querySelector(`[data-step="${b.dataset.step}"]`); nb && nb.focus(); }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220);
  }));
}
