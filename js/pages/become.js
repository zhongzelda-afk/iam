// 04 Become a Material: watch, then write as the material. One text box, one button.
// After saving, sharing with the Library is one optional step on the same screen.
import { esc, $, announce } from "../lib/util.js?v=202611041513";
import { href } from "../lib/library.js?v=202611041513";
import * as col from "../lib/collection.js?v=202611041513";
import { videoPlayer } from "../components/videoPlayer.js?v=202611041513";
import { contributionForm, mountContributionForm } from "../components/contributionForm.js?v=202611041513";

const DRAFT = slug => `iam.draft.${slug}`;
const readDraft = slug => { try { return sessionStorage.getItem(DRAFT(slug)) || ""; } catch { return ""; } };
const writeDraft = (slug, v) => { try { v ? sessionStorage.setItem(DRAFT(slug), v) : sessionStorage.removeItem(DRAFT(slug)); } catch {} };

export function render(main, o) {
  const name = o.name.toLowerCase();
  const perf = o.bodyPerformanceVideo;
  main.innerHTML = `
  <article class="become" aria-labelledby="b-title">
    <a class="mono back" href="${href.object(o)}">← Object ${o.no} ${esc(o.name)}</a>

    <section class="b-watch" aria-label="Embodied performance">
      ${perf ? videoPlayer(perf, { id: "perf-video", label: "Embodied performance" }) : `
      <div class="b-slot" role="img" aria-label="Space for the workshop body performance video, not yet added">
        <p class="mono">Embodied performance / Workshop documentation</p>
        <p class="mono muted">Object ${o.no} / ${esc(o.name)} / ${esc(o.primaryAction)}</p>
        <p class="mono muted b-slot-soon">Video coming soon</p>
      </div>`}
      <p class="muted small b-note">One person's way of becoming the ${esc(name)}, not the only way.</p>
    </section>

    <section class="b-write" aria-labelledby="b-title">
      <h1 id="b-title" class="b-title">Become the ${esc(o.name)}.</h1>
      <p class="b-prompt">“You have seen how the ${esc(name)} changes under pressure. Now imagine the action from within.”</p>
      <form class="b-form" data-form novalidate>
        <label for="b-text" class="b-ask">What would you say?</label>
        <p id="b-help" class="muted">You are not describing the material. You are speaking as the material.</p>
        <textarea id="b-text" name="text" rows="4" maxlength="${col.MAX}" placeholder="I..." aria-describedby="b-help b-err" required>${esc(readDraft(o.slug))}</textarea>
        <p id="b-err" class="err" role="alert" hidden></p>
        <div class="b-actions">
          <button class="cta cta--fill" type="submit">Add to My Collection <span aria-hidden="true">→</span></button>
          <p class="mono muted small">Private, kept in this browser.</p>
        </div>
      </form>
      <div class="b-done" data-done hidden tabindex="-1"></div>
    </section>
  </article>`;

  const form = $("[data-form]", main), ta = $("#b-text", main), err = $("#b-err", main), done = $("[data-done]", main);
  ta.addEventListener("input", () => { writeDraft(o.slug, ta.value); if (!err.hidden && ta.value.trim()) { err.hidden = true; ta.removeAttribute("aria-invalid"); } });
  form.addEventListener("submit", ev => {
    ev.preventDefault();
    if (!ta.value.trim()) { err.textContent = "Write at least a few words, starting from “I”."; err.hidden = false; ta.setAttribute("aria-invalid", "true"); ta.focus(); return; }
    let t;
    try { t = col.create(o, ta.value); } catch (e) { err.textContent = e.message; err.hidden = false; return; }
    writeDraft(o.slug, "");
    form.hidden = true;
    done.hidden = false;
    done.innerHTML = `
      <p class="mono saved-k"><span class="status status--private"><span class="status-dot" aria-hidden="true"></span>Saved to My Collection</span> ${esc(t.id)} / Object ${esc(t.objectNo)}</p>
      <blockquote class="saved-text">“${esc(t.text)}”</blockquote>
      ${contributionForm(t, { id: "b-share" })}
      <div class="saved-actions">
        <a class="cta cta--fill" href="${href.collection}">My Collection <span aria-hidden="true">→</span></a>
        <a class="link mono" href="${href.library}">Another material</a>
      </div>`;
    done.classList.add("is-in");
    done.focus();
    announce(`Saved to My Collection as ${t.id}.`);
    mountContributionForm(done, t);
  });
}
