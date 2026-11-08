// 04 Become a Material: a real card table.
// Two seats. The Human (played by the site) sits across; you sit as the material.
// Neither sees the other's hand. The human plays an Action face down and turns it over,
// you answer from your hand of Response cards, the human answers with a Translation.
// The human decides how many rounds (3 to 5) and always ends with RELEASE, then leaves.
// You have no stop button: that is the point. Last, you are dealt Voice cards and a
// blank card: the card you play becomes your entry, kept in My Collection or given to the Library.
import { esc, $, $$, announce, reduceMotion } from "../lib/util.js?v=202611082325";
import { href } from "../lib/library.js?v=202611082325";
import * as col from "../lib/collection.js?v=202611082325";
import { contributionForm, mountContributionForm } from "../components/contributionForm.js?v=202611082325";
import { ACTIONS, RESPONSES, TRANSLATIONS, VOICES, IDENTITIES, MAX_ROUNDS } from "../data/cards.js?v=202611082325";

const DRAFT = slug => `iam.draft.${slug}`;
const readDraft = slug => { try { return sessionStorage.getItem(DRAFT(slug)) || ""; } catch { return ""; } };
const writeDraft = (slug, v) => { try { v ? sessionStorage.setItem(DRAFT(slug), v) : sessionStorage.removeItem(DRAFT(slug)); } catch {} };
const pick = a => a[Math.floor(Math.random() * a.length)];

// Sets follow the printed decks: dark tarot shell for A, R, T, I; light shell for Voice and blanks.
const SETS = {
  A: { label: "Action", acc: "#C2493F" },
  R: { label: "Response", acc: "#A0679A" },
  T: { label: "Translation", acc: "#7FA27A" },
  I: { label: "Identity", acc: "#C9993F" },
  V: { label: "Voice", acc: "#2B231F", light: true },
  B: { label: "Your voice", acc: "#2B231F", light: true }
};

function planActions() {
  const total = 3 + Math.floor(Math.random() * (MAX_ROUNDS - 2));
  const pool = ACTIONS.filter(a => a.n !== "A 05"), out = [];
  for (let i = 0; i < total - 1; i++) out.push(pick(pool.filter(a => a !== out[i - 1])));
  out.push(ACTIONS.find(a => a.n === "A 05"));
  return out;
}

