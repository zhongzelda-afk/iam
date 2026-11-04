// Translation Record: one quotation with its archival source label.
import { esc, fmtDate } from "../lib/util.js?v=202611041335";
import { SOURCE_TYPES } from "../data/translations.js?v=202611041335";

export function translationRecord(t, o) {
  const st = o.states && t.state ? o.states.find(s => s.n === t.state) : null;
  const sim = t.sourceType === "CREATIVE_SIMULATION";
  return `
  <li class="tr${sim ? " tr--sim" : ""}">
    <blockquote class="tr-text"><p>“${esc(t.text)}”</p></blockquote>
    <dl class="tr-meta mono">
      <div><dt>Translation</dt><dd>${esc(t.id)}</dd></div>
      <div><dt>Object</dt><dd>${o.no}</dd></div>
      <div><dt>Action</dt><dd>${esc(t.action)}</dd></div>
      ${st ? `<div><dt>State</dt><dd>${st.n} ${esc(st.name)}</dd></div>` : ""}
      <div><dt>Source</dt><dd>${esc(t.sourceLabel)}</dd></div>
      <div><dt>Type</dt><dd>${esc(SOURCE_TYPES[t.sourceType] || t.sourceType)}</dd></div>
      ${t.createdAt ? `<div><dt>Date</dt><dd>${fmtDate(t.createdAt)}</dd></div>` : ""}
    </dl>
  </li>`;
}
