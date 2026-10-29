import { COLLECTIONS, SPECIMENS, byId, canonical, collectionOf, specimensIn, recorded, mainRecord, behaviourOf, slug, unslug, FAMILIES, CONDITIONS, CHANGE_WORDS, WHEN_WORDS, BACK_WORDS, EXAMPLES } from "./data.js";
import { seal, specimenArt, responseDiagram } from "./art.js";
import { mountEditor, mountPlayer, tracesSVG, defaultPose, defaultBody } from "./body.js";
import * as store from "./store.js";

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const main = $("#main");
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
const pad = n => String(n).padStart(3, "0");
const latestMeaning = e => (e.revisions && e.revisions.length ? e.revisions[e.revisions.length - 1].meaning : e.meaning);

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3200);
}
window.addEventListener("iam:toast", e => toast(e.detail));

function modal(html, onMount, onClose) {
  const root = $("#modal-root");
  const last = document.activeElement;
  root.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">${html}<button class="pill modal-close" data-close aria-label="Close">Close ✕</button></div></div>`;
  const bd = $(".modal-backdrop", root);
  const close = () => { root.innerHTML = ""; document.removeEventListener("keydown", onKey); last && last.focus && last.focus(); onClose && onClose(); };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  bd.addEventListener("click", e => { if (e.target === bd || e.target.closest("[data-close]")) close(); });
  const first = $("input, textarea, button:not([data-close])", bd); (first || $(".modal", bd)).focus?.();
  onMount && onMount($(".modal", bd), close);
  return close;
}

