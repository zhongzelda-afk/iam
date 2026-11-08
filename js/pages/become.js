// 04 Become a Material: the card game, then the visitor's own Voice.
// The site plays the HUMAN. It gives you an Identity card from the material you became,
// then plays Action cards on you. You answer each one with a Response card, and the human
// reads you with a Translation card. The human decides how long this goes on (3 to 5 rounds)
// and always ends with RELEASE. You never get a stop button: that is the point.
// Afterwards your Voice is your archive entry: kept in My Collection, optionally shared.
import { esc, $, $$, announce, reduceMotion } from "../lib/util.js?v=202611082312";
import { href } from "../lib/library.js?v=202611082312";
import * as col from "../lib/collection.js?v=202611082312";
import { videoPlayer } from "../components/videoPlayer.js?v=202611082312";
import { contributionForm, mountContributionForm } from "../components/contributionForm.js?v=202611082312";
import { ACTIONS, RESPONSES, TRANSLATIONS, VOICES, IDENTITIES, MAX_ROUNDS } from "../data/cards.js?v=202611082312";

const DRAFT = slug => `iam.draft.${slug}`;
const readDraft = slug => { try { return sessionStorage.getItem(DRAFT(slug)) || ""; } catch { return ""; } };
const writeDraft = (slug, v) => { try { v ? sessionStorage.setItem(DRAFT(slug), v) : sessionStorage.removeItem(DRAFT(slug)); } catch {} };
const tOf = r => TRANSLATIONS.find(t => t.n === r.t);
const pick = a => a[Math.floor(Math.random() * a.length)];

// The human's plan: 3 to 5 rounds, hidden from the player. Pressing moves first, RELEASE last.
function planActions() {
  const total = 3 + Math.floor(Math.random() * (MAX_ROUNDS - 2));
  const pool = ACTIONS.filter(a => a.n !== "A 05"), out = [];
  for (let i = 0; i < total - 1; i++) out.push(pick(pool.filter(a => a !== out[i - 1])));
  out.push(ACTIONS.find(a => a.n === "A 05"));
  return out;
}

const actionCard = (a, i) => `
  <div class="card card--a" role="group" aria-label="Action card ${esc(a.n)}, ${esc(a.word)}">
    <p class="card-k mono"><span class="num-box">${String(i + 1).padStart(2, "0")}</span> Action · ${esc(a.n)}</p>
    <p class="card-word">${esc(a.word)}</p>
    <p class="card-text">${esc(a.text)}</p>
  </div>`;

const translationCard = t => `
  <div class="card card--t" role="group" aria-label="Translation card ${esc(t.n)}, ${esc(t.word)}">
    <p class="card-k mono">Translation · ${esc(t.n)}</p>
    <p class="card-word">${esc(t.word)}</p>
    <p class="card-text">${esc(t.meaning)}</p>
    <p class="card-q">${esc(t.question)}</p>
  </div>`;

const responseChoice = (r, round) => `
  <button type="button" class="card card--r" data-resp="${esc(r.n)}" aria-describedby="g-ask-${round}">
    <span class="card-k mono">Response · ${esc(r.n)}</span>
    <span class="card-word">${esc(r.word)}</span>
    <span class="card-voice">“${esc(r.voice)}”</span>
    <span class="card-text">${esc(r.physical)}</span>
  </button>`;

const responsePlayed = r => `
  <div class="card card--r is-played" role="group" aria-label="Your Response card ${esc(r.n)}, ${esc(r.word)}">
    <p class="card-k mono">You · Response · ${esc(r.n)}</p>
    <p class="card-word">${esc(r.word)}</p>
    <p class="card-voice">“${esc(r.voice)}”</p>
  </div>`;

function identityCard(o) {
  const id = IDENTITIES[o.slug];
  if (!id) return `
    <div class="card card--i card--i-none" role="group" aria-label="No Identity card for ${esc(o.name)}">
      <p class="card-k mono">Identity · none yet</p>
      <p class="card-word">The ${esc(o.name)}</p>
      <p class="card-text">There is no Identity card for this material yet. You play it as you find it.</p>
    </div>`;
  return `
    <div class="card card--i" role="group" aria-label="Identity card ${esc(id.n)}, ${esc(id.name)}">
      <p class="card-k mono">Identity · ${esc(id.n)} · ${esc(o.name)}</p>
      <p class="card-word">${esc(id.name)}</p>
      <p class="card-text">${esc(id.note)}</p>
      <dl class="card-dl">
        <dt class="mono">Physical</dt><dd>${esc(id.physical)}</dd>
        <dt class="mono">Response</dt><dd>${esc(id.response)}</dd>
      </dl>
      ${id.expected ? `<p class="card-flag mono">Expected behaviour, not yet filmed</p>` : ""}
    </div>`;
}

