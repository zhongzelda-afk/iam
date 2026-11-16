// 01 Home: one material at the centre inside red corner marks, changing every few seconds;
// the small text sits in the four corners; one way in, a glass pill with a pulsing red marker.
import { esc, reduceMotion } from "../lib/util.js?v=202611161712";
import { PUBLISHED, href } from "../lib/library.js?v=202611161712";

let at = 0;

// Lynn's booklet tracings (photo at low opacity, navy contour lines); only these objects appear on the home page
const TRACED = ["orange", "aluminium-foil", "cleaning-sponge", "cream-foam", "rose"];
const traceOf = o => `assets/tracings/${o.slug}.webp`;
// near invisible code in two corners, written for the material at the centre
const codeA = o => [
  `# I.A.M. ${o.no} ${o.name.toUpperCase()}  state 01 BEFORE`,
  `${o.slug.replace(/-/g, "_")} = Material(no="${o.no}", action="${(o.primaryAction || "compression").toLowerCase()}")`,
  `frame = still("${o.slug.toUpperCase().replace(/-/g, "_")}_FILM", t="00:00")`,
  `state = trace(frame, line="navy", photo=0.45)`,
  `contact = None  # untouched`,
  `press = None    # not measured, read by eye`,
  `stack.add(state)  # sheet 1 of 4`,
  `reading = ask(visitor)`].join("\n");
const codeB = o => [
  `for s in ${o.slug.replace(/-/g, "_")}.states:`,
  `    sheet = trace(s.frame, line="navy")`,
  `    force = locate(s.contact)  # where the hand went`,
  `    booklet.fold(sheet)`,
  `# we shape materials`,
  `# materials shape us`,
  `voice = translate(${o.slug.replace(/-/g, "_")}, by="human")`,
  `collection.keep(voice)`].join("\n");

export function render(main) {
  const objs = PUBLISHED.filter(o => TRACED.includes(o.slug)).sort((x, y) => TRACED.indexOf(x.slug) - TRACED.indexOf(y.slug));
  const o = objs[at % objs.length];
  main.innerHTML = `
  <section class="home3" aria-labelledby="home-title">
    <pre class="h3-code h3-code--a" aria-hidden="true" data-code-a>${esc(codeA(o))}</pre>
    <pre class="h3-code h3-code--b" aria-hidden="true" data-code-b>${esc(codeB(o))}</pre>
    <div class="h3-c h3-tl"><b>I.A.M.</b><span>Institute of Animate Matter</span></div>
    <nav class="h3-c h3-tr" aria-label="More"><a href="#/collection">My Collection</a><a href="#/about">About</a></nav>
    <div class="h3-c h3-bl"><h1 id="home-title">The Living Material Library</h1><span>We shape materials. Materials shape us.</span></div>
    <div class="h3-c h3-br"><b data-label>Object ${o.no} / ${esc(o.name)}</b><span>Lynn Zhong · MA UX Design · LCC, UAL</span></div>
    <div class="h3-mid">
      <a class="h3-stage brackets" href="${href.object(o)}" data-stage aria-label="Open Object ${o.no}, ${esc(o.name)}">
        ${objs.map((x, i) => `<img class="h3-obj${x === o ? " is-on" : ""}" src="${traceOf(x)}" alt="" decoding="async">`).join("")}
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
    main.querySelector("[data-code-a]").textContent = codeA(x);
    main.querySelector("[data-code-b]").textContent = codeB(x);
  };
  const timer = reduceMotion() ? 0 : setInterval(() => show((at + 1) % objs.length), 2600);
  return () => clearInterval(timer);
}