// compass star emblem, as on the printed card backs; k varies it per card
function star(acc, k = 0, light) {
  const pts = [];
  for (let i = 0; i < 16; i++) { const r = i % 2 ? 13 : (i % 4 ? 30 : 44), a = (i * Math.PI) / 8 - Math.PI / 2; pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`); }
  const line = light ? "#2B231F" : "#E6D9BA";
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    ${Array.from({ length: 2 + (k % 3) }, (_, i) => `<circle cx="50" cy="50" r="${46 - i * 7}" fill="none" stroke="${line}" stroke-width=".5" opacity="${.55 - i * .1}"/>`).join("")}
    <g transform="rotate(${(k * 11.25) % 45} 50 50)"><polygon points="${pts.join(" ")}" fill="${acc}" stroke="${line}" stroke-width=".5"/></g>
    <circle cx="50" cy="50" r="5" fill="${line}"/><circle cx="50" cy="50" r="2.2" fill="${acc}"/>
  </svg>`;
}

// card data → { set, n, word, text, more[] }
const cA = a => ({ set: "A", n: a.n, word: a.word, text: a.text, more: [] });
const cR = r => ({ set: "R", n: r.n, word: r.word, text: `“${r.voice}”`, more: [["Physical", r.physical], ["Human", r.human]] });
const cT = t => ({ set: "T", n: t.n, word: t.word, text: t.question, more: [["Meaning", t.meaning]] });
const cV = v => ({ set: "V", n: v.n, word: "", text: `“${v.text}”`, plain: v.text, more: [] });
const cB = () => ({ set: "B", n: "V __", word: "", text: "Write your own.", more: [] });

function face(c, k, o) {
  const s = SETS[c.set];
  const art = c.img ? `<img src="${esc(c.img)}" alt="">` : star(s.acc, k, s.light);
  return `<div class="pc-face pc-front"><div class="pc-panel">
      <div class="pc-top"><span class="pc-no">${esc(c.n)}</span><span class="pc-set">${esc(s.label)}</span></div>
      <div class="pc-art">${art}</div>
      ${c.word ? `<p class="pc-word">${esc(c.word)}</p>` : ""}
      <p class="pc-txt">${esc(c.text)}</p>
    </div></div>`;
}
function back(set) {
  const s = SETS[set];
  return `<div class="pc-face pc-back"><div class="pc-panel"><div class="pc-art">${star(s.acc, 0, s.light)}</div><p class="pc-set pc-back-t">${esc(s.label)}</p></div></div>`;
}
function cardEl(c, { down = false, tag = "div", k = 0 } = {}) {
  const el = document.createElement(tag);
  el.className = `pc pc--${c.set}${SETS[c.set].light ? " pc--light" : ""}${down ? " is-down" : ""}`;
  if (tag === "button") el.type = "button";
  el.innerHTML = `<div class="pc-in">${face(c, k)}${back(c.set)}</div>`;
  el._card = c;
  return el;
}
const label = c => `${SETS[c.set].label} card ${c.n}${c.word ? ", " + c.word : ""}. ${c.text}`;

export function render(main, o) {
  const name = o.name.toLowerCase();
  const idc = IDENTITIES[o.slug];
  const identity = idc
    ? { set: "I", n: idc.n, word: idc.name, text: idc.note, img: o.heroImage, more: [["Physical", idc.physical], ["Response", idc.response]] }
    : { set: "I", n: "I —", word: `The ${o.name}`, text: "No Identity card yet. You play it as you find it.", img: o.heroImage, more: [] };

  main.innerHTML = `
  <article class="become become--table" aria-labelledby="b-title">
    <div class="tb-head">
      <a class="mono back" href="${href.object(o)}">← Object ${o.no} ${esc(o.name)}</a>
      <h1 id="b-title" class="tb-title">Become the ${esc(o.name)}.</h1>
      <p class="mono muted tb-sub">A card game for two. You play the ${esc(name)}. The other player is human.</p>
    </div>

    <section class="table" aria-label="Card table" data-table>
      <div class="seat seat--human">
        <div class="seat-tag"><span class="seat-dot" aria-hidden="true"></span><span class="mono">The Human</span><span class="mono muted" data-hstate>waiting</span></div>
        <div class="hand hand--down" data-hhand aria-label="The human's hand, face down">${Array.from({ length: 5 }, (_, i) => `<div class="pc pc--A is-down" style="--i:${i}"><div class="pc-in">${face(cA(ACTIONS[0]), 0)}${back(i % 2 ? "T" : "A")}</div></div>`).join("")}</div>
      </div>

      <div class="felt">
        <p class="turn mono" data-turn aria-live="polite">Two seats. One of you will be handled.</p>
        <div class="slots" data-slots>
          <div class="slot" data-slot="A"><span class="mono">Action</span></div>
          <div class="slot" data-slot="R"><span class="mono">Your response</span></div>
          <div class="slot" data-slot="T"><span class="mono">Translation</span></div>
        </div>
        <div class="voice" data-voice hidden>
          <div class="slot slot--voice" data-slot="V"><span class="mono">Your card</span></div>
          <form class="voice-form" data-form novalidate>
            <label for="b-text" class="mono">Your voice, as the ${esc(name)}</label>
            <textarea id="b-text" rows="3" maxlength="${col.MAX}" placeholder="I..." aria-describedby="b-err">${esc(readDraft(o.slug))}</textarea>
            <p id="b-err" class="err" role="alert" hidden></p>
            <div class="voice-actions">
              <button type="submit" class="cta cta--fill" data-keep value="keep">Keep in My Collection</button>
              <button type="submit" class="cta cta--gold" data-give value="give">Give to the Material Library</button>
            </div>
          </form>
          <div class="b-done" data-done hidden tabindex="-1"></div>
        </div>
        <button type="button" class="cta cta--big tb-start" data-start>Sit down at the table <span aria-hidden="true">→</span></button>
        <ol class="played" data-played aria-label="Rounds played"></ol>
      </div>

      <div class="seat seat--you">
        <div class="you-id">
          <p class="mono seat-k">You are</p>
          <div data-idslot></div>
        </div>
        <div class="you-hand">
          <div class="hand hand--up" data-hand role="group" aria-label="Your hand"></div>
          <div class="hand-bar">
            <p class="hand-hint" data-hint aria-live="polite"></p>
            <button type="button" class="cta cta--big" data-play hidden>Play this card <span aria-hidden="true">↑</span></button>
          </div>
        </div>
      </div>
    </section>

    <p class="muted small tb-note">At most ${MAX_ROUNDS} rounds. The human decides when it ends. Tap any card on the table to read it closely.</p>
    <dialog class="zoom" data-zoom aria-label="Card"><div class="zoom-in"></div><button type="button" class="cta" data-zoom-close>Close</button></dialog>
  </article>`;

  const table = $("[data-table]", main), turn = $("[data-turn]", main), hstate = $("[data-hstate]", main);
  const hhand = $("[data-hhand]", main), hand = $("[data-hand]", main), hint = $("[data-hint]", main), playBtn = $("[data-play]", main);
  const slots = $("[data-slots]", main), played = $("[data-played]", main), startBtn = $("[data-start]", main);
  const voice = $("[data-voice]", main), zoom = $("[data-zoom]", main);
  const slot = k => $(`[data-slot="${k}"]`, main);
  const motion = () => !reduceMotion();
  const wait = ms => new Promise(r => setTimeout(r, motion() ? ms : 0));
  let alive = true;
  const gone = () => !alive || !main.contains(table);

  // the identity card is dealt face up to the player's seat
  const idEl = cardEl(identity, { tag: "button" });
  idEl.setAttribute("aria-label", "Your Identity card. " + label(identity));
  $("[data-idslot]", main).appendChild(idEl);

  // FLIP move: put el into target, animate from where it was
  async function fly(el, target, fromRect) {
    const first = fromRect || el.getBoundingClientRect();
    target.appendChild(el);
    if (!motion()) return;
    const last = el.getBoundingClientRect();
    const dx = first.left - last.left, dy = first.top - last.top, s = first.width / last.width;
    await el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(${dx > 0 ? -6 : 6}deg)` }, { transform: "none" }], { duration: 620, easing: "cubic-bezier(.2,.7,.2,1)" }).finished.catch(() => {});
  }
  async function humanPlays(c, key, k) {
    const backs = $$(".pc", hhand); const from = backs[Math.floor(backs.length / 2)];
    from.classList.add("is-lift");
    await wait(450);
    from.classList.remove("is-lift");
    const el = cardEl(c, { down: true, tag: "button", k });
    el.setAttribute("aria-label", label(c));
    await fly(el, slot(key), from.getBoundingClientRect());
    await wait(250);
    el.classList.remove("is-down");
    await wait(motion() ? 600 : 0);
  }
  function setTurn(text, who) {
    turn.textContent = text;
    table.dataset.turn = who;
    hstate.textContent = who === "human" ? "playing" : who === "gone" ? "left the table" : "waiting";
  }

  // player's hand: select, then play
  let resolvePick = null, selected = null;
  function fillHand(cards) {
    hand.innerHTML = "";
    cards.forEach((c, i) => {
      const el = cardEl(c, { tag: "button", k: i + 1 });
      el.style.setProperty("--i", i);
      el.setAttribute("aria-label", label(c));
      el.setAttribute("aria-pressed", "false");
      hand.appendChild(el);
    });
    layoutHand();
  }
  function layoutHand() {
    const els = $$(".pc", hand), n = els.length;
    els.forEach((el, i) => { el.style.setProperty("--rot", `${(i - (n - 1) / 2) * 4}deg`); el.style.setProperty("--dy", `${Math.abs(i - (n - 1) / 2) * 6}px`); });
  }
  function select(el) {
    selected = el;
    $$(".pc", hand).forEach(x => { x.classList.toggle("is-sel", x === el); x.setAttribute("aria-pressed", x === el); });
    const c = el._card;
    hint.innerHTML = c.set === "R"
      ? `<b>${esc(c.n)} ${esc(c.word)}</b> ${esc(c.text)} <span>${esc(c.more[0][1])}</span>`
      : c.set === "B" ? `<b>Blank card</b> Write your own voice.` : `<b>${esc(c.n)}</b> ${esc(c.text)}`;
    playBtn.hidden = false;
  }
  hand.addEventListener("click", ev => {
    const el = ev.target.closest(".pc"); if (!el || !resolvePick) return;
    if (selected === el) return playSelected();
    select(el);
  });
  playBtn.addEventListener("click", () => playSelected());
  function playSelected() {
    if (!selected || !resolvePick) return;
    const r = resolvePick; resolvePick = null; playBtn.hidden = true;
    r(selected);
  }
  function yourTurn(text) {
    setTurn(text, "you");
    hint.textContent = "Choose a card from your hand.";
    selected = null;
    const first = $(".pc", hand); first && first.focus({ preventScroll: true });
    return new Promise(res => { resolvePick = res; });
  }

  async function play() {
    startBtn.hidden = true;
    table.classList.add("is-on");
    table.scrollIntoView({ behavior: motion() ? "smooth" : "auto", block: "start" });
    const plan = planActions(), trail = [];
    setTurn("Dealing.", "deal");
    fillHand(RESPONSES.map(cR));
    if (motion()) $$(".pc", hand).forEach((el, i) => el.animate([{ transform: "translateY(-60vh) rotate(-20deg)", opacity: 0 }, { opacity: 1 }], { duration: 520, delay: i * 90, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" }));
    await wait(1000); if (gone()) return;

    for (let i = 0; i < plan.length; i++) {
      const a = plan[i];
      setTurn(`Round ${i + 1}. The human plays.`, "human");
      await humanPlays(cA(a), "A", i); if (gone()) return;
      announce(`The human plays ${a.word}. ${a.text} Your turn.`);
      const el = await yourTurn(`The human: ${a.word.toUpperCase()}. Your turn. How does the ${name} respond?`); if (gone()) return;
      el.classList.remove("is-sel"); el.removeAttribute("aria-pressed");
      hint.textContent = "";
      await fly(el, slot("R")); layoutHand();
      const r = RESPONSES.find(x => x.n === el._card.n), t = TRANSLATIONS.find(x => x.n === r.t);
      setTurn("The human reads you.", "human");
      await wait(500); if (gone()) return;
      await humanPlays(cT(t), "T", i + 2); if (gone()) return;
      announce(`The human reads you as ${t.word}. ${t.question}`);
      trail.push({ action: a.n, response: r.n, translation: t.n });
      await wait(2600); if (gone()) return;
      // sweep the round into the played row
      const li = document.createElement("li");
      li.innerHTML = `<span class="mono">${String(i + 1).padStart(2, "0")}</span>`;
      played.appendChild(li);
      for (const k of ["A", "R", "T"]) { const c = $(".pc", slot(k)); c && await fly(c, li); }
      if (i < plan.length - 1) { setTurn("The human is not finished with you.", "human"); await wait(1200); if (gone()) return; }
    }

    // the human leaves; the player gets their voice
    setTurn(`The human let go after ${plan.length} rounds and left the table. They decided when it ended. You did not.`, "gone");
    announce("The human ended the game and left the table.");
    table.classList.add("is-left");
    await wait(2400); if (gone()) return;
    slots.hidden = true; voice.hidden = false;
    fillHand([...VOICES.map(cV), cB()]);
    const el = await yourTurn("Your last card is your own voice. Play a Voice card, or the blank card to write your own."); if (gone()) return;
    el.classList.remove("is-sel");
    hint.textContent = "";
    $$(".pc", hand).forEach(x => x !== el && x.classList.add("is-out"));
    await fly(el, slot("V"));
    hand.innerHTML = "";
    setTurn("Your voice becomes your entry in the archive.", "you");
    const ta = $("#b-text", main);
    if (el._card.plain && !ta.value.trim()) ta.value = el._card.plain;
    ta.focus();
    main._trail = trail;
  }
  startBtn.addEventListener("click", () => play(), { once: true });

  // zoom any card on the table
  table.addEventListener("click", ev => {
    const el = ev.target.closest(".pc"); if (!el || el.closest("[data-hand]") || el.closest("[data-hhand]") || el.classList.contains("is-down") || !el._card) return;
    const c = el._card;
    $(".zoom-in", zoom).innerHTML = `<div class="zoom-card"></div><div class="zoom-txt"><p class="mono">${esc(SETS[c.set].label)} · ${esc(c.n)}</p>${c.word ? `<h2>${esc(c.word)}</h2>` : ""}<p class="zoom-q">${esc(c.text)}</p>${c.more.map(([k, v]) => `<p><span class="mono">${esc(k)}</span> ${esc(v)}</p>`).join("")}</div>`;
    $(".zoom-card", zoom).appendChild(cardEl(c));
    zoom.showModal();
  });
  $("[data-zoom-close]", main).addEventListener("click", () => zoom.close());
  zoom.addEventListener("click", ev => { if (ev.target === zoom) zoom.close(); });

  // saving the voice
  const form = $("[data-form]", main), ta = $("#b-text", main), err = $("#b-err", main), done = $("[data-done]", main);
  ta.addEventListener("input", () => { writeDraft(o.slug, ta.value); if (!err.hidden && ta.value.trim()) err.hidden = true; });
  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const give = ev.submitter && ev.submitter.value === "give";
    if (!ta.value.trim()) { err.textContent = "Write at least a few words, starting from “I”."; err.hidden = false; ta.focus(); return; }
    let t;
    try {
      t = col.create(o, ta.value);
      t = col.patch(t.id, { game: { identity: idc ? idc.n : null, rounds: main._trail || [], endedBy: "human" } });
    } catch (e) { err.textContent = e.message; err.hidden = false; return; }
    writeDraft(o.slug, "");
    form.hidden = true; done.hidden = false;
    done.innerHTML = `
      <p class="mono saved-k"><span class="status status--private"><span class="status-dot" aria-hidden="true"></span>Kept in My Collection</span> ${esc(t.id)}</p>
      <blockquote class="saved-text">“${esc(t.text)}”</blockquote>
      ${give ? contributionForm(t, { id: "b-share" }) : `<p class="small">It stays private in this browser. You can still give it to the Library from My Collection.</p>`}
      <div class="saved-actions">
        <a class="cta cta--fill" href="${href.collection}">My Collection <span aria-hidden="true">→</span></a>
        <a class="link mono" href="${href.library}">Become another material</a>
      </div>`;
    done.focus();
    announce(`Kept in My Collection as ${t.id}.`);
    if (give) { mountContributionForm(done, t); const c = $("[data-consent]", done); c && c.focus(); }
  });
  return () => { alive = false; };
}
