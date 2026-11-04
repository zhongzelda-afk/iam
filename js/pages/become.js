// 04 Become a Material: WATCH > IMAGINE > TRANSLATE on one page. One text box, no questionnaire.
import { esc, $, announce } from "../lib/util.js?v=202611040018";
import { href } from "../lib/library.js?v=202611040018";
import * as col from "../lib/collection.js?v=202611040018";
import { videoPlayer } from "../components/videoPlayer.js?v=202611040018";

const DRAFT = slug => `iam.draft.${slug}`;
const readDraft = slug => { try { return sessionStorage.getItem(DRAFT(slug)) || ""; } catch { return ""; } };
const writeDraft = (slug, v) => { try { v ? sessionStorage.setItem(DRAFT(slug), v) : sessionStorage.removeItem(DRAFT(slug)); } catch {} };

export function render(main, o) {
  const name = o.name.toLowerCase();
  const perf = o.bodyPerformanceVideo;
  main.innerHTML = `
  <article class="become" aria-labelledby="b-title">
    <header class="b-head">
      <a class="mono back" href="${href.object(o)}">← Object ${o.no} ${esc(o.name)}</a>
      <ol class="b-steps mono" aria-label="Three steps"><li>01 Watch</li><li>02 Imagine</li><li>03 Translate</li></ol>
    </header>

    <section class="b-watch" aria-labelledby="b-watch-t">
      <div class="b-label">
        <p class="mono sec-k">01 · Watch</p>
        <h2 id="b-watch-t" class="mono">Embodied performance / Workshop documentation</h2>
        <p class="mono">Object ${o.no} / ${esc(o.name)}<br>Action / ${esc(o.primaryAction)}</p>
        <p class="muted small">A human interpretation of the material action, not a scientific record, and not the only way to embody it.</p>
      </div>
      <div class="b-media">
        ${perf ? videoPlayer(perf, { id: "perf-video", label: "Workshop body performance" }) : `
        <div class="b-pending" role="note">
          <p class="mono">Workshop body performance · footage not yet added</p>
          <p>When the workshop film of participants becoming the ${esc(name)} is added, it plays here. Until then, watch the material itself once more.</p>
        </div>
        ${o.experimentVideo ? videoPlayer(o.experimentVideo, { id: "exp-video-b", label: "Material action" }) : ""}`}
      </div>
    </section>

    <section class="b-imagine" aria-labelledby="b-title">
      <p class="mono sec-k">02 · Imagine</p>
      <h1 id="b-title" class="b-title">Become the ${esc(o.name)}.</h1>
      <p class="b-prompt">“You have seen how the ${esc(name)} changes under pressure. Now imagine the action from within.”</p>
    </section>

    <section class="b-translate" aria-labelledby="b-ask">
      <p class="mono sec-k">03 · Translate</p>
      <form class="b-form" data-form novalidate>
        <label id="b-ask" for="b-text" class="b-ask">What would you say?</label>
        <p id="b-help" class="muted">You are not describing the material. You are speaking as the material.</p>
        <textarea id="b-text" name="text" rows="5" maxlength="${col.MAX}" placeholder="I..." aria-describedby="b-help b-err" required>${esc(readDraft(o.slug))}</textarea>
        <p id="b-err" class="err" role="alert" hidden></p>
        <div class="b-actions">
          <button class="cta cta--fill" type="submit">Add to My Collection <span aria-hidden="true">→</span></button>
          <p class="mono muted small">Saved privately in this browser. Nothing is shared unless you choose to contribute.</p>
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
      <p class="mono saved-k"><span class="status status--private"><span class="status-dot" aria-hidden="true"></span>Saved · Private</span> ${esc(t.id)} / Object ${esc(t.objectNo)}</p>
      <blockquote class="saved-text">“${esc(t.text)}”</blockquote>
      <p class="mono muted">${esc(t.materialName)} / ${esc(t.action)}</p>
      <div class="saved-actions">
        <a class="cta cta--fill" href="${href.collection}">View My Collection <span aria-hidden="true">→</span></a>
        <a class="cta" href="${href.contribute(t.id)}">Contribute to the Lab</a>
        <button type="button" class="link mono" data-again>Write another</button>
      </div>`;
    done.classList.add("is-in");
    done.focus();
    announce(`Saved to My Collection as ${t.id}.`);
    $("[data-again]", done).addEventListener("click", () => render(main, o));
  });
}
