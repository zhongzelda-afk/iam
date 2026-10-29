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
const unknown = id => ({ id, name: "Unknown material", display: "cube", tex: "community" });

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3200);
}
window.addEventListener("iam:toast", e => toast(e.detail));

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

// example bodies so the examples show what a body looks like
const pose = (o = {}) => { const p = defaultPose(); const a = { ...p.a, ...(o.a || {}) }; return { ...p, ...o, a }; };
const EXAMPLE_BODIES = {
  "ex-1": { speed: .85, ending: "return", frames: [pose(), pose({ squash: .56, a: { lElbow: 250, lHand: -100, rElbow: 110, rHand: 100, lKnee: 120, rKnee: 60 } })] },
  "ex-2": { speed: .08, ending: "hold", frames: [pose({ a: { lElbow: 270, lHand: 0, rElbow: 90, rHand: 0 } }), pose({ squash: .82, a: { chest: -70, lElbow: 230, rElbow: 140, lKnee: 120, lFoot: -40, rKnee: 70, rFoot: 30 } }), pose({ squash: .5, y: 230, a: { chest: -20, neck: 10, lElbow: 170, rElbow: 200, lKnee: 160, lFoot: 0, rKnee: 20, rFoot: 0 } })] },
  "ex-3": { speed: .92, ending: "hold", frames: [pose({ a: { lElbow: 250, rElbow: 110 } }), pose({ squash: .78, a: { chest: -110, neck: 30, head: 20, lElbow: 100, lHand: -120, rElbow: 40, rHand: 140, lKnee: 130, lFoot: -90, rKnee: 60, rFoot: 80 } })] }
};
const examples = () => EXAMPLES.map(e => ({ ...e, body: EXAMPLE_BODIES[e.id] }));