// in-page confirmation (browser confirm() is blocked in some embeds)
function ask(question, yes = "Yes") {
  return new Promise(resolve => {
    let done = false;
    const close = modal(`<p class="eyebrow">Please confirm</p><h2 style="font-size:28px;margin-bottom:22px">${esc(question)}</h2>
      <div class="btn-row"><button class="btn btn-primary" data-yes>${esc(yes)}</button><button class="btn btn-ghost" data-close>Cancel</button></div>`, (box, c) => {
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

// fill every [data-seal] slot
function stampSeals(root = document) {
  $$("[data-seal]", root).forEach(el => {
    if (el.dataset.done) return;
    const kind = el.dataset.seal;
    el.innerHTML = seal({ color: kind === "foot" ? "#F1E8D7" : kind === "light" ? "#E6D2B4" : kind === "brass" ? "#A17C58" : "#6E302F", text: kind !== "nav", id: kind + Math.random().toString(36).slice(2, 6), hollow: kind === "foot" || kind === "light" });
    el.dataset.done = 1;
  });
}

// media: shows assets/materials/<id>.mp4 or .jpg when present, else the drawing
function mediaFor(s, cls = "") {
  return `<div class="media-slot ${cls}" data-media="${s.id}">${specimenArt(s)}</div>`;
}
function upgradeMedia(root = document) {
  $$("[data-media]", root).forEach(slot => {
    const id = slot.dataset.media;
    if (!byId(id)?.photo) return;
    const img = new Image();
    img.onload = () => { slot.innerHTML = ""; img.alt = byId(id)?.name || ""; slot.appendChild(img); };
    img.src = `assets/materials/${slug(id)}.jpg`;
  });
}

// example bodies so the atlas is never blank before visitors contribute
const pose = (o = {}) => { const p = defaultPose(); const a = { ...p.a, ...(o.a || {}) }; return { ...p, ...o, a }; };
const EXAMPLE_BODIES = {
  "ex-1": { speed: .85, ending: "return", frames: [pose(), pose({ squash: .56, a: { lElbow: 250, lHand: -100, rElbow: 110, rHand: 100, lKnee: 120, rKnee: 60 } })] },
  "ex-2": { speed: .08, ending: "hold", frames: [pose({ a: { lElbow: 270, lHand: 0, rElbow: 90, rHand: 0 } }), pose({ squash: .82, a: { chest: -70, lElbow: 230, rElbow: 140, lKnee: 120, lFoot: -40, rKnee: 70, rFoot: 30 } }), pose({ squash: .5, y: 230, a: { chest: -20, neck: 10, lElbow: 170, rElbow: 200, lKnee: 160, lFoot: 0, rKnee: 20, rFoot: 0 } })] },
  "ex-3": { speed: .92, ending: "hold", frames: [pose({ a: { lElbow: 250, rElbow: 110 } }), pose({ squash: .78, a: { chest: -110, neck: 30, head: 20, lElbow: 100, lHand: -120, rElbow: 40, rHand: 140, lKnee: 130, lFoot: -90, rKnee: 60, rFoot: 80 } })] }
};
const examples = () => EXAMPLES.map(e => ({ ...e, body: EXAMPLE_BODIES[e.id] }));

async function collectiveRows() {
  let rows = [];
  try { rows = (await store.listShared()).map(r => ({ ...r, material_id: canonical(r.material_id) })); } catch (e) { console.error(e); toast("The shared archive could not be reached. Showing what we have."); }
  const withReal = new Set(rows.map(r => r.material_id));
  return [...rows, ...examples().filter(x => !withReal.has(x.material_id))];
}

function offlineNotice() {
  if (store.online()) return "";
  return `<div class="notice" role="note"><span class="mono">Notice</span><span>The Institute's shared archive is not connected yet, so anything you share stays on this device for now. Your own dictionary is saved in this browser either way.</span></div>`;
}

// ---------- router ----------
const routes = [
  [/^$/, home],
  [/^materials$/, materials],
  [/^materials-c(\d{3})$/, materials],
  [/^materials-(\d{3}-\d{2})$/, caseFile],
  [/^lab$/, lab],
  [/^lab-(\d{3}-\d{2})$/, id => lab(unslug(id))],
  [/^collective$/, () => collective("words")],
  [/^collective-(words|bodies|traces)(?:-(\d{3}-\d{2}))?$/, (v, m) => collective(v, m ? unslug(m) : "")],
  [/^me$/, me],
  [/^about$/, about]
];
const navKey = path => path.startsWith("materials") ? "materials" : path.startsWith("lab") ? "lab" : path.startsWith("collective") ? "collective" : path.startsWith("me") ? "me" : "home";

let leaving = null;
async function render() {
  const path = location.hash.replace(/^#\/?/, "").replace(/\//g, "-");
  if (path === "main") { history.replaceState(null, "", "#" + (render.last || "")); main.focus(); return; }
  render.last = path;
  if (leaving) { leaving(); leaving = null; }
  const route = routes.find(([re]) => re.test(path));
  const key = navKey(path);
  $$(".nav [data-nav]").forEach(a => a.dataset.nav === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  $("#nav").classList.remove("open"); $(".nav-toggle").setAttribute("aria-expanded", "false");
  if (!route) { main.innerHTML = notFound(); return; }
  const m = path.match(route[0]);
  await route[1](...m.slice(1));
  stampSeals(main); upgradeMedia(main);
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  main.focus({ preventScroll: true });
  document.title = (main.querySelector("h1")?.textContent.trim() || "Institute") + " · I.A.M.";
}
window.addEventListener("hashchange", render);
$(".nav-toggle").addEventListener("click", e => {
  const open = $("#nav").classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", String(open));
});

// ---------- shared fragments ----------
const nr = v => (!v || v === "Not recorded") ? `<span class="nr">Not recorded</span>` : esc(v);

function specCard(s, { count } = {}) {
  const recs = recorded(s);
  const planned = s.experiments.some(e => e.planned);
  return `<a class="spec-card" href="#materials-${slug(s.id)}">
    <div class="spec-art">${mediaFor(s)}</div>
    <div class="spec-label">
      <span class="spec-no">SPECIMEN ${s.id}</span>
      <h3 class="spec-name">${esc(s.name)}</h3>
      <p class="spec-variety">${esc(s.variety)}</p>
      <span class="spec-records ${recs.length ? "has" : ""}">${recs.length ? `${recs.length} experiment record${recs.length > 1 ? "s" : ""}` : planned ? "Experiment planned" : "No experiment yet"}${count ? ` · ${count} meaning${count > 1 ? "s" : ""}` : ""}</span>
    </div>
  </a>`;
}

function quoteCard(e, { showMaterial = true } = {}) {
  const s = byId(e.material_id) || { id: e.material_id, name: "Unknown specimen" };
  const rev = e.revisions && e.revisions.length ? e.revisions[e.revisions.length - 1] : null;
  return `<article class="card quote-card">
    ${showMaterial ? `<span class="spec-no">SPECIMEN ${s.id} / ${esc(s.name.toUpperCase())}</span>` : ""}
    ${rev ? `<p class="meaning"><s class="muted" style="font-size:.6em">${esc(e.meaning)}</s><br>${esc(rev.meaning)}</p>` : `<p class="meaning">${esc(e.meaning)}</p>`}
    ${e.meaning_note ? `<p class="why">${esc(e.meaning_note)}</p>` : ""}
    ${e.voice ? `<p class="voice">“${esc(e.voice)}”</p>` : ""}
    <footer><span>${esc(e.alias || "Anonymous translator")}</span><span>${e.example ? "Example entry" : fmtDate(e.created_at)}</span></footer>
  </article>`;
}

// ---------- HOME / THE INSTITUTE ----------
const CABINET = ["001.01", "004.01", "003.01", "008.01", "002.01", "007.01", "011.01", "013.01", "005.01", "006.01", "009.02", "004.02"];
async function home() {
  const rows = await collectiveRows();
  const latest = rows.filter(r => !r.example).slice(0, 3);
  const nRec = SPECIMENS.reduce((n, s) => n + recorded(s).length, 0);
  main.innerHTML = `
  <section class="home-hero">
    <div class="wrap hero-grid">
      <div>
        <p class="eyebrow">Department of Material Responses · Est. 2026</p>
        <h1 class="hero-title">I.A.M.</h1>
        <p class="hero-sub">Institute of Animate Matter</p>
        <div class="hero-rule"><span class="mono small">Cabinet of Material Responses</span></div>
        <p class="hero-lede">A collection of ordinary materials, catalogued with precision, and the <em>entirely unscientific</em> things people believe they mean.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#materials">Open the Cabinet</a>
          <a class="btn" href="#lab">Become a Material Translator</a>
        </div>
        <p class="mono small muted" style="margin-top:22px">${COLLECTIONS.length} collections · ${SPECIMENS.length} specimens · ${nRec} experiment records</p>
      </div>
      <div class="cabinet" aria-label="A cabinet of specimens">
        <div class="cabinet-crest"><span class="mono">Cabinet I</span><span data-seal="light" style="width:34px;display:block"></span><span class="mono">Study collection</span></div>
        <div class="cabinet-grid">${CABINET.map(id => { const s = byId(id); return `<a class="cabinet-cell" href="#materials-${slug(id)}" aria-label="${esc(s.name)}">${specimenArt(s)}<span class="mono">${id}</span></a>`; }).join("")}</div>
      </div>
    </div>
  </section>

  <section class="band band-walnut">
    <div class="statement">
      <p class="mono" style="opacity:.7;margin-bottom:22px">Office of Human Interpretation</p>
      <p class="big">The specimen is measured. <em>The meaning is not.</em></p>
      <p class="mono small" style="opacity:.7">We keep both, and we keep them apart.</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <p class="eyebrow">How a translation is filed</p>
      <h2 style="font-size:clamp(36px,5vw,60px);margin-bottom:28px">Observe. Interpret.<br>Imagine. Perform.</h2>
      <div class="steps">
        <div class="step"><span class="num">STEP 1 · EVIDENCE</span><h3>Observe</h3><p>Watch one specimen change. Record only what you can see: how fast, and whether it comes back.</p></div>
        <div class="step rose"><span class="num">STEP 2 · INTERPRETATION</span><h3>Interpret</h3><p>Say what that change means to you. One word is enough. Nobody can be wrong here.</p></div>
        <div class="step rose"><span class="num">STEP 3 · SPECULATION</span><h3>Imagine</h3><p>If the material could speak while it changes, what would it say? Write it as the material.</p></div>
        <div class="step"><span class="num">STEP 4 · EMBODIMENT</span><h3>Perform</h3><p>Translate the change into a body: yours, or one you borrow from the Institute.</p></div>
      </div>
    </div>
  </section>

  <section class="band band-card section">
    <div class="wrap split">
      <div>
        <p class="eyebrow">Apparatus No. 1</p>
        <h2 style="font-size:clamp(40px,5.6vw,72px)">Borrow a Body</h2>
        <p class="serif" style="font-size:25px;margin:14px 0 18px;color:var(--olive)">“No body available? Borrow one from the Institute.”</p>
        <p class="prose">Drag the joints, file two or three poses, then set how fast the change happens and whether the body comes back. Speed and return are the two things the Institute records for every specimen.</p>
        <div class="btn-row" style="margin-top:20px"><a class="btn btn-primary" href="#lab">Open the Translation Lab</a><a class="btn" href="#collective-bodies">Visit the Body Atlas</a></div>
      </div>
      <div class="panel" style="max-width:420px;justify-self:center;width:100%">
        <span class="plaque" style="position:absolute;top:-12px;left:20px">Embodied translation · example</span>
        <div class="figure-mini" id="home-fig"></div>
        <p class="mono small muted" style="margin-top:10px">Specimen 001.01 Kitchen Sponge, performed: instant, comes back</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div><p class="eyebrow">Collective Dictionary</p><h2>Recently filed meanings</h2></div>
        <a class="btn" href="#collective">Read the wall</a>
      </div>
      ${latest.length ? `<div class="wall">${latest.map(e => quoteCard(e)).join("")}</div>` :
      `<div class="empty"><h3>The wall is waiting for its first meaning.</h3><p>Be the first translator on record.</p><a class="btn btn-primary" href="#lab">Translate a specimen</a></div>`}
    </div>
  </section>

  <section class="band band-rose section">
    <div class="wrap split">
      <div>
        <p class="eyebrow">About the Institute</p>
        <h2 style="font-size:clamp(36px,4.6vw,58px)">A very orderly home for very disorderly meanings.</h2>
      </div>
      <div class="prose">
        <p>The Institute of Animate Matter is a fictional institution and a real research project. It asks how the way materials change can become a language that people read and perform with their bodies.</p>
        <p>Every record keeps two things apart: what the material physically did, and what a person thinks it means. The first is evidence. The second is yours.</p>
        <p class="hand">institute property / handle with feeling</p>
        <a class="btn" href="#about">About the research &amp; your data</a>
      </div>
    </div>
  </section>`;

  mountPlayer($("#home-fig"), EXAMPLE_BODIES["ex-1"], { trails: true, label: "Example body performing a sponge" });
}

// ---------- MATERIAL ARCHIVE: THE CABINET ----------
async function materials(collectionId = "") {
  const rows = await collectiveRows();
  const counts = {}; rows.filter(r => !r.example).forEach(r => counts[r.material_id] = (counts[r.material_id] || 0) + 1);
  const modes = [...new Set(SPECIMENS.map(behaviourOf).filter(Boolean))];
  const state = { col: collectionId, fam: "", beh: "", cond: "" };
  main.innerHTML = `
  <div class="wrap page-head">
    <p class="eyebrow">Department of Material Responses</p>
    <h1>The Material Archive</h1>
    <p class="lede">A cabinet of ordinary matter. Each drawer is a collection; each compartment holds one specimen and leads to its experiment records.</p>
  </div>
  <div class="wrap">
    <form class="filters" id="filters" aria-label="Filter the cabinet">
      <label>Collection<select class="select" data-f="col"><option value="">All collections</option>${COLLECTIONS.map(c => `<option value="${c.id}">${c.id} ${esc(c.name)}</option>`).join("")}</select></label>
      <label>Material family<select class="select" data-f="fam"><option value="">All families</option>${FAMILIES.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
      <label>Physical behaviour<select class="select" data-f="beh"><option value="">Any behaviour</option>${modes.map(x => `<option>${esc(x)}</option>`).join("")}<option value="none">No experiment yet</option></select></label>
      <label>Specimen condition<select class="select" data-f="cond"><option value="">Any condition</option>${CONDITIONS.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
      <button type="reset" class="btn btn-small btn-ghost">Clear</button>
    </form>
    <div id="cab"></div>
    <p class="rep-note"><span class="stamp brass" style="transform:none">Note</span><span>Cubes and jars are stylised archive representations at a common scale. The materials actually used in experiments, and how they were prepared, are described in each experiment record.</span></p>
  </div>`;
  $$("#filters select").forEach(sel => { sel.value = state[sel.dataset.f]; sel.addEventListener("change", () => { state[sel.dataset.f] = sel.value; draw(); }); });
  $("#filters").addEventListener("reset", () => { setTimeout(() => { Object.keys(state).forEach(k => state[k] = ""); draw(); }); });
  function draw() {
    const fit = s => (!state.col || s.id.startsWith(state.col + ".")) && (!state.fam || s.family === state.fam)
      && (!state.beh || (state.beh === "none" ? !behaviourOf(s) : behaviourOf(s) === state.beh)) && (!state.cond || s.condition === state.cond);
    const drawers = COLLECTIONS.map(c => [c, specimensIn(c.id).filter(fit)]).filter(([, l]) => l.length);
    $("#cab").innerHTML = drawers.length ? drawers.map(([c, l]) => `
      <section class="drawer">
        <div class="drawer-head"><span class="plaque">Collection ${c.id}</span><h2>${esc(c.name)}</h2><span class="mono small muted count">${l.length} specimen${l.length > 1 ? "s" : ""}</span></div>
        <div class="compartments">${l.map(s => specCard(s, { count: counts[s.id] })).join("")}${'<div class="vacant" aria-hidden="true"><span class="mono">Vacant</span></div>'.repeat((4 - l.length % 4) % 4)}</div>
      </section>`).join("") : `<div class="empty"><h3>No specimen fits all of these.</h3><p>Try clearing a filter.</p></div>`;
    upgradeMedia($("#cab"));
  }
  draw();
}

// ---------- CASE FILE ----------
async function caseFile(slugId) {
  const s = byId(unslug(slugId));
  if (!s) { main.innerHTML = notFound(); return; }
  const col = collectionOf(s);
  const rows = (await collectiveRows()).filter(r => r.material_id === s.id);
  const real = rows.filter(r => !r.example);
  const freq = {}; rows.map(latestMeaning).forEach(w => { const k = w.trim().toLowerCase(); freq[k] = (freq[k] || 0) + 1; });
  const words = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const voices = rows.filter(r => r.voice).slice(0, 4);
  const bodies = rows.filter(r => r.body && r.body.frames && r.body.frames.length).slice(0, 6);
  const i = SPECIMENS.indexOf(s), prev = SPECIMENS[(i - 1 + SPECIMENS.length) % SPECIMENS.length], next = SPECIMENS[(i + 1) % SPECIMENS.length];
  const rec = mainRecord(s);

  const recordHTML = e => `
    <article class="record">
      <header><span class="spec-no">EXPERIMENT ${s.id} / ${e.id} · ${esc(e.type.toUpperCase())}</span><span class="mono small muted">${esc(e.date)}</span></header>
      ${e.planned ? `<p class="muted">Planned. No observation recorded yet.</p>` : `
      <table class="typed"><tbody>
        <tr><th>Context</th><td>${nr(e.context)}</td></tr>
        <tr><th>Response speed</th><td>${e.speed === "instant" ? "Instant" : "Delayed"}</td></tr>
        <tr><th>Reversibility</th><td>${e.reversibility === "reversible" ? "Returns toward first shape" : "Keeps the change"}</td></tr>
        <tr><th>Mode of change</th><td>${esc(e.mode)}</td></tr>
        <tr><th>Observed response</th><td style="font-family:var(--sans);font-size:15px">${esc(e.response)}</td></tr>
      </tbody></table>
      ${responseDiagram(e)}`}
      <div class="media-strip">${e.media && e.media.length ? e.media.map(md => `<figure>${md.type === "video" ? `<video src="${esc(md.src)}" controls muted playsinline preload="metadata"></video>` : `<img src="${esc(md.src)}" alt="${esc(md.caption || s.name)}" loading="lazy">`}<figcaption>${esc(md.caption || "")}</figcaption></figure>`).join("") : `<div class="media-pending">Experiment media<br>not yet filed</div>`}</div>
    </article>`;

  main.innerHTML = `
  <div class="wrap page-head" style="padding-bottom:4px">
    <nav class="breadcrumb" aria-label="Catalogue position"><a href="#materials">Archive</a><span>/</span><a href="#materials-c${col.id}">Collection ${col.id} ${esc(col.name)}</a><span>/</span><span>Specimen ${s.id}</span></nav>
  </div>
  <div class="wrap">
    <div class="case-hero">
      <div>
        <div class="case-photo">
          <div data-media="${s.id}" style="display:contents">${specimenArt(s)}</div>
          <div class="watermark" data-seal="main"></div>
          <span class="label photo-note">Archive representation</span>
        </div>
        <p class="rep-note">This ${s.display === "vial" ? "jar" : "cube"} is a stylised archive representation. ${recorded(s).length ? "The material used in the experiment is described below." : "No experiment has been carried out on this specimen yet."}</p>
      </div>
      <div class="case-meta">
        <span class="spec-no">COLLECTION ${col.id} · SPECIMEN ${s.id}</span>
        <h1>${esc(s.name)}</h1>
        <table class="typed"><tbody>
          <tr><th>Collection</th><td>${col.id} ${esc(col.name)}</td></tr>
          <tr><th>Specimen ID</th><td>${s.id}</td></tr>
          <tr><th>Common name</th><td>${esc(s.name)}</td></tr>
          <tr><th>Variety / subtype</th><td>${nr(s.variety)}</td></tr>
          <tr><th>Composition</th><td>${nr(s.composition)}</td></tr>
          <tr><th>Specimen part</th><td>${nr(s.part)}</td></tr>
          <tr><th>Physical condition</th><td>${nr(s.condition)}</td></tr>
          <tr><th>Preparation / storage</th><td>${nr(s.preparation)}</td></tr>
          <tr><th>Material family</th><td>${esc(s.family)}</td></tr>
          <tr><th>Experiment records</th><td>${recorded(s).length || "None yet"}</td></tr>
          <tr><th>Human interpretations</th><td>${real.length || "None yet"}</td></tr>
          <tr><th>Embodied translations</th><td>${bodies.filter(b => !b.example).length || "None yet"}</td></tr>
        </tbody></table>
        <div class="btn-row"><a class="btn btn-primary" href="#lab-${slug(s.id)}">Translate this specimen</a><span class="stamp" style="margin-left:auto">Handle<br>with feeling</span></div>
      </div>
    </div>

    <div class="case-sections">
      <section class="card case-sec zone-evidence">
        <header><p class="mono">I / Experiment records</p><h2>Physical evidence</h2><p class="muted">What the material did. Recorded by the Institute.</p></header>
        <div>${s.experiments.length ? s.experiments.map(recordHTML).join("") : `<p>No experiment has been carried out on this specimen yet.</p><p class="hand">the cabinet holds it anyway, in case.</p>`}</div>
      </section>

      <section class="card case-sec zone-projection">
        <header><p class="mono">II / Human interpretations</p><h2>What people think it means</h2><p class="muted">Personal readings. Never properties of the material.</p></header>
        <div>
          ${words.length ? `<div class="word-cloud">${words.map(([w, n]) => `<span style="font-size:${Math.min(58, 24 + n * 8)}px">${esc(w)}</span>`).join(`<span class="sep">·</span>`)}</div>
          <p class="mono small" style="margin-top:16px;color:var(--rose-ink)">Conclusion: ${words.length > 1 ? "multiple meanings recorded" : "one meaning recorded so far"}${real.length ? "" : " (example only)"}</p>` : `<p>No meanings filed yet.</p>`}
        </div>
      </section>

      <section class="card case-sec zone-voice">
        <header><p class="mono">III / Speculative voices</p><h2>What it might say</h2><p class="muted">Written by people, in the material's voice.</p></header>
        <div>${voices.length ? voices.map(v => `<p class="voice-line">“${esc(v.voice)}”</p><p class="mono small muted" style="margin:0 0 18px">${esc(v.alias || "Anonymous translator")}${v.example ? " · example" : ""}</p>`).join("") : `<p>No voices yet. Lend it one.</p>`}</div>
      </section>

      <section class="card case-sec zone-body">
        <header><p class="mono">IV / Embodied translations</p><h2>Performed by people</h2></header>
        <div>
          ${bodies.length ? `<div class="quad-grid">${bodies.map(b => `<button class="body-tile" data-read="${esc(b.id)}"><div class="figure-mini" data-body="${esc(b.id)}"></div><span class="mono">${b.example ? "Example" : esc(b.alias || "Anonymous")} · read it</span></button>`).join("")}</div>
          <p class="hand" style="margin-top:14px">tap a body to guess what it means before you are told.</p>` : `<p>No bodies filed for this specimen yet.</p>`}
        </div>
      </section>

      <section class="card case-sec zone-turn">
        <header><p class="mono">V / Your turn</p><h2>File your reading</h2></header>
        <div>
          <p class="serif" style="font-size:28px">What does this change mean to you?</p>
          <div class="btn-row"><a class="btn btn-primary" href="#lab-${slug(s.id)}">Start a translation of ${s.id}</a></div>
        </div>
      </section>
    </div>

    <div class="btn-row" style="justify-content:space-between;margin-top:32px">
      <a class="pill" href="#materials-${slug(prev.id)}">← ${prev.id} ${esc(prev.name)}</a>
      <a class="pill" href="#materials-${slug(next.id)}">${next.id} ${esc(next.name)} →</a>
    </div>
  </div>`;

  bodies.forEach(b => mountPlayer($(`[data-body="${CSS.escape(b.id)}"]`), b.body));
  $$("[data-read]").forEach(btn => btn.addEventListener("click", () => reinterpret(rows.find(r => String(r.id) === btn.dataset.read))));
}

// ---------- REINTERPRETATION ----------
function reinterpret(entry) {
  if (!entry) return;
  const m = byId(entry.material_id) || { id: "", name: "" };
  modal(`
    <p class="eyebrow">Specimen ${esc(m.id)} / Reinterpretation</p>
    <h2 style="font-size:clamp(28px,4vw,42px)">What do you think this body is trying to say?</h2>
    <p class="muted" style="margin-top:8px">Specimen ${esc(m.id)} / ${esc(m.name)}. Watch first. The original meaning stays sealed until you answer.</p>
    <div class="grid-2" style="margin-top:18px;align-items:start">
      <div class="figure-mini" id="ri-fig"></div>
      <form id="ri-form">
        <div class="field">
          <label for="ri-text">Your reading</label>
          <input id="ri-text" class="input big" maxlength="80" required placeholder="It is saying…" autocomplete="off">
          <p class="hint">A word or a short phrase.</p>
        </div>
        <button class="btn btn-primary" type="submit">Unseal the original</button>
      </form>
    </div>
    <div id="ri-reveal"></div>`, (box) => {
    mountPlayer($("#ri-fig", box), entry.body, { trails: true });
    $("#ri-form", box).addEventListener("submit", async ev => {
      ev.preventDefault();
      const text = $("#ri-text", box).value.trim(); if (!text) return;
      const btn = $("button[type=submit]", box); btn.disabled = true;
      try { await store.addReading(entry.id, text); } catch (e) { console.error(e); }
      let others = [];
      try { others = (await store.readingsFor([entry.id])).filter(r => r.text !== text).slice(0, 8); } catch { }
      $("#ri-form", box).innerHTML = `<p class="mono muted">Reading filed</p><p class="serif" style="font-size:30px">${esc(text)}</p>`;
      $("#ri-reveal", box).innerHTML = `
        <div class="reveal">
          <div class="card unfold" style="animation-delay:.05s"><span class="mono muted">Your reading</span><p class="serif" style="font-size:32px;margin:8px 0 0">${esc(text)}</p></div>
          <div class="card unfold sealed" style="animation-delay:.35s">
            <span class="stamp confidential">Unsealed</span>
            <span class="mono muted">${esc(entry.alias || "The translator")} meant</span>
            <p class="serif" style="font-size:34px;margin:8px 0 6px;font-style:italic;color:var(--rose-ink)">${esc(latestMeaning(entry))}</p>
            ${entry.meaning_note ? `<p>${esc(entry.meaning_note)}</p>` : ""}
            ${entry.voice ? `<p class="hand">“${esc(entry.voice)}”</p>` : ""}
          </div>
        </div>
        <p class="annot"><span class="mono small muted">Finding</span><span class="hand">${text.trim().toLowerCase() === latestMeaning(entry).trim().toLowerCase() ? "the body carried the meaning across." : "one body, at least two meanings. both are on record."}</span></p>
        ${others.length ? `<p class="mono muted" style="margin-top:18px">Other readings of this body</p><div class="word-cloud">${others.map(o => `<span style="font-size:20px">${esc(o.text)}</span>`).join(`<span class="muted">·</span>`)}</div>` : ""}`;
    });
  });
}

// ---------- TRANSLATION LAB ----------
const LAB_STEPS = ["Specimen", "Observe", "Interpret", "Imagine", "Perform", "File"];
function freshDraft(material_id = "") {
  return { step: material_id ? 1 : 0, material_id, observe: { changes: [], other: "", when: "", back: "", notes: "" }, meaning: "", meaning_note: "", voice: "", embody: "borrow", body: null, own_body_note: "", alias: store.alias(), share: false };
}
async function lab(id) {
  let d = store.draft();
  if (!d || (id && d.material_id !== id)) d = freshDraft(id || "");
  if (id && d.step === 0) d.step = 1;
  if (d.material_id) d.material_id = canonical(d.material_id);
  let editor = null;
  const save = () => store.setDraft(d);
  leaving = () => { editor && editor.stop(); };
  save();

  function progress() {
    return `<div class="lab-progress" aria-label="Step ${d.step + 1} of ${LAB_STEPS.length}">${LAB_STEPS.map((s, i) => `${i ? '<span class="lab-line"></span>' : ""}<span class="lab-dot ${i < d.step ? "done" : i === d.step ? "now" : ""}" title="${s}">${i < d.step ? "✓" : String(i).padStart(2, "0")}</span>`).join("")}</div>`;
  }
  function specimenStrip() {
    const m = byId(d.material_id); if (!m) return "";
    return `<div class="lab-specimen">${specimenArt(m)}<div><span class="spec-no">SPECIMEN ${m.id}</span><div class="serif" style="font-size:24px">${esc(m.name)}</div></div><button class="link" data-act="change" style="margin-left:auto">Change</button></div>`;
  }
  const chip = (group, v, on) => `<button type="button" class="chip" data-chip="${group}" data-v="${esc(v)}" aria-pressed="${on}">${esc(v)}</button>`;

  function view() {
    const m = byId(d.material_id);
    let body = "";
    if (d.step === 0) {
      body = `<p class="mono muted">Experiment ${pad(store.mine().length + 1)} / Choose a specimen</p>
        <h2>Which material will you translate?</h2>
        <p class="instruction">Pick one. If you have the real thing nearby, press it with your palm while you work.</p>
        ${COLLECTIONS.map(c => `<div class="pick-group"><span class="mono">Collection ${c.id} · ${esc(c.name)}</span><div class="pick-grid">${specimensIn(c.id).map(x => `<button type="button" class="pick" data-pick="${x.id}">${specimenArt(x)}<span class="spec-no">${x.id}</span><div class="spec-name">${esc(x.name)}</div></button>`).join("")}</div></div>`).join("")}`;
    } else if (d.step === 1) {
      body = `${specimenStrip()}<p class="mono muted">Experiment ${m.id} / Observation</p>
        <h2>What did you see change?</h2>
        <p class="instruction">Only what you can see or feel. Meanings come next. ${mainRecord(m) ? `<br><span class="hand">institute note: ${esc(mainRecord(m).response.toLowerCase())}</span>` : ""}</p>
        <div class="field"><span class="flabel">The material…</span><div class="chips">${CHANGE_WORDS.map(w => chip("changes", w, d.observe.changes.includes(w))).join("")}</div>
          <input class="input" data-k="observe.other" placeholder="Something else? Describe it" maxlength="80" value="${esc(d.observe.other)}"></div>
        <div class="field"><span class="flabel">When did you first notice the change?</span><div class="chips">${WHEN_WORDS.map(w => chip("when", w, d.observe.when === w)).join("")}</div></div>
        <div class="field"><span class="flabel">Did it come back?</span><div class="chips">${BACK_WORDS.map(w => chip("back", w, d.observe.back === w)).join("")}</div></div>`;
    } else if (d.step === 2) {
      body = `${specimenStrip()}<p class="mono muted">Experiment ${m.id} / Human interpretation</p>
        <h2>What does this change mean to you?</h2>
        <p class="instruction">There is no correct answer. The Institute records it, it does not mark it.</p>
        <div class="field"><label for="f-meaning">Meaning, in a word or short phrase</label>
          <input id="f-meaning" class="input big" data-k="meaning" maxlength="80" placeholder="e.g. letting go" value="${esc(d.meaning)}" autocomplete="off"></div>
        <div class="field"><label for="f-note">Why? One sentence is plenty (optional)</label>
          <textarea id="f-note" class="textarea" data-k="meaning_note" maxlength="400" placeholder="Because…">${esc(d.meaning_note)}</textarea></div>`;
    } else if (d.step === 3) {
      body = `${specimenStrip()}<p class="mono muted">Experiment ${m.id} / Imagined voice</p>
        <h2>If ${esc(m.name.toLowerCase())} could speak while it changes, what would it say?</h2>
        <p class="instruction">Write in the first person, as the material. Optional, but this is often where the surprises are.</p>
        <div class="field"><label for="f-voice" class="visually-hidden">Material voice</label>
          <input id="f-voice" class="input big" data-k="voice" maxlength="200" placeholder="“I…”" value="${esc(d.voice)}" autocomplete="off"></div>`;
    } else if (d.step === 4) {
      body = `${specimenStrip()}<p class="mono muted">Experiment ${m.id} / Embodied participation</p>
        <h2>Now perform the change.</h2>
        <p class="instruction">Show how ${esc(m.name.toLowerCase())} changes, with a body. Stand up and try it with your own first, then record it here.</p>
        <div class="seg" role="group" aria-label="Which body" style="margin:14px 0 18px">
          <button type="button" data-embody="borrow" aria-pressed="${d.embody === "borrow"}">Borrow a Body</button>
          <button type="button" data-embody="own" aria-pressed="${d.embody === "own"}">Describe my own</button>
          <button type="button" data-embody="skip" aria-pressed="${d.embody === "skip"}">Skip</button>
        </div>
        <div id="embody-area"></div>`;
    } else if (d.step === 5) {
      body = `${specimenStrip()}<p class="mono muted">Experiment ${m.id} / Filing</p>
        <h2>File it in your dictionary.</h2>
        <div class="inset" style="margin:18px 0">
          <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:0">
            <dt class="mono muted">Observed</dt><dd style="margin:0">${esc([...d.observe.changes, d.observe.other].filter(Boolean).join(", ") || "—")}${d.observe.when ? ` · ${esc(d.observe.when.toLowerCase())}` : ""}${d.observe.back ? ` · ${esc(d.observe.back.toLowerCase())}` : ""}</dd>
            <dt class="mono muted">Meaning</dt><dd class="serif" style="margin:0;font-size:24px">${esc(d.meaning)}</dd>
            ${d.voice ? `<dt class="mono muted">Voice</dt><dd class="hand" style="margin:0">“${esc(d.voice)}”</dd>` : ""}
            <dt class="mono muted">Body</dt><dd style="margin:0">${d.embody === "borrow" && d.body && d.body.frames.length > 1 ? `${d.body.frames.length} poses, ${d.body.ending === "hold" ? "stays changed" : "comes back"}` : d.embody === "own" && d.own_body_note ? "described in words" : "none"}</dd>
          </dl>
        </div>
        <div class="field"><label for="f-alias">Sign it as (optional)</label>
          <input id="f-alias" class="input" data-k="alias" maxlength="40" placeholder="Anonymous translator" value="${esc(d.alias)}" autocomplete="nickname">
          <p class="hint">A first name, initials or a made-up name. Please don't use your full name.</p></div>
        <label class="check"><input type="checkbox" data-k="share" ${d.share ? "checked" : ""}>
          <span><strong>Also share it with the Collective Dictionary.</strong><br><span class="muted" style="font-size:14px">Your meaning, voice and body appear publicly with the name above, and may be quoted in Lynn Zhong's MA research. You can withdraw it later from My Dictionary on this device. <a href="#about" target="_blank">More about your data</a></span></span></label>
        ${offlineNotice()}`;
    }
    const canNext = d.step === 0 ? !!d.material_id : d.step === 2 ? !!d.meaning.trim() : true;
    main.innerHTML = `
      <div class="wrap page-head" style="padding-bottom:18px;text-align:center">
        <p class="eyebrow" style="justify-content:center">Translation Lab</p>
        <h1 style="font-size:clamp(36px,5.4vw,64px)">Become a Material Translator</h1>
      </div>
      <div class="wrap lab-shell">
        ${progress()}
        <form class="card lab-card" id="lab-form" novalidate>
          ${body}
          <div class="lab-nav">
            ${d.step > 0 ? `<button type="button" class="btn btn-ghost" data-act="back">← Back</button>` : `<span></span>`}
            ${d.step === 0 ? "" : d.step < 5 ? `<button type="submit" class="btn btn-primary" ${canNext ? "" : "disabled"}>${d.step === 4 && d.embody === "skip" ? "Skip to filing" : "Next"} →</button>` : `<button type="submit" class="btn btn-primary">${d.share ? "File & share" : "File in my dictionary"}</button>`}
          </div>
        </form>
        <p class="mono small muted" style="text-align:center;margin-top:16px">Your draft is kept on this device until you file it. <button class="link" data-act="restart">Start over</button></p>
      </div>`;
    if (d.step === 4) embodyArea();
    wire();
    const f = $("input.input, textarea", main); if (f && d.step > 1) f.focus({ preventScroll: true });
  }

  function embodyArea() {
    const area = $("#embody-area");
    editor && editor.stop(); editor = null;
    if (d.embody === "borrow") {
      area.innerHTML = `<p class="serif" style="font-size:22px;font-weight:300;margin:0 0 4px">No body available? Borrow one from the Institute.</p>
        <p class="hint muted" style="margin:0 0 14px;font-size:14px">Drag the joints into a first pose. Press <b>+ B</b> to copy it, move it into the changed shape, then press Play. Add <b>C</b> for a third stage.</p><div id="editor"></div>`;
      editor = mountEditor($("#editor"), d.body || defaultBody(), b => { d.body = b; save(); });
      if (!d.body) { d.body = editor.get(); save(); }
    } else if (d.embody === "own") {
      area.innerHTML = `<div class="field"><label for="f-own">How did your body move? Where did the force enter, where did it stay?</label>
        <textarea id="f-own" class="textarea" data-k="own_body_note" maxlength="400" placeholder="I curled my shoulders in fast, then slowly opened my hands…">${esc(d.own_body_note)}</textarea>
        <p class="hint">Words only. The Institute does not collect photos or video of visitors.</p></div>`;
      $("#f-own").addEventListener("input", e => { d.own_body_note = e.target.value; save(); });
    } else {
      area.innerHTML = `<p class="muted">That's fine. You can file the meaning without a body.</p>`;
    }
  }

  function wire() {
    const form = $("#lab-form");
    $$("[data-k]", form).forEach(el => {
      const k = el.dataset.k;
      const ev = el.type === "checkbox" ? "change" : "input";
      el.addEventListener(ev, () => {
        const val = el.type === "checkbox" ? el.checked : el.value;
        if (k.startsWith("observe.")) d.observe[k.split(".")[1]] = val; else d[k] = val;
        save();
        if (k === "meaning") { const b = $("button[type=submit]", form); b.disabled = !val.trim(); }
        if (k === "share") { $("button[type=submit]", form).textContent = val ? "File & share" : "File in my dictionary"; }
      });
    });
    $$("[data-chip]", form).forEach(b => b.addEventListener("click", () => {
      const g = b.dataset.chip, v = b.dataset.v;
      if (g === "changes") {
        const s = new Set(d.observe.changes); s.has(v) ? s.delete(v) : s.add(v); d.observe.changes = [...s];
        b.setAttribute("aria-pressed", String(s.has(v)));
      } else {
        d.observe[g] = d.observe[g] === v ? "" : v;
        $$(`[data-chip="${g}"]`, form).forEach(x => x.setAttribute("aria-pressed", String(x.dataset.v === d.observe[g])));
      }
      save();
    }));
    $$("[data-pick]", form).forEach(b => b.addEventListener("click", () => { d.material_id = b.dataset.pick; d.step = 1; save(); history.replaceState(null, "", `#lab-${slug(d.material_id)}`); view(); }));
    $$("[data-embody]", form).forEach(b => b.addEventListener("click", () => {
      d.embody = b.dataset.embody; save();
      $$("[data-embody]", form).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      embodyArea();
      const sub = $("button[type=submit]", form); sub.textContent = d.embody === "skip" ? "Skip to filing →" : "Next →";
    }));
    $('[data-act="back"]', main)?.addEventListener("click", () => { d.step = Math.max(0, d.step - 1); save(); view(); });
    $('[data-act="change"]', main)?.addEventListener("click", () => { d.step = 0; save(); view(); });
    $('[data-act="restart"]', main)?.addEventListener("click", async () => { if (await ask("Clear this draft and start again?", "Clear draft")) { d = freshDraft(); save(); history.replaceState(null, "", "#lab"); view(); } });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (d.step === 2 && !d.meaning.trim()) return;
      if (d.step < 5) { if (d.step === 4) editor && editor.stop(); d.step++; save(); view(); window.scrollTo({ top: 0 }); return; }
      await fileEntry();
    });
  }

  async function fileEntry() {
    const btn = $("#lab-form button[type=submit]"); btn.disabled = true; btn.textContent = "Filing…";
    store.setAlias(d.alias.trim());
    const entry = {
      material_id: d.material_id, alias: d.alias.trim(),
      observe: d.observe, meaning: d.meaning.trim(), meaning_note: d.meaning_note.trim(), voice: d.voice.trim().replace(/^["“]|["”]$/g, ""),
      body: d.embody === "borrow" && d.body && d.body.frames.length > 1 ? d.body : null,
      own_body_note: d.embody === "own" ? d.own_body_note.trim() : ""
    };
    const saved = store.addMine(entry);
    let sharedOk = false;
    if (d.share) {
      try { const rid = await store.share(saved); store.updateMine(saved.id, { shared: true, remote_id: rid }); sharedOk = true; store.invalidate(); }
      catch (err) { console.error(err); toast("Saved to your dictionary, but sharing failed. You can try again from My Dictionary."); }
    }
    const m = byId(d.material_id);
    store.setDraft(null);
    main.innerHTML = `
      <div class="wrap lab-shell section" style="text-align:center">
        <div class="panel" style="padding:clamp(28px,5vw,60px)">
          <div data-seal="main" style="width:120px;margin:0 auto 18px;filter:var(--seal-press)"></div>
          <p class="mono muted">Entry Nº ${pad(saved.no)} / Specimen ${m.id} / ${esc(m.name)}</p>
          <h2 style="font-size:clamp(40px,6vw,72px);margin:14px 0">${esc(saved.meaning)}</h2>
          <span class="stamp">Filed${sharedOk ? " & shared" : ""}<br>${fmtDate(saved.created_at)}</span>
          <p style="margin:26px auto 22px;max-width:46ch">${sharedOk ? "Your translation is now on the Collective Dictionary wall. Others may read your body and file what they think it says." : "Your translation is in your personal dictionary on this device."} Come back in a few days and see if the meaning still holds.</p>
          <div class="btn-row" style="justify-content:center">
            <a class="btn btn-primary" href="#me">Open My Dictionary</a>
            <a class="btn" href="#collective">See the Collective</a>
            <a class="btn btn-ghost" href="#lab">Translate another</a>
          </div>
        </div>
      </div>`;
    stampSeals(main);
  }

  view();
}

// ---------- MY DICTIONARY ----------
async function me() {
  const list = store.mine();
  const shared = list.filter(e => e.shared && e.remote_id);
  let readings = [];
  try { readings = await store.readingsFor(shared.map(e => e.remote_id)); } catch (e) { console.error(e); }

  main.innerHTML = `
  <div class="wrap page-head">
    <div class="panel dict-cover">
      <div class="seal" data-seal="main"></div>
      <div>
        <p class="mono muted">Personal dictionary / Office of Human Interpretation</p>
        <label class="visually-hidden" for="alias">Your dictionary name</label>
        <h1 style="font-size:clamp(22px,2.6vw,28px);margin:12px 0 4px" class="serif">The material dictionary of</h1>
        <input id="alias" class="alias-edit" maxlength="40" placeholder="an anonymous translator" value="${esc(store.alias())}">
        <p class="mono small muted" style="margin-top:12px">${list.length} entr${list.length === 1 ? "y" : "ies"} · ${shared.length} shared · kept in this browser</p>
      </div>
      <div class="btn-row" style="flex-direction:column;align-items:stretch">
        <a class="btn btn-primary" href="#lab">New translation</a>
        ${list.length ? `<button class="btn btn-small" data-act="export">Download a copy</button>` : ""}
      </div>
    </div>
  </div>
  <div class="wrap">
    ${list.length ? `<div class="entries">${list.map(e => entryCard(e, readings.filter(r => r.entry_id === e.remote_id))).join("")}</div>` :
      `<div class="empty"><h3>Your dictionary has no entries yet.</h3><p>Each translation you file becomes a page here: what you saw, what it meant, and how that meaning changes over time.</p><a class="btn btn-primary" href="#lab">Translate your first material</a></div>`}
    <p class="mono small muted" style="margin-top:28px">Entries live in this browser only. Clearing site data or switching device will lose them, so download a copy if they matter to you.</p>
  </div>`;

  list.forEach(e => e.body && mountPlayer($(`[data-mine="${e.id}"]`), e.body));
  $("#alias").addEventListener("change", ev => { store.setAlias(ev.target.value.trim()); toast("Name updated"); });
  $('[data-act="export"]', main)?.addEventListener("click", () => download("iam-my-dictionary.json", store.exportAll()));
  const onClick = async ev => {
    const b = ev.target.closest("[data-e]"); if (!b) return;
    const e = store.getMine(b.dataset.e); if (!e) return;
    const act = b.dataset.do;
    if (act === "revise") return revise(e);
    if (act === "share") {
      b.disabled = true;
      try { const rid = await store.share(e); store.updateMine(e.id, { shared: true, remote_id: rid }); store.invalidate(); toast("Shared with the Collective Dictionary"); }
      catch (err) { console.error(err); toast("Sharing failed. Please try again later."); }
      return render();
    }
    if (act === "unshare") {
      if (!(await ask("Withdraw this entry from the Collective Dictionary? It stays in your own dictionary.", "Withdraw"))) return;
      try { await store.unshare(e.remote_id); store.updateMine(e.id, { shared: false, remote_id: null }); store.invalidate(); toast("Withdrawn from the Collective"); }
      catch (err) { console.error(err); toast("Could not withdraw it. Please try again."); }
      return render();
    }
    if (act === "delete") {
      if (!(await ask("Delete this entry from your dictionary?" + (e.shared ? " It will also be withdrawn from the Collective." : ""), "Delete"))) return;
      if (e.shared && e.remote_id) { try { await store.unshare(e.remote_id); store.invalidate(); } catch (err) { console.error(err); } }
      store.deleteMine(e.id); toast("Entry deleted"); return render();
    }
  };
  main.addEventListener("click", onClick);
  leaving = () => main.removeEventListener("click", onClick);
}

function entryCard(e, readings = []) {
  const m = byId(e.material_id) || { id: e.material_id, name: "?" };
  const revs = e.revisions || [];
  const current = revs.length ? revs[revs.length - 1] : null;
  return `<article class="card entry ${revs.length ? "layered" : ""}">
    <div class="entry-head"><span class="spec-no">Nº ${pad(e.no || 0)} · ${m.id} / ${esc(m.name.toUpperCase())}</span><span class="mono small muted">${fmtDate(e.created_at)}</span></div>
    ${current ? `
      <div><span class="mono small muted">Original meaning</span><p class="meaning old">${esc(e.meaning)}</p></div>
      <div><span class="mono small" style="color:var(--burgundy)">Revised meaning · ${fmtDate(current.at)}</span><p class="meaning">${esc(current.meaning)}</p>${current.note ? `<p class="hand" style="font-size:20px">${esc(current.note)}</p>` : ""}</div>
      ${revs.length > 1 ? `<div class="revision-trail">${revs.slice(0, -1).map(r => `<span class="mono small muted">${fmtDate(r.at)} · ${esc(r.meaning)}</span>`).join("")}</div>` : ""}`
      : `<div><span class="mono small muted">Meaning</span><p class="meaning">${esc(e.meaning)}</p></div>`}
    ${e.meaning_note ? `<p style="font-size:15px;margin:0">${esc(e.meaning_note)}</p>` : ""}
    ${e.voice ? `<p class="voice">“${esc(e.voice)}”</p>` : ""}
    ${e.body ? `<div class="mini-wrap"><div class="figure-mini" data-mine="${e.id}"></div></div>` : e.own_body_note ? `<p class="mono small muted">Own body: <span style="text-transform:none;letter-spacing:0;font-family:var(--sans);font-size:14px;color:var(--ink)">${esc(e.own_body_note)}</span></p>` : ""}
    ${e.observe && (e.observe.changes?.length || e.observe.other) ? `<dl><dt>Observed</dt><dd>${esc([...(e.observe.changes || []), e.observe.other].filter(Boolean).join(", "))}</dd></dl>` : ""}
    ${readings.length ? `<div class="inset" style="padding:12px 14px"><span class="mono small muted">Others read your body as</span><p class="serif" style="margin:6px 0 0;font-size:18px">${readings.slice(0, 6).map(r => esc(r.text)).join(" · ")}</p></div>` : ""}
    <div class="actions">
      <button class="btn btn-small btn-primary" data-e="${e.id}" data-do="revise">Revisit</button>
      ${e.shared ? `<button class="btn btn-small" data-e="${e.id}" data-do="unshare">Withdraw from Collective</button>` : `<button class="btn btn-small" data-e="${e.id}" data-do="share">Share</button>`}
      <button class="btn btn-small btn-ghost" data-e="${e.id}" data-do="delete">Delete</button>
    </div>
  </article>`;
}

function revise(e) {
  const m = byId(e.material_id);
  const current = latestMeaning(e);
  modal(`
    <p class="eyebrow">Reflection & revision / Specimen ${m.id} ${esc(m.name)}</p>
    <h2 style="font-size:clamp(28px,4vw,42px)">Does “${esc(current)}” still feel true?</h2>
    <p class="muted" style="margin-top:8px">Filed ${fmtDate(e.created_at)}. Look at the change again${e.body ? ", watch your body," : ""} and see what it means today. The original is never erased; a revision is layered on top.</p>
    ${e.body ? `<div style="max-width:260px;margin:16px 0"><div class="figure-mini" id="rv-fig"></div></div>` : ""}
    <form id="rv-form">
      <div class="field"><label for="rv-m">What it means now</label><input id="rv-m" class="input big" maxlength="80" required value="" placeholder="${esc(current)}" autocomplete="off"></div>
      <div class="field"><label for="rv-n">What changed for you? (optional)</label><textarea id="rv-n" class="textarea" maxlength="300"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" type="submit">Layer this revision</button><button class="btn btn-ghost" type="button" data-same>It still holds</button></div>
    </form>`, (box, close) => {
    if (e.body) mountPlayer($("#rv-fig", box), e.body, { trails: true });
    const finish = async (meaning, note) => {
      const revisions = [...(e.revisions || []), { at: new Date().toISOString(), meaning, note }];
      const upd = store.updateMine(e.id, { revisions });
      if (upd.shared && upd.remote_id) { try { await store.updateShared(upd.remote_id, upd); store.invalidate(); } catch (err) { console.error(err); toast("Revision saved here; the shared copy could not be updated."); } }
      close(); toast("Revision layered"); render();
    };
    $("#rv-form", box).addEventListener("submit", ev => { ev.preventDefault(); const v = $("#rv-m", box).value.trim(); if (v) finish(v, $("#rv-n", box).value.trim()); });
    $("[data-same]", box).addEventListener("click", () => finish(current, "It still holds."));
  });
}

// ---------- COLLECTIVE ----------
async function collective(viewName = "words", matParam = "") {
  const rows = await collectiveRows();
  const realCount = rows.filter(r => !r.example).length;
  const mat = matParam || "";
  const filtered = mat ? rows.filter(r => r.material_id === mat) : rows;

  main.innerHTML = `
  <div class="wrap page-head">
    <p class="eyebrow">Collective Dictionary</p>
    <h1>A wall of collected meanings</h1>
    <p class="lede">${realCount ? `${realCount} translation${realCount > 1 ? "s" : ""} filed by visitors so far.` : "No visitor translations yet: the entries marked Example show the format."} The archive is formal; the meanings are not.</p>
  </div>
  <div class="wrap">
    ${offlineNotice()}
    <div class="view-tabs" style="margin-top:18px">
      <a class="pill ${viewName === "words" ? "is-on" : ""}" href="#collective-words${mat ? "-" + slug(mat) : ""}">Words</a>
      <a class="pill ${viewName === "bodies" ? "is-on" : ""}" href="#collective-bodies${mat ? "-" + slug(mat) : ""}">Bodies · Atlas</a>
      <a class="pill ${viewName === "traces" ? "is-on" : ""}" href="#collective-traces${mat ? "-" + slug(mat) : ""}">Traces</a>
      <label class="visually-hidden" for="mat-filter">Filter by specimen</label>
      <select id="mat-filter" class="select" style="width:auto;margin-left:auto;padding:9px 14px;font-size:14px">
        <option value="">All specimens</option>
        ${SPECIMENS.map(m => `<option value="${m.id}" ${m.id === mat ? "selected" : ""}>${m.id} ${esc(m.name)}</option>`).join("")}
      </select>
    </div>
    <div id="cview"></div>
  </div>`;
  $("#mat-filter").addEventListener("change", ev => { location.hash = `#collective-${viewName}${ev.target.value ? "-" + slug(ev.target.value) : ""}`; });
  const box = $("#cview");

  if (viewName === "words") {
    const groups = SPECIMENS.map(m => [m, filtered.filter(r => r.material_id === m.id)]).filter(([, l]) => l.length);
    box.innerHTML = groups.length ? groups.map(([m, l]) => {
      const tr = l.slice(0, 3).map((r, i) => `<div class="row rose"><span>Human translation ${"ABC"[i]}:</span><span>${esc(latestMeaning(r))}</span></div>`).join("");
      return `<section class="material-group">
        <header><div class="head-art">${specimenArt(m)}<h3>${m.id} ${esc(m.name)}</h3></div><a class="pill" href="#materials-${slug(m.id)}">Case file →</a></header>
        <div class="wall">
          <div class="card summary-card">
            <div class="row"><span>Specimen</span><span>${m.id} / ${esc(m.name)}</span></div>
            <div class="row"><span>Observed physical change:</span><span>${esc(behaviourOf(m) || "No experiment recorded yet")}</span></div>
            ${tr}
            <div class="row rose"><span>Conclusion:</span><span>${new Set(l.map(r => latestMeaning(r).toLowerCase())).size > 1 ? "Multiple meanings recorded" : "One meaning recorded, so far"}</span></div>
          </div>
          ${l.map(r => quoteCard(r, { showMaterial: false })).join("")}
        </div>
      </section>`;
    }).join("") : emptyCollective();
  }

  if (viewName === "bodies") {
    const bodies = filtered.filter(r => r.body && r.body.frames && r.body.frames.length > 1);
    const quad = (sp, en) => bodies.filter(r => (sp === "fast" ? (r.body.speed ?? .5) >= .5 : (r.body.speed ?? .5) < .5) && (r.body.ending || "return") === en);
    const tile = r => `<button class="body-tile" data-read="${esc(r.id)}" aria-label="Read this body"><div class="figure-mini" data-b="${esc(r.id)}"></div><span class="mono">${(byId(r.material_id)?.id) || ""} · ${r.example ? "example" : esc(r.alias || "anonymous")}</span></button>`;
    box.innerHTML = bodies.length ? `
      <p class="muted" style="max-width:60ch">The Body Atlas sorts every performed body by the two things the Institute measures in materials: how fast the change happens and whether it comes back. Tap a body to guess its meaning before it is revealed.</p>
      <div class="atlas" style="margin-top:20px">
        <span class="corner-blank"></span><span class="axis-x">Fast change</span><span class="axis-x">Slow change</span>
        <span class="axis-y">Comes back</span>
        <div class="quad" style="background:var(--pink)"><span class="mono">Instant · comes back</span><div class="quad-grid">${quad("fast", "return").map(tile).join("") || '<p class="mono small muted">none yet</p>'}</div></div>
        <div class="quad" style="background:var(--butter)"><span class="mono">Delayed · comes back</span><div class="quad-grid">${quad("slow", "return").map(tile).join("") || '<p class="mono small muted">none yet</p>'}</div></div>
        <span class="axis-y">Stays changed</span>
        <div class="quad" style="background:var(--blue)"><span class="mono">Instant · stays changed</span><div class="quad-grid">${quad("fast", "hold").map(tile).join("") || '<p class="mono small muted">none yet</p>'}</div></div>
        <div class="quad" style="background:var(--sage)"><span class="mono">Delayed · stays changed</span><div class="quad-grid">${quad("slow", "hold").map(tile).join("") || '<p class="mono small muted">none yet</p>'}</div></div>
      </div>` : emptyCollective("No bodies filed yet.");
    bodies.forEach(r => mountPlayer($(`[data-b="${CSS.escape(String(r.id))}"]`, box), r.body));
    $$("[data-read]", box).forEach(b => b.addEventListener("click", () => reinterpret(filtered.find(r => String(r.id) === b.dataset.read))));
  }

  if (viewName === "traces") {
    const groups = SPECIMENS.map(m => [m, filtered.filter(r => r.material_id === m.id && r.body && r.body.frames && r.body.frames.length > 1)]).filter(([, l]) => l.length);
    const revised = filtered.filter(r => r.revisions && r.revisions.length);
    box.innerHTML = `
      <p class="muted" style="max-width:62ch">Traces are what is left after a change. Here: the paths of every body's head, hands and feet overlaid per specimen, and meanings that people went back and revised.</p>
      ${groups.length ? `<h2 style="font-size:32px;margin:28px 0 16px">Movement traces</h2><div class="traces-overlay">${groups.map(([m, l]) => `<div class="card trace-card">${tracesSVG(l.map(r => r.body))}<p class="spec-no" style="margin-top:10px">${m.id} / ${esc(m.name.toUpperCase())} · ${l.length} bod${l.length > 1 ? "ies" : "y"}</p></div>`).join("")}</div>` : ""}
      <h2 style="font-size:32px;margin:40px 0 16px">Revised meanings</h2>
      ${revised.length ? `<div class="entries">${revised.map(r => { const m = byId(r.material_id); return `<article class="card entry layered"><span class="spec-no">${m.id} / ${esc(m.name.toUpperCase())}</span><div><span class="mono small muted">Original meaning</span><p class="meaning old">${esc(r.meaning)}</p></div>${r.revisions.map(v => `<div><span class="mono small" style="color:var(--burgundy)">Revised${r.example ? "" : " · " + fmtDate(v.at)}</span><p class="meaning" style="font-size:28px">${esc(v.meaning)}</p>${v.note ? `<p class="hand" style="font-size:20px">${esc(v.note)}</p>` : ""}</div>`).join("")}<p class="mono small muted">${esc(r.alias || "Anonymous")}${r.example ? " · example" : ""}</p></article>`; }).join("")}</div>` : `<p class="muted">Nobody has revised a shared meaning yet.</p>`}`;
  }
}
const emptyCollective = (t = "Nothing filed for this specimen yet.") => `<div class="empty"><h3>${t}</h3><p>Translate a material and choose to share it.</p><a class="btn btn-primary" href="#lab">Open the Translation Lab</a></div>`;

// ---------- ABOUT ----------
async function about() {
  main.innerHTML = `
  <div class="wrap page-head">
    <p class="eyebrow">About the Institute</p>
    <h1>About &amp; your data</h1>
  </div>
  <div class="wrap grid-2" style="align-items:start">
    <div class="prose">
      <h2>The research</h2>
      <p>The Institute of Animate Matter (I.A.M.) is a fictional institution created for <em>UX of Respond</em>, an MA User Experience Design project by Lynn Zhong at the University of the Arts London, 2026.</p>
      <p>The project asks: <strong>how can the way materials change become a language that people read and perform with their bodies?</strong> Materials respond to force at different speeds, and some come back while others keep the change. People read those responses, give them meanings, and act them out.</p>
      <p>The institutional labels on this site (certified findings, specimen records) are playful branding. Meanings filed here are personal interpretations. They are never presented as properties of the materials.</p>
      <h2>Your data</h2>
      <ul>
        <li><strong>My Dictionary</strong> is stored only in your browser. Nobody else, including the researcher, can see it unless you share an entry.</li>
        <li><strong>Shared entries</strong> (meaning, sentence, material voice, body movement, the name you sign with, date) are public on the Collective Dictionary and may be quoted, anonymously or with the name you chose, in the MA research and its exhibition.</li>
        <li><strong>Readings</strong> you type when guessing someone's body are stored with that entry, without a name.</li>
        <li>No email, account, photo, video, location or tracking cookies are collected. An anonymous technical ID in your browser lets you withdraw your own shared entries later.</li>
        <li>To withdraw, use “Withdraw from Collective” in My Dictionary on the same device, or contact the researcher through UAL.</li>
      </ul>
    </div>
    <div class="panel" style="text-align:center">
      <div data-seal="main" style="width:200px;margin:0 auto 18px;filter:var(--seal-press)"></div>
      <p class="mono">Institute of Animate Matter</p>
      <p class="mono muted">Department of Material Responses</p>
      <p class="mono muted">Office of Human Interpretation</p>
      <p class="hand" style="margin-top:18px">materials have not confirmed their participation.</p>
    </div>
  </div>`;
}

function notFound() {
  return `<div class="wrap section" style="text-align:center"><span class="stamp">Specimen missing</span><h1 style="font-size:56px;margin:24px 0 12px">This page has deformed beyond recognition.</h1><a class="btn btn-primary" href="#">Back to the Institute</a></div>`;
}

// ---------- boot ----------
stampSeals(document);
render();
