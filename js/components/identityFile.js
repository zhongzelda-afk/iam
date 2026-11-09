// Material Identity Archive: the same file as the acrylic plate for this material, so the online
// record and the plate in the exhibition match. Content lives in js/data/archive.js (generated).
import { esc } from "../lib/util.js?v=202611091312";
import { ARCHIVE } from "../data/archive.js?v=202611091312";
import { IDENTITIES } from "../data/cards.js?v=202611091312";

const rows = list => list.map(([k, v]) => `<div class="if-row"><dt class="mono">${esc(k)}</dt><dd>${k === "Response" ? `<span class="if-resp">${esc(v)}</span>` : esc(v)}</dd></div>`).join("");

export function identityFile(o) {
  const a = ARCHIVE[o.slug];
  if (!a) return `<p class="missing">No identity file yet for this material.</p>`;
  const card = IDENTITIES[o.slug];
  const resp = (a.agency.find(([k]) => k === "Response") || [])[1] || "";
  const rcode = (resp.match(/R\s?0\d/) || [""])[0].replace(/\s/, "");
  return `
  <article class="ifile" aria-label="Identity file ${esc(a.no)}, ${esc(a.name)}">
    <div class="ifile-tab"><span class="ifile-no">${esc(a.no)}</span><span class="mono">${esc(a.name)}</span></div>
    <header class="ifile-head">
      <p class="mono">I.A.M. / Material Registry</p>
      <p class="ifile-badge mono">File ${esc(a.no)}</p>
    </header>
    <div class="ifile-sub mono"><span class="ifile-red">Material Identity Archive</span><span>Subject ${esc(a.no)} / ${esc(a.latin)}</span></div>
    <div class="ifile-top">
      <figure class="ifile-fig brackets">
        ${o.heroImage ? `<img src="${esc(o.heroImage)}" alt="" loading="lazy">` : ""}
        <span class="ifile-stamp mono" aria-hidden="true">Registered<small>Material</small></span>
      </figure>
      <div>
        <h3 class="ifile-name">${esc(a.name)}</h3>
        <p class="mono muted">Status: registered material</p>
        <dl class="if-rows"><p class="if-k mono"><span class="num-box">01</span> Identity <span class="muted">Imagined</span></p>${rows(a.identity)}</dl>
      </div>
      ${card ? `<img class="ifile-card" src="assets/cards/${card.n.replace(" ", "")}.webp" alt="Identity card ${esc(card.n)}, ${esc(card.name)}" loading="lazy">` : ""}
    </div>
    <p class="ifile-motto">“${esc(a.motto)}”</p>
    <div class="ifile-cols">
      <dl class="if-rows"><p class="if-k mono"><span class="num-box">02</span> Human assignment <span class="muted">Imagined</span></p>${rows(a.assignment)}</dl>
      <dl class="if-rows"><p class="if-k mono"><span class="num-box">03</span> Material agency <span class="muted">Observed by I.A.M.</span></p>${rows(a.agency)}
        ${rcode ? `<img class="ifile-rcard" src="assets/cards/${rcode}.webp" alt="Response card ${esc(resp)}" loading="lazy">` : ""}</dl>
    </div>
    <div class="ifile-stmt">
      <p class="if-k mono"><span class="num-box">04</span> Personal statement <span class="muted">Imagined</span></p>
      <p class="ifile-quote">“${esc(a.statement)}”</p>
      ${a.on_record ? `<p class="mono ifile-red ifile-rec"><span>Also on record at the Living Material Library</span><span class="muted">${esc(a.credit || "")}</span></p><p class="ifile-onrec">“${esc(a.on_record)}”</p>` : ""}
    </div>
    <footer class="ifile-foot mono"><span>Identity and role: speculative, not the material's real wish</span><span>Same file as acrylic plate ${esc(a.no)}</span></footer>
  </article>`;
}