export function render(main, o) {
  const name = o.name.toLowerCase();
  const perf = o.bodyPerformanceVideo;
  main.innerHTML = `
  <article class="become" aria-labelledby="b-title">
    <a class="mono back" href="${href.object(o)}">← Object ${o.no} ${esc(o.name)}</a>

    <header class="b-head">
      <p class="mono muted">Object ${o.no} / ${esc(o.name)} / Card game</p>
      <h1 id="b-title" class="b-title">Become the ${esc(o.name)}.</h1>
      <p class="b-prompt">You are the ${esc(name)} now. Someone will handle you. You can answer, but you cannot make them stop.</p>
    </header>

    ${perf ? `<section class="b-watch frame" data-no="00" aria-label="Embodied performance">
      ${videoPlayer(perf, { id: "perf-video", label: "Embodied performance" })}
      <p class="muted small b-note">One person's way of becoming the ${esc(name)}, not the only way.</p>
    </section>` : ""}

    <section class="b-game frame" data-no="01" aria-labelledby="g-h">
      <div class="g-intro">
        <div>
          <p class="mono g-step">Your card</p>
          ${identityCard(o)}
        </div>
        <div class="g-rules">
          <h2 id="g-h" class="g-h">The human plays first.</h2>
          <ol class="g-list">
            <li><span class="mono">Action</span> The human does something to you.</li>
            <li><span class="mono">Response</span> You choose how you, the ${esc(name)}, respond.</li>
            <li><span class="mono">Translation</span> The human reads your response as a feeling.</li>
          </ol>
          <p class="muted small">At most ${MAX_ROUNDS} rounds. Only the human decides when it ends.</p>
          <button type="button" class="cta cta--fill" data-start>Let the human begin <span aria-hidden="true">→</span></button>
        </div>
      </div>
      <ol class="g-rounds" data-rounds aria-live="polite"></ol>
      <p class="g-end" data-end hidden tabindex="-1"></p>
    </section>

    <section class="b-write frame" data-no="02" data-voice hidden aria-labelledby="v-h">
      <form class="b-form" data-form novalidate>
        <p class="mono g-step">Voice</p>
        <label for="b-text" class="b-ask" id="v-h">Now it is your turn. What would you say?</label>
        <p id="b-help" class="muted">You are not describing the ${esc(name)}. You are speaking as it. This becomes your entry in the archive.</p>
        <div class="v-starters" role="group" aria-label="Voice cards to start from">
          ${VOICES.map(v => `<button type="button" class="v-chip" data-voice-card="${esc(v.text)}"><span class="mono">${esc(v.n)}</span> ${esc(v.text)}</button>`).join("")}
        </div>
        <textarea id="b-text" name="text" rows="4" maxlength="${col.MAX}" placeholder="I..." aria-describedby="b-help b-err" required>${esc(readDraft(o.slug))}</textarea>
        <p id="b-err" class="err" role="alert" hidden></p>
        <div class="b-actions">
          <button class="cta cta--fill" type="submit">Keep it in My Collection <span aria-hidden="true">→</span></button>
          <p class="mono muted small">Private, kept in this browser. You can share it next.</p>
        </div>
      </form>
      <div class="b-done" data-done hidden tabindex="-1"></div>
    </section>
  </article>`;

  const game = $(".b-game", main), rounds = $("[data-rounds]", main), endP = $("[data-end]", main);
  const voice = $("[data-voice]", main), startBtn = $("[data-start]", main);
  const pause = ms => new Promise(r => setTimeout(r, reduceMotion() ? 0 : ms));
  const plan = planActions(), trail = [];
  let alive = true;
  const gone = () => !alive || !main.contains(game);

  async function round(i) {
    const a = plan[i];
    const li = document.createElement("li");
    li.className = "g-round";
    li.innerHTML = `
      <div class="g-col g-human"><p class="mono g-who">The human</p>${actionCard(a, i)}</div>
      <div class="g-col g-you" data-you>
        <p class="mono g-who" id="g-ask-${i}">You, the ${esc(name)}. How do you respond to “${esc(a.word)}”?</p>
        <div class="g-hand">${RESPONSES.map(r => responseChoice(r, i)).join("")}</div>
      </div>
      <div class="g-col g-human g-read" data-read></div>`;
    rounds.appendChild(li);
    li.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    announce(`The human plays ${a.word}. ${a.text} Choose your response.`);
    $(".card--r", li).focus({ preventScroll: true });

    const r = await new Promise(res => li.addEventListener("click", ev => {
      const b = ev.target.closest("[data-resp]"); if (b) res(RESPONSES.find(x => x.n === b.dataset.resp));
    }));
    const you = $("[data-you]", li);
    you.innerHTML = `<p class="mono g-who">You, the ${esc(name)}</p>${responsePlayed(r)}`;
    const t = tOf(r);
    await pause(700); if (gone()) return;
    const read = $("[data-read]", li);
    read.innerHTML = `<p class="mono g-who">The human reads you as</p>${translationCard(t)}`;
    read.classList.add("is-in");
    announce(`The human reads you as ${t.word}. ${t.question}`);
    trail.push({ action: a.n, response: r.n, translation: t.n });
  }

  async function play() {
    startBtn.disabled = true; startBtn.textContent = "The human is playing";
    game.classList.add("is-playing");
    for (let i = 0; i < plan.length; i++) {
      await round(i); if (gone()) return;
      if (i < plan.length - 1) {
        const wait = document.createElement("li");
        wait.className = "g-wait mono"; wait.textContent = "The human is not finished with you.";
        rounds.appendChild(wait);
        await pause(2600); if (gone()) return;
        wait.remove();
      }
    }
    await pause(1200); if (gone()) return;
    endP.hidden = false;
    endP.innerHTML = `<span class="mono">End · after ${plan.length} rounds</span> The human let go and walked away. They decided when it ended. You did not.`;
    endP.focus({ preventScroll: true });
    endP.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
    announce("The human ended the game. Now write your own voice.");
    startBtn.textContent = "Played";
    await pause(1400); if (gone()) return;
    voice.hidden = false;
    voice.classList.add("is-in");
  }
  startBtn.addEventListener("click", play, { once: true });

  // Voice: the visitor's own words become their archive entry.
  const form = $("[data-form]", main), ta = $("#b-text", main), err = $("#b-err", main), done = $("[data-done]", main);
  $$("[data-voice-card]", main).forEach(b => b.addEventListener("click", () => {
    ta.value = b.dataset.voiceCard + (ta.value.trim() ? " " + ta.value.trim() : "");
    writeDraft(o.slug, ta.value); ta.focus();
  }));
  ta.addEventListener("input", () => { writeDraft(o.slug, ta.value); if (!err.hidden && ta.value.trim()) { err.hidden = true; ta.removeAttribute("aria-invalid"); } });
  form.addEventListener("submit", ev => {
    ev.preventDefault();
    if (!ta.value.trim()) { err.textContent = "Write at least a few words, starting from “I”."; err.hidden = false; ta.setAttribute("aria-invalid", "true"); ta.focus(); return; }
    let t;
    try {
      t = col.create(o, ta.value);
      const id = IDENTITIES[o.slug];
      t = col.patch(t.id, { game: { identity: id ? id.n : null, rounds: trail, endedBy: "human" } });
    } catch (e) { err.textContent = e.message; err.hidden = false; return; }
    writeDraft(o.slug, "");
    form.hidden = true;
    done.hidden = false;
    done.innerHTML = `
      <p class="mono saved-k"><span class="status status--private"><span class="status-dot" aria-hidden="true"></span>Kept in My Collection</span> ${esc(t.id)} / Object ${esc(t.objectNo)}</p>
      <blockquote class="saved-text">“${esc(t.text)}”</blockquote>
      ${trail.length ? `<p class="mono muted small g-trail">${trail.map(s => `${esc(s.action)} → ${esc(s.response)} → ${esc(s.translation)}`).join("  ·  ")}</p>` : ""}
      ${contributionForm(t, { id: "b-share" })}
      <div class="saved-actions">
        <a class="cta cta--fill" href="${href.collection}">My Collection <span aria-hidden="true">→</span></a>
        <a class="link mono" href="${href.library}">Another material</a>
      </div>`;
    done.classList.add("is-in");
    done.focus();
    announce(`Kept in My Collection as ${t.id}.`);
    mountContributionForm(done, t);
  });
  return () => { alive = false; };
}
