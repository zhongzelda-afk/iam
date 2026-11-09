// 04 Become a Material: a real card table.
// Two seats. The Human (played by the site) sits across; you sit as the material.
// Neither sees the other's hand. The human plays an Action face down and turns it over,
// you answer from your hand of Response cards, the human answers with a Translation.
// The human decides how many rounds (3 to 5) and always ends with RELEASE, then leaves.
// You have no stop button: that is the point. Last, you are dealt Voice cards and a
// blank card: the card you play becomes your entry, kept in My Collection or given to the Library.
import { esc, $, $$, announce, reduceMotion } from "../lib/util.js?v=202611091126";
import { href } from "../lib/library.js?v=202611091126";
import * as col from "../lib/collection.js?v=202611091126";
import { contributionForm, mountContributionForm } from "../components/contributionForm.js?v=202611091126";
import { ACTIONS, RESPONSES, TRANSLATIONS, VOICES, IDENTITIES, MAX_ROUNDS } from "../data/cards.js?v=202611091126";

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

// The human's lines. The cards give the meaning; the human improvises around it, like dialogue in a film.
const LINES = {
  "A 01": ["Hold still. This won't take long.", "Let's see how much you can take.", "I'm only pressing a little. You'll be fine."],
  "A 02": ["Come on. Show me what's inside.", "Tighter. I want to see you change.", "Don't make this harder than it is."],
  "A 03": ["Come here. You're coming with me.", "Let go of the table.", "Stretch a little more for me."],
  "A 04": ["Let's try you another way.", "You'll take a better shape like this.", "Don't fight it. Turn."],
  "A 05": ["Fine. I'm done with you.", "That's enough. I have other things to hold.", "There. Keep whatever's left."]
};
const READ = { // [mocking, comforting]
  "T 01": ["Still holding on to that? Let it go already.", "It's alright to keep the mark. I won't rush you."],
  "T 02": ["Falling apart over a little pressure?", "Too much? Breathe. I'll ease off. For now."],
  "T 03": ["How much longer do you need? I can't wait forever.", "Take your time. I'll still be here."],
  "T 04": ["Pretending you're fine? I can see the bruise.", "You don't have to show it. I know something changed."],
  "T 05": ["Stop clinging to my hand.", "You don't want me to leave, do you?"]
};
const BACKTALK = ["Oh, now you talk back?", "Hm. I didn't know you could speak.", "Nobody asked you.", "Say that again. Slowly.", "Interesting. Go on, then."];
const LEAVING = ["I'm finished here.", "Someone will clear this up.", "Don't take it personally. It's what I do with things."];

