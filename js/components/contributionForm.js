// Contribution Form: one short step. Optional name (blank = anonymous), one unchecked consent box, one button.
import { $, announce } from "../lib/util.js?v=202611082312";
import { submit } from "../lib/contributions.js?v=202611082312";
import { submissionStatus } from "./status.js?v=202611082312";

export function contributionForm(t, { id = "share" } = {}) {
  return `
  <form class="share" data-share novalidate aria-labelledby="${id}-t">
    <p id="${id}-t" class="share-t">Share it with the Library? <span class="muted">Optional</span></p>
    <label class="share-name"><span class="mono">Name to show</span>
      <input type="text" maxlength="40" autocomplete="nickname" placeholder="Leave blank to stay anonymous" data-name></label>
    <label class="check"><input type="checkbox" data-consent> <span>I agree that my Translation may be displayed in the public I.A.M. Material Library.</span></label>
    <p class="small muted">Lynn reviews it before it appears. Your private copy stays in My Collection, and you can withdraw it there any time.</p>
    <p class="err" role="alert" data-err hidden></p>
    <button class="cta" type="submit" data-submit>Share for review <span aria-hidden="true">→</span></button>
  </form>`;
}

export function mountContributionForm(root, t, { onDone } = {}) {
  const form = $("[data-share]", root); if (!form) return;
  const consent = $("[data-consent]", form), err = $("[data-err]", form), btn = $("[data-submit]", form);
  consent.addEventListener("change", () => { if (consent.checked) err.hidden = true; });
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    if (!consent.checked) { err.textContent = "Tick the box to share. Nothing is shared without it."; err.hidden = false; consent.focus(); return; }
    btn.disabled = true; btn.textContent = "Sharing…";
    try {
      const r = await submit(t.id, { displayName: $("[data-name]", form).value.trim() || null });
      const held = r.contribution && r.contribution.queue === "browser";
      form.outerHTML = `<div class="share share--done" tabindex="-1" data-shared>
        <p class="mono">${submissionStatus(r)}</p>
        <p>${held ? "Saved for review. The Library could not be reached just now, so it will be sent the next time you open My Collection." : "Sent for review. It appears in the Library once Lynn approves it."}</p>
      </div>`;
      const done = $("[data-shared]", root); done && done.focus();
      announce("Shared for review.");
      onDone && onDone(r);
    } catch (e) { btn.disabled = false; btn.innerHTML = 'Share for review <span aria-hidden="true">→</span>'; err.textContent = e.message; err.hidden = false; }
  });
}

