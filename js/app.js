// I.A.M. The Living Material Library. Hash router and site navigation.
// HOME > MATERIAL LIBRARY > MATERIAL DETAIL > BECOME A MATERIAL > MY COLLECTION > CONTRIBUTE TO THE LAB
import { $, $$, reduceMotion } from "./lib/util.js?v=202611082312";
import { bySlug, byKey, isOpen, href } from "./lib/library.js?v=202611082312";
import * as col from "./lib/collection.js?v=202611082312";
import * as Home from "./pages/home.js?v=202611082312";
import * as Library from "./pages/library.js?v=202611082312";
import * as Material from "./pages/material.js?v=202611082312";
import * as Become from "./pages/become.js?v=202611082312";
import * as Collection from "./pages/collection.js?v=202611082312";
import * as Record from "./pages/record.js?v=202611082312";
import * as Contribute from "./pages/contribute.js?v=202611082312";
import * as About from "./pages/about.js?v=202611082312";

const main = $("#main");
let cleanup = null;

// addresses from earlier versions of the site
function legacy(h) {
  if (h === "#library" || h === "#archive" || h === "#shelf") return href.library;
  if (h === "#collection" || h === "#dictionary") return href.collection;
  if (h === "#about") return href.about;
  const m = h.match(/^#(?:item|material|returned)-(\d{3})/);
  if (m) { const o = byKey(m[1]); return o ? href.object(o) : href.library; }
  return null;
}

function notFound(msg) {
  main.innerHTML = `<section class="narrow notfound"><p class="mono eyebrow">I.A.M.</p><h1 class="page-title">Record not available</h1><p>${msg}</p><a class="cta" href="${href.library}">Material Library <span aria-hidden="true">→</span></a></section>`;
}

function route() {
  const h = location.hash || "#/";
  const old = legacy(h); if (old) { location.replace(old); return; }
  const parts = h.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  let nav = "home", title = "I.A.M. · The Living Material Library";
  const [a, b, c] = parts;
  if (!a) Home.render(main);
  else if (a === "library") { nav = "library"; title = "Material Library · I.A.M."; Library.render(main); }
  else if (a === "object") {
    nav = "library";
    const o = bySlug(b);
    if (!o) notFound("There is no object at this address.");
    else if (!isOpen(o)) notFound(`Object ${o.no}, ${o.name}, is under observation. Its record is not yet available.`);
    else if (c === "become") { title = `Become the ${o.name} · I.A.M.`; cleanup = Become.render(main, o); }
    else { title = `Object ${o.no} ${o.name} · I.A.M.`; cleanup = Material.render(main, o); }
  }
  else if (a === "collection") {
    nav = "collection"; title = "My Collection · I.A.M.";
    if (!b) Collection.render(main);
    else if (c === "contribute") { title = "Contribute to the Lab · I.A.M."; Contribute.render(main, b); }
    else Record.render(main, b);
  }
  else if (a === "about") { nav = "about"; title = "About · I.A.M."; About.render(main); }
  else notFound("This page does not exist.");
  document.title = title;
  $$("[data-nav]").forEach(l => l.dataset.nav === nav ? l.setAttribute("aria-current", "page") : l.removeAttribute("aria-current"));
  document.body.dataset.page = a || "home";
}

function go() {
  // in-page anchors such as the skip link are not routes
  const h = location.hash;
  if (h && !h.startsWith("#/") && !legacy(h) && document.getElementById(h.slice(1))) { document.getElementById(h.slice(1)).focus(); return; }
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "instant" });
  if (document.startViewTransition && !reduceMotion()) {
    const vt = document.startViewTransition(() => { route(); scrollTop(); });
    vt.ready.catch(() => {}); vt.finished.catch(() => {});
  }
  else { route(); scrollTop(); main.classList.remove("enter"); void main.offsetWidth; main.classList.add("enter"); }
  // move focus to the page for keyboard and screen reader users, except on first load
  if (go.loaded) main.focus({ preventScroll: true });
  go.loaded = true;
}

function updateCount() {
  const n = col.count(), el = $("[data-col-count]");
  if (el) { el.textContent = n ? String(n) : ""; el.hidden = !n; }
}

window.addEventListener("hashchange", go);
col.onChange(updateCount);
window.addEventListener("storage", updateCount);
updateCount();
go();
document.body.classList.remove("booting");
