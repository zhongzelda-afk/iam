import { allMaterials, setCommunity, byId, canonical, SPEEDS, AFTERS, AFTERS_SHORT, LANGUAGE, DEMOS } from "./data.js";
import { mark, specimenArt, field, guilloche } from "./art.js";
import { mountEditor, mountPlayer, defaultPose } from "./body.js";
import * as store from "./store.js";
import { LEGAL } from "./legal.js";

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const main = $("#main");
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
const latestMeaning = e => (e.revisions && e.revisions.length ? e.revisions[e.revisions.length - 1].meaning : e.meaning);
const unknown = id => ({ id, no: "—", name: "Unknown material", shape: "stand", words: [], experiments: [], media: [] });
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const transition = fn => (document.startViewTransition && !calm()) ? document.startViewTransition(fn) : (fn(), null);
const missing = (t = "Not yet recorded.") => `<p class="missing">${t}</p>`;
const hasBody = e => !!(e && e.body && e.body.frames && e.body.frames.length > 1);
const kindLabel = m => m.community ? `Community submission · not verified` : m.retired ? "Earlier archive entry" : "Founding collection";

// a specimen inside its technical field
const stage = (m, { large = false } = {}) => `${field()}${specimenArt(m, { large })}`;

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3200);
}
window.addEventListener("iam:toast", e => toast(e.detail));

// whichever dialog or panel is open, closed when the page changes
let overlay = null;
const closeOverlay = () => { if (overlay && $("#modal-root").firstChild) overlay(); overlay = null; };

// centred dialog, used for confirmations, expanded cards and image inspection
function modal(html, onMount, onClose, { wide = false, cls = "" } = {}) {
  const root = $("#modal-root");
  const last = document.activeElement;
  root.innerHTML = `<div class="modal-backdrop"><div class="modal ${wide ? "wide" : ""} ${cls}" role="dialog" aria-modal="true">${html}<button class="modal-close" data-close aria-label="Close">×</button></div></div>`;
  const bd = $(".modal-backdrop", root);
  const close = () => { if (root.contains(bd)) root.innerHTML = ""; document.removeEventListener("keydown", onKey); last && last.focus && last.focus(); onClose && onClose(); };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  bd.addEventListener("click", e => { if (e.target === bd || e.target.closest("[data-close]")) close(); });
  const first = $("input, textarea, button:not([data-close])", bd); (first || $(".modal", bd)).focus?.();
  overlay = close;
  onMount && onMount($(".modal", bd), close);
  return close;
}

// side panel that slides in from the right, used for the short one-question-at-a-time flows
function panel(label, onMount, onClose) {
  const root = $("#modal-root");
  const last = document.activeElement;
  root.innerHTML = `<div class="panel-backdrop"></div><aside class="side" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="side-body"></div><button class="modal-close" data-close aria-label="Close">×</button></aside>`;
  const side = $(".side", root);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", onKey);
    const done = () => { if (root.contains(side)) root.innerHTML = ""; last && last.focus && last.focus(); onClose && onClose(); };
    if (calm()) return done();
    side.classList.add("closing"); setTimeout(done, 240);
  };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  $(".panel-backdrop", root).addEventListener("click", close);
  side.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  overlay = close;
  onMount($(".side-body", side), close);
  return close;
}

// in-page confirmation (browser confirm() is blocked in some embeds)
function ask(question, yes = "Yes") {
  return new Promise(resolve => {
    let done = false;
    modal(`<h2>${esc(question)}</h2>
      <div class="row" style="margin-top:24px"><button class="btn btn-primary" data-yes>${esc(yes)}</button><button class="btn btn-quiet" data-close>Cancel</button></div>`, (box, c) => {
      $("[data-yes]", box).addEventListener("click", () => { done = true; c(); resolve(true); });
    }, () => { if (!done) resolve(false); });
  });
}

