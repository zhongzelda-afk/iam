// The Library of Found Materials (I.A.M.)
// Journey: Home > Library shelf > Item (watch it change, try it, read, write) > Returned > next item.
// Journey map v0.1, 2 Nov 2026. Four screens, no accounts.

import { FOUNDING, LANGUAGE, canonical } from "./data.js?v=202611030050";
import { readingsFor, addReading, myReadingIds, LIMITS } from "./store.js?v=202611030050";

const $ = (s, el = document) => el.querySelector(s);
const main = $("#main");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ITEMS = FOUNDING;
const byId = id => ITEMS.find(m => m.id === canonical(id));
const CATALOGUING = 3; // empty numbered slots after the shelf: the library keeps growing

// ---------- what each item shows ----------
const video = m => (m.media || []).find(x => x.type === "video");
const filmed = m => !!video(m);
// the frame with the hand on the item, so the person is always next to the object
const handStill = m => { const v = video(m); return v && v.sequence ? v.sequence[1].src : null; };
const photo = m => m.photo ? `assets/materials/${m.id}.jpg` : null;
const cover = m => handStill(m) || photo(m);
// one response word (Response Cards R01 to R05). Without a card word, the return behaviour maps to Recover or Retain by its definition.
const word = m => m.words && m.words.length ? LANGUAGE[m.words[0]].word : m.after ? LANGUAGE[m.after === "returns" ? "recover" : "retain"].word : null;
const sentence = m => m.def || m.response || "";

// "Try it": one prompt for the visitor's own body. Placeholder wording until Lynn writes her own.
const tryIt = m => m.after === "returns"
  ? "Press your palm flat on the table. Hold it for three seconds. Let go slowly, and watch how your hand comes back."
  : m.after === "keeps"
    ? "Press your thumb into the palm of your other hand. Hold it. Let go and look at the mark it leaves for a moment."
    : "Press your palm flat on the table. Hold it for three seconds. Let go slowly. What did your hand do?";

// the next item to borrow: one that behaves the opposite way, filmed if possible
function opposite(m) {
  const pool = ITEMS.filter(x => x.id !== m.id);
  const want = m.after === "returns" ? "keeps" : "returns";
  return pool.find(x => x.after === want && filmed(x)) || pool.find(x => x.after === want) || pool.find(filmed) || pool[0];
}

const fmtDate = iso => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return ""; } };

// ---------- pieces ----------
const tile = m => {
  const src = cover(m);
  return `<a class="tile${filmed(m) ? "" : " is-loading"}" href="#item-${m.id}">
    <span class="tile-img">${src ? `<img src="${src}" alt="" loading="lazy">` : ""}${filmed(m) ? "" : `<span class="loading-tag">Loading</span>`}</span>
    <span class="tile-meta"><span class="no">${m.no}</span><span class="tile-name">${esc(m.name)}</span>${word(m) ? `<span class="tile-word">${esc(word(m))}</span>` : ""}</span>
  </a>`;
};

// ---------- 01 Home ----------
function home() {
  const picks = ITEMS.filter(filmed).slice(0, 3);
  main.innerHTML = `
  <section class="wrap home">
    <p class="label">Institute of Animate Matter</p>
    <h1 class="home-title">The Library of Found Materials</h1>
    <p class="lede">Eleven ordinary things, pressed by hand. Borrow one, watch it change, and leave a line about what you saw.</p>
    <div class="home-picks">${picks.map(m => `<a href="#item-${m.id}" class="pick"><img src="${handStill(m)}" alt="A hand pressing ${esc(m.name.toLowerCase())}"><span>${m.no} ${esc(m.name)}</span></a>`).join("")}</div>
    <a class="btn btn-fill" href="#library">Enter the library</a>
    <p class="sig">Collected by Lynn Zhong · MA User Experience Design, UAL</p>
  </section>`;
}

// ---------- 02 Library shelf ----------
function library() {
  const last = ITEMS.length;
  const slots = Array.from({ length: CATALOGUING }, (_, i) => String(last + 1 + i).padStart(3, "0"));
  main.innerHTML = `
  <section class="wrap page">
    <header class="page-head">
      <h1>On the shelf <span class="count">${ITEMS.length}</span></h1>
      <p class="muted">Pick any item to borrow it. Items marked loading have not been filmed yet.</p>
    </header>
    <div class="shelf">${ITEMS.map(tile).join("")}</div>
    <h2 class="label shelf-sub">Being catalogued</h2>
    <div class="shelf">${slots.map(n => `<div class="tile ghost" aria-label="Slot ${n}, being catalogued"><span class="tile-img"></span><span class="tile-meta"><span class="no">${n}</span><span class="tile-name muted">Being catalogued</span></span></div>`).join("")}</div>
  </section>`;
}

