// 06 Contribute to the Lab: the same one-step share form, opened from a saved translation.
import { esc, $ } from "../lib/util.js?v=202611041523";
import { href } from "../lib/library.js?v=202611041523";
import * as col from "../lib/collection.js?v=202611041523";
import { contributionForm, mountContributionForm } from "../components/contributionForm.js?v=202611041523";

export function render(main, id) {
  const t = col.get(id);
  if (!t || t.submissionStatus !== "PRIVATE") { location.hash = href.record(id); return; }
  main.innerHTML = `
  <article class="contribute narrow" aria-labelledby="k-title">
    <a class="mono back" href="${href.record(t.id)}">← ${esc(t.id)}</a>
    <h1 id="k-title" class="page-title">Contribute to the Lab</h1>
    <p class="mono r-k">${esc(t.id)} / Object ${esc(t.objectNo)} / ${esc(t.materialName)} / ${esc(t.action)}</p>
    <blockquote class="k-text">“${esc(t.text)}”</blockquote>
    <div data-k>${contributionForm(t, { id: "k-share" })}</div>
    <p class="c-more"><a class="link mono" href="${href.collection}">Back to My Collection</a></p>
  </article>`;
  mountContributionForm($("[data-k]", main), t);
}
