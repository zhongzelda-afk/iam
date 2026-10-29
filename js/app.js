import { allMaterials, setCommunity, byId, canonical, SPEEDS, AFTERS, EXAMPLES } from "./data.js";
import { mark, specimenArt, emptyJar } from "./art.js";
import { mountEditor, mountPlayer, defaultPose } from "./body.js";
import * as store from "./store.js";

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const main = $("#main");
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
const latestMeaning = e => (e.revisions && e.revisions.length ? e.revisions[e.revisions.length - 1].meaning : e.meaning);
const no = m => m.no || m.id;
const art = m => m.photo ? `<img src="assets/materials/${m.id}.jpg" alt="${esc(m.name)}" loading="lazy">` : specimenArt(m);
const unknown = id => ({ id, name: "Unknown material", display: "cube", tex: "community", experiments: [] });
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const transition = fn => (document.startViewTransition && !calm()) ? document.startViewTransition(fn) : (fn(), null);

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3200);
}
window.addEventListener("iam:toast", e => toast(e.detail));

// centred dialog, used for short confirmations and expanded cards
function modal(html, onMount, onClose, { wide = false } = {}) {
  const root = $("#modal-root");
  const last = document.activeElement;
  root.innerHTML = `<div class="modal-backdrop"><div class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true">${html}<button class="modal-close" data-close aria-label="Close">×</button></div></div>`;
  const bd = $(".modal-backdrop", root);
  const close = () => { root.innerHTML = ""; document.removeEventListener("keydown", onKey); last && last.focus && last.focus(); onClose && onClose(); };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  bd.addEventListener("click", e => { if (e.target === bd || e.target.closest("[data-close]")) close(); });
  const first = $("input, textarea, button:not([data-close])", bd); (first || $(".modal", bd)).focus?.();
  onMount && onMount($(".modal", bd), close);
  return close;
}

// side panel that slides in from the right, used for the one-question-at-a-time flows
function panel(label, onMount, onClose) {
  const root = $("#modal-root");
  const last = document.activeElement;
  root.innerHTML = `<div class="panel-backdrop"></div><aside class="side" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="side-body"></div><button class="modal-close" data-close aria-label="Close">×</button></aside>`;
  const side = $(".side", root);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", onKey);
    const done = () => { root.innerHTML = ""; last && last.focus && last.focus(); onClose && onClose(); };
    if (calm()) return done();
    side.classList.add("closing"); setTimeout(done, 240);
  };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  $(".panel-backdrop", root).addEventListener("click", close);
  side.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
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

async function loadMaterials() {
  const slow = new Promise((_, no) => setTimeout(() => no(new Error("Materials took too long")), 6000));
  try { setCommunity(await Promise.race([store.listMaterials(), slow])); } catch (e) { console.error(e); }
}

// body translations for the Institute's interpretations
const pose = (o = {}) => { const p = defaultPose(); const a = { ...p.a, ...(o.a || {}) }; return { ...p, ...o, a }; };
const EXAMPLE_BODIES = {
  "ex-1": { speed: .85, ending: "return", frames: [pose(), pose({ squash: .56, a: { lElbow: 250, lHand: -100, rElbow: 110, rHand: 100, lKnee: 120, rKnee: 60 } })] },
  "ex-2": { speed: .08, ending: "hold", frames: [pose({ a: { lElbow: 270, lHand: 0, rElbow: 90, rHand: 0 } }), pose({ squash: .82, a: { chest: -70, lElbow: 230, rElbow: 140, lKnee: 120, lFoot: -40, rKnee: 70, rFoot: 30 } }), pose({ squash: .5, y: 230, a: { chest: -20, neck: 10, lElbow: 170, rElbow: 200, lKnee: 160, lFoot: 0, rKnee: 20, rFoot: 0 } })] },
  "ex-3": { speed: .92, ending: "hold", frames: [pose({ a: { lElbow: 250, rElbow: 110 } }), pose({ squash: .78, a: { chest: -110, neck: 30, head: 20, lElbow: 100, lHand: -120, rElbow: 40, rHand: 140, lKnee: 130, lFoot: -90, rKnee: 60, rFoot: 80 } })] }
};
const institute = id => EXAMPLES.filter(e => e.material_id === id).map(e => ({ ...e, body: EXAMPLE_BODIES[e.id] }));
const hasBody = e => e && e.body && e.body.frames && e.body.frames.length > 1;

