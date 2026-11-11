// 01 Home: one material at the centre inside red corner marks, changing every few seconds;
// the small text sits in the four corners; one way in, a glass pill with a pulsing red marker.
import { esc, reduceMotion } from "../lib/util.js?v=202611110009";
import { PUBLISHED, href } from "../lib/library.js?v=202611110009";

let at = 0;

export function render(main) {
  const objs = PUBLISHED.filter(o => o.heroImage);
  const o = objs[at % objs.length];
  main.innerHTML = `
  <section class="home3" aria-labelledby="home-title">
    <div class="h3-c h3-tl"><b>I.A.M.</b><span>Institute of Animate Matter</span></div>
    <nav class="h3-c h3-tr" aria-label="More"><a href="#/collection">My Collection</a><a href="#/about">About</a></nav>
    <div class="h3-c h3-bl"><h1 id="home-title">The Living Material Library</h1><span>We shape materials. Materials shape us.</span></div>
    <div class="h3-c h3-br"><b data-label>Object ${o.no} / ${esc(o.name)}</b><span>Lynn Zhong · MA UX Design · LCC, UAL</span></div>
    <div class="h3-mid">
      <a class="h3-stage brackets" href="${href.object(o)}" data-stage aria-label="Open Object ${o.no}, ${esc(o.name)}">
        ${objs.map((x, i) => `<img class="h3-obj${x === o ? " is-on" : ""}" src="${esc(x.heroImage)}" alt="" decoding="async">`).join("")}
      </a>
      <a class="h3-go" href="${href.library}"><i class="h3-pulse" aria-hidden="true"></i>Material Library</a>
    </div>
  </section>`;

  const stage = main.querySelector("[data-stage]"), label = main.querySelector("[data-label]"), imgs = [...main.querySelectorAll(".h3-obj")];
  const show = i => {
    at = i; const x = objs[i];
    imgs.forEach((im, j) => im.classList.toggle("is-on", j === i));
    stage.href = href.object(x); stage.setAttribute("aria-label", `Open Object ${x.no}, ${x.name}`);
    label.textContent = `Object ${x.no} / ${x.name}`;
  };
  const timer = reduceMotion() ? 0 : setInterval(() => show((at + 1) % objs.length), 2600);
  return () => clearInterval(timer);
}