// ---------- 03 Item ----------
async function item(id) {
  const m = byId(id);
  if (!m) return notFound();
  const v = video(m);
  const w = word(m);
  main.innerHTML = `
  <article class="wrap page item">
    <nav class="crumb"><a href="#library">← Library</a><span class="no">No. ${m.no}</span></nav>
    <h1 class="item-title">${esc(m.name)}</h1>

    <section class="watch" aria-label="How it changes">
      ${v ? `
        <video class="film" src="${v.src}" poster="${v.poster || handStill(m)}" controls muted playsinline preload="metadata"></video>
        <ol class="strip">${v.sequence.map(s => `<li><button type="button" data-t="${s.t}"><img src="${s.src}" alt="${esc(s.label)}" loading="lazy"><span>${esc(s.label.split(" · ")[0])}</span></button></li>`).join("")}</ol>`
      : `<div class="film loading">${photo(m) ? `<img src="${photo(m)}" alt="${esc(m.name)}">` : ""}<p><span class="loading-tag">Loading</span> This item has not been pressed on film yet.</p></div>`}
      <div class="what">
        ${w ? `<span class="chip">${esc(w)}</span>` : ""}
        ${sentence(m) ? `<p>${esc(sentence(m))}</p>` : `<p class="muted">Observation still being written. What do you think it does?</p>`}
        ${m.refImage && !v ? `<p class="small muted">Reference image, not a photograph of the library's own item.</p>` : ""}
      </div>
    </section>

    <section class="try" aria-labelledby="try-h">
      <h2 id="try-h" class="label">Try it</h2>
      <p>${esc(tryIt(m))}</p>
    </section>

    <section class="readings" aria-labelledby="read-h">
      <h2 id="read-h">Readings <span class="count" data-count>…</span></h2>
      <ul class="reading-list" data-list><li class="muted">Loading readings…</li></ul>
    </section>

    <form class="write" data-form novalidate>
      <label for="reading-text" class="label">Your reading</label>
      <textarea id="reading-text" name="text" rows="3" maxlength="${LIMITS.text}" placeholder="What did it do? What does it remind you of?" required></textarea>
      <label for="reading-name" class="sr">Name (optional)</label>
      <input id="reading-name" name="name" maxlength="${LIMITS.name}" placeholder="Name (optional)" autocomplete="given-name">
      <p class="small muted">Your reading is shown publicly next to this item. Please don't include anyone's personal details.</p>
      <p class="error" data-error role="alert" hidden></p>
      <div class="write-actions">
        <button class="btn btn-fill" type="submit">Return with my reading</button>
        <a class="quiet" href="#returned-${m.id}">Return without writing</a>
      </div>
    </form>
  </article>`;

  // stills jump the video to that moment
  const film = $("video.film");
  main.querySelectorAll("[data-t]").forEach(b => b.addEventListener("click", () => {
    if (!film) return; film.currentTime = Number(b.dataset.t); film.play().catch(() => {});
  }));

  const form = $("[data-form]");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const err = $("[data-error]"); err.hidden = true;
    const text = form.text.value.trim();
    if (!text) { err.textContent = "Write a few words first, or choose Return without writing."; err.hidden = false; form.text.focus(); return; }
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Returning…";
    try {
      const r = await addReading(m.id, text, form.name.value);
      try { sessionStorage.setItem("iam.returned", JSON.stringify(r)); } catch {}
      location.hash = "returned-" + m.id;
    } catch (x) {
      err.textContent = x.message || "That didn't save. Try again."; err.hidden = false;
      btn.disabled = false; btn.textContent = "Return with my reading";
    }
  });

  const list = await readingsFor(m.id).catch(() => []);
  if (!document.body.contains(form)) return;
  const mine = myReadingIds();
  $("[data-count]").textContent = list.length;
  $("[data-list]").innerHTML = list.length
    ? list.map(r => `<li class="${mine.has(r.id) ? "is-mine" : ""}"><q>${esc(r.text)}</q><span class="by">${esc(r.name || "anonymous")}${mine.has(r.id) ? " · you" : ""} · ${fmtDate(r.created_at)}</span></li>`).join("")
    : `<li class="muted">No readings yet. Be the first to leave one.</li>`;
}

// ---------- 04 Returned ----------
async function returned(id) {
  const m = byId(id);
  if (!m) return notFound();
  let r = null;
  try { r = JSON.parse(sessionStorage.getItem("iam.returned") || "null"); } catch {}
  if (r && r.material_id !== m.id) r = null;
  let position = null;
  if (r) {
    const list = await readingsFor(m.id, { fresh: true }).catch(() => []);
    const i = [...list].reverse().findIndex(x => x.id === r.id);
    position = i >= 0 ? i + 1 : list.length || 1;
  }
  const next = opposite(m);
  const sameKind = m.after && next.after && m.after === next.after;
  main.innerHTML = `
  <section class="wrap page returned">
    <p class="label">Returned · ${fmtDate(new Date().toISOString())}</p>
    <h1>${esc(m.name)} is back on the shelf.</h1>
    ${r ? `
      <figure class="my-reading">
        <blockquote>${esc(r.text)}</blockquote>
        <figcaption class="label">Reading no. ${position} · ${esc(m.name)} · ${esc(r.name || "you")}</figcaption>
      </figure>
      ${r.stored === "browser" ? `<p class="small muted">Saved in this browser for now. It will be visible to others once the library's database is switched on.</p>` : ""}
      <p class="muted">Your words now sit next to the ${esc(m.name.toLowerCase())}. Find them again any time under Readings.</p>`
    : `<p class="muted">Thanks for borrowing it.</p>`}
    <div class="next">
      <p>${m.after && !sameKind ? `This one ${m.after === "returns" ? "comes back" : "stays changed"}. Want one that ${m.after === "returns" ? "stays changed" : "comes back"}?` : "Borrow another?"}</p>
      <a class="next-card" href="#item-${next.id}">${cover(next) ? `<img src="${cover(next)}" alt="">` : ""}<span>${next.no} ${esc(next.name)}</span></a>
      <div class="write-actions">
        <a class="btn btn-fill" href="#item-${next.id}">Borrow ${esc(next.name)}</a>
        <a class="btn" href="#library">Back to the shelf</a>
      </div>
    </div>
  </section>`;
}

// ---------- About ----------
function about() {
  main.innerHTML = `
  <section class="wrap page prose">
    <h1>About the library</h1>
    <p>The Library of Found Materials is part of <em>UX of Respond</em>, an MA User Experience Design project by Lynn Zhong at the University of the Arts London (2026). The Institute of Animate Matter is the project's fictional host.</p>
    <p>Every item here is an ordinary thing Lynn found and pressed by hand. The films show what each one does under a palm, and what is left when the hand lets go. The project asks how the way materials change can become a language that people read and perform with their own bodies.</p>
    <h2>Your readings</h2>
    <ul>
      <li>No account is needed. A reading is one short line and an optional first name or nickname.</li>
      <li>Readings are public and shown next to the item. Please don't write anything that identifies you or someone else.</li>
      <li>Readings may be quoted, without names, in Lynn's MA research. Unsuitable readings are removed.</li>
      <li>To have a reading removed, contact Lynn (contact details to be added).</li>
    </ul>
    <p class="small muted">Draft text. To be checked against UAL's research ethics and data protection guidance before the site is used for research.</p>
  </section>`;
}

function notFound() {
  main.innerHTML = `<section class="wrap page"><h1>Not on the shelf</h1><p class="muted">This item isn't in the library.</p><a class="btn" href="#library">Back to the shelf</a></section>`;
}

// ---------- router ----------
const ID = "(\\d{3})";
const routes = [
  [/^$/, home],
  [/^library$/, library],
  [new RegExp(`^item-${ID}$`), item],
  [new RegExp(`^returned-${ID}$`), returned],
  [/^about$/, about]
];
// addresses from earlier versions of the site
function legacy(path) {
  let m;
  if ((m = path.match(/^(?:archive|play|materials)-(\d{3})(?:-\d{2})?$/))) return "item-" + canonical(m[1]);
  if (/^(archive|materials|collective|lab|play|dictionary|collection|me)/.test(path)) return "library";
  if (/^(terms|privacy|research|consent)$/.test(path)) return "about";
  return null;
}
const currentPath = () => location.hash.replace(/^#\/?/, "").replace(/\//g, "-");
const navKey = p => p === "" ? "home" : p === "about" ? "about" : "library";

async function render() {
  const path = currentPath();
  if (path === "main") return;
  const moved = legacy(path);
  if (moved) { history.replaceState(null, "", "#" + moved); return render(); }
  document.querySelectorAll(".nav [data-nav]").forEach(a => a.dataset.nav === navKey(path) ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  const route = routes.find(([re]) => re.test(path));
  try {
    if (!route) notFound(); else await route[1](...path.match(route[0]).slice(1));
  } catch (e) { console.error(e); notFound(); }
  window.scrollTo(0, 0);
  const h = main.querySelector("h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  document.title = (h && path ? h.textContent.replace(/\s+\d+$/, "") + " · " : "") + "The Library of Found Materials";
}

window.addEventListener("hashchange", render);
document.body.classList.remove("booting");
render();
