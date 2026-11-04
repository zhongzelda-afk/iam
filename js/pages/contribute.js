// 06 Contribute to the Lab: REVIEW > CONSENT > SUBMIT. Optional, explicit, reversible.
import { esc, $, $$, announce } from "../lib/util.js?v=202611040018";
import { href } from "../lib/library.js?v=202611040018";
import * as col from "../lib/collection.js?v=202611040018";
import { submit } from "../lib/contributions.js?v=202611040018";
import { submissionStatus } from "../components/status.js?v=202611040018";

export function render(main, id) {
  const t = col.get(id);
  if (!t) { location.hash = href.record(id); return; }
  if (t.submissionStatus !== "PRIVATE") { location.hash = href.record(id); return; }
  main.innerHTML = `
  <article class="contribute narrow" aria-labelledby="k-title">
    <a class="mono back" href="${href.record(t.id)}">← ${esc(t.id)}</a>
    <p class="mono eyebrow">Optional</p>
    <h1 id="k-title" class="page-title">Contribute to the Lab</h1>
    <p class="muted">Share this translation with the public Material Library. It stays in My Collection either way.</p>
    <form class="k-form" data-form novalidate>
      <fieldset class="k-step"><legend class="mono"><span>01</span> Review</legend>
        <dl class="kvs mono">
          <div class="kv"><dt>Material</dt><dd>${esc(t.materialName)}</dd></div>
          <div class="kv"><dt>Object</dt><dd>${esc(t.objectNo)}</dd></div>
          <div class="kv"><dt>Action</dt><dd>${esc(t.action)}</dd></div>
          <div class="kv"><dt>Status</dt><dd>${submissionStatus(t)}</dd></div>
        </dl>
        <blockquote class="k-text">“${esc(t.text)}”</blockquote>
        <p class="small muted">Want to change it first? <a href="${href.record(t.id)}">Edit in My Collection</a>.</p>
      </fieldset>
      <fieldset class="k-step"><legend class="mono"><span>02</span> Credit and consent</legend>
        <div class="radios">
          <label><input type="radio" name="credit" value="anon" checked> Anonymous</label>
          <label><input type="radio" name="credit" value="name"> Display a chosen name</label>
        </div>
        <div class="k-name" data-name hidden>
          <label for="k-name" class="mono">Name to display</label>
          <input id="k-name" type="text" maxlength="40" autocomplete="nickname" aria-describedby="k-name-h">
          <p id="k-name-h" class="small muted">Any name you like. A real name is not needed.</p>
        </div>
        <label class="check"><input type="checkbox" data-consent> <span>I agree that my Translation may be displayed in the public I.A.M. Material Library.</span></label>
        <p class="small muted">Contributions are reviewed before publication, so it will not appear straight away. You can withdraw it at any time from My Collection.</p>
      </fieldset>
      <fieldset class="k-step"><legend class="mono"><span>03</span> Submit</legend>
        <p class="err" role="alert" data-err hidden></p>
        <button class="cta cta--fill" type="submit" data-submit aria-disabled="true">Submit for review <span aria-hidden="true">→</span></button>
      </fieldset>
    </form>
    <div class="k-done" data-done hidden tabindex="-1"></div>
  </article>`;

  const form = $("[data-form]", main), consent = $("[data-consent]", main), btn = $("[data-submit]", main), err = $("[data-err]", main);
  const nameBox = $("[data-name]", main), nameIn = $("#k-name", main);
  $$("input[name=credit]", main).forEach(r => r.addEventListener("change", () => { nameBox.hidden = r.value !== "name" || !r.checked; if (!nameBox.hidden) nameIn.focus(); }));
  consent.addEventListener("change", () => { btn.setAttribute("aria-disabled", !consent.checked); if (consent.checked) err.hidden = true; });
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    if (!consent.checked) { err.textContent = "Tick the consent box to submit. Nothing is shared without it."; err.hidden = false; consent.focus(); return; }
    const wantsName = $("input[name=credit]:checked", main).value === "name";
    if (wantsName && !nameIn.value.trim()) { err.textContent = "Type the name to display, or choose Anonymous."; err.hidden = false; nameIn.focus(); return; }
    btn.disabled = true; btn.textContent = "Submitting…";
    try {
      const r = await submit(t.id, { displayName: wantsName ? nameIn.value : null });
      const held = r.contribution && r.contribution.queue === "browser";
      form.hidden = true;
      const done = $("[data-done]", main);
      done.hidden = false;
      done.innerHTML = `
        <p class="mono">${submissionStatus(r)}</p>
        <h2 class="k-done-t">Submitted for review.</h2>
        <p>${held ? "The Library's review queue could not be reached just now, so your submission is held in this browser and will be sent the next time you open My Collection while online. It is not public." : "Lynn reviews contributions before they appear in the public Library. Until then it is not public."}</p>
        <p class="muted">Your private copy stays in My Collection. You can withdraw the contribution there at any time.</p>
        <div class="r-actions"><a class="cta cta--fill" href="${href.collection}">Back to My Collection <span aria-hidden="true">→</span></a><a class="cta" href="${href.library}">Material Library</a></div>`;
      done.focus(); announce("Submitted for review.");
    } catch (e) { btn.disabled = false; btn.innerHTML = 'Submit for review <span aria-hidden="true">→</span>'; err.textContent = e.message; err.hidden = false; }
  });
}