function planActions() {
  const total = 3 + Math.floor(Math.random() * (MAX_ROUNDS - 2));
  const pool = ACTIONS.filter(a => a.n !== "A 05"), out = [];
  for (let i = 0; i < total - 1; i++) out.push(pick(pool)); // the human may repeat a card
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
const cA = a => ({ set: "A", n: a.n, file: CARD_IMG(a.n), word: a.word, text: a.text, more: [] });
const cR = r => ({ set: "R", n: r.n, file: CARD_IMG(r.n), word: r.word, text: `“${r.voice}”`, more: [["Physical", r.physical], ["Human", r.human]] });
const cT = t => ({ set: "T", n: t.n, file: CARD_IMG(t.n), word: t.word, text: t.question, more: [["Meaning", t.meaning]] });
const cV = v => ({ set: "V", n: v.n, file: CARD_IMG(v.n), word: "", text: `“${v.text}”`, plain: v.text, more: [] });
const cB = () => ({ set: "B", n: "Blank", file: CARD_IMG(pick(BLANKS)), word: "", text: "Write your own.", more: [] });
const cSpeak = () => ({ set: "B", n: "Own words", file: CARD_IMG("B02"), word: "", text: "Answer in your own words.", speak: true, more: [] });
const cOwn = t => ({ set: "B", n: "Own words", file: CARD_IMG("B02"), word: "", text: "“" + t + "”", own: t, more: [] });

// Lynn's printed cards (PDF PRINT 11, cut to one image per card in assets/cards/)
const CARD_IMG = n => `assets/cards/${n.replace(" ", "")}.webp`;
const BLANKS = Array.from({ length: 10 }, (_, i) => `B${String(i + 1).padStart(2, "0")}`);

function face(c, k, o) {
  const s = SETS[c.set];
  if (c.file) return `<div class="pc-face pc-front pc-face--img"><img src="${esc(c.file)}" alt="" draggable="false">${c.own ? `<p class="pc-own">${esc(c.own)}</p>` : c.speak ? `<p class="pc-own pc-own--hint">Your own words</p>` : ""}</div>`;
  const art = c.img ? `<img src="${esc(c.img)}" alt="">` : star(s.acc, k, s.light);
  return `<div class="pc-face pc-front"><div class="pc-panel">
      <div class="pc-top"><span class="pc-no">${esc(c.n)}</span><span class="pc-set">${esc(s.label)}</span></div>
      <div class="pc-art">${art}</div>
      ${c.word ? `<p class="pc-word">${esc(c.word)}</p>` : ""}
      <p class="pc-txt">${esc(c.text)}</p>
    </div></div>`;
}
function back(set) {
  const bk = { A: "A", R: "R", T: "T", I: "I", V: "V", B: "V" }[set];
  return `<div class="pc-face pc-back pc-face--img"><img src="assets/cards/back-${bk}.webp" alt="" draggable="false"></div>`;
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
    ? { set: "I", n: idc.n, file: CARD_IMG(idc.n), word: idc.name, text: idc.note, more: [["Physical", idc.physical], ["Response", idc.response]] }
    : { set: "I", n: "I —", word: `The ${o.name}`, text: "No Identity card yet. You play it as you find it.", img: o.heroImage, more: [] };

  main.innerHTML = `
  <article class="become become--table" aria-labelledby="b-title">
    <div class="tb-head">
      <a class="mono back" href="${href.object(o)}">← Object ${o.no} ${esc(o.name)}</a>
      <h1 id="b-title" class="tb-title">Become the ${esc(o.name)}.</h1>
      <p class="mono muted tb-sub">A card game for two. You play the ${esc(name)}. The other player is human.</p>
    </div>

    <section class="tb-rules" aria-labelledby="tb-rules-h">
      <h2 id="tb-rules-h" class="mono">How to play</h2>
      <ol>
        <li><span class="num-box">01</span><p><b>You are the ${esc(name)}.</b> Your Identity card is dealt to you. The other player is human, and you cannot see their hand.</p></li>
        <li><span class="num-box">02</span><p><b>The human acts on you.</b> They play an Action card and say something. The words on the card are only a prompt.</p></li>
        <li><span class="num-box">03</span><p><b>You respond.</b> First with a Response card. From then on, you may also answer in your own words. Cards can be played again.</p></li>
        <li><span class="num-box">04</span><p><b>The human decides.</b> They may attack again, or read you with a Translation, kindly or not. At most ${MAX_ROUNDS} attacks. Only the human can end the game.</p></li>
        <li><span class="num-box">05</span><p><b>Your voice stays.</b> Your last card becomes your entry. Keep it in My Collection, or give it to the Material Library.</p></li>
      </ol>
      <p class="tb-rules-tip mono">Tap any card on the table to read it closely.</p>
    </section>

    <section class="table" aria-label="Card table" data-table>
      <div class="seat seat--human">
        <div class="seat-tag"><span class="seat-dot" aria-hidden="true"></span><span class="mono">The Human</span><span class="mono muted" data-hstate>waiting</span></div>
        <div class="hand hand--down" data-hhand aria-label="The human's hand, face down">${Array.from({ length: 5 }, (_, i) => `<div class="pc pc--A is-down" style="--i:${i}"><div class="pc-in">${face(cA(ACTIONS[0]), 0)}${back(i % 2 ? "T" : "A")}</div></div>`).join("")}</div>
      </div>

      <div class="felt">
        <p class="turn mono" data-turn aria-live="polite">Two seats. One of you will be handled.</p>
        <p class="say" data-say aria-live="polite" hidden></p>
        <div class="slots" data-slots>
          <div class="slot" data-slot="H"><span class="mono">The human played</span></div>
          <div class="slot" data-slot="Y"><span class="mono">You played</span></div>
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
            <input type="text" class="own-input" data-own maxlength="140" placeholder="Say it as the ${esc(name)}. Start with “I”." aria-label="Your own words" hidden>
            <button type="button" class="cta cta--big" data-play hidden>Play this card <span aria-hidden="true">↑</span></button>
          </div>
        </div>
      </div>
    </section>

    <dialog class="zoom" data-zoom aria-label="Card"><div class="zoom-in"></div><button type="button" class="cta" data-zoom-close>Close</button></dialog>
  </article>`;

  const table = $("[data-table]", main), turn = $("[data-turn]", main), hstate = $("[data-hstate]", main);
  const hhand = $("[data-hhand]", main), hand = $("[data-hand]", main), hint = $("[data-hint]", main), playBtn = $("[data-play]", main);
  const own = $("[data-own]", main), say = $("[data-say]", main);
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
      : c.speak ? `<b>Your own words</b> Type what the ${esc(name)} says back.` : c.set === "B" ? `<b>Blank card</b> Write your own voice.` : `<b>${esc(c.n)}</b> ${esc(c.text)}`;
    own.hidden = !c.speak;
    if (c.speak) own.focus();
    playBtn.hidden = false;
  }
  hand.addEventListener("click", ev => {
    const el = ev.target.closest(".pc"); if (!el || !resolvePick) return;
    if (selected === el) return playSelected();
    select(el);
  });
  playBtn.addEventListener("click", () => playSelected());
  own.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); playSelected(); } });
  function playSelected() {
    if (!selected || !resolvePick) return;
    if (selected._card.speak && !own.value.trim()) { hint.innerHTML = `<b>Your own words</b> Type something first.`; own.focus(); return; }
    const r = resolvePick; resolvePick = null; playBtn.hidden = true; table.dataset.turn = "wait";
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
    const plan = planActions(), trail = [{ human: plan[0].n }];
    setTurn("Dealing.", "deal");
    fillHand(RESPONSES.map(cR));
    if (motion()) $$(".pc", hand).forEach((el, i) => el.animate([{ transform: "translateY(-60vh) rotate(-20deg)", opacity: 0 }, { opacity: 1 }], { duration: 520, delay: i * 90, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" }));
    await wait(1000); if (gone()) return;

    // a card lands in a slot; the card that was there moves to the played row
    async function land(el, key, fromRect) {
      const old = $(".pc", slot(key));
      if (old) { const li = document.createElement("li"); played.appendChild(li); await fly(old, li); }
      await fly(el, slot(key), fromRect);
    }
    async function speak(line) {
      say.hidden = false; say.classList.remove("is-in"); void say.offsetWidth;
      say.textContent = "“" + line + "”"; say.classList.add("is-in");
      announce("The human says: " + line);
      await wait(Math.min(3400, 1000 + line.length * 40));
    }
    async function human(c, line) {
      setTurn("The human plays.", "human");
      const backs = $$(".pc", hhand); const from = backs[Math.floor(backs.length / 2)];
      from.classList.add("is-lift"); await wait(450); from.classList.remove("is-lift");
      const el = cardEl(c, { down: true, tag: "button" }); el.setAttribute("aria-label", label(c));
      await land(el, "H", from.getBoundingClientRect());
      await wait(250); el.classList.remove("is-down"); await wait(500);
      await speak(line);
    }

    let ai = 0, prev = "A", humanCards = 1, moves = 0;
    await human(cA(plan[0]), pick(LINES[plan[0].n]));
    for (;;) {
      if (gone()) return;
      const released = plan[ai].n === "A 05" && prev === "A";
      // your turn: Response cards always; your own words from the second answer on
      fillHand(moves ? [...RESPONSES.map(cR), cSpeak()] : RESPONSES.map(cR));
      own.value = ""; own.hidden = true;
      const el = await yourTurn(moves ? "Your turn. Play a Response card, or answer in your own words." : `Your turn. How does the ${name} respond? Play a Response card.`); if (gone()) return;
      el.classList.remove("is-sel"); el.setAttribute("aria-pressed", "false"); hint.textContent = "";
      const c = el._card.speak ? cOwn(own.value.trim()) : el._card;
      own.hidden = true;
      const copy = cardEl(c, { tag: "button" }); copy.setAttribute("aria-label", label(c));
      await land(copy, "Y", el.getBoundingClientRect()); if (gone()) return;
      moves++;
      const lastR = c.set === "R" ? RESPONSES.find(x => x.n === c.n) : null;
      trail.push(lastR ? { you: lastR.n } : { you: "own", text: c.own });
      if (!lastR) await speak(pick(BACKTALK));
      if (released) break;
      // the human chooses: read you (mock or comfort), or attack again
      const readNext = humanCards < 9 && (prev === "A" ? Math.random() < .65 : Math.random() < .25);
      if (readNext) {
        const t = lastR ? TRANSLATIONS.find(x => x.n === lastR.t) : pick(TRANSLATIONS);
        await human(cT(t), READ[t.n][Math.random() < .55 ? 0 : 1]); prev = "T";
        trail.push({ human: t.n });
      } else {
        ai++; await human(cA(plan[ai]), pick(LINES[plan[ai].n])); prev = "A";
        trail.push({ human: plan[ai].n });
      }
      humanCards++;
    }
    // after RELEASE and your last answer the human has the last word, then leaves
    await speak(pick(LEAVING)); if (gone()) return;
    say.hidden = true;
    const rounds = ai + 1;
    // the human leaves; the player gets their voice
    setTurn(`The human let go after ${rounds} attacks and left the table. They decided when it ended. You did not.`, "gone");
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