// shared entries, plus examples for materials nobody has written about yet
async function sharedRows() {
  let rows = [];
  try { rows = (await store.listShared()).map(r => ({ ...r, material_id: canonical(r.material_id) })); } catch (e) { console.error(e); toast("The shared archive could not be reached."); }
  const withReal = new Set(rows.map(r => r.material_id));
  return [...rows, ...examples().filter(x => !withReal.has(x.material_id))];
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

let leaving = null;
async function render() {
  const path = location.hash.replace(/^#\/?/, "").replace(/\//g, "-");
  if (path === "main") { history.replaceState(null, "", "#" + (render.last || "")); main.focus(); return; }
  const moved = legacy(path);
  if (moved !== null) { history.replaceState(null, "", "#" + moved); return render(); }
  render.last = path;
  if (leaving) { leaving(); leaving = null; }
  const key = navKey(path);
  $$(".nav [data-nav]").forEach(a => a.dataset.nav === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  const route = routes.find(([re]) => re.test(path));
  if (!route) main.innerHTML = notFound();
  else await route[1](...path.match(route[0]).slice(1));
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  main.focus({ preventScroll: true });
  const h1 = main.querySelector("h1")?.textContent.trim();
  document.title = h1 && path ? `${h1} · I.A.M.` : "I.A.M. Institute of Animate Matter";
}
window.addEventListener("hashchange", render);

// ---------- fragments ----------
const specLink = m => `<a class="spec" href="#archive-${m.id}">
  <div class="img">${art(m)}</div>
  <div class="meta"><span class="no">${no(m)}</span><span class="name">${esc(m.name)}</span>${m.community ? `<span class="tag-community">Community</span>` : ""}</div>
</a>`;

function meaningCard(e, { material = false } = {}) {
  const revs = e.revisions || [];
  const m = byId(e.material_id) || unknown(e.material_id);
  return `<article class="meaning-card">
    ${material ? `<span class="label">${no(m)} ${esc(m.name)}</span>` : ""}
    ${revs.length ? `<span class="old">${esc(e.meaning)}</span>` : ""}
    <span class="word">${esc(latestMeaning(e))}</span>
    ${e.meaning_note ? `<p class="note">${esc(e.meaning_note)}</p>` : ""}
    <span class="by"><span>${esc(e.alias || "Anonymous")}</span><span>${e.example ? "Example" : fmtDate(e.created_at)}</span></span>
  </article>`;
}

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
    <div class="shelf" aria-hidden="true">${shelf.map(m => `<a href="#archive-${m.id}" tabindex="-1">${art(m)}</a>`).join("")}</div>
  </section>`;
}

// ---------- ARCHIVE ----------
async function archive() {
  await loadMaterials();
  const list = allMaterials();
  const empties = 4;
  main.innerHTML = `
  <div class="wrap page">
    <div class="page-head"><div><h1>Archive</h1><p>Eleven founding materials. Add the next one.</p></div></div>
    <div class="grid">
      ${list.map(specLink).join("")}
      ${Array.from({ length: empties }, () => `<button class="spec empty" data-add type="button"><div class="img">${emptyJar()}</div><div class="meta"><span class="name">Add a material</span></div></button>`).join("")}
    </div>
  </div>`;
  $$("[data-add]", main).forEach(b => b.addEventListener("click", addMaterial));
}

function addMaterial() {
  modal(`
    <h2>Add a material</h2>
    <p class="muted">It joins the archive as a community submission.</p>
    <form id="add-form">
      <label class="field">Name<input class="input" id="am-name" maxlength="40" required autocomplete="off" placeholder="e.g. Marshmallow"></label>
      <label class="field">What happens when you press it? (optional)<input class="input" id="am-note" maxlength="160" autocomplete="off" placeholder="It squashes, then slowly rises."></label>
      <div class="row" style="margin-top:24px"><button class="btn btn-primary" type="submit">Add to archive</button></div>
      ${store.online() ? "" : `<p class="notice">The shared archive is not connected yet, so this stays on your device for now.</p>`}
    </form>`, (box, close) => {
    $("#add-form", box).addEventListener("submit", async ev => {
      ev.preventDefault();
      const name = $("#am-name", box).value.trim(); if (!name) return;
      const btn = $("button[type=submit]", box); btn.disabled = true;
      try {
        const row = await store.addMaterial({ name, note: $("#am-note", box).value });
        close(); toast("Added to the archive");
        location.hash = "#archive-" + row.id;
      } catch (e) { console.error(e); btn.disabled = false; toast("Could not add it. Please try again."); }
    });
  });
}

// ---------- MATERIAL ----------
async function detail(id) {
  if (!byId(id)) await loadMaterials();
  const m = byId(id);
  if (!m) { main.innerHTML = notFound(); return; }
  const rows = (await sharedRows()).filter(r => r.material_id === m.id);
  const bodies = rows.filter(r => r.body && r.body.frames && r.body.frames.length > 1);
  main.innerHTML = `
  <div class="wrap page">
    <a class="back" href="#archive">← Archive</a>
    <div class="detail">
      <div class="img">${art(m)}</div>
      <div class="detail-info">
        <span class="label">${no(m)} · ${esc(m.kind || "Material")}</span>
        <h1>${esc(m.name)}</h1>
        ${m.def ? `<p class="def">${esc(m.def)}</p>` : `<p class="def muted">Not yet described.</p>`}
        ${m.word ? `<dl class="dict">
          <div><dt>Material language</dt><dd><span class="mword">${esc(m.word)}</span>
            <span class="matrix" role="img" aria-label="${SPEEDS[m.speed]}, ${AFTERS[m.after]}">${["instant", "slow"].map(sp => ["returns", "stays"].map(af => `<span class="${sp === m.speed && af === m.after ? "on" : ""}">${SPEEDS[sp]} · ${AFTERS[af]}</span>`).join("")).join("")}</span></dd></div>
          <div><dt>In the body</dt><dd>${esc(m.body)}</dd></div>
          <div><dt>Made of</dt><dd>${esc(m.madeOf)}</dd></div>
          <div><dt>Record</dt><dd>${esc(m.record)}</dd></div>
        </dl>` : ""}
        <div class="row"><button class="btn btn-primary" type="button" data-add-meaning>Add Your Meaning</button></div>
      </div>
    </div>

    <section class="section">
      <h2 class="sub">What it means to people</h2>
      ${rows.length ? `<div class="meanings">${rows.map(r => meaningCard(r)).join("")}</div>`
        : `<p class="muted">No meanings yet. Yours could be the first.</p>`}
    </section>

    ${bodies.length ? `<section class="section">
      <h2 class="sub">Read a body</h2>
      <p class="muted" style="margin-bottom:16px">Guess what each body is saying before you see its meaning.</p>
      <div class="meanings">${bodies.map(b => `<button class="meaning-card" data-read="${esc(b.id)}" type="button">
        <div class="fig" data-fig="${esc(b.id)}"></div>
        <span class="by"><span>${esc(b.alias || "Anonymous")}</span><span>${b.example ? "Example" : "Guess"}</span></span>
      </button>`).join("")}</div>
    </section>` : ""}
  </div>`;
  bodies.forEach(b => mountPlayer($(`[data-fig="${CSS.escape(String(b.id))}"]`, main), b.body, { trails: true }));
  $("[data-add-meaning]", main).addEventListener("click", () => addMeaning(m));
  $$("[data-read]", main).forEach(btn => btn.addEventListener("click", () => reinterpret(bodies.find(b => String(b.id) === btn.dataset.read))));
}

function addMeaning(m) {
  let editor = null;
  modal(`
    <h2>What does ${esc(m.name.toLowerCase())} mean to you?</h2>
    <p class="muted">${m.word ? `It ${esc(m.word)}. ` : ""}One word is enough.</p>
    <form id="am-form">
      <label class="field">Meaning<input id="am-m" class="input" maxlength="80" required autocomplete="off" placeholder="A word or a feeling"></label>
      <label class="field">Why? (optional)<input id="am-n" class="input" maxlength="300" autocomplete="off"></label>
      <div id="am-body-wrap" style="margin-top:16px"><button class="link" type="button" data-body>+ Show it with a body (optional)</button></div>
      <label class="toggle"><input type="checkbox" id="am-share"> Share with the archive</label>
      <label class="field" id="am-alias-f" hidden>Sign as (optional)<input id="am-alias" class="input" maxlength="40" autocomplete="off" value="${esc(store.alias())}"></label>
      <div class="row" style="margin-top:24px"><button class="btn btn-primary" type="submit">Save</button></div>
    </form>`, (box, close) => {
    const share = $("#am-share", box);
    share.addEventListener("change", () => { $("#am-alias-f", box).hidden = !share.checked; });
    $("[data-body]", box).addEventListener("click", () => {
      $("#am-body-wrap", box).innerHTML = `<p class="label" style="margin-bottom:8px">Drag the joints. Add a second pose, then play.</p><div id="am-body"></div>`;
      editor = mountEditor($("#am-body", box), null);
    });
    $("#am-form", box).addEventListener("submit", async ev => {
      ev.preventDefault();
      const meaning = $("#am-m", box).value.trim(); if (!meaning) return;
      const btn = $("button[type=submit]", box); btn.disabled = true;
      const body = editor ? editor.get() : null;
      if (editor) editor.stop();
      const alias = share.checked ? $("#am-alias", box).value.trim() : "";
      if (alias) store.setAlias(alias);
      const saved = store.addMine({ material_id: m.id, alias, observe: {}, meaning, meaning_note: $("#am-n", box).value.trim(), voice: "", body: body && body.frames.length > 1 ? body : null, own_body_note: "" });
      let msg = "Saved to My Collection";
      if (share.checked) {
        try { const rid = await store.share(saved); store.updateMine(saved.id, { shared: true, remote_id: rid }); store.invalidate(); msg = "Saved and shared"; }
        catch (err) { console.error(err); msg = "Saved. Sharing failed, try again from My Collection."; }
      }
      close(); toast(msg); render();
    });
  }, () => { if (editor) editor.stop(); }, { wide: true });
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
        <button class="btn btn-primary" type="submit">Reveal</button>
      </form>
    </div>
    <div id="ri-reveal"></div>`, box => {
    mountPlayer($("#ri-fig", box), entry.body, { trails: true });
    $("#ri-form", box).addEventListener("submit", async ev => {
      ev.preventDefault();
      const text = $("#ri-text", box).value.trim(); if (!text) return;
      $("button[type=submit]", box).disabled = true;
      try { await store.addReading(entry.id, text); } catch (e) { console.error(e); }
      let others = [];
      try { others = (await store.readingsFor([entry.id])).filter(r => r.text !== text).slice(0, 8); } catch { }
      $("#ri-reveal", box).innerHTML = `
        <div class="reveal">
          <div class="unfold"><span class="label">You read</span><p class="word">${esc(text)}</p></div>
          <div class="unfold theirs" style="animation-delay:.3s"><span class="label">${esc(entry.alias || "They")} meant</span><p class="word">${esc(latestMeaning(entry))}</p>${entry.meaning_note ? `<p style="margin-top:6px">${esc(entry.meaning_note)}</p>` : ""}</div>
        </div>
        ${others.length ? `<p class="label" style="margin-top:18px">Others read: ${others.map(o => esc(o.text)).join(" · ")}</p>` : ""}`;
    });
  }, null, { wide: true });
}

// ---------- MY COLLECTION ----------
async function collection() {
  await loadMaterials();
  const list = store.mine();
  const shared = list.filter(e => e.shared && e.remote_id);
  let readings = [];
  try { readings = await store.readingsFor(shared.map(e => e.remote_id)); } catch (e) { console.error(e); }

  main.innerHTML = `
  <div class="wrap page">
    <div class="page-head">
      <div><h1>My Collection</h1><p>Your meanings, kept in this browser.</p></div>
      <a class="btn" href="#archive">Explore Archive</a>
    </div>
    ${list.length ? `<div class="entries">${list.map(e => entryCard(e, readings.filter(r => r.entry_id === e.remote_id))).join("")}</div>
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

function entryCard(e, readings = []) {
  const m = byId(e.material_id) || unknown(e.material_id);
  const revs = e.revisions || [];
  const act = e.observe && e.observe.action ? `${e.observe.action} · ${e.observe.response || ""}` : "";
  return `<article class="entry">
    <div class="entry-top">
      <div class="thumb">${art(m)}</div>
      <div><span class="name">${esc(m.name)}</span><br><span class="label">${e.shared ? `<span class="shared-dot" aria-hidden="true"></span>Shared · ` : ""}${fmtDate(e.created_at)}</span></div>
    </div>
    ${revs.length ? `<span class="old">${esc(e.meaning)}</span>` : ""}
    <span class="word">${esc(latestMeaning(e))}</span>
    ${e.meaning_note ? `<p>${esc(e.meaning_note)}</p>` : ""}
    ${act ? `<span class="label">${esc(act)}</span>` : ""}
    ${e.body ? `<div class="fig" data-mine="${e.id}"></div>` : ""}
    ${readings.length ? `<span class="label">Others read your body as: ${readings.slice(0, 6).map(r => esc(r.text)).join(" · ")}</span>` : ""}
    <div class="actions">
      <button data-e="${e.id}" data-do="revise" type="button">Revisit</button>
      <a class="btn-quiet" href="#archive-${m.id}" style="font-size:var(--t-small);padding:4px 8px;color:var(--muted)">Compare</a>
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
      <p>Meanings here are personal. They describe people, not materials.</p>
      <h2 class="sub">Your data</h2>
      <ul>
        <li>My Collection is stored only in your browser.</li>
        <li>What you choose to share (meaning, note, action, body, the name you sign with, date) is public here and may be quoted in the research.</li>
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