function download(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// zoom into a real photograph: click to magnify at that point, click again to return
function inspect(src, alt) {
  modal(`<div class="inspect"><img src="${esc(src)}" alt="${esc(alt)}"></div><p class="label" style="margin-top:10px">Click to zoom</p>`, box => {
    const wrap = $(".inspect", box), img = $("img", wrap);
    wrap.addEventListener("click", e => {
      const r = wrap.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width * 100).toFixed(1)}% ${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`;
      wrap.classList.toggle("zoomed");
    });
  }, null, { wide: true, cls: "modal-image" });
}

async function loadMaterials() {
  const slow = new Promise((_, no) => setTimeout(() => no(new Error("Materials took too long")), 6000));
  try { setCommunity(await Promise.race([store.listMaterials(), slow])); } catch (e) { console.error(e); }
}

// movement for the demo interpretations
const pose = (o = {}) => { const p = defaultPose(); const a = { ...p.a, ...(o.a || {}) }; return { ...p, ...o, a }; };
const DEMO_BODIES = {
  "ex-1": { speed: .85, ending: "return", frames: [pose(), pose({ squash: .56, a: { lElbow: 250, lHand: -100, rElbow: 110, rHand: 100, lKnee: 120, rKnee: 60 } })] },
  "ex-2": { speed: .08, ending: "hold", frames: [pose({ a: { lElbow: 270, lHand: 0, rElbow: 90, rHand: 0 } }), pose({ squash: .82, a: { chest: -70, lElbow: 230, rElbow: 140, lKnee: 120, lFoot: -40, rKnee: 70, rFoot: 30 } }), pose({ squash: .5, y: 230, a: { chest: -20, neck: 10, lElbow: 170, rElbow: 200, lKnee: 160, lFoot: 0, rKnee: 20, rFoot: 0 } })] },
  "ex-3": { speed: .92, ending: "hold", frames: [pose({ a: { lElbow: 250, rElbow: 110 } }), pose({ squash: .78, a: { chest: -110, neck: 30, head: 20, lElbow: 100, lHand: -120, rElbow: 40, rHand: 140, lKnee: 130, lFoot: -90, rKnee: 60, rFoot: 80 } })] }
};
const demosFor = id => DEMOS.filter(e => e.material_id === id).map(e => ({ ...e, body: DEMO_BODIES[e.id] }));

// other people's meanings of one material: shared entries (not mine), then demos
async function othersOf(id) {
  const mineIds = new Set(store.mine().map(e => e.remote_id).filter(Boolean));
  let rows = [];
  try { rows = (await store.listShared()).map(r => ({ ...r, material_id: canonical(r.material_id) })).filter(r => r.material_id === id && !mineIds.has(r.id)); }
  catch (e) { console.error(e); toast("The shared archive could not be reached."); }
  return [...rows, ...demosFor(id)];
}
const myEntriesFor = id => store.mine().filter(e => canonical(e.material_id) === id);
const revealKey = id => "iam.reveal." + id;
const isRevealed = id => { try { return sessionStorage.getItem(revealKey(id)) === "1"; } catch { return false; } };
const setRevealed = id => { try { sessionStorage.setItem(revealKey(id), "1"); } catch { } };

// ---------- router ----------
const ID = "(\\d{3}|c-[a-z0-9]{8})";
const routes = [
  [/^$/, home],
  [/^archive$/, archive],
  [new RegExp(`^archive-${ID}$`), detail],
  [/^dictionary$/, collection],
  [/^about$/, about],
  [/^(terms|privacy|research|consent)$/, legalPage]
];
// addresses from earlier versions of the site
const legacy = path => {
  let m;
  if ((m = path.match(/^materials-(\d{3}-\d{2})$/))) return "archive-" + canonical(m[1].replace("-", "."));
  if ((m = path.match(new RegExp(`^play-${ID}$`)))) return "archive-" + m[1];
  if (/^(materials|collective|lab|play)/.test(path)) return "archive";
  if (path === "me" || path === "collection") return "dictionary";
  return null;
};
const navKey = path => path.startsWith("archive") ? "archive" : path === "dictionary" ? "dictionary" : path === "" ? "home" : "";
const currentPath = () => location.hash.replace(/^#\/?/, "").replace(/\//g, "-");

let leaving = null, renderSeq = 0;
async function render() {
  const path = currentPath();
  if (path === "main") { history.replaceState(null, "", "#" + (render.last || "")); main.focus(); return; }
  const moved = legacy(path);
  if (moved !== null) { history.replaceState(null, "", "#" + moved); return render(); }
  const sameRoute = path === render.last;
  render.last = path;
  if (leaving) { leaving(); leaving = null; }
  if (!sameRoute) closeOverlay();
  document.body.dataset.route = navKey(path) || "page";
  $$(".nav [data-nav]").forEach(a => a.dataset.nav === navKey(path) ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  const route = routes.find(([re]) => re.test(path));
  const y = window.scrollY;
  // a slow page dims the old content and shows a progress line; a failed one offers a retry
  const seq = ++renderSeq;
  const slow = setTimeout(() => { if (seq === renderSeq) { main.setAttribute("aria-busy", "true"); document.body.classList.add("is-loading"); } }, 160);
  try {
    if (!route) main.innerHTML = notFound();
    else await route[1](...path.match(route[0]).slice(1));
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="wrap page empty-state" role="alert"><h1>This page could not be opened.</h1><p>The archive may be unreachable for a moment. Your drafts in this browser are safe.</p><div class="row" style="justify-content:center"><button class="btn btn-primary" type="button" data-retry>Try again</button><a class="btn" href="#">Home</a></div></div>`;
    $("[data-retry]", main).addEventListener("click", () => { render.last = null; render(); });
  } finally {
    clearTimeout(slow);
    if (seq === renderSeq) { main.removeAttribute("aria-busy"); document.body.classList.remove("is-loading", "booting"); }
  }
  if (seq !== renderSeq) return;
  window.scrollTo({ top: sameRoute ? y : 0, behavior: "instant" in window ? "instant" : "auto" });
  if (!sameRoute) main.focus({ preventScroll: true });
  const h1 = main.querySelector("h1")?.textContent.trim();
  document.title = h1 && path ? `${h1} · I.A.M.` : "I.A.M. Institute of Animate Matter";
}
const onNav = () => { if (currentPath() !== render.last) render(); };
window.addEventListener("hashchange", onNav);
window.addEventListener("popstate", onNav);

// a specimen opens into its case file, and closes back into the archive
function go(hash, before, after) {
  return transition(async () => { before && before(); history.pushState(null, "", hash); await render(); after && after(); });
}
main.addEventListener("click", e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  const spec = e.target.closest("a.spec[data-id]");
  if (spec && document.startViewTransition && !calm()) {
    e.preventDefault();
    const img = $(".img", spec); img.style.viewTransitionName = "spec-hero";
    go(spec.getAttribute("href"), () => { img.style.viewTransitionName = ""; });
    return;
  }
  const back = e.target.closest("a.back[data-from]");
  if (back && document.startViewTransition && !calm()) {
    e.preventDefault();
    let target = null;
    const t = go(back.getAttribute("href"), null, () => { target = $(`.spec[data-id="${back.dataset.from}"] .img`, main); if (target) target.style.viewTransitionName = "spec-hero"; });
    t && t.finished.finally(() => { if (target) target.style.viewTransitionName = ""; });
  }
});
// directional light follows the pointer across a specimen
main.addEventListener("pointermove", e => {
  const img = e.target.closest(".spec .img, .stage"); if (!img) return;
  const r = img.getBoundingClientRect();
  img.style.setProperty("--lx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
  img.style.setProperty("--ly", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
});

// ---------- fragments ----------
// behaviour, written the same way everywhere
const behaviour = m => m.speed && m.after ? `${AFTERS[m.after]} · ${SPEEDS[m.speed]}` : "";
const behaviourShort = m => m.speed && m.after ? `${AFTERS_SHORT[m.after]} · ${SPEEDS[m.speed]}` : "";
// what a founding record still lacks; an empty list means the record is complete
const recordGaps = m => {
  if (m.community) return [];
  const g = [];
  if (!m.photo) g.push("Photograph");
  if (!m.response) g.push("Physical observation");
  if (!m.speed || !m.after) g.push("Behaviour");
  return g;
};
const isComplete = m => !m.community && !m.retired && !recordGaps(m).length;
const collectionOf = m => m.community ? "Community submission, not verified" : m.retired ? "Earlier archive entry" : "Founding collection";

const specLink = m => `<a class="spec" href="#archive-${m.id}" data-id="${m.id}" data-speed="${m.speed || ""}" data-after="${m.after || ""}" ${m.community ? "data-community" : ""}>
  <div class="img">${stage(m)}${m.refImage ? `<span class="ref-dot" title="Reference image, not a specimen photograph">Ref.</span>` : ""}</div>
  <div class="meta"><span class="no">${m.no}</span><span class="name">${esc(m.name)}</span>${m.community ? `<span class="tag-community">Community</span>` : ""}</div>
  <div class="spec-sub">${esc(behaviourShort(m) || (m.community ? "Not verified" : "Behaviour not recorded"))}</div>
</a>`;

const matrix = m => `<span class="matrix" role="img" aria-label="${SPEEDS[m.speed]}, ${AFTERS[m.after]}">${["instant", "delayed"].map(sp => ["returns", "keeps"].map(af =>
  `<span class="${sp === m.speed && af === m.after ? "on" : ""}">${AFTERS_SHORT[af]} · ${SPEEDS[sp]}</span>`).join("")).join("")}</span>`;

const savedMark = `<svg class="saved-mark" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25" fill="none" stroke-width="1.5"/><path d="M18 29 l7 7 l13 -15" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// how a personal entry relates to the Institute's own
const RELATIONS = { adopt: ["Adopt it", "Adopts"], adapt: ["Adapt or extend it", "Adapts"], different: ["Something different", "A different reading from"] };
const relationLine = (rel, m) => rel && RELATIONS[rel] && m && m.identity ? `${RELATIONS[rel][1]} the Institute's “${esc(m.identity.name)}”` : "";

// a personal dictionary entry: material, the visitor's name for it, and why
function dictEntry(e, { sample = false, m = byId(e.material_id) || unknown(e.material_id) } = {}) {
  const o = e.observe || {};
  const noticed = [...(o.noticed || []), o.note].filter(Boolean).join(" · ");
  const rel = relationLine(o.relation, m);
  return `<article class="dict-entry${sample ? " sample" : ""}">
    ${sample ? `<span class="label sample-label">Example entry · written by the Institute to show the format, not a visitor's response</span>` : ""}
    <div class="de-head"><span class="de-word">${esc(latestMeaning(e))}</span><span class="de-mat">No. ${m.no} · ${esc(m.name)}</span></div>
    ${e.meaning_note ? `<p class="de-def">${esc(e.meaning_note)}</p>` : ""}
    <dl class="de-meta">
      ${noticed ? `<div><dt>Noticed</dt><dd>${esc(noticed)}</dd></div>` : ""}
      ${e.voice ? `<div><dt>Imagined voice</dt><dd><span class="voice">${esc(e.voice)}</span></dd></div>` : ""}
      ${rel ? `<div><dt>Relation</dt><dd>${rel}</dd></div>` : ""}
    </dl>
  </article>`;
}
const SAMPLE = () => ({ ...DEMOS[0], observe: { relation: "adapt" } });

// ---------- HOME ----------
// the Institute's archive on the right: a specimen under observation, its protocol and parameters, the catalogue, a spec card
// how to take part stays in a column on the left while the archive scrolls
const DETAILS = ["Surface", "Texture", "Interior"];
const words = m => (m.words || []).map(w => LANGUAGE[w].word).join(", ");
const codeLines = (start, rows) => rows.map((r, i) => `<span class="cl ${r[0]}"><span class="ln" aria-hidden="true">${start + i}</span><span class="ct" ${r[1] ? `data-type="${esc(r[1])}"` : ""}>${esc(r[1] || "")}</span></span>`).join("");
const protocol = m => {
  const x = (m.experiments || [])[0];
  return codeLines(31, [
    ["c", "// observation protocol [观察指令]"], ["rule", "----------------------------------"], ["", ""],
    ["h", "Input steps"], ["", ""],
    ["k", "01_specimen"], ["v", m.specimen ? `${m.name} · ${m.specimen.condition}` : m.name],
    ["k", "02_action"], ["v", x ? x.type : "Not yet tested"],
    ["k", "03_response"], ["v", m.speed ? `${AFTERS_SHORT[m.after]} · ${SPEEDS[m.speed]}` : "Not yet recorded"],
    ["k", "04_language"], ["v", words(m) || "Unassigned"],
    ["", ""], ["x", "// observe first. interpret later."]
  ]);
};
const params = m => codeLines(19, [
  ["c", "// basic parameters"], ["rule", "------------------------"], ["", ""],
  ["k", "Institute identifier"], ["v", "I.A.M."], ["", ""],
  ["k", "Object id"], ["v", `Specimen_${m.no}`], ["", ""],
  ["k", "Structure"], ["v", m.structure || m.botanical || "Not recorded"], ["", ""],
  ["k", "Institute's entry"], ["v", m.identity ? m.identity.name : "Not yet written"], ["", ""],
  ["k", "Status"], ["v", m.refImage ? "Reference image [~]" : m.photo ? "Documented [√]" : "No photograph yet [ ]"]
]);
// close-ups only where they exist; otherwise an empty labelled frame, never a "pending" claim
const detailSlots = m => (m.details || DETAILS.map(label => ({ label }))).map((d, i) => `<li class="${d.src ? "has" : "none"}" style="--i:${i}"><span class="dimg">${d.src ? `<img src="${esc(d.src)}" alt="${esc(m.name)}, ${esc(d.label)}" loading="lazy">` : ""}</span><span class="dlabel"><span>0${i + 1}</span>${esc(d.label)}</span></li>`).join("");
const FINDERS = [[[54, 30, 9], [44, 56, 14]], [[40, 26, 10], [56, 60, 12]], [[58, 40, 8], [38, 62, 15]], [[46, 22, 11], [60, 52, 13]]];

// how to take part, written like the observation protocol beside it
const rail = () => {
  const ex = byId("001");
  const rows = [
    ["c", "// how it works [参与方式]"], ["rule", "------------------------"], ["", ""],
    ["h", "Two dictionaries"], ["v", "Every material answers pressure"], ["v", "in its own way."], ["v", "The Institute reads it and writes"], ["v", "an entry in its dictionary."], ["v", "You read the same behaviour"], ["v", "and write an entry in yours."], ["", ""],
    ["k", "01_explore"], ["v", "Watch how a material changes:"], ["v", "before, during, after release."], ["", ""],
    ["k", "02_read"], ["v", "The Institute's reading."], ["v", "One authored reading,"], ["v", "not the answer."], ["a", `e.g. ${ex.name} → ${ex.identity.name}`], ["", ""],
    ["k", "03_write"], ["v", "Your own entry:"], ["v", "notice · associate ·"], ["v", "imagine · name."], ["v", "Adopt it, adapt it, or differ."], ["", ""],
    ["k", "04_keep"], ["v", "Private by default."], ["v", "No account needed to start."], ["", ""]
  ];
  return `<aside class="rail" aria-labelledby="rail-h">
    <h2 class="visually-hidden" id="rail-h">How it works</h2>
    <pre class="code rail-code">${codeLines(1, rows)}<span class="cl x"><span class="ln" aria-hidden="true">${rows.length + 1}</span><span class="ct"><a href="#archive" class="rail-go">Explore_a_material() →</a></span></span></pre>
    <details class="rail-eg"><summary><span class="ln-pad" aria-hidden="true">${rows.length + 2}</span>// see an example entry</summary>${dictEntry(SAMPLE(), { sample: true })}</details>
  </aside>`;
};

async function home() {
  const all = allMaterials().filter(m => !m.community && !m.retired);
  let cur = 0, timer = null;
  const feat = all.find(m => m.photo && m.identity) || all[0];
  main.innerHTML = `
  <div class="home-grid">
  ${rail()}
  <div class="home-main">
  <section class="home-top">
    <div class="home-title">
      <span class="label">I.A.M. · Institute of Animate Matter</span>
      <h1>One Material. Many Meanings.</h1>
      <p>An evolving archive of materials and the meanings we give them.</p>
    </div>
    <a class="btn btn-primary" href="#archive">Explore Archive</a>
  </section>

  <section>
    <div class="viewer" aria-label="Specimen under observation">
      <div class="board">
        <div class="board-id"><span class="board-no" data-v-no>${all[0].no}</span><span class="board-name" data-v-name>${esc(all[0].name)}</span></div>
        <div class="board-stage">
          <svg class="board-guides" viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".6" vector-effect="non-scaling-stroke">
            <circle class="draw" pathLength="1" cx="200" cy="200" r="150" stroke-dasharray="3 5" style="--d:200ms"/>
            <g class="draw-fade" style="--d:500ms"><path d="M200 20 V60 M200 340 V380 M20 200 H60 M340 200 H380"/>${[[70, 70], [330, 70], [70, 330], [330, 330]].map(([x, y]) => `<path d="M${x - 8} ${y} H${x + 8} M${x} ${y - 8} V${y + 8}"/>`).join("")}</g>
          </g></svg>
          <div class="scale" data-v-scale aria-hidden="true" ${all[0].size ? "" : "hidden"}><span></span><em data-v-size>${all[0].size || ""}</em></div>
          <a class="board-spec xray" href="#archive-${all[0].id}" data-v-link aria-label="Open ${esc(all[0].name)}">${specimenArt(all[0], { large: true })}</a>
          ${FINDERS[0].map(([x, y, w], i) => `<span class="vf" data-vf="${i}" style="--x:${x}%;--y:${y}%;--w:${w}%"></span>`).join("")}
        </div>
        <ol class="details" data-v-details>${detailSlots(all[0])}</ol>
      </div>
      <pre class="code code-l" data-v-proto>${protocol(all[0])}</pre>
      <pre class="code code-r" data-v-params>${params(all[0])}</pre>
      <div class="viewer-foot">
        <span class="viewer-mark">${guilloche({ size: 120 })}</span>
        <span class="viewer-count label"><span data-v-i>01</span> / ${String(all.length).padStart(2, "0")}<span class="ref-note" data-v-ref ${all[0].refImage ? "" : "hidden"}> · Reference image, not a specimen photograph</span></span>
        <div class="viewer-btns">
          <button class="vbtn" type="button" data-v-step="-1" aria-label="Previous specimen">←</button>
          <button class="vbtn" type="button" data-v-step="1" aria-label="Next specimen">→</button>
          <a class="vbtn" href="#archive-${all[0].id}" data-v-open aria-label="Open the record for ${esc(all[0].name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></a>
        </div>
      </div>
    </div>
  </section>

  <section class="catalogue-wrap" aria-label="Founding collection">
    <div class="catalogue-side" aria-hidden="true"><span>FOUNDING COLLECTION_001–${String(all.length).padStart(3, "0")}</span></div>
    <div class="catalogue">
      ${all.map((m, i) => `<a class="cat" href="#archive-${m.id}" style="--i:${i}">
        <div class="cat-img xray">${specimenArt(m)}<span class="cat-vf" aria-hidden="true"></span></div>
        <div class="cat-cap"><span class="cat-no">${m.no}</span><span class="cat-text"><strong>${esc(m.name.toUpperCase())}</strong><span>${esc(behaviourShort(m) || "In progress")}</span></span></div>
      </a>`).join("")}
    </div>
  </section>

  <section class="spec-wrap">
    <div class="spec-card">
      <span class="spec-side">Specimen</span>
      <div class="spec-card-img xray">${specimenArt(feat, { large: true })}</div>
      <div class="spec-card-info">
        <h2>${esc(feat.name)}</h2>
        <dl class="spec-table">
          ${[["Item", feat.type], ["Structure", feat.structure || feat.botanical], ["Behaviour", behaviourShort(feat)], ["Language", words(feat)], ["Institute's entry", feat.identity && feat.identity.name], ["ID", feat.no]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}:</dt><dd>${esc(v)}</dd></div>`).join("")}
        </dl>
        <a class="btn btn-small" href="#archive-${feat.id}">Open case file</a>
      </div>
    </div>
    <div class="spec-card spec-card-foot">
      <span>Write your own entry for any material.<br>Private by default.</span>
      <span><a class="ulink" href="#archive">Archive</a><br><a class="ulink" href="#dictionary">My Dictionary</a><br><a class="ulink" href="#about">About &amp; privacy</a></span>
    </div>
  </section>
  </div>
  </div>`;

  // typed update of each line, a quick settle rather than a slow effect
  const type = (root, html) => {
    root.innerHTML = html;
    if (calm()) return;
    $$("[data-type]", root).forEach(el => {
      const full = el.dataset.type, t0 = performance.now(), glyphs = "▮▯/_01";
      const step = now => {
        const k = Math.min(1, (now - t0) / 320), n = Math.floor(full.length * k);
        el.textContent = full.slice(0, n) + (k < 1 ? glyphs[Math.floor(Math.random() * glyphs.length)] : "");
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };
  const show = i => {
    cur = (i + all.length) % all.length;
    const m = all[cur], v = $(".viewer", main); if (!v) return;
    $("[data-v-no]", v).textContent = m.no; $("[data-v-name]", v).textContent = m.name;
    $("[data-v-i]", v).textContent = String(cur + 1).padStart(2, "0");
    const link = $("[data-v-link]", v); link.href = "#archive-" + m.id; link.setAttribute("aria-label", "Open " + m.name);
    link.classList.remove("swap"); void link.offsetWidth; link.classList.add("swap");
    link.innerHTML = specimenArt(m, { large: true });
    const open = $("[data-v-open]", v); open.href = "#archive-" + m.id; open.setAttribute("aria-label", "Open the record for " + m.name);
    $("[data-v-scale]", v).hidden = !m.size; $("[data-v-size]", v).textContent = m.size || "";
    $("[data-v-details]", v).innerHTML = detailSlots(m);
    $("[data-v-ref]", v).hidden = !m.refImage;
    FINDERS[cur % FINDERS.length].forEach(([x, y, w], k) => { const f = $(`[data-vf="${k}"]`, v); f.style.setProperty("--x", x + "%"); f.style.setProperty("--y", y + "%"); f.style.setProperty("--w", w + "%"); });
    type($("[data-v-proto]", v), protocol(m));
    type($("[data-v-params]", v), params(m));
  };
  const auto = () => { clearInterval(timer); if (!calm()) timer = setInterval(() => { if (!document.hidden && !$(".viewer:hover, .viewer:focus-within", main)) show(cur + 1); }, 6000); };
  $$("[data-v-step]", main).forEach(b => b.addEventListener("click", () => { show(cur + Number(b.dataset.vStep)); auto(); }));
  const start = all.findIndex(m => m.photo);
  if (start > 0) show(start);
  auto();
  leaving = () => clearInterval(timer);
}

// ---------- ARCHIVE ----------
// two independent dimensions that combine; "any" leaves a dimension open
const RETURNS = [["any", "Any"], ["returns", AFTERS.returns], ["keeps", AFTERS.keeps]];
const TIMES = [["any", "Any"], ["instant", SPEEDS.instant], ["delayed", SPEEDS.delayed]];
const SORTS = [["no", "Number"], ["name", "Name"], ["behaviour", "Behaviour"]];
let fReturn = "any", fTime = "any", archiveView = "grid", archiveSort = "no";
try { archiveView = localStorage.getItem("iam.view") === "index" ? "index" : "grid"; } catch { }
const matches = m => (fReturn === "any" || m.after === fReturn) && (fTime === "any" || m.speed === fTime);

function indexList(list) {
  const roots = list.filter(m => !m.parent || !list.some(p => p.id === m.parent));
  const kids = id => list.filter(m => m.parent === id);
  const bk = m => behaviour(m) || "~";
  const by = { no: (a, b) => String(a.no).localeCompare(String(b.no), undefined, { numeric: true }), name: (a, b) => a.name.localeCompare(b.name), behaviour: (a, b) => bk(a).localeCompare(bk(b)) || String(a.no).localeCompare(String(b.no), undefined, { numeric: true }) }[archiveSort];
  roots.sort(by);
  const row = (m, sub = false) => {
    const gaps = recordGaps(m);
    return `<a class="ix ${sub ? "ix-sub" : ""}" href="#archive-${m.id}" data-id="${m.id}">
      <span class="ix-no">${m.no}</span>
      <span class="ix-name">${sub ? `<span class="ix-branch" aria-hidden="true"></span>` : ""}${esc(m.name)}${m.community ? ` <span class="tag-community">Community</span>` : ""}</span>
      <span class="ix-lang">${esc(behaviour(m) || "Not recorded")}</span>
      <span class="ix-id">${m.identity ? esc(m.identity.name) : `<span class="muted">Not written</span>`}</span>
      <span class="ix-st">${m.community ? "Not verified" : gaps.length ? `In progress` : "Complete"}</span>
    </a>`;
  };
  let html = "", lastHead = null;
  roots.forEach((m, i) => {
    const head = archiveSort === "name" ? m.name[0].toUpperCase() : archiveSort === "behaviour" ? (behaviour(m) || "Behaviour not recorded") : null;
    if (head !== null && head !== lastHead) { html += `<div class="ix-head">${esc(head)}</div>`; lastHead = head; }
    html += `<div class="ix-group" style="--i:${Math.min(i, 14)}">${row(m)}${kids(m.id).sort(by).map(k => row(k, true)).join("")}</div>`;
  });
  return `<div class="ix-cols label" aria-hidden="true"><span>No.</span><span>Name</span><span>Behaviour</span><span>Institute's entry</span><span>Record</span></div>${html}`;
}

const progressRow = m => `<a class="prog" href="#archive-${m.id}" data-id="${m.id}">
  <span class="prog-img">${m.photo ? specimenArt(m) : ""}</span>
  <span class="prog-no">${m.no}</span><span class="prog-name">${esc(m.name)}</span>
  <span class="prog-gaps">Missing: ${esc(recordGaps(m).join(", ").toLowerCase())}</span>
</a>`;

async function archive() {
  await loadMaterials();
  const list = allMaterials();
  const done = list.filter(isComplete), wip = list.filter(m => !m.community && !isComplete(m)), comm = list.filter(m => m.community);
  const facet = (name, opts, cur, labelId, label) => `<div class="facet" role="group" aria-labelledby="${labelId}"><span class="label facet-label" id="${labelId}">${label}</span>${opts.map(([k, l]) => `<button class="chip" type="button" data-f="${name}" data-v="${k}" aria-pressed="${k === cur}">${l}</button>`).join("")}</div>`;
  main.innerHTML = `
  <div class="wrap page">
    <div class="page-head">
      <div><h1>Archive</h1><p>The founding collection: ${done.length} complete records and ${wip.length} still in progress.${comm.length ? ` ${comm.length} community ${comm.length === 1 ? "submission" : "submissions"}.` : ""}</p></div>
      <div class="seg view-seg" role="group" aria-label="View">${[["grid", "Specimens"], ["index", "Index"]].map(([k, l]) => `<button type="button" data-view="${k}" aria-pressed="${k === archiveView}">${l}</button>`).join("")}</div>
    </div>
    <div class="facets">
      ${facet("return", RETURNS, fReturn, "f-ret", "Return behaviour")}
      ${facet("time", TIMES, fTime, "f-time", "Response time")}
      <details class="facet-help"><summary>What does response time measure?</summary>
        <p>How soon the visible change happens: straight away under the hand (immediate), or slowly, over seconds to hours (delayed). It is the Institute's observation from the experiments, not a timed measurement. Records with no recorded behaviour only appear when both filters are set to Any.</p></details>
      <p class="facet-count label" aria-live="polite" data-count></p>
      ${archiveView === "index" ? `<div class="facet sort-row" role="group" aria-labelledby="f-sort"><span class="label facet-label" id="f-sort">Sort</span>${SORTS.map(([k, l]) => `<button class="chip" type="button" data-sort="${k}" aria-pressed="${k === archiveSort}">${l}</button>`).join("")}</div>` : ""}
    </div>
    ${archiveView === "grid" ? `
      <section aria-labelledby="h-done"><h2 class="sub arch-h" id="h-done">Complete records</h2>
        <div class="grid">${done.map(specLink).join("")}</div>
        <p class="muted none" hidden>No complete record matches both filters.</p></section>
      ${wip.length ? `<section class="arch-sec" aria-labelledby="h-wip"><h2 class="sub arch-h" id="h-wip">In progress</h2><p class="hint arch-note">Open for reading and for your own entries. Still waiting for the parts listed.</p>
        <div class="progs">${wip.map(progressRow).join("")}</div><p class="muted none" hidden>No record in progress matches both filters.</p></section>` : ""}
      ${comm.length ? `<section class="arch-sec" aria-labelledby="h-comm"><h2 class="sub arch-h" id="h-comm">Community submissions</h2><p class="hint arch-note">Registered by contributors. Not verified by the Institute.</p>
        <div class="grid">${comm.map(specLink).join("")}</div><p class="muted none" hidden>No community submission matches both filters.</p></section>` : ""}`
    : `<div class="index">${indexList(list)}</div>`}
    <div class="contribute">
      <div><h2 class="sub">Know a material that should be here?</h2><p class="muted">Register it as a community submission. It is labelled as not verified until the Institute documents it.</p></div>
      <button class="btn" type="button" data-add>Register a material</button>
    </div>
  </div>`;
  const apply = () => {
    let shown = 0;
    $$(".spec[data-id], .ix[data-id], .prog[data-id]", main).forEach(s => { const ok = matches(byId(s.dataset.id) || {}); s.classList.toggle("hide", !ok); if (ok) shown++; });
    $$(".ix-group", main).forEach(g => g.classList.toggle("hide", !$(".ix:not(.hide)", g)));
    $$(".ix-head", main).forEach(h => { let n = h.nextElementSibling, any = false; while (n && !n.classList.contains("ix-head")) { if (!n.classList.contains("hide")) any = true; n = n.nextElementSibling; } h.classList.toggle("hide", !any); });
    $$("section", main).forEach(sec => { const none = $(".none", sec); if (none) none.hidden = !!$("[data-id]:not(.hide)", sec); });
    const filtering = fReturn !== "any" || fTime !== "any";
    const unrec = list.filter(m => !m.speed || !m.after).length;
    $("[data-count]", main).innerHTML = filtering ? `Showing ${shown} of ${list.length}${unrec ? ` · ${unrec} without recorded behaviour hidden` : ""} · <button class="link" type="button" data-clear>Clear filters</button>` : `${list.length} records`;
    $("[data-clear]", main)?.addEventListener("click", () => { fReturn = fTime = "any"; $$("[data-f]", main).forEach(x => x.setAttribute("aria-pressed", String(x.dataset.v === "any"))); reorder(apply); });
  };
  // indexing: items glide to their new places
  const reorder = fn => {
    const items = $$(".grid > .spec, .ix-group, .progs > .prog", main);
    items.forEach((s, i) => { s.style.viewTransitionName = "s" + i; });
    const t = transition(fn);
    const clear = () => items.forEach(s => { s.style.viewTransitionName = ""; });
    t ? t.finished.finally(clear) : clear();
  };
  apply();
  $$("[data-f]", main).forEach(b => b.addEventListener("click", () => {
    const dim = b.dataset.f, v = b.dataset.v;
    if ((dim === "return" ? fReturn : fTime) === v) return;
    reorder(() => { if (dim === "return") fReturn = v; else fTime = v; $$(`[data-f="${dim}"]`, main).forEach(x => x.setAttribute("aria-pressed", String(x === b))); apply(); });
  }));
  $$("[data-sort]", main).forEach(b => b.addEventListener("click", () => {
    if (b.dataset.sort === archiveSort) return;
    archiveSort = b.dataset.sort;
    transition(() => { $(".index", main).innerHTML = indexList(list); $$("[data-sort]", main).forEach(x => x.setAttribute("aria-pressed", String(x === b))); apply(); });
  }));
  $$("[data-view]", main).forEach(b => b.addEventListener("click", () => {
    if (b.dataset.view === archiveView) return;
    archiveView = b.dataset.view; try { localStorage.setItem("iam.view", archiveView); } catch { }
    transition(() => render());
  }));
  $$("[data-add]", main).forEach(b => b.addEventListener("click", registerMaterial));
}

// similar names already in the archive (to avoid duplicate records)
const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/(es|s)$/, "");
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const similarTo = name => {
  const n = norm(name); if (!n) return [];
  return allMaterials().filter(m => { const k = norm(m.name); return k === n || k.includes(n) || n.includes(k) || n.split(" ").some(w => w.length > 2 && k.split(" ").includes(w)) || lev(k, n) <= 2; });
};

// registration: one question at a time, with a duplicate check and an optional parent material
function registerMaterial() {
  if (store.mode() === "guest") return authPanel({ view: "signin", reason: "Registering a material needs a contributor account, so each record has someone who can correct or remove it." });
  const d = { name: "", note: "", parent: "" };
  let step = 0, similar = [];
  panel("Register a material", (body, close) => {
    const view = () => {
      const back = step > 0 ? `<button class="btn btn-quiet btn-small" type="button" data-back style="justify-self:start">← Back</button>` : "";
      let html = "";
      if (step === 0) html = `<span class="label">Register a material</span><h2>What is it called?</h2>
        <p class="hint">A material, or a specific variety of one.</p>
        <input class="answer" id="q" maxlength="40" autocomplete="off" placeholder="e.g. Blood Orange" value="${esc(d.name)}">
        <div class="step-actions"><button class="btn btn-primary" type="submit" ${d.name.trim() ? "" : "disabled"}>Next</button></div>`;
      if (step === 1) html = `<span class="label">${esc(d.name)}</span><h2>Is it already here?</h2>
        <p class="hint">Similar records in the archive.</p>
        <div class="choice">${similar.map(m => `<a class="choice-link" href="#archive-${m.id}" data-close><span class="no">${m.no}</span> ${esc(m.name)}<small>${kindLabel(m)}</small></a>`).join("")}</div>
        <div class="step-actions"><button class="btn btn-primary" type="submit">No, register it</button></div>`;
      if (step === 2) html = `<span class="label">${esc(d.name)}</span><h2>Is it a variety of an existing material?</h2>
        <p class="hint">For example, Blood Orange under Orange.</p>
        <select class="input" id="parent"><option value="">No, a new material</option>${allMaterials().map(m => `<option value="${m.id}" ${d.parent === m.id ? "selected" : ""}>${m.no} ${esc(m.name)}</option>`).join("")}</select>
        <div class="step-actions"><button class="btn btn-primary" type="submit">Next</button></div>`;
      if (step === 3) html = `<span class="label">${esc(d.name)}</span><h2>What happens when you press it?</h2>
        <p class="hint">Only what you see or feel. Optional.</p>
        <input class="answer" id="q" maxlength="160" autocomplete="off" placeholder="It squashes, then slowly rises." value="${esc(d.note)}">
        <div class="step-actions"><button class="btn btn-primary" type="submit">Next</button></div>`;
      if (step === 4) html = `<span class="label">${esc(d.name)}${d.parent ? ` · variety of ${esc(byId(d.parent).name)}` : ""}</span><h2>Add it to the archive?</h2>
        <p class="hint">It joins as a community submission. It is not verified evidence.</p>
        ${store.online() ? "" : `<p class="notice">The shared archive is not connected yet, so it stays on this device for now.</p>`}
        <div class="step-actions"><button class="btn btn-primary" type="submit">Register</button></div>`;
      body.innerHTML = `<form class="step" novalidate>${back}${html}</form>`;
      const form = $("form", body);
      const q = $("#q", form);
      if (q) { q.focus({ preventScroll: true }); q.addEventListener("input", () => { if (step === 0) { d.name = q.value; $("button[type=submit]", form).disabled = !d.name.trim(); } else d.note = q.value; }); }
      $("#parent", form)?.addEventListener("change", e => { d.parent = e.target.value; });
      $("[data-back]", form)?.addEventListener("click", () => { step = step === 2 && !similar.length ? 0 : step - 1; view(); });
      form.addEventListener("submit", async e => {
        e.preventDefault();
        if (step === 0) { if (!d.name.trim()) return; similar = similarTo(d.name); step = similar.length ? 1 : 2; return view(); }
        if (step < 4) { step++; return view(); }
        const btn = $("button[type=submit]", form); btn.disabled = true;
        try {
          const row = await store.addMaterial({ name: d.name, note: d.note, parent: d.parent });
          close(); toast("Registered as a community submission");
          location.hash = "#archive-" + row.id;
        } catch (err) { console.error(err); btn.disabled = false; toast("Could not register it. Please try again."); }
      });
    };
    view();
  });
}

// ---------- MATERIAL CASE FILE ----------
const dl = rows => `<dl class="dict">${rows.filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;

// the research record, behind a disclosure: observation, classification, specimen, experiments, the Institute's sources
function fullRecord(m) {
  const sp = m.specimen;
  const words = (m.words || []).map(w => LANGUAGE[w]);
  const children = allMaterials().filter(x => x.parent === m.id);
  const obs = `<div class="rec-block">
      <span class="kind kind-obs">Physical observation${m.community ? " · community submission, not verified" : " · recorded by the Institute"}</span>
      ${m.def ? `<p>${esc(m.def)}</p>` : m.community && m.note ? `<p>${esc(m.note)}</p>` : missing("No observation written yet.")}
      ${dl([
        ["Physical characteristics", esc(m.traits)],
        ["Material language", words.length ? words.map(w => `<span class="mword">${w.word}</span> <span class="muted">${esc(w.physical)}</span>`).join("<br>") : ""],
        ["Behaviour", m.speed ? `${esc(behaviour(m))}${matrix(m)}` : ""],
        ["Mode of change", esc(m.mode)],
        ["Record", m.community ? "" : esc(m.note)],
        ["Registered varieties", children.length ? children.map(c => `<a class="ulink" href="#archive-${c.id}">${esc(c.name)}</a>`).join(", ") : ""],
        ["Variety of", m.parent && byId(m.parent) ? `<a class="ulink" href="#archive-${m.parent}">${esc(byId(m.parent).name)}</a>` : ""]
      ])}
    </div>`;
  const cls = `<div class="rec-block">
      <span class="kind kind-obs">Classification</span>
      ${dl([["Collection", esc(collectionOf(m))], ["Physical structure", esc(m.structure) || `<span class="muted">Not recorded</span>`], ["Composition", sp ? esc(sp.composition) : `<span class="muted">Not recorded</span>`], ["Botanical group", esc(m.botanical)]])}
    </div>`;
  if (m.community) return obs + cls;
  const spec = `<div class="rec-block">
      <span class="kind kind-obs">Specimen${sp ? " · " + esc(sp.name) : ""}</span>
      ${sp ? dl([["Variety", esc(sp.variety)], ["Specimen part", esc(sp.part)], ["Condition", esc(sp.condition)], ["Preparation", esc(sp.preparation)]]) : missing()}
    </div>`;
  const exps = `<div class="rec-block">
      <span class="kind kind-obs">Experiment records</span>
      ${m.experiments.length ? m.experiments.map(x => dl([["Experiment", `${m.no} / ${x.id} · ${esc(x.type)}`], ["Date", esc(x.date)], ["Context", esc(x.context)]])).join("") + dl([["Documentation", m.media.length ? `${m.media.length} video${m.media.length > 1 ? "s" : ""}` : "None filed yet"]])
        : missing("No experiment record yet.")}
    </div>`;
  const ints = `<div class="rec-block">
      <span class="kind kind-int">The Institute's Dictionary · sources</span>
      ${m.identity || words.length ? dl([
        ["Entry", m.identity ? `<span class="accent">${esc(m.identity.name)}</span>` : ""],
        ...words.map(w => [`${w.word}, in human terms`, esc(w.human)]),
        ...words.map(w => [`${w.word}, imagined voice`, `<span class="voice">${esc(w.voice)}</span>`]),
        ["Source", m.identity ? `Identity card ${m.identity.card}` : ""]
      ]) : missing("No Institute entry yet.")}
    </div>`;
  return obs + cls + spec + exps + ints;
}

// how it changes: three stills from a real video, then the video itself; a short status line when nothing is filmed
function documentation(m) {
  if (!m.media.length) {
    const x = (m.experiments || []).find(e => e.date && e.date !== "Not recorded") || (m.experiments || [])[0];
    return `<p class="status-line"><span class="dot" aria-hidden="true"></span>No experiment footage filed yet.${x ? ` Recorded: ${esc(x.type.toLowerCase())}, ${esc(x.context.toLowerCase())}${x.date && x.date !== "Not recorded" ? `, ${esc(x.date)}` : ""}.` : ""}</p>`;
  }
  return `<div class="doc">
    <div data-seq></div>
    <div class="doc-view" id="doc-view"></div>
    ${m.media.length > 1 ? `<div class="doc-tabs" role="tablist">${m.media.map((x, i) => `<button class="chip" type="button" role="tab" data-doc="${i}" aria-pressed="${i === 0}">${esc(x.caption || "Video " + (i + 1))}</button>`).join("")}</div>` : ""}
  </div>`;
}
const clock = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
function showDoc(m, i) {
  const x = m.media[i], view = $("#doc-view", main); if (!x || !view) return;
  const seq = $("[data-seq]", main);
  if (seq) seq.innerHTML = x.sequence ? `<ol class="seq" aria-label="Before, during and after pressure">${x.sequence.map((s, k) => `<li style="--i:${k}">
      <button type="button" class="seq-img" data-seek="${s.t}" aria-label="${esc(s.label)}, play from ${clock(s.t)}"><img src="${esc(s.src)}" alt="${esc(m.name)}, ${esc(s.label.toLowerCase())}" loading="lazy"></button>
      <span class="seq-cap"><strong>${esc(s.label)}</strong><span>${clock(s.t)}</span></span></li>`).join("")}</ol>
    <p class="hint seq-note">Stills from the ${esc(x.caption)} video. Hand and camera position can differ between frames.</p>` : "";
  view.innerHTML = `<div class="doc-video"><video src="${esc(x.src)}" ${x.poster ? `poster="${esc(x.poster)}"` : ""} controls loop muted playsinline preload="metadata" aria-label="${esc(m.name)}, ${esc(x.caption)}"></video>
      ${x.chapters ? `<div class="doc-chapters" role="group" aria-label="Jump to action">${x.chapters.map(([l, t], i) => `<button type="button" class="chip" data-seek="${t}" data-ch="${i}">${String(i + 1).padStart(2, "0")} ${esc(l)}</button>`).join("")}<span class="label doc-cap">${esc(x.caption || "")}</span></div>` : ""}</div>`;
  const vid = $("video", view);
  $$("[data-seek]", main).forEach(b => b.addEventListener("click", () => { vid.currentTime = Number(b.dataset.seek); vid.play().catch(() => { }); if (b.closest(".seq")) vid.scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" }); }));
  if (x.chapters) {
    const chips = $$("[data-ch]", view);
    // the action being shown is marked as the video plays
    vid.addEventListener("timeupdate", () => { let k = 0; x.chapters.forEach(([, t], i) => { if (vid.currentTime >= t) k = i; }); chips.forEach((b, i) => b.setAttribute("aria-pressed", String(i === k))); });
  }
  $$("[data-doc]", main).forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.doc) === i)));
}

const institute = m => m.identity
  ? `<section class="dict-entry inst" aria-labelledby="inst-h">
      <span class="kind kind-int" id="inst-h">The Institute's Dictionary</span>
      <div class="de-head"><span class="de-word">${esc(m.identity.name)}</span><span class="de-mat">No. ${m.no} · ${esc(m.name)}</span></div>
      <dl class="de-meta"><div><dt>Interpretive connection</dt><dd>${esc(m.identity.note)}</dd></div></dl>
      <p class="de-foot">An authored interpretation, not a fact about the material. Yours may adopt it, extend it, reinterpret it, or disagree.</p>
    </section>`
  : `<section class="dict-entry inst empty" aria-labelledby="inst-h"><span class="kind kind-int" id="inst-h">The Institute's Dictionary</span><p>The Institute has not written an entry for ${esc(m.name)} yet. Yours can be the first reading.</p></section>`;

async function detail(id) {
  if (!byId(id)) await loadMaterials();
  const m = byId(id);
  if (!m) { main.innerHTML = notFound(); return; }
  const others = await othersOf(m.id);
  const mine = myEntriesFor(m.id);
  const open = mine.length > 0 || isRevealed(m.id);
  const gaps = recordGaps(m);
  const draft = loadDraft(m.id);
  const obsText = m.response || (m.community && m.note) || "";
  main.innerHTML = `
  <div class="wrap page">
    <a class="back" href="#archive" data-from="${m.id}">← Archive</a>
    <div class="detail">
      <div class="stage-col">
        <div class="img stage">${stage(m, { large: true })}<span class="stage-id">No. ${m.no}</span>${m.photo ? `<button class="zoom" type="button" data-zoom aria-label="Inspect image">Inspect</button>` : ""}</div>
        ${m.refImage ? `<p class="stage-note">Reference image, not a specimen photograph.</p>` : ""}
      </div>
      <div class="detail-info">
        <div><span class="label">${esc(collectionOf(m))}</span><h1>${esc(m.name)}</h1>${m.type ? `<p class="muted">${esc(m.type)}</p>` : ""}</div>
        ${gaps.length ? `<p class="status-line"><span class="dot" aria-hidden="true"></span>Record in progress. Missing: ${esc(gaps.join(", ").toLowerCase())}.</p>` : ""}
        <section class="obs-block" aria-labelledby="obs-h">
          <span class="kind kind-obs" id="obs-h">Physical behaviour${m.responseExpected ? " · partly expected, not yet observed" : ""}${m.community ? " · not verified" : ""}</span>
          ${obsText ? `<p>${esc(obsText)}</p>` : missing("No observation written yet.")}
          ${m.speed && m.after ? `<p class="beh"><span>${esc(AFTERS[m.after])}</span><span>${esc(SPEEDS[m.speed])}</span></p>` : ""}
        </section>
        ${m.community ? "" : institute(m)}
        <div class="cta">
          <button class="btn btn-primary" type="button" data-add-meaning>${draft ? "Continue your entry" : "Write your own entry"}</button>
          <p class="hint">${draft ? "Your unfinished draft is kept in this browser." : "Agree with the Institute, adapt it, or say something else. Every reading is equally valid."}</p>
        </div>
        <button class="record-toggle" type="button" aria-expanded="false" aria-controls="record">Research record <span class="chev" aria-hidden="true">+</span></button>
        <div class="record" id="record"><div><div class="record-inner">${fullRecord(m)}</div></div></div>
        <section class="interview" id="interview" aria-label="Your dictionary entry" hidden></section>
      </div>
    </div>

    <section class="section" aria-labelledby="change-h">
      <div class="section-head"><h2 class="sub" id="change-h">How it changes</h2><span class="kind kind-obs">Documented observation</span></div>
      ${documentation(m)}
    </section>

    <section class="section" id="meanings" aria-labelledby="meanings-h">
      <div class="carousel-head">
        <div><h2 class="sub" id="meanings-h">Visitors' entries</h2><span class="kind kind-int">Personal readings, shared by choice</span></div>
        ${open && others.length > 1 ? `<div class="carousel-nav"><button type="button" data-scroll="-1" aria-label="Previous">←</button><button type="button" data-scroll="1" aria-label="Next">→</button></div>` : ""}
      </div>
      ${open ? `
        ${mine.length ? `<div class="compare"><span class="label">Yours</span>${mine.map(e => `<span class="your-word">${e.revisions && e.revisions.length ? `<s>${esc(e.meaning)}</s> ` : ""}${esc(latestMeaning(e))}</span>`).join("")}<button class="link" type="button" data-changed="${mine[0].id}">Has your reading changed?</button></div>` : ""}
        ${others.length ? `<div class="carousel" tabindex="0" aria-label="Visitors' entries">${others.map(icard).join("")}</div>` : `<p class="muted">Nobody else has shared an entry yet.</p>`}`
      : `<div class="locked">
          <p>Write your own entry first, so other readings do not steer yours.</p>
          <p class="label">${others.length ? `${others.length} other ${others.length > 1 ? "entries" : "entry"} waiting` : "Nobody else has shared one yet"}</p>
          <div class="row"><button class="btn btn-primary btn-small" type="button" data-add-meaning>${draft ? "Continue your entry" : "Write your own entry"}</button><button class="btn btn-quiet btn-small" type="button" data-reveal>Show them anyway</button></div>
        </div>`}
    </section>
  </div>`;

  const toggle = $(".record-toggle", main), rec = $("#record", main);
  toggle.addEventListener("click", () => {
    const o = !rec.classList.contains("open");
    rec.classList.toggle("open", o); toggle.setAttribute("aria-expanded", String(o));
  });
  if (m.media.length) { showDoc(m, 0); $$("[data-doc]", main).forEach(b => b.addEventListener("click", () => showDoc(m, Number(b.dataset.doc)))); }
  $("[data-zoom]", main)?.addEventListener("click", () => inspect(m.cutout ? `assets/materials/${m.id}-cut.png` : `assets/materials/${m.id}.jpg`, m.name));
  others.forEach(r => { const el = $(`[data-cardfig="${CSS.escape(String(r.id))}"]`, main); if (el) mountPlayer(el, r.body); });
  $$("[data-card]", main).forEach(c => c.addEventListener("click", () => {
    const r = others.find(x => String(x.id) === c.dataset.card);
    hasBody(r) ? reinterpret(r) : expand(r);
  }));
  $$("[data-scroll]", main).forEach(b => b.addEventListener("click", () => {
    const c = $(".carousel", main); c.scrollBy({ left: Number(b.dataset.scroll) * (c.clientWidth * .8), behavior: calm() ? "auto" : "smooth" });
  }));
  $$("[data-add-meaning]", main).forEach(b => b.addEventListener("click", () => interview(m)));
  // continue straight into the comparison after signing in, or reopen an unfinished interview
  let cmp = null, resume = null;
  try { cmp = sessionStorage.getItem("iam.compare"); sessionStorage.removeItem("iam.compare"); resume = sessionStorage.getItem("iam.resume"); sessionStorage.removeItem("iam.resume"); } catch { }
  const filed = cmp && store.getMine(cmp);
  if (filed && canonical(filed.material_id) === m.id) interview(m, { compareWith: filed });
  else if (resume === m.id) interview(m);
  $("[data-reveal]", main)?.addEventListener("click", () => { setRevealed(m.id); render().then(() => $("#meanings")?.scrollIntoView({ behavior: calm() ? "auto" : "smooth" })); });
  $("[data-changed]", main)?.addEventListener("click", e => { const en = store.getMine(e.currentTarget.dataset.changed); if (en) revise(en); });
}

// one card per person; a card with a body hides its meaning until you guess
function icard(r) {
  const revs = r.revisions || [];
  const by = `<span class="by"><span>${esc(r.alias || "Anonymous")}</span><span>${r.demo ? "Not evidence" : fmtDate(r.created_at)}</span></span>`;
  if (hasBody(r)) return `<button class="icard" type="button" data-card="${esc(r.id)}">
    <div class="fig" data-cardfig="${esc(r.id)}"></div>
    <span class="preview">What do you think this movement means?</span>${by}</button>`;
  return `<button class="icard" type="button" data-card="${esc(r.id)}">
    <div>${revs.length ? `<span class="old">${esc(r.meaning)}</span><br>` : ""}<span class="word">${esc(latestMeaning(r))}</span></div>
    <span class="preview">${esc(r.meaning_note || r.voice || "Open to read more.")}</span>${by}</button>`;
}

function entryHTML(r) {
  const revs = r.revisions || [];
  return `
    <span class="kind kind-int">${r.demo ? "Demo entry · not research evidence" : "Visitor's entry"} · ${esc(r.alias || "Anonymous")}${r.demo ? "" : " · " + fmtDate(r.created_at)}</span>
    ${revs.length ? `<div style="margin-top:14px"><span class="label">First meaning</span><p style="text-decoration:line-through;color:var(--muted)">${esc(r.meaning)}</p></div>
      ${revs.map(v => `<div style="margin-top:10px"><span class="label">Revised${r.demo ? "" : " · " + fmtDate(v.at)}</span><p class="word">${esc(v.meaning)}</p>${v.note ? `<p class="muted">${esc(v.note)}</p>` : ""}</div>`).join("")}`
      : `<p class="word" style="margin-top:12px">${esc(r.meaning)}</p>`}
    ${r.meaning_note ? `<p style="margin-top:12px">${esc(r.meaning_note)}</p>` : ""}
    ${relationLine((r.observe || {}).relation, byId(r.material_id)) ? `<p class="muted" style="margin-top:12px">${relationLine(r.observe.relation, byId(r.material_id))}</p>` : ""}
    ${r.voice ? `<p style="margin-top:12px"><span class="label">Imagined voice</span><br><span class="voice">${esc(r.voice)}</span></p>` : ""}
    ${r.own_body_note ? `<p style="margin-top:12px"><span class="label">Became it</span><br>${esc(r.own_body_note)}</p>` : ""}`;
}

function expand(r) {
  if (!r) return;
  modal(`<div class="unfold">${entryHTML(r)}${hasBody(r) ? `<div class="rec-fig" id="ex-fig" style="margin-top:16px"></div>` : ""}</div>`, box => {
    if (hasBody(r)) mountPlayer($("#ex-fig", box), r.body, { trails: true });
  });
}

// interpret someone else's movement: guess first, then see their intention side by side
function reinterpret(entry) {
  if (!entry) return;
  modal(`
    <h2>What do you think this movement means?</h2>
    <p class="muted">${entry.demo ? "Demo movement, not research evidence. " : ""}Guess first. Then see what it meant.</p>
    <div class="reveal" style="align-items:start">
      <div class="figure-mini" id="ri-fig"></div>
      <form id="ri-form" style="display:grid;gap:14px;align-content:center">
        <label class="visually-hidden" for="ri-text">Your guess</label>
        <input id="ri-text" class="input" maxlength="80" required placeholder="It means…" autocomplete="off">
        <div class="row"><button class="btn btn-primary" type="submit">Reveal</button><button class="btn btn-quiet" type="button" data-skip>Just show me</button></div>
      </form>
    </div>
    <div id="ri-reveal"></div>`, box => {
    mountPlayer($("#ri-fig", box), entry.body, { trails: true });
    const show = async text => {
      $$("#ri-form button", box).forEach(b => { b.disabled = true; });
      let others = [];
      if (text) {
        try { await store.addReading(entry.id, text); } catch (e) { console.error(e); }
        try { others = (await store.readingsFor([entry.id])).filter(r => r.text !== text).slice(0, 8); } catch { }
      }
      $("#ri-reveal", box).innerHTML = `
        <div class="reveal">
          ${text ? `<div class="card unfold"><span class="label">You read</span><p class="word">${esc(text)}</p></div>` : ""}
          <div class="card theirs unfold" style="animation-delay:.2s;${text ? "" : "grid-column:1/-1"}">${entryHTML(entry)}</div>
        </div>
        ${others.length ? `<p class="label" style="margin-top:18px">Others read: ${others.map(o => esc(o.text)).join(" · ")}</p>` : ""}`;
    };
    $("#ri-form", box).addEventListener("submit", ev => { ev.preventDefault(); const t = $("#ri-text", box).value.trim(); if (t) show(t); });
    $("[data-skip]", box).addEventListener("click", () => show(""));
  }, null, { wide: true });
}

// Your dictionary entry, as a little interview: notice, associate, imagine, name. Observe first, interpret later, compare last.
const STAGES = [["notice", "Notice"], ["associate", "Associate"], ["imagine", "Imagine"], ["name", "Name"]];
const draftKey = id => "iam.interview." + id;
const loadDraft = id => { try { return JSON.parse(localStorage.getItem(draftKey(id))) || null; } catch { return null; } };
const saveDraft = (id, d) => { try { localStorage.setItem(draftKey(id), JSON.stringify(d)); } catch { } };
const dropDraft = id => { try { localStorage.removeItem(draftKey(id)); } catch { } };
// unfinished interviews kept in this browser
const browserDrafts = () => allMaterials().map(m => [m, loadDraft(m.id)]).filter(([, d]) => d && d.started);
// the Institute's recorded observation, one sentence per option, without restating it
const noticeable = m => {
  const text = m.response || (m.community ? m.note : "") || "";
  const out = text.split(/(?<=\.)\s+/).map(t => t.trim().replace(/\.$/, "")).filter(Boolean);
  if (!out.length && m.mode) out.push(m.mode);
  return [...new Set(out)];
};

function interview(m, { compareWith = null } = {}) {
  const box = $("#interview", main), info = $(".detail-info", main);
  if (!box) return;
  const fresh = { started: false, step: 0, far: 0, noticed: [], noticeNote: "", associate: "", voice: "", title: "", relation: "" };
  const prior = loadDraft(m.id);
  let d = { ...fresh, ...(prior || {}) };
  if (prior && !("started" in prior)) d.started = true;
  let saved = compareWith, view = compareWith ? "compare" : !d.started ? "intro" : d.step >= 4 ? "preview" : "ask";
  const keep = () => { d.far = Math.max(d.far || 0, Math.min(d.step, 3)); saveDraft(m.id, d); };
  const reg = `<svg class="iv-reg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".6" vector-effect="non-scaling-stroke"><path class="draw" pathLength="1" d="M0 8 V0 H8"/><path class="draw" pathLength="1" d="M92 0 H100 V8"/><path class="draw" pathLength="1" d="M0 92 V100 H8"/><path class="draw" pathLength="1" d="M92 100 H100 V92"/></g></svg>`;
  const track = () => `<ol class="iv-track" aria-label="Progress">${STAGES.map(([k, l], i) => `<li class="${i < d.step || (i <= (d.far || 0) && i !== d.step) || view !== "ask" ? "done" : ""} ${i === d.step && view === "ask" ? "now" : ""}"><button type="button" data-goto="${i}" ${i <= Math.max(d.step, d.far || 0) ? "" : "disabled"} ${i === d.step && view === "ask" ? `aria-current="step"` : ""}><span>0${i + 1}</span><em>${l}${k === "imagine" ? " (optional)" : ""}</em></button></li>`).join("")}</ol>`;
  const head = `<div class="iv-head"><span class="iv-thumb" aria-hidden="true">${specimenArt(m)}</span><span class="label">Your dictionary entry · No. ${m.no} ${esc(m.name)}</span><button class="link iv-close" type="button" data-iv-close>Close</button></div>`;
  const entry = () => ({ material_id: m.id, alias: "", observe: { noticed: d.noticed, note: d.noticeNote.trim(), relation: d.relation || "" }, meaning: d.title.trim(), meaning_note: d.associate.trim(), voice: d.voice.trim().replace(/^["“]|["”]$/g, ""), body: null, own_body_note: "" });

  const draw = (dir = 1) => {
    let html = "";
    if (view === "intro") {
      html = `${head}<div class="iv-q" data-dir="1">
        <h2 id="iv-h">Write ${esc(m.name)} into your own dictionary</h2>
        <p>You will create one entry: <strong>your name for this material</strong>, and a few words on why. Four short steps:</p>
        <ol class="iv-steps">
          <li><strong>Notice</strong> what it physically does.</li>
          <li><strong>Associate</strong> it with a feeling, memory or situation.</li>
          <li><strong>Imagine</strong> what it might say. Optional.</li>
          <li><strong>Name</strong> it. You can adopt the Institute's reading, adapt it, or choose something different.</li>
        </ol>
        <p class="hint">Any step except the name can be skipped. Your answers are kept in this browser as you go. Nothing is shared unless you choose to share it later.</p>
        <div class="iv-actions"><span></span><button class="btn btn-primary btn-small" type="button" data-begin>Begin</button></div>
      </div>`;
    }
    if (view === "ask") {
      const st = STAGES[d.step][0];
      let q = "";
      if (st === "notice") {
        const opts = noticeable(m);
        q = `<h2 id="iv-h">What do you notice it doing?</h2>
          ${opts.length ? `<fieldset class="iv-set"><legend class="label">Recorded by the Institute · choose any you also notice</legend>
            <div class="iv-notes">${opts.map(o => `<button type="button" class="iv-note" aria-pressed="${d.noticed.includes(o)}" data-note="${esc(o)}">${esc(o)}</button>`).join("")}</div></fieldset>`
          : `<p class="hint">The Institute has not recorded an observation for this material yet.</p>`}
          <label class="label iv-own" for="q">Your own observation${opts.length ? ", in your words" : ""}</label>
          <textarea class="answer area small" id="q" rows="2" maxlength="200" placeholder="What I see or feel">${esc(d.noticeNote)}</textarea>`;
      }
      if (st === "associate") q = `<h2 id="iv-h">What does that bring to mind?</h2><p class="hint" id="iv-hint">A feeling, a memory, a situation. This becomes the explanation in your entry.</p>
          <textarea class="answer area" id="q" rows="3" maxlength="400" aria-labelledby="iv-h" aria-describedby="iv-hint">${esc(d.associate)}</textarea>`;
      if (st === "imagine") q = `<h2 id="iv-h">If this material could speak, what might it say?</h2><p class="hint" id="iv-hint">An imagined voice, not a claim that materials think or feel. Optional.</p>
          <input class="answer" id="q" maxlength="200" autocomplete="off" placeholder="“…”" value="${esc(d.voice)}" aria-labelledby="iv-h" aria-describedby="iv-hint">`;
      if (st === "name") q = `<h2 id="iv-h">What would you call it?</h2>
          ${m.identity ? `<div class="iv-inst"><span class="label">The Institute's entry</span><span class="iv-inst-word">${esc(m.identity.name)}</span><span class="muted">${esc(m.identity.note)}</span></div>
            <fieldset class="iv-set"><legend class="label">Your entry and the Institute's · optional</legend>
              <div class="iv-rel">${Object.entries(RELATIONS).map(([k, [l]]) => `<button type="button" class="iv-note" data-rel="${k}" aria-pressed="${d.relation === k}">${l}</button>`).join("")}</div></fieldset>` : `<p class="hint">The Institute has no entry for this material yet, so yours starts fresh.</p>`}
          <label class="label iv-own" for="q">Your name for ${esc(m.name)}</label>
          <input class="answer" id="q" maxlength="80" autocomplete="off" value="${esc(d.title)}" aria-describedby="iv-hint">
          <p class="hint" id="iv-hint">A word or a short phrase. It becomes the headword of your entry.</p>`;
      html = `${head}${track()}<form class="iv-q" data-dir="${dir}" novalidate aria-labelledby="iv-h">${q}
        <div class="iv-actions">
          ${d.step > 0 ? `<button class="btn btn-quiet btn-small" type="button" data-back>← Back</button>` : `<span></span>`}
          <span class="row">${st !== "name" ? `<button class="btn btn-quiet btn-small" type="button" data-skip>Skip</button>` : ""}<button class="btn btn-primary btn-small" type="submit" ${st === "name" && !d.title.trim() ? "disabled" : ""}>${st === "name" ? "Review your entry" : "Next"}</button></span>
        </div></form>`;
    }
    if (view === "preview") {
      const edit = (step, what) => `<button class="link de-edit" type="button" data-goto="${step}" aria-label="Edit ${what}">Edit</button>`;
      const noticed = [...d.noticed, d.noticeNote.trim()].filter(Boolean).join(" · ");
      html = `${head}${track()}<div class="iv-q" data-dir="${dir}">
        <h2 id="iv-h">Review your entry</h2>
        <article class="dict-entry draft">
          <span class="label">Draft · not saved yet</span>
          <div class="de-head"><span class="de-word">${esc(d.title)}</span><span class="de-mat">No. ${m.no} · ${esc(m.name)}</span>${edit(3, "name")}</div>
          <dl class="de-meta">
            <div><dt>Why ${edit(1, "explanation")}</dt><dd>${d.associate.trim() ? esc(d.associate) : `<span class="muted">Skipped</span>`}</dd></div>
            <div><dt>Noticed ${edit(0, "what you noticed")}</dt><dd>${noticed ? esc(noticed) : `<span class="muted">Skipped</span>`}</dd></div>
            <div><dt>Imagined voice ${edit(2, "imagined voice")}</dt><dd>${d.voice.trim() ? `<span class="voice">${esc(d.voice)}</span>` : `<span class="muted">Skipped</span>`}</dd></div>
            ${relationLine(d.relation, m) ? `<div><dt>Relation ${edit(3, "relation")}</dt><dd>${relationLine(d.relation, m)}</dd></div>` : ""}
          </dl>
        </article>
        <p class="hint">${store.canSave() ? "Saving files it privately in My Dictionary. Sharing it in the archive is a separate choice you can make later, entry by entry." : "Saving needs a free contributor account, so your entry has somewhere to live. Your draft stays in this browser until then. Entries are private unless you choose to share one."}</p>
        <div class="iv-actions"><span></span>
          <button class="btn btn-primary btn-small" type="button" data-save>${store.canSave() ? "Save to My Dictionary" : "Sign in to save"}</button></div>
      </div>`;
    }
    if (view === "compare") {
      html = `${head}<div class="iv-q" data-dir="1"><span class="label">Filed privately in My Dictionary</span><h2>Your entry, beside others</h2><div class="iv-compare" data-cmp><p class="hint">Loading…</p></div></div>`;
    }
    box.innerHTML = reg + html;
    wire();
  };

  const fillCompare = async () => {
    const el = $("[data-cmp]", box); if (!el) return;
    let others = [];
    try { others = (await othersOf(m.id)).filter(r => !r.demo); } catch { }
    const latest = latestMeaning(saved);
    const rel = relationLine((saved.observe || {}).relation, m);
    el.innerHTML = `
      <div class="cmp-row mine"><span class="label">Yours</span><span class="iv-title">${saved.revisions && saved.revisions.length ? `<s>${esc(saved.meaning)}</s> ` : ""}${esc(latest)}</span>${rel ? `<span class="muted">${rel}</span>` : ""}</div>
      <div class="cmp-row"><span class="label">The Institute's Dictionary</span>${m.identity ? `<span class="cmp-word">${esc(m.identity.name)}</span><span class="muted">${esc(m.identity.note)}</span>` : `<span class="muted">No Institute entry yet.</span>`}</div>
      <div class="cmp-row"><span class="label">Other visitors</span>${others.length ? `<span class="cmp-words">${others.slice(0, 6).map(o => `<span>${esc(latestMeaning(o))}</span>`).join("")}</span>${others.length > 6 ? `<span class="muted">and ${others.length - 6} more</span>` : ""}` : `<span class="muted">No other visitors' entries yet.</span>`}</div>
      <div class="cmp-ask">
        <h3>Would you still describe it the same way?</h3>
        <div class="row"><button class="btn btn-small" type="button" data-keep>Yes, keep it</button><button class="btn btn-small" type="button" data-revise>Add a revised entry</button><button class="btn btn-quiet btn-small" type="button" data-explore>Read other entries</button></div>
        <form class="cmp-revise" hidden><label class="label" for="rv">Your revised name</label><input class="answer" id="rv" maxlength="80" autocomplete="off" placeholder="${esc(latest)}"><label class="label" for="rvn">What changed? (optional)</label><input class="input" id="rvn" maxlength="300" autocomplete="off"><div class="row"><button class="btn btn-primary btn-small" type="submit">Save revision</button></div><p class="hint">Your first entry is kept too.</p></form>
      </div>`;
    $("[data-keep]", el).addEventListener("click", () => { toast("Kept as it is"); finish(true); });
    $("[data-explore]", el).addEventListener("click", () => finish(true));
    $("[data-revise]", el).addEventListener("click", () => { const f = $(".cmp-revise", el); f.hidden = false; $("#rv", f).focus(); });
    $(".cmp-revise", el).addEventListener("submit", async ev => {
      ev.preventDefault();
      const v = $("#rv", el).value.trim(); if (!v) return;
      const revisions = [...(saved.revisions || []), { at: new Date().toISOString(), meaning: v, note: $("#rvn", el).value.trim() }];
      try {
        saved = await store.updateMine(saved.id, { revisions });
        if (saved.shared && saved.remote_id) { try { await store.updateShared(saved.remote_id, saved); store.invalidate(); } catch (e) { console.error(e); } }
        toast("Both versions kept"); fillCompare();
      } catch (e) { console.error(e); toast("Could not save the revision. Please try again."); }
    });
  };

  const finish = reveal => {
    if (reveal) setRevealed(m.id);
    close();
    render().then(() => reveal && $("#meanings")?.scrollIntoView({ behavior: calm() ? "auto" : "smooth" }));
  };
  const close = () => { info.classList.remove("interviewing"); box.hidden = true; box.innerHTML = ""; $("[data-add-meaning]", info)?.focus({ preventScroll: true }); };

  const save = async btn => {
    if (!d.title.trim()) return;
    btn.disabled = true;
    if (!store.canSave()) {
      // all answers travel with the draft through sign in
      store.setPending({ ...entry(), at: new Date().toISOString() });
      return authPanel({ view: "signup", reason: "Your entry is kept. Create a free account or sign in, and it is filed privately in My Dictionary." });
    }
    try {
      saved = await store.addMine(entry());
      dropDraft(m.id);
      view = "compare"; draw(); fillCompare();
    } catch (e) { console.error(e); btn.disabled = false; toast("Could not save. Please try again."); }
  };

  const wire = () => {
    $("[data-iv-close]", box).addEventListener("click", close);
    $("[data-begin]", box)?.addEventListener("click", () => { d.started = true; d.step = 0; view = "ask"; keep(); draw(1); });
    $$("[data-goto]", box).forEach(b => b.addEventListener("click", () => { d.step = Number(b.dataset.goto); view = "ask"; keep(); draw(-1); }));
    const q = $("#q", box);
    if (q) {
      q.focus({ preventScroll: true });
      q.addEventListener("input", () => {
        const st = STAGES[d.step][0];
        if (st === "notice") d.noticeNote = q.value; else if (st === "associate") d.associate = q.value; else if (st === "imagine") d.voice = q.value;
        else { d.title = q.value; $("button[type=submit]", box).disabled = !d.title.trim(); }
        keep();
      });
    } else {
      const h = $("h2", box); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    }
    $$("[data-note]", box).forEach(b => b.addEventListener("click", () => {
      const v = b.dataset.note, on = !d.noticed.includes(v);
      d.noticed = on ? [...d.noticed, v] : d.noticed.filter(x => x !== v);
      b.setAttribute("aria-pressed", String(on)); keep();
    }));
    // adopting fills in the Institute's name; a different reading clears it; the visitor can still edit either
    $$("[data-rel]", box).forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.rel, on = d.relation !== k, inst = m.identity.name;
      d.relation = on ? k : "";
      if (on && (k === "adopt" || k === "adapt") && !d.title.trim()) d.title = inst;
      if (on && k === "adopt") d.title = inst;
      if (on && k === "different" && d.title.trim() === inst) d.title = "";
      $$("[data-rel]", box).forEach(x => x.setAttribute("aria-pressed", String(x.dataset.rel === d.relation)));
      if (q) { q.value = d.title; $("button[type=submit]", box).disabled = !d.title.trim(); if (k !== "adopt") q.focus(); }
      keep();
    }));
    $("[data-back]", box)?.addEventListener("click", () => { d.step--; keep(); draw(-1); });
    $("[data-skip]", box)?.addEventListener("click", () => { d.step++; keep(); draw(1); });
    $("form.iv-q", box)?.addEventListener("submit", e => {
      e.preventDefault();
      if (d.step < 3) { d.step++; keep(); return draw(1); }
      if (!d.title.trim()) return;
      d.step = 4; view = "preview"; keep(); draw(1);
    });
    $("[data-save]", box)?.addEventListener("click", e => save(e.currentTarget));
  };

  info.classList.add("interviewing"); box.hidden = false;
  draw();
  if (view === "compare") fillCompare();
  if (window.matchMedia("(max-width: 820px)").matches || box.getBoundingClientRect().top > innerHeight * .7) box.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
}

// ---------- MY DICTIONARY ----------
// a filing cabinet: one drawer tab per material, one index card per entry
const draftsList = () => {
  const ds = browserDrafts();
  return ds.length ? `<section class="drafts" aria-labelledby="drafts-h"><h2 class="sub" id="drafts-h">Unfinished entries in this browser</h2>
    <ul>${ds.map(([m, d]) => `<li><span class="no">${m.no}</span><span>${esc(m.name)}${d.title ? ` · “${esc(d.title)}”` : ""}</span><span class="muted">${d.step >= 4 ? "Ready to save" : `Step ${Math.min(d.step, 3) + 1} of 4`}</span><a class="btn btn-small" href="#archive-${m.id}" data-resume="${m.id}">Continue</a></li>`).join("")}</ul></section>` : "";
};
const sampleBlock = () => `<div class="sample-wrap"><span class="label">What an entry looks like</span>${dictEntry(SAMPLE(), { sample: true })}</div>`;

async function collection() {
  await loadMaterials();
  const mode = store.mode();
  const draft = store.pending();
  const wireResume = () => $$("[data-resume]", main).forEach(a => a.addEventListener("click", () => { try { sessionStorage.setItem("iam.resume", a.dataset.resume); } catch { } }));
  if (mode === "guest") {
    main.innerHTML = `
    <div class="wrap page">
      <div class="page-head"><div><h1>My Dictionary</h1><p>Your own entries for materials: the name you give each one, and why.</p></div></div>
      ${draft ? draftNote(draft) : ""}
      ${draftsList()}
      <div class="dict-start">
        <div class="cabinet-empty calibrate">
          ${field()}
          <div>
            <span class="label">No account needed to start</span>
            <h2>Start your first entry</h2>
            <ol class="how-steps">
              <li>Choose a material in the archive.</li>
              <li>Write your entry. Your answers are kept in this browser while you write.</li>
              <li>To save it, create a free contributor account. Entries are private by default. Sharing one in the archive is a separate choice.</li>
            </ol>
            <div class="row"><a class="btn btn-primary" href="#archive">Choose a material</a><button class="btn" type="button" data-auth="signin">Sign in</button></div>
            <p class="hint">New here? <button class="link" type="button" data-auth="signup">Create an account</button> when you are ready to save.</p>
          </div>
        </div>
        ${sampleBlock()}
      </div>
    </div>`;
    $$("[data-auth]", main).forEach(b => b.addEventListener("click", () => authPanel({ view: b.dataset.auth })));
    $("[data-discard]", main)?.addEventListener("click", async () => { if (await ask("Discard this draft?", "Discard")) { store.setPending(null); render(); } });
    wireResume();
    return;
  }

  const list = store.mine();
  const shared = list.filter(e => e.shared && e.remote_id);
  let readings = [];
  try { readings = await store.readingsFor(shared.map(e => e.remote_id)); } catch (e) { console.error(e); }
  let just = null; try { just = sessionStorage.getItem("iam.justSaved"); sessionStorage.removeItem("iam.justSaved"); } catch { }
  const local = store.localEntries();
  const groups = [];
  list.forEach(e => {
    const id = canonical(e.material_id);
    let g = groups.find(x => x.id === id);
    if (!g) groups.push(g = { id, m: byId(id) || unknown(id), items: [] });
    g.items.push(e);
  });
  groups.sort((x, y) => String(x.m.no).localeCompare(String(y.m.no)));

  main.innerHTML = `
  <div class="wrap page">
    <div class="page-head">
      <div><h1>My Dictionary</h1><p>${list.length} ${list.length === 1 ? "entry" : "entries"} · private unless you share one</p></div>
      <div class="row">${list.length ? `<button class="btn btn-small" type="button" data-export>Export</button>` : ""}<a class="btn btn-small" href="#archive">Choose a material</a></div>
    </div>
    ${mode === "preview" ? `<p class="notice">Preview: entries are kept in this browser only. Contributor accounts work on the live site.</p>` : ""}
    ${local.length ? `<div class="notice row-notice"><span>${local.length} ${local.length === 1 ? "entry was" : "entries were"} saved in this browser before accounts. Add ${local.length === 1 ? "it" : "them"} to your dictionary? ${local.length === 1 ? "It stays" : "They stay"} private.</span><span class="row"><button class="btn btn-small btn-primary" type="button" data-import>Add to my dictionary</button><button class="btn btn-small btn-quiet" type="button" data-dismiss>Not now</button></span></div>` : ""}
    ${draftsList()}
    ${list.length ? `<div class="cabinet">${groups.map((g, gi) => `
      <section class="drawer" style="--i:${gi}">
        <a class="drawer-tab" href="#archive-${g.m.id}"><span class="no">${g.m.no}</span><span>${esc(g.m.name)}</span><span class="count">${g.items.length}</span></a>
        <div class="cards">${g.items.map(e => indexCard(e, readings.filter(r => r.entry_id === e.remote_id), e.id === just)).join("")}</div>
      </section>`).join("")}</div>`
      : `<div class="dict-start"><div class="cabinet-empty calibrate">${field()}<div><span class="label">Empty so far</span><h2>No entries filed yet.</h2><p>Open a material, read how it behaves and what the Institute makes of it, then write your own entry.</p><a class="btn btn-primary" href="#archive">Choose a material</a></div></div>${sampleBlock()}</div>`}
  </div>`;
  wireResume();

  const onClick = async ev => {
    if (ev.target.closest("[data-export]")) return download("iam-my-dictionary.json", store.exportAll());
    if (ev.target.closest("[data-import]")) {
      try { await store.importLocal(); toast("Added to your dictionary"); } catch (err) { console.error(err); toast("Could not add them. Please try again."); }
      return render();
    }
    if (ev.target.closest("[data-dismiss]")) { if (await ask("Remove those browser-only entries from this device?", "Remove")) { store.dismissLocal(); render(); } return; }
    const head = ev.target.closest("[data-open]");
    if (head) {
      const card = head.closest(".icard-file"), o = !card.classList.contains("open");
      card.classList.toggle("open", o); head.setAttribute("aria-expanded", String(o));
      const fig = $("[data-mine]", card);
      if (o && fig && !fig.dataset.on) { const e = store.getMine(card.dataset.id); fig.dataset.on = "1"; mountPlayer(fig, e.body); }
      return;
    }
    const b = ev.target.closest("[data-e]"); if (!b) return;
    const e = store.getMine(b.dataset.e); if (!e) return;
    const act = b.dataset.do;
    if (act === "revise") return revise(e);
    if (act === "body") return editBody(e);
    if (act === "share") { b.disabled = true; if (await shareEntry(e)) toast("Shared in the archive"); return render(); }
    if (act === "unshare") {
      if (!(await ask("Make this private again? It leaves the public archive and stays in your dictionary.", "Make private"))) return;
      if (await unshareEntry(e)) toast("Private again");
      return render();
    }
    if (act === "delete") {
      if (!(await ask("Delete this entry and all its versions?" + (e.shared ? " It will also leave the public archive." : ""), "Delete"))) return;
      if (e.shared && e.remote_id && !(await unshareEntry(e))) return;
      try { await store.deleteMine(e.id); toast("Deleted"); } catch (err) { console.error(err); toast("Could not delete it. Please try again."); }
      return render();
    }
  };
  main.addEventListener("click", onClick);
  leaving = () => main.removeEventListener("click", onClick);
  if (just) { const c = $(`.icard-file[data-id="${CSS.escape(just)}"]`, main); c && c.scrollIntoView({ block: "center", behavior: "instant" in window ? "instant" : "auto" }); }
}

const draftNote = d => `<div class="notice row-notice"><span><strong>Entry waiting to be saved:</strong> “${esc(d.meaning)}” for ${esc((byId(d.material_id) || unknown(d.material_id)).name)}. Sign in or create an account to file it privately.</span><span class="row"><button class="btn btn-small btn-primary" type="button" data-auth="signin">Sign in</button><button class="btn btn-small btn-quiet" type="button" data-discard>Discard</button></span></div>`;

function indexCard(e, readings = [], just = false) {
  const revs = e.revisions || [];
  const versions = [{ at: e.created_at, meaning: e.meaning, note: e.meaning_note, first: true }, ...revs];
  return `<article class="icard-file ${just ? "filing" : ""}" data-id="${esc(e.id)}">
    <button class="icard-head" type="button" data-open aria-expanded="false">
      <span class="word">${esc(latestMeaning(e))}</span>
      <span class="icard-meta"><span class="state ${e.shared ? "is-public" : ""}">${e.shared ? "Shared" : "Private"}</span><span>${fmtDate(e.created_at)}</span>${revs.length ? `<span>${revs.length + 1} versions</span>` : ""}${hasBody(e) ? `<span>Body</span>` : ""}</span>
      <span class="chev" aria-hidden="true">+</span>
    </button>
    <div class="icard-body"><div><div class="icard-inner">
      <ol class="versions">${versions.map((v, i) => `<li><span class="label">${v.first ? "Original" : "Revised"} · ${fmtDate(v.at)}</span><span class="${i < versions.length - 1 ? "old" : "word"}">${esc(v.meaning)}</span>${v.note && !v.first ? `<span class="muted">${esc(v.note)}</span>` : ""}</li>`).join("")}</ol>
      ${e.observe && ((e.observe.noticed || []).length || e.observe.note) ? `<p><span class="label">Noticed</span><br>${esc([...(e.observe.noticed || []), e.observe.note].filter(Boolean).join(" · "))}</p>` : ""}
      ${e.meaning_note ? `<p><span class="label">Why</span><br>${esc(e.meaning_note)}</p>` : ""}
      ${relationLine((e.observe || {}).relation, byId(e.material_id)) ? `<p><span class="label">Relation</span><br>${relationLine(e.observe.relation, byId(e.material_id))}</p>` : ""}
      ${e.voice ? `<p><span class="label">Imagined voice</span><br><span class="voice">${esc(e.voice)}</span></p>` : ""}
      ${e.own_body_note ? `<p><span class="label">Became it</span><br>${esc(e.own_body_note)}</p>` : ""}
      ${e.body ? `<div class="fig" data-mine="${esc(e.id)}"></div>` : ""}
      ${readings.length ? `<p class="label">Others read your body as: ${readings.slice(0, 6).map(r => esc(r.text)).join(" · ")}</p>` : ""}
      <div class="actions">
        <button data-e="${esc(e.id)}" data-do="revise" type="button">Revise</button>
        <button data-e="${esc(e.id)}" data-do="body" type="button">${e.body ? "Edit body" : "Add body"}</button>
        <a href="#archive-${canonical(e.material_id)}">Compare</a>
        ${e.shared ? `<button data-e="${esc(e.id)}" data-do="unshare" type="button">Make private</button>` : `<button data-e="${esc(e.id)}" data-do="share" type="button">Share in archive</button>`}
        <button data-e="${esc(e.id)}" data-do="delete" type="button">Delete</button>
      </div>
    </div></div></div>
  </article>`;
}

// ---------- sharing, always a separate choice from saving ----------
async function shareEntry(e, { quiet = false } = {}) {
  if (!store.publishAllowed() && !(await publishConsent())) return false;
  try {
    const rid = await store.share(e);
    await store.updateMine(e.id, { shared: true, remote_id: rid });
    store.invalidate(); return true;
  } catch (err) { console.error(err); toast(quiet ? "Saved privately. Making it public failed, try again from My Dictionary." : "Could not make it public. Please try again."); return false; }
}
async function unshareEntry(e) {
  try {
    if (e.remote_id) await store.unshare(e.remote_id);
    await store.updateMine(e.id, { shared: false, remote_id: null });
    store.invalidate(); return true;
  } catch (err) { console.error(err); toast("Could not make it private. Please try again."); return false; }
}
function publishConsent() {
  return new Promise(resolve => {
    let done = false;
    modal(`<span class="label">Publishing consent</span><h2>Show selected entries in the public archive?</h2>
      <p class="muted">You have not given publishing consent. If you agree, only the entries you choose are shown, signed with the name you choose or as Anonymous. Your email is never shown. You can make any entry private again, or withdraw this consent from your account.</p>
      <p><a class="ulink" href="#consent" target="_blank" rel="noopener">Research Consent Details</a></p>
      <div class="row" style="margin-top:24px"><button class="btn btn-primary" data-yes type="button">I agree to publish selected entries</button><button class="btn btn-quiet" data-close type="button">Keep private</button></div>`, (box, close) => {
      $("[data-yes]", box).addEventListener("click", async ev => {
        ev.currentTarget.disabled = true;
        try { await store.setConsent({ publish: true }); done = true; close(); resolve(true); }
        catch (err) { console.error(err); toast("Could not record your consent. Please try again."); ev.currentTarget.disabled = false; }
      });
    }, () => { if (!done) resolve(false); });
  });
}

// ---------- contributor accounts ----------
const authErr = err => {
  const m = String(err && (err.message || err)).toLowerCase();
  if (m.includes("invalid login")) return "That email and password do not match.";
  if (m.includes("not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("password")) return err.message;
  if (m.includes("email rate limit")) return "The Institute has sent too many emails this hour. Please try again later. If you already got a confirmation email, use that link.";
  if (m.includes("rate limit") || m.includes("security purposes")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("fetch") || m.includes("network")) return "The archive could not be reached. Check your connection.";
  return err && err.message ? err.message : "Something went wrong. Please try again.";
};
const legalLink = (k, t) => `<a class="ulink" href="#${k}" target="_blank" rel="noopener">${t || LEGAL[k].title}</a>`;

function authPanel({ view = "signin", reason = "", email = "" } = {}) {
  let v = view, mail = email;
  panel("Contributor access", (body, close) => {
    const draw = () => {
      if (store.mode() === "preview") {
        body.innerHTML = `<div class="step"><span class="label">Contributor access</span><h2>Become an I.A.M. Contributor</h2><p>Keep your own dictionary of materials.</p>
          <p class="notice">This preview cannot reach the account service, so sign up and sign in are switched off here. They work on the live site. In the preview, meanings are kept in this browser only.</p>
          ${store.pending() ? `<div class="step-actions"><button class="btn btn-primary" type="button" data-keep>Keep my draft in this browser</button></div>` : ""}</div>`;
        $("[data-keep]", body)?.addEventListener("click", async () => { close(); await resumePending(); });
        return;
      }
      const why = reason ? `<p class="notice">${esc(reason)}</p>` : "";
      if (v === "signup") body.innerHTML = `<form class="step auth" novalidate>
          <span class="label">Contributor access</span><h2>Become an I.A.M. Contributor</h2><p>Keep your own dictionary of materials.</p>${why}
          <label class="field">Email<input class="input" type="email" name="email" autocomplete="email" required value="${esc(mail)}"></label>
          <label class="field">Password<input class="input" type="password" name="password" autocomplete="new-password" minlength="8" required><span class="hint">At least 8 characters.</span></label>
          <details class="plain"><summary>What happens to my data?</summary>
            <ul>
              <li><strong>Stored:</strong> your email, your consent choices, and the meanings you save. Your password is handled by the sign-in service and never seen by the project.</li>
              <li><strong>Purpose:</strong> to keep your dictionary, and to show the entries you choose to share.</li>
              <li><strong>Access:</strong> private entries are visible only to you. Public entries are visible to everyone, without your email.</li>
              <li><strong>Research:</strong> your entries are used in the research only if you tick the research box.</li>
              <li><strong>Leaving:</strong> you can make entries private, withdraw consent, export, or delete your account at any time.</li>
            </ul></details>
          <fieldset class="consents"><legend class="label">Required</legend>
            <label class="check"><input type="checkbox" name="terms" required> <span>I agree to the ${legalLink("terms")}.</span></label>
            <label class="check"><input type="checkbox" name="privacy" required> <span>I have read the ${legalLink("privacy")}.</span></label>
          </fieldset>
          <fieldset class="consents"><legend class="label">Optional · you can change these later</legend>
            <label class="check"><input type="checkbox" name="research"> <span>I agree that my entries may be used in the <em>UX of Respond</em> research. ${legalLink("research", "Research Participation Information")}</span></label>
            <label class="check"><input type="checkbox" name="publish"> <span>I agree that entries I choose to share may be shown publicly in the archive. ${legalLink("consent", "Research Consent Details")}</span></label>
          </fieldset>
          <p class="form-error" role="alert"></p>
          <div class="step-actions"><button class="btn btn-primary" type="submit">Create account</button></div>
          <p class="hint">Already a contributor? <button class="link" type="button" data-v="signin">Sign in</button></p>
        </form>`;
      if (v === "signin") body.innerHTML = `<form class="step auth" novalidate>
          <span class="label">Contributor access</span><h2>Sign in</h2>${why}
          <label class="field">Email<input class="input" type="email" name="email" autocomplete="email" required value="${esc(mail)}"></label>
          <label class="field">Password<input class="input" type="password" name="password" autocomplete="current-password" required></label>
          <p class="form-error" role="alert"></p>
          <div class="step-actions"><button class="btn btn-primary" type="submit">Sign in</button><button class="link" type="button" data-v="forgot">Forgot password?</button></div>
          <p class="hint">New here? <button class="link" type="button" data-v="signup">Become an I.A.M. Contributor</button></p>
        </form>`;
      if (v === "forgot") body.innerHTML = `<form class="step auth" novalidate>
          <span class="label">Contributor access</span><h2>Reset your password</h2><p class="hint">We will email you a link to choose a new one.</p>
          <label class="field">Email<input class="input" type="email" name="email" autocomplete="email" required value="${esc(mail)}"></label>
          <p class="form-error" role="alert"></p>
          <div class="step-actions"><button class="btn btn-primary" type="submit">Send link</button><button class="link" type="button" data-v="signin">Back to sign in</button></div>
        </form>`;
      if (v === "sent") body.innerHTML = `<div class="step"><span class="label">Check your email</span><h2>Reset link sent</h2><p>If an account exists for ${esc(mail)}, a link to reset the password is on its way.</p></div>`;
      if (v === "verify") body.innerHTML = `<div class="step"><span class="label">One more step</span><h2>Confirm your email</h2>
          <p>We sent a confirmation link to <strong>${esc(mail)}</strong>. Open it on this device to finish creating your account.</p>
          ${store.pending() ? `<p class="hint">Your draft is kept in this browser and will be filed privately once you are signed in.</p>` : ""}
          <p class="form-error" role="alert"></p>
          <div class="step-actions"><button class="btn" type="button" data-resend>Send the link again</button></div></div>`;
      wire();
    };
    const wire = () => {
      $$("[data-v]", body).forEach(b => b.addEventListener("click", () => { const f = $("form", body); if (f && f.email) mail = f.email.value.trim(); v = b.dataset.v; draw(); }));
      $("[data-resend]", body)?.addEventListener("click", async ev => {
        ev.currentTarget.disabled = true;
        try { await store.resendVerification(mail); toast("Link sent again"); } catch (err) { $(".form-error", body).textContent = authErr(err); ev.currentTarget.disabled = false; }
      });
      const form = $("form", body); if (!form) return;
      (form.email.value ? form.password || form.email : form.email).focus({ preventScroll: true });
      form.addEventListener("submit", async ev => {
        ev.preventDefault();
        const err = $(".form-error", form), btn = $("button[type=submit]", form);
        err.textContent = "";
        mail = form.email.value.trim();
        if (!/^\S+@\S+\.\S+$/.test(mail)) { err.textContent = "Please enter a valid email address."; return; }
        if (v === "signup") {
          if (form.password.value.length < 8) { err.textContent = "The password needs at least 8 characters."; return; }
          if (!form.terms.checked || !form.privacy.checked) { err.textContent = "Please agree to the Terms of Use and confirm you have read the Privacy Notice."; return; }
        }
        btn.disabled = true;
        try {
          if (v === "signup") {
            const r = await store.signUp({ email: mail, password: form.password.value, research: form.research.checked, publish: form.publish.checked });
            if (r.needsVerification) { v = "verify"; return draw(); }
            close(); toast("Welcome, contributor"); return;
          }
          if (v === "signin") { await store.signIn({ email: mail, password: form.password.value }); close(); toast("Signed in"); return; }
          if (v === "forgot") { await store.resetPassword(mail); v = "sent"; return draw(); }
        } catch (e) { console.error(e); err.textContent = authErr(e); btn.disabled = false; }
      });
    };
    draw();
  });
}

function newPasswordPanel() {
  panel("Choose a new password", (body, close) => {
    body.innerHTML = `<form class="step auth" novalidate><span class="label">Contributor access</span><h2>Choose a new password</h2>
      <label class="field">New password<input class="input" type="password" name="password" autocomplete="new-password" minlength="8" required><span class="hint">At least 8 characters.</span></label>
      <p class="form-error" role="alert"></p>
      <div class="step-actions"><button class="btn btn-primary" type="submit">Save password</button></div></form>`;
    const form = $("form", body); form.password.focus();
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const err = $(".form-error", form);
      if (form.password.value.length < 8) { err.textContent = "The password needs at least 8 characters."; return; }
      try { await store.updatePassword(form.password.value); close(); toast("Password updated"); } catch (e) { err.textContent = authErr(e); }
    });
  });
}

function accountPanel() {
  panel("Your account", (body, close) => {
    const draw = () => {
      const u = store.user(), p = store.profile() || {};
      body.innerHTML = `<div class="step">
        <span class="label">I.A.M. Contributor</span><h2>Your account</h2>
        <p class="muted">${esc(u.email)}</p>
        <fieldset class="consents"><legend class="label">Your choices · change any time</legend>
          <label class="check"><input type="checkbox" data-consent="research" ${p.research_consent ? "checked" : ""}> <span>My entries may be used in the research. ${legalLink("research", "Information")}</span></label>
          <label class="check"><input type="checkbox" data-consent="publish" ${p.publish_consent ? "checked" : ""}> <span>Entries I choose to share may be shown publicly. ${legalLink("consent", "Details")}</span></label>
        </fieldset>
        <div class="acct-actions">
          <a class="btn btn-small" href="#dictionary" data-close>My Dictionary</a>
          <button class="btn btn-small" type="button" data-export>Export my data</button>
          <button class="btn btn-small" type="button" data-signout>Sign out</button>
        </div>
        <div class="danger">
          <span class="label">Delete account</span>
          <p class="hint">Deletes your profile, dictionary, shared entries and sign-in. This cannot be undone. Export first if you want a copy.</p>
          <button class="btn btn-small btn-danger" type="button" data-delete>Delete my account</button>
        </div>
        <p class="hint">${legalLink("terms")} · ${legalLink("privacy")}</p>
      </div>`;
      $$("[data-consent]", body).forEach(c => c.addEventListener("change", async () => {
        const key = c.dataset.consent, on = c.checked;
        if (key === "publish" && !on) {
          const pub = store.mine().filter(e => e.shared && e.remote_id);
          if (pub.length) {
            // the confirmation replaces this panel, so the panel is reopened afterwards
            const yes = await ask(`Withdraw publishing consent? Your ${pub.length} public ${pub.length === 1 ? "entry" : "entries"} will be made private.`, "Withdraw");
            if (yes) { for (const e of pub) if (!(await unshareEntry(e))) return accountPanel(); }
            if (!yes) return accountPanel();
          }
        }
        try { await store.setConsent({ [key]: on }); toast(on ? "Consent recorded" : "Consent withdrawn"); }
        catch (err) { console.error(err); toast("Could not update your choice. Please try again."); }
        if (!body.isConnected) accountPanel();
        if (currentPath() === "dictionary") render();
      }));
      $("[data-export]", body).addEventListener("click", () => download("iam-my-data.json", store.exportAll()));
      $("[data-signout]", body).addEventListener("click", async () => { await store.signOut(); close(); toast("Signed out"); });
      $("[data-delete]", body).addEventListener("click", async () => {
        if (!(await ask("Delete your account and everything in it? This cannot be undone.", "Delete everything"))) return accountPanel();
        try { await store.deleteAccount(); toast("Your account has been deleted"); location.hash = "#"; }
        catch (err) { console.error(err); toast("Could not delete the account. Please try again."); accountPanel(); }
      });
    };
    draw();
  });
}

// header control: Sign in, or the contributor's account
function updateAcct() {
  const b = $("[data-acct]"); if (!b) return;
  const u = store.user();
  b.hidden = false;
  b.textContent = u ? "Account" : "Sign in";
  b.classList.toggle("signed", !!u);
  b.setAttribute("aria-label", u ? `Account, signed in as ${u.email}` : "Sign in or become a contributor");
}
$("[data-acct]")?.addEventListener("click", () => store.user() ? accountPanel() : authPanel({ view: "signin" }));

// a draft written before signing in is filed privately once there is somewhere to keep it
async function resumePending() {
  const d = store.pending();
  if (!d || !store.canSave()) return;
  const { wantsShare, at, ...entry } = d;
  try {
    const saved = await store.addMine(entry);
    store.setPending(null);
    try { sessionStorage.setItem("iam.justSaved", saved.id); } catch { }
    toast(wantsShare ? "Your entry is filed privately. Share it from My Dictionary if you still want to." : "Filed privately in My Dictionary");
    const mid = canonical(entry.material_id);
    if (byId(mid)) {
      try { localStorage.removeItem("iam.interview." + mid); sessionStorage.setItem("iam.compare", saved.id); } catch { }
      if (currentPath() === "archive-" + mid) render(); else go("#archive-" + mid);
    } else if (currentPath() === "dictionary") render(); else go("#dictionary");
  } catch (err) { console.error(err); toast("Your draft could not be filed yet. It is still kept in this browser."); }
}

window.addEventListener("iam:auth", async () => {
  updateAcct();
  if (store.pending() && store.canSave()) return resumePending();
  render();
});
window.addEventListener("iam:recovery", newPasswordPanel);

function editBody(e) {
  let editor = null;
  modal(`<h2>Borrow a Body</h2><p class="muted">Drag the joints. Two or three poses.</p><div id="eb" style="margin-top:16px"></div>
    <div class="row" style="margin-top:20px"><button class="btn btn-primary" type="button" data-save>Save movement</button>${e.body ? `<button class="btn btn-quiet" type="button" data-remove>Remove movement</button>` : ""}</div>`, (box, close) => {
    editor = mountEditor($("#eb", box), e.body);
    const finish = async body => {
      let upd;
      try { upd = await store.updateMine(e.id, { body }); } catch (err) { console.error(err); toast("Could not save. Please try again."); return; }
      if (upd.shared && upd.remote_id) { try { await store.updateShared(upd.remote_id, upd); store.invalidate(); } catch (err) { console.error(err); toast("Saved here; the shared copy could not be updated."); } }
      try { sessionStorage.setItem("iam.justSaved", e.id); } catch { }
      close(); toast("Movement saved"); render();
    };
    $("[data-save]", box).addEventListener("click", () => { const b = editor.get(); if (b.frames.length < 2) { toast("Add a second pose first."); return; } finish(b); });
    $("[data-remove]", box)?.addEventListener("click", () => finish(null));
  }, () => { if (editor) editor.stop(); }, { wide: true });
}

function revise(e) {
  const current = latestMeaning(e);
  modal(`
    <h2>Has your meaning changed?</h2>
    <p class="muted">You said “${esc(current)}” on ${fmtDate(e.created_at)}. Both versions are kept.</p>
    ${e.body ? `<div class="figure-mini" id="rv-fig" style="max-width:200px;margin:16px 0"></div>` : ""}
    <form id="rv-form">
      <label class="field">What it means now<input id="rv-m" class="input" maxlength="80" required placeholder="${esc(current)}" autocomplete="off"></label>
      <label class="field">What changed? (optional)<input id="rv-n" class="input" maxlength="300" autocomplete="off"></label>
      <div class="row" style="margin-top:24px"><button class="btn btn-primary" type="submit">Save revision</button><button class="btn" type="button" data-same>It still holds</button></div>
    </form>`, (box, close) => {
    if (e.body) mountPlayer($("#rv-fig", box), e.body, { trails: true });
    const finish = async (meaning, note) => {
      const revisions = [...(e.revisions || []), { at: new Date().toISOString(), meaning, note }];
      let upd;
      try { upd = await store.updateMine(e.id, { revisions }); } catch (err) { console.error(err); toast("Could not save. Please try again."); return; }
      if (upd.shared && upd.remote_id) { try { await store.updateShared(upd.remote_id, upd); store.invalidate(); } catch (err) { console.error(err); toast("Saved here; the shared copy could not be updated."); } }
      try { sessionStorage.setItem("iam.justSaved", e.id); } catch { }
      close(); toast("Saved"); render();
    };
    $("#rv-form", box).addEventListener("submit", ev => { ev.preventDefault(); const v = $("#rv-m", box).value.trim(); if (v) finish(v, $("#rv-n", box).value.trim()); });
    $("[data-same]", box).addEventListener("click", () => finish(current, "It still holds."));
  });
}

// ---------- ABOUT ----------
async function about() {
  main.innerHTML = `
  <div class="wrap page">
    <div class="prose">
      <h1>About &amp; privacy</h1>
      <p>The Institute of Animate Matter is a fictional institute made for <em>UX of Respond</em>, an MA UX Design project by Lynn Zhong at the University of the Arts London, 2026. It studies how people give meanings, feelings and imagined voices to the way everyday materials respond.</p>
      <p>Physical observations describe what a material did. Interpretations, including the Institute's own, are subjective. Materials are not claimed to think or feel. Demo content is marked as demo.</p>
      <h2 class="sub">Your data, in short</h2>
      <ul>
        <li>Browsing needs no account. Writing an entry needs no account. A free contributor account saves your entries in My Dictionary.</li>
        <li>Everything you save is private unless you make a specific entry public.</li>
        <li>Research use and publishing are two separate, optional permissions. You can withdraw either.</li>
        <li>You can export your data or delete your account at any time.</li>
      </ul>
      <h2 class="sub">Documents</h2>
      <ul class="doc-links">${Object.entries(LEGAL).map(([k, d]) => `<li><a class="ulink" href="#${k}">${d.title}</a></li>`).join("")}</ul>
    </div>
  </div>`;
}

async function legalPage(key) {
  const d = LEGAL[key];
  main.innerHTML = `<div class="wrap page"><div class="prose legal"><a class="back" href="#about">← About &amp; privacy</a><h1>${d.title}</h1>${d.html}</div></div>`;
}

function notFound() {
  return `<div class="wrap page empty-state"><h1>Nothing here.</h1><p>This page may have moved.</p><a class="btn btn-primary" href="#">Home</a></div>`;
}

// ---------- boot ----------
$("[data-mark]").innerHTML = mark();
// accounts first (bounded, so a slow network never leaves a blank page); community materials load on the pages that list them
await Promise.race([store.ready(), new Promise(r => setTimeout(r, 6000))]);
updateAcct();
await render();
resumePending();
