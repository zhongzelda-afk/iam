// Personal Translation Detail: one of the visitor's own records, full text first.
import { esc, fmtDate, $, announce } from "../lib/util.js?v=202611042302";
import { href, byKey } from "../lib/library.js?v=202611042302";
import * as col from "../lib/collection.js?v=202611042302";
import { withdraw } from "../lib/contributions.js?v=202611042302";
import { submissionStatus } from "../components/status.js?v=202611042302";

export function render(main, id, { editing = false, flash = "" } = {}) {
  const t = col.get(id);
  if (!t) {
    main.innerHTML = `<section class="mycol narrow"><p class="mono eyebrow">My Collection</p><h1 class="page-title">Not in your collection</h1><p>This translation is not saved in this browser. It may have been removed, or written on another device.</p><a class="cta" href="${href.collection}">My Collection <span aria-hidden="true">→</span></a></section>`;
    return;
  }
  const o = byKey(t.materialId);
  const isPrivate = t.submissionStatus === "PRIVATE";
  const held = t.contribution && t.contribution.queue === "browser";
  main.innerHTML = `
  <article class="record narrow" aria-labelledby="r-title">
    <a class="mono back" href="${href.collection}">← My Collection</a>
    <p class="mono r-k">${esc(t.id)} / Object ${esc(t.objectNo)} / ${esc(t.materialName)} / ${esc(t.action)}</p>
    <h1 id="r-title" class="visually-hidden">Translation ${esc(t.id)}</h1>
    ${editing ? `
      <form class="r-edit" data-edit novalidate>
        <label for="r-text" class="mono">Edit translation</label>
        <textarea id="r-text" rows="6" maxlength="${col.MAX}" aria-describedby="r-err">${esc(t.text)}</textarea>
        <p id="r-err" class="err" role="alert" hidden></p>
        <div class="r-actions"><button class="cta cta--fill" type="submit">Save changes</button><button class="cta" type="button" data-cancel>Cancel</button></div>
      </form>` : `<blockquote class="r-text">“${esc(t.text)}”</blockquote>`}
    <dl class="kvs mono r-meta">
      <div class="kv"><dt>Translation</dt><dd>${esc(t.id)}</dd></div>
      <div class="kv"><dt>Object</dt><dd>${esc(t.objectNo)} ${esc(t.materialName)}</dd></div>
      <div class="kv"><dt>Action</dt><dd>${esc(t.action)}</dd></div>
      <div class="kv"><dt>Written</dt><dd>${fmtDate(t.createdAt)}</dd></div>
      ${t.updatedAt !== t.createdAt ? `<div class="kv"><dt>Edited</dt><dd>${fmtDate(t.updatedAt)}</dd></div>` : ""}
      <div class="kv"><dt>Status</dt><dd>${submissionStatus(t)}</dd></div>
      ${t.contribution ? `<div class="kv"><dt>Credit</dt><dd>${t.displayName ? esc(t.displayName) : "Anonymous"}</dd></div>` : ""}
    </dl>
    ${flash ? `<p class="flash" role="status">${esc(flash)}</p>` : ""}
    ${t.submissionStatus === "PENDING_REVIEW" ? `<p class="muted small">${held ? "The Library's review queue could not be reached, so this submission is held in this browser. It is sent automatically the next time you open My Collection while online." : "Submitted to the Lab. It appears in the public Library only after review. Your private copy stays here."}</p>` : ""}
    ${t.submissionStatus === "PUBLISHED" ? `<p class="muted small">Approved and shown on the public record for ${esc(t.materialName)}.</p>` : ""}
    ${editing ? "" : `
    <div class="r-actions">
      ${isPrivate ? `<button type="button" class="cta" data-act="edit">Edit</button>` : ""}
      <button type="button" class="cta" data-act="remove">Remove</button>
      ${isPrivate ? `<a class="cta cta--fill" href="${href.contribute(t.id)}">Contribute to the Lab <span aria-hidden="true">→</span></a>` : `<button type="button" class="cta" data-act="withdraw">Withdraw from the Lab</button>`}
      ${o ? `<a class="cta" href="${href.object(o)}">View original material record</a>` : ""}
    </div>`}
    <p class="err" role="alert" data-err hidden></p>
  </article>
  <dialog class="confirm" data-confirm aria-labelledby="dlg-t">
    <form method="dialog">
      <p id="dlg-t" class="mono">Remove ${esc(t.id)}?</p>
      <p>${isPrivate ? "This deletes the translation from your collection. It cannot be undone." : "This deletes your private copy and withdraws the contribution from the Lab. It cannot be undone."}</p>
      <div class="r-actions"><button class="cta cta--fill" value="yes">Remove</button><button class="cta" value="no" autofocus>Keep it</button></div>
    </form>
  </dialog>`;

  const errEl = $("[data-err]", main);
  const fail = e => { errEl.textContent = e.message; errEl.hidden = false; };
  if (editing) {
    const ta = $("#r-text", main); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    $("[data-cancel]", main).addEventListener("click", () => render(main, id));
    $("[data-edit]", main).addEventListener("submit", ev => {
      ev.preventDefault();
      try { col.editText(id, ta.value); render(main, id, { flash: "Changes saved." }); announce("Changes saved."); }
      catch (e) { const r = $("#r-err", main); r.textContent = e.message; r.hidden = false; ta.focus(); }
    });
    return;
  }
  main.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", async () => {
    const act = b.dataset.act;
    if (act === "edit") return render(main, id, { editing: true });
    if (act === "withdraw") {
      b.disabled = true;
      try { await withdraw(id); render(main, id, { flash: "Withdrawn. The translation is private again." }); announce("Withdrawn."); }
      catch (e) { b.disabled = false; fail(e); }
    }
    if (act === "remove") {
      const dlg = $("[data-confirm]", main);
      dlg.addEventListener("close", async () => {
        if (dlg.returnValue !== "yes") return;
        try { if (t.contribution) await withdraw(id); col.remove(id); announce(`${id} removed.`); location.hash = href.collection; }
        catch (e) { fail(e); }
      }, { once: true });
      dlg.showModal();
    }
  }));
}