// everyone's shared interpretations of one material, then the Institute's
async function interpretationsOf(id) {
  let rows = [];
  try { rows = (await store.listShared()).map(r => ({ ...r, material_id: canonical(r.material_id) })).filter(r => r.material_id === id); }
  catch (e) { console.error(e); toast("The shared archive could not be reached."); }
  return [...rows, ...institute(id)];
}

// ---------- router ----------
const ID = "(\\d{3}|c-[a-z0-9]{8})";
const routes = [
  [/^$/, home],
  [/^archive$/, archive],
  [new RegExp(`^archive-${ID}$`), detail],
  [/^collection$/, collection],
  [/^about$/, about]
];
// addresses from earlier versions of the site
const legacy = path => {
  let m;
  if ((m = path.match(/^materials-(\d{3}-\d{2})$/))) return "archive-" + canonical(m[1].replace("-", "."));
  if ((m = path.match(new RegExp(`^play-${ID}$`)))) return "archive-" + m[1];
  if (/^(materials|collective|lab|play)/.test(path)) return "archive";
  if (path === "me") return "collection";
  return null;
};
const navKey = path => path.startsWith("archive") ? "archive" : path.startsWith("collection") ? "collection" : path === "" ? "home" : "";
const currentPath = () => location.hash.replace(/^#\/?/, "").replace(/\//g, "-");

let leaving = null;
async function render() {
  const path = currentPath();
  if (path === "main") { history.replaceState(null, "", "#" + (render.last || "")); main.focus(); return; }
  const moved = legacy(path);
  if (moved !== null) { history.replaceState(null, "", "#" + moved); return render(); }
  const sameRoute = path === render.last;
  render.last = path;
  if (leaving) { leaving(); leaving = null; }
  $$(".nav [data-nav]").forEach(a => a.dataset.nav === navKey(path) ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  const route = routes.find(([re]) => re.test(path));
  const y = window.scrollY;
  if (!route) main.innerHTML = notFound();
  else await route[1](...path.match(route[0]).slice(1));
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
  const t = transition(async () => { before && before(); history.pushState(null, "", hash); await render(); after && after(); });
  return t;
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
// a soft light follows the pointer across a specimen
main.addEventListener("pointermove", e => {
  const img = e.target.closest(".spec .img"); if (!img) return;
  const r = img.getBoundingClientRect();
  img.style.setProperty("--lx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
  img.style.setProperty("--ly", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
});

// ---------- fragments ----------
const specLink = m => `<a class="spec" href="#archive-${m.id}" data-id="${m.id}" data-tex="${esc(m.tex)}" data-speed="${m.speed || ""}" data-after="${m.after || ""}" ${m.community ? "data-community" : ""}>
  <div class="img">${art(m)}</div>
  <div class="meta"><span class="no">${no(m)}</span><span class="name">${esc(m.name)}</span>${m.community ? `<span class="tag-community">Community</span>` : ""}</div>
</a>`;

const matrix = m => `<span class="matrix" role="img" aria-label="${SPEEDS[m.speed]}, ${AFTERS[m.after]}">${["instant", "delayed"].map(sp => ["returns", "keeps"].map(af =>
  `<span class="${sp === m.speed && af === m.after ? "on" : ""}">${SPEEDS[sp]} · ${af === "returns" ? "Comes back" : "Keeps the change"}</span>`).join("")).join("")}</span>`;

const savedMark = `<svg class="saved-mark" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25" fill="none" stroke-width="1.5"/><path d="M18 29 l7 7 l13 -15" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---------- HOME ----------
async function home() {
  const shelf = ["001", "004", "003", "008"].map(byId);
  main.innerHTML = `
  <section class="wrap hero">
    <div>
      <h1>One Material. Many Meanings.</h1>
      <p>An evolving archive of materials and the meanings we give them.</p>
      <div class="row"><a class="btn btn-primary" href="#archive">Explore Archive</a></div>
    </div>
    <div class="shelf">${shelf.map(m => `<a class="spec" href="#archive-${m.id}" data-id="${m.id}" data-tex="${m.tex}" aria-label="${esc(m.name)}"><div class="img">${art(m)}</div></a>`).join("")}</div>
  </section>`;
}

// ---------- ARCHIVE ----------
const FILTERS = [["all", "All"], ["returns", "Comes back"], ["keeps", "Keeps the change"], ["instant", "Instant"], ["delayed", "Delayed"], ["community", "Community"]];
let archiveFilter = "all";
async function archive() {
  await loadMaterials();
  const list = allMaterials();
  const filters = FILTERS.filter(([k]) => k !== "community" || list.some(m => m.community));
  if (!filters.some(([k]) => k === archiveFilter)) archiveFilter = "all";
  main.innerHTML = `
  <div class="wrap page">
    <div class="page-head">
      <div><h1>Archive</h1><p>Eleven founding materials. Add the next one.</p></div>
      <div class="filter-row" role="group" aria-label="Filter materials">${filters.map(([k, l]) => `<button class="chip" type="button" data-filter="${k}" aria-pressed="${k === archiveFilter}">${l}</button>`).join("")}</div>
    </div>
    <div class="grid">
      ${list.map(specLink).join("")}
      ${Array.from({ length: 4 }, (_, i) => `<button class="spec empty" data-add data-slot="${i}" type="button" aria-label="Add a material"><div class="img">${emptyJar()}<span class="add">+ Add a Material</span></div><div class="meta"><span class="no">&nbsp;</span></div></button>`).join("")}
    </div>
  </div>`;
  const apply = () => $$(".spec[data-id]", main).forEach(s => {
    const d = s.dataset, f = archiveFilter;
    s.classList.toggle("hide", !(f === "all" || (f === "community" ? "community" in d : d.speed === f || d.after === f)));
  });
  apply();
  $$("[data-filter]", main).forEach(b => b.addEventListener("click", () => {
    if (b.dataset.filter === archiveFilter) return;
    const items = $$(".grid > .spec", main);
    items.forEach((s, i) => { s.style.viewTransitionName = "s" + i; });
    const t = transition(() => {
      archiveFilter = b.dataset.filter;
      $$("[data-filter]", main).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    });
    const clear = () => items.forEach(s => { s.style.viewTransitionName = ""; });
    t ? t.finished.finally(clear) : clear();
  }));
  $$("[data-add]", main).forEach(b => b.addEventListener("click", addMaterial));
}

// registration: one question at a time
function addMaterial() {
  const d = { name: "", note: "" };
  let step = 0;
  panel("Add a material", (body, close) => {
    const view = () => {
      const back = step > 0 ? `<button class="btn btn-quiet btn-small" type="button" data-back style="justify-self:start">← Back</button>` : "";
      if (step === 0) body.innerHTML = `<form class="step">${back}
        <span class="label">New material</span>
        <h2>What is it called?</h2>
        <input class="answer" id="nm" maxlength="40" autocomplete="off" placeholder="e.g. Marshmallow" value="${esc(d.name)}">
        <div class="step-actions"><button class="btn btn-primary" type="submit" ${d.name.trim() ? "" : "disabled"}>Next</button></div></form>`;
      if (step === 1) body.innerHTML = `<form class="step">${back}
        <span class="label">${esc(d.name)}</span>
        <h2>What happens when you press it?</h2>
        <p class="hint">Only what you see or feel. Optional.</p>
        <input class="answer" id="nt" maxlength="160" autocomplete="off" placeholder="It squashes, then slowly rises." value="${esc(d.note)}">
        <div class="step-actions"><button class="btn btn-primary" type="submit">Next</button></div></form>`;
      if (step === 2) body.innerHTML = `<form class="step">${back}
        <span class="label">${esc(d.name)}</span>
        <h2>Add it to the archive?</h2>
        <p class="hint">It joins as a community submission, clearly marked.</p>
        ${store.online() ? "" : `<p class="notice">The shared archive is not connected yet, so it stays on this device for now.</p>`}
        <div class="step-actions"><button class="btn btn-primary" type="submit">Add to archive</button></div></form>`;
      const form = $("form", body);
      const inp = $("input", form);
      if (inp) { inp.focus({ preventScroll: true }); inp.addEventListener("input", () => { if (step === 0) { d.name = inp.value; $("button[type=submit]", form).disabled = !d.name.trim(); } else d.note = inp.value; }); }
      $("[data-back]", form)?.addEventListener("click", () => { step--; view(); });
      form.addEventListener("submit", async e => {
        e.preventDefault();
        if (step < 2) { if (step === 0 && !d.name.trim()) return; step++; return view(); }
        const btn = $("button[type=submit]", form); btn.disabled = true;
        try {
          const row = await store.addMaterial({ name: d.name, note: d.note });
          close(); toast("Added to the archive");
          location.hash = "#archive-" + row.id;
        } catch (err) { console.error(err); btn.disabled = false; toast("Could not add it. Please try again."); }
      });
    };
    view();
  });
}

// ---------- MATERIAL CASE FILE ----------
function fullRecord(m, inst) {
  const sp = m.specimen;
  const dl = rows => `<dl class="dict">${rows.filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
  const obs = m.def || m.language ? `<div class="rec-block">
      <span class="kind kind-obs">Physical observation · recorded by the Institute</span>
      ${m.def ? `<p>${esc(m.def)}</p>` : ""}
      ${dl([
        ["Material language", m.language ? `${esc(m.language)}${m.speed ? matrix(m) : ""}` : ""],
        ["Response speed", SPEEDS[m.speed]],
        ["After the press", AFTERS[m.after]],
        ["Mode of change", esc(m.response)],
        ["Record", esc(m.note)]
      ])}
    </div>` : m.community && m.response ? `<div class="rec-block"><span class="kind kind-obs">Physical observation · community submission</span><p>${esc(m.response)}</p></div>` : "";
  const spec = sp ? `<div class="rec-block">
      <span class="kind kind-obs">Specimen · ${esc(sp.name)}</span>
      ${dl([["Variety", esc(sp.variety)], ["Composition", esc(sp.composition)], ["Specimen part", esc(sp.part)], ["Condition", esc(sp.condition)], ["Preparation", esc(sp.preparation)]])}
    </div>` : "";
  const exps = sp ? `<div class="rec-block">
      <span class="kind kind-obs">Experiment records</span>
      ${m.experiments.length ? m.experiments.map(x => dl([["Experiment", `${m.id} / ${x.id} · ${esc(x.type)}`], ["Date", esc(x.date)], ["Context", esc(x.context)], ["Documentation", "Not yet filed"]])).join("")
        : `<p class="muted">No experiment has been carried out on this specimen yet.</p>`}
    </div>` : "";
  const ints = inst.length ? inst.map(e => `<div class="rec-block">
      <span class="kind kind-int">Interpretation · I.A.M., subjective</span>
      ${dl([
        ["Meaning", `<span style="color:var(--accent)">${esc(e.meaning)}</span>`],
        ...(e.revisions || []).map(r => ["Revised", `${esc(r.meaning)}${r.note ? `<br><span class="muted">${esc(r.note)}</span>` : ""}`]),
        ["Why", esc(e.meaning_note)],
        ["What it might say", e.voice ? `<span class="voice">${esc(e.voice)}</span>` : ""],
        ["Body translation", hasBody(e) ? `<div class="rec-fig" data-recfig="${e.id}"></div>` : ""]
      ])}
    </div>`).join("") : "";
  const content = obs + spec + exps + ints;
  return content || `<p class="muted">No record yet. The Institute has not written this entry.</p>`;
}

async function detail(id) {
  if (!byId(id)) await loadMaterials();
  const m = byId(id);
  if (!m) { main.innerHTML = notFound(); return; }
  const rows = await interpretationsOf(m.id);
  const inst = institute(m.id);
  const featured = inst[0] || rows[0];
  main.innerHTML = `
  <div class="wrap page">
    <a class="back" href="#archive" data-from="${m.id}">← Archive</a>
    <div class="detail">
      <div class="img">${art(m)}</div>
      <div class="detail-info">
        <span class="label">${no(m)}${m.community ? " · Community submission" : ""}</span>
        <h1>${esc(m.name)}</h1>
        ${m.response ? `<div><span class="kind kind-obs">Physical response</span><p class="response">${esc(m.response)}</p></div>` : ""}
        ${featured ? `<div class="featured"><span class="kind kind-int">${featured.example ? "I.A.M. interpretation" : "Featured interpretation"}</span><span class="word">${esc(latestMeaning(featured))}</span></div>` : ""}
        <div class="row"><button class="btn btn-primary" type="button" data-add-meaning>Add Your Meaning</button></div>
        <button class="record-toggle" type="button" aria-expanded="false" aria-controls="record">View Full Record <span class="chev" aria-hidden="true">+</span></button>
        <div class="record" id="record"><div><div class="record-inner">${fullRecord(m, inst)}</div></div></div>
      </div>
    </div>

    <section class="section">
      <div class="carousel-head">
        <div><h2 class="sub">Interpretations</h2><p class="label">${rows.length ? `${rows.length} reading${rows.length > 1 ? "s" : ""} of the same material` : "None yet"}</p></div>
        ${rows.length > 1 ? `<div class="carousel-nav"><button type="button" data-scroll="-1" aria-label="Previous">←</button><button type="button" data-scroll="1" aria-label="Next">→</button></div>` : ""}
      </div>
      ${rows.length ? `<div class="carousel" tabindex="0" aria-label="Interpretations">${rows.map(r => icard(r)).join("")}</div>`
        : `<p class="muted">Yours could be the first.</p>`}
    </section>
  </div>`;

  const toggle = $(".record-toggle", main), rec = $("#record", main);
  let figsOn = false;
  toggle.addEventListener("click", () => {
    const open = !rec.classList.contains("open");
    rec.classList.toggle("open", open); toggle.setAttribute("aria-expanded", String(open));
    if (open && !figsOn) { figsOn = true; inst.forEach(e => { const el = $(`[data-recfig="${e.id}"]`, main); if (el) mountPlayer(el, e.body, { trails: true }); }); }
  });
  rows.forEach(r => { const el = $(`[data-cardfig="${CSS.escape(String(r.id))}"]`, main); if (el) mountPlayer(el, r.body); });
  $$("[data-card]", main).forEach(c => c.addEventListener("click", () => {
    const r = rows.find(x => String(x.id) === c.dataset.card);
    hasBody(r) ? reinterpret(r) : expand(r);
  }));
  $$("[data-scroll]", main).forEach(b => b.addEventListener("click", () => {
    const c = $(".carousel", main); c.scrollBy({ left: Number(b.dataset.scroll) * (c.clientWidth * .8), behavior: calm() ? "auto" : "smooth" });
  }));
  $("[data-add-meaning]", main).addEventListener("click", () => addMeaning(m));
}

// one card per person; a card with a body hides its meaning until you guess
function icard(r) {
  const revs = r.revisions || [];
  const by = `<span class="by"><span>${esc(r.alias || "Anonymous")}</span><span>${r.example ? "Institute" : fmtDate(r.created_at)}</span></span>`;
  if (hasBody(r)) return `<button class="icard" type="button" data-card="${esc(r.id)}">
    <div class="fig" data-cardfig="${esc(r.id)}"></div>
    <span class="preview">What is this body saying? Guess first.</span>${by}</button>`;
  return `<button class="icard" type="button" data-card="${esc(r.id)}">
    <div>${revs.length ? `<span class="old">${esc(r.meaning)}</span><br>` : ""}<span class="word">${esc(latestMeaning(r))}</span></div>
    <span class="preview">${esc(r.meaning_note || r.voice || "Open to read more.")}</span>${by}</button>`;
}

function entryHTML(r) {
  const revs = r.revisions || [];
  return `
    <span class="kind kind-int">${r.example ? "I.A.M. interpretation" : "Interpretation"} · ${esc(r.alias || "Anonymous")}${r.example ? "" : " · " + fmtDate(r.created_at)}</span>
    ${revs.length ? `<div style="margin-top:14px"><span class="label">First meaning</span><p style="text-decoration:line-through;color:var(--muted)">${esc(r.meaning)}</p></div>
      ${revs.map(v => `<div style="margin-top:10px"><span class="label">Revised${r.example ? "" : " · " + fmtDate(v.at)}</span><p class="word" style="font-size:var(--t-large);color:var(--accent)">${esc(v.meaning)}</p>${v.note ? `<p class="muted">${esc(v.note)}</p>` : ""}</div>`).join("")}`
      : `<p style="font-size:var(--t-large);color:var(--accent);margin-top:12px">${esc(r.meaning)}</p>`}
    ${r.meaning_note ? `<p style="margin-top:12px">${esc(r.meaning_note)}</p>` : ""}
    ${r.voice ? `<p class="voice" style="margin-top:12px">${esc(r.voice)}</p>` : ""}`;
}

function expand(r) {
  if (!r) return;
  modal(`<div class="unfold">${entryHTML(r)}${hasBody(r) ? `<div class="rec-fig" id="ex-fig" style="margin-top:16px"></div>` : ""}</div>`, box => {
    if (hasBody(r)) mountPlayer($("#ex-fig", box), r.body, { trails: true });
  });
}

function reinterpret(entry) {
  if (!entry) return;
  modal(`
    <h2>What is this body saying?</h2>
    <p class="muted">Guess first. Then see what it meant.</p>
    <div class="reveal" style="align-items:start">
      <div class="figure-mini" id="ri-fig"></div>
      <form id="ri-form" style="display:grid;gap:14px;align-content:center">
        <label class="visually-hidden" for="ri-text">Your guess</label>
        <input id="ri-text" class="input" maxlength="80" required placeholder="It is saying…" autocomplete="off">
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

// Add Your Meaning: one question at a time, private by default
function addMeaning(m) {
  const d = { meaning: "", note: "", body: null, share: false, alias: store.alias() };
  let step = 0, editor = null;
  const stopEditor = () => { if (editor) { d.body = editor.get(); editor.stop(); editor = null; } };
  panel(`Add your meaning to ${m.name}`, (body, close) => {
    const view = () => {
      stopEditor();
      const back = step > 0 && step < 5 ? `<button class="btn btn-quiet btn-small" type="button" data-back style="justify-self:start">← Back</button>` : "";
      const head = `<span class="label">${no(m)} ${esc(m.name)}</span>`;
      let html = "";
      if (step === 0) html = `${head}<h2>What does it mean to you?</h2>${m.response ? `<p class="hint">It ${esc(m.response.toLowerCase())}.</p>` : ""}
        <input class="answer" id="q" maxlength="80" autocomplete="off" placeholder="A word or a feeling" value="${esc(d.meaning)}">
        <div class="step-actions"><button class="btn btn-primary" type="submit" ${d.meaning.trim() ? "" : "disabled"}>Next</button></div>`;
      if (step === 1) html = `${head}<h2>Why?</h2><p class="hint">Optional.</p>
        <input class="answer" id="q" maxlength="300" autocomplete="off" placeholder="Because…" value="${esc(d.note)}">
        <div class="step-actions"><button class="btn btn-primary" type="submit">Next</button><button class="btn btn-quiet" type="button" data-next>Skip</button></div>`;
      if (step === 2) html = `${head}<h2>Show it with a body?</h2><p class="hint">Optional. Borrow a figure and pose the change.</p>
        <div class="choice"><button type="button" data-borrow>Borrow a body<small>Two or three poses</small></button><button type="button" data-next>Skip</button></div>`;
      if (step === 3) html = `${head}<h2>Borrow a body</h2><p class="hint">Drag the joints. Add a second pose, then play.</p>
        <div id="ed"></div>
        <div class="step-actions"><button class="btn btn-primary" type="submit">Next</button></div>`;
      if (step === 4) html = `${head}<h2>Keep it, or share it?</h2>
        <div class="choice">
          <button type="button" data-share="0" aria-pressed="${!d.share}">Keep private<small>Only in your collection</small></button>
          <button type="button" data-share="1" aria-pressed="${d.share}">Share with the archive<small>Others can read it here</small></button>
        </div>
        <label class="field" id="al" ${d.share ? "" : "hidden"}>Sign as (optional)<input class="input" id="alias" maxlength="40" autocomplete="off" value="${esc(d.alias)}"></label>
        <div class="step-actions"><button class="btn btn-primary" type="submit">Save</button></div>`;
      if (step === 5) html = `${savedMark}<h2>${esc(d.meaning)}</h2><p class="hint">${d.shared ? "Saved and shared." : "Saved to My Collection."} Come back later. See if it still holds.</p>
        <div class="step-actions"><a class="btn btn-primary" href="#collection" data-close>My Collection</a><button class="btn" type="button" data-close>Close</button></div>`;
      body.innerHTML = `<form class="step" novalidate>${back}${html}</form>`;
      wire();
    };
    const wire = () => {
      const form = $("form", body);
      const q = $("#q", form);
      if (q) {
        q.focus({ preventScroll: true });
        q.addEventListener("input", () => { if (step === 0) { d.meaning = q.value; $("button[type=submit]", form).disabled = !d.meaning.trim(); } else d.note = q.value; });
      }
      if ($("#ed", form)) editor = mountEditor($("#ed", form), d.body);
      $("[data-back]", form)?.addEventListener("click", () => { step = step === 4 && !hasBody(d) && !editor ? 2 : step - 1; view(); });
      $$("[data-next]", form).forEach(b => b.addEventListener("click", () => { if (step === 2) { d.body = null; step = 4; } else step++; view(); }));
      $("[data-borrow]", form)?.addEventListener("click", () => { step = 3; view(); });
      $$("[data-share]", form).forEach(b => b.addEventListener("click", () => {
        d.share = b.dataset.share === "1";
        $$("[data-share]", form).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        $("#al", form).hidden = !d.share;
      }));
      $("#alias", form)?.addEventListener("input", e => { d.alias = e.target.value; });
      form.addEventListener("submit", async e => {
        e.preventDefault();
        if (step === 0 && !d.meaning.trim()) return;
        if (step === 3) { const b = editor.get(); if (b.frames.length < 2) { toast("Add a second pose, or go back and skip."); return; } }
        if (step < 4) { step++; return view(); }
        if (step === 4) await save($("button[type=submit]", form));
      });
    };
    const save = async btn => {
      btn.disabled = true;
      const alias = d.share ? d.alias.trim() : "";
      if (alias) store.setAlias(alias);
      const saved = store.addMine({ material_id: m.id, alias, observe: {}, meaning: d.meaning.trim(), meaning_note: d.note.trim(), voice: "", body: hasBody(d) ? d.body : null, own_body_note: "" });
      try { sessionStorage.setItem("iam.justSaved", saved.id); } catch { }
      if (d.share) {
        try { const rid = await store.share(saved); store.updateMine(saved.id, { shared: true, remote_id: rid }); store.invalidate(); d.shared = true; }
        catch (err) { console.error(err); toast("Saved. Sharing failed, try again from My Collection."); }
      }
      step = 5; view();
    };
    view();
  }, () => { stopEditor(); if (step === 5 && currentPath() === "archive-" + m.id) render(); });
}

// ---------- MY COLLECTION ----------
async function collection() {
  await loadMaterials();
  const list = store.mine();
  const shared = list.filter(e => e.shared && e.remote_id);
  let readings = [];
  try { readings = await store.readingsFor(shared.map(e => e.remote_id)); } catch (e) { console.error(e); }
  let just = null; try { just = sessionStorage.getItem("iam.justSaved"); sessionStorage.removeItem("iam.justSaved"); } catch { }

  main.innerHTML = `
  <div class="wrap page">
    <div class="page-head">
      <div><h1>My Collection</h1><p>Your meanings, kept in this browser.</p></div>
      <a class="btn" href="#archive">Explore Archive</a>
    </div>
    ${list.length ? `<div class="entries">${list.map((e, i) => entryCard(e, readings.filter(r => r.entry_id === e.remote_id), i, e.id === just)).join("")}</div>
      <p class="notice">Only this browser keeps your collection. <button class="link" data-export type="button">Download a copy</button></p>`
      : `<div class="empty-state"><h2>Nothing here yet.</h2><p>Open a material and add your meaning. It will appear here.</p><a class="btn btn-primary" href="#archive">Explore Archive</a></div>`}
  </div>`;

  list.forEach(e => e.body && mountPlayer($(`[data-mine="${e.id}"]`, main), e.body));
  $("[data-export]", main)?.addEventListener("click", () => download("iam-my-collection.json", store.exportAll()));
  const onClick = async ev => {
    const b = ev.target.closest("[data-e]"); if (!b) return;
    const e = store.getMine(b.dataset.e); if (!e) return;
    const act = b.dataset.do;
    if (act === "revise") return revise(e);
    if (act === "share") {
      b.disabled = true;
      try { const rid = await store.share(e); store.updateMine(e.id, { shared: true, remote_id: rid }); store.invalidate(); toast("Shared with the archive"); }
      catch (err) { console.error(err); toast("Sharing failed. Please try again later."); }
      return render();
    }
    if (act === "unshare") {
      if (!(await ask("Remove this from the shared archive? It stays in your collection.", "Remove"))) return;
      try { await store.unshare(e.remote_id); store.updateMine(e.id, { shared: false, remote_id: null }); store.invalidate(); toast("Removed from the archive"); }
      catch (err) { console.error(err); toast("Could not remove it. Please try again."); }
      return render();
    }
    if (act === "delete") {
      if (!(await ask("Delete this meaning?" + (e.shared ? " It will also leave the shared archive." : ""), "Delete"))) return;
      if (e.shared && e.remote_id) { try { await store.unshare(e.remote_id); store.invalidate(); } catch (err) { console.error(err); } }
      store.deleteMine(e.id); toast("Deleted"); return render();
    }
  };
  main.addEventListener("click", onClick);
  leaving = () => main.removeEventListener("click", onClick);
}

function entryCard(e, readings = [], i = 0, just = false) {
  const m = byId(e.material_id) || unknown(e.material_id);
  const revs = e.revisions || [];
  const act = e.observe && e.observe.action ? `${e.observe.action} · ${e.observe.response || ""}` : "";
  return `<article class="entry ${just ? "just-saved" : ""}" style="animation-delay:${Math.min(i, 8) * 40}ms">
    <div class="entry-top">
      <div class="thumb">${art(m)}</div>
      <div><span class="name">${esc(m.name)}</span><br><span class="label">${e.shared ? `<span class="shared-dot" aria-hidden="true"></span>Shared · ` : ""}${fmtDate(e.created_at)}</span></div>
    </div>
    ${revs.length ? `<span class="old">${esc(e.meaning)}</span>` : ""}
    <span class="word">${esc(latestMeaning(e))}</span>
    ${e.meaning_note ? `<p>${esc(e.meaning_note)}</p>` : ""}
    ${e.voice ? `<p class="voice">${esc(e.voice)}</p>` : ""}
    ${act ? `<span class="label">${esc(act)}</span>` : ""}
    ${e.body ? `<div class="fig" data-mine="${e.id}"></div>` : ""}
    ${readings.length ? `<span class="label">Others read your body as: ${readings.slice(0, 6).map(r => esc(r.text)).join(" · ")}</span>` : ""}
    <div class="actions">
      <button data-e="${e.id}" data-do="revise" type="button">Revisit</button>
      <a href="#archive-${m.id}">Compare</a>
      ${e.shared ? `<button data-e="${e.id}" data-do="unshare" type="button">Unshare</button>` : `<button data-e="${e.id}" data-do="share" type="button">Share</button>`}
      <button data-e="${e.id}" data-do="delete" type="button">Delete</button>
    </div>
  </article>`;
}

function revise(e) {
  const current = latestMeaning(e);
  modal(`
    <h2>Does “${esc(current)}” still feel true?</h2>
    <p class="muted">Saved ${fmtDate(e.created_at)}. The first meaning is kept underneath.</p>
    ${e.body ? `<div class="figure-mini" id="rv-fig" style="max-width:200px;margin:16px 0"></div>` : ""}
    <form id="rv-form">
      <label class="field">What it means now<input id="rv-m" class="input" maxlength="80" required placeholder="${esc(current)}" autocomplete="off"></label>
      <label class="field">What changed? (optional)<input id="rv-n" class="input" maxlength="300" autocomplete="off"></label>
      <div class="row" style="margin-top:24px"><button class="btn btn-primary" type="submit">Save</button><button class="btn" type="button" data-same>It still holds</button></div>
    </form>`, (box, close) => {
    if (e.body) mountPlayer($("#rv-fig", box), e.body, { trails: true });
    const finish = async (meaning, note) => {
      const revisions = [...(e.revisions || []), { at: new Date().toISOString(), meaning, note }];
      const upd = store.updateMine(e.id, { revisions });
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
      <p>The Institute of Animate Matter is a fictional institute made for <em>UX of Respond</em>, an MA UX Design project by Lynn Zhong at the University of the Arts London, 2026. It asks how the way materials change can become a language people read and perform with their bodies.</p>
      <p>Physical observations describe what a material did. Interpretations are personal, including the Institute's own. The motion of specimens on this site is a stylised interface, not experimental evidence.</p>
      <h2 class="sub">Your data</h2>
      <ul>
        <li>My Collection is stored only in your browser. Meanings are private unless you choose to share.</li>
        <li>What you share (meaning, note, body, the name you sign with, date) is public here and may be quoted in the research.</li>
        <li>No email, account, location or tracking cookies. An anonymous ID in your browser lets you remove what you shared.</li>
      </ul>
    </div>
  </div>`;
}

function notFound() {
  return `<div class="wrap page empty-state"><h1>Nothing here.</h1><p>This page may have moved.</p><a class="btn btn-primary" href="#">Home</a></div>`;
}

// ---------- boot ----------
$("[data-mark]").innerHTML = mark();
await loadMaterials();
render();
