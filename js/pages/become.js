// 04 Become a Material: a real card table.
// Two seats. The Human (played by the site) sits across; you sit as the material.
// Neither sees the other's hand. The human plays an Action face down and turns it over,
// you answer from your hand of Response cards, the human answers with a Translation.
// The human decides how many rounds (3 to 5) and always ends with RELEASE, then leaves.
// You have no stop button: that is the point. Last, you are dealt Voice cards and a
// blank card: the card you play becomes your entry, kept in My Collection or given to the Library.
import { esc, $, $$, announce, reduceMotion } from "../lib/util.js?v=202611161437";
import { href } from "../lib/library.js?v=202611161437";
import * as col from "../lib/collection.js?v=202611161437";
import { contributionForm, mountContributionForm } from "../components/contributionForm.js?v=202611161437";
import { ACTIONS, RESPONSES, TRANSLATIONS, VOICES, IDENTITIES, MAX_ROUNDS } from "../data/cards.js?v=202611161437";

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
// The human has a different temper each game (never the same one twice in a row in this browser).
// Cards give the meaning; the human improvises around them, like dialogue in a film.
const PERSONAS = [
  { mood: "cruel", read: .6,
    A: { "A 01": ["Hold still. This won't take long.", "Let's see how much you can take."],
         "A 02": ["Come on. Show me what's inside.", "Tighter. I want to see you change."],
         "A 03": ["Come here. You're coming with me.", "Let go of the table."],
         "A 04": ["Let's try you another way.", "Don't fight it. Turn."],
         "A 05": ["Fine. I'm done with you.", "There. Keep whatever's left."] },
    T: { "T 01": ["Still holding on to that? Let it go already."], "T 02": ["Falling apart over a little pressure?"],
         "T 03": ["How much longer do you need? I can't wait forever."], "T 04": ["Pretending you're fine? I can see the bruise."],
         "T 05": ["Stop clinging to my hand."] },
    back: ["Oh, now you talk back?", "Nobody asked you.", "Say that again. Slowly."],
    leave: ["I'm finished here.", "Someone will clear this up.", "Don't take it personally. It's what I do with things."] },
  { mood: "careless", read: .45,
    A: { "A 01": ["Oh, were you there? I was just leaning on you.", "Sorry, I needed something to press on."],
         "A 02": ["Just squeezing. It's a habit.", "I wasn't really looking."],
         "A 03": ["I'll take you with me. Or not. We'll see."],
         "A 04": ["Let's see what this does."],
         "A 05": ["Whatever. You can go.", "I've lost interest."] },
    T: { "T 01": ["Still holding that? Didn't notice."], "T 02": ["Too much? Everything is too much for something."],
         "T 03": ["Take your time. I'm on my phone anyway."], "T 04": ["You look fine to me."], "T 05": ["You're sticking to me. Weird."] },
    back: ["Huh? Did you say something?", "Sorry, wasn't listening.", "Okay. Anyway."],
    leave: ["I'll grab another one.", "There are plenty more like you."] },
  { mood: "thoughtful", read: .75,
    A: { "A 01": ["I'm pressing you. I've never asked myself why.", "My hand does this without thinking. Does yours?"],
         "A 02": ["I squeeze things every morning. I never once watched what happens.", "How hard is too hard? Tell me."],
         "A 03": ["I keep taking things with me. Do they ever want to come?"],
         "A 04": ["I wanted you in a better shape. Better for whom?"],
         "A 05": ["I'm letting go. I don't know if that is kindness or neglect.", "I'll stop. I should have asked first."] },
    T: { "T 01": ["You keep the mark I left. I leave marks everywhere, don't I?"], "T 02": ["Was that too much? I couldn't tell where your limit was."],
         "T 03": ["You need time. I rarely give anything time."], "T 04": ["Nothing shows. That doesn't mean nothing happened."],
         "T 05": ["You hold on to me. Maybe I hold on to you too."] },
    back: ["You can speak. I never thought to listen.", "Say more. I'm listening now.", "I didn't expect an answer. I should have."],
    leave: ["I shape things all day. I wonder what they have shaped in me.", "Next time I'll look before I press."] },
  { mood: "curious", read: .6,
    A: { "A 01": ["Let's record what happens under the palm.", "Hold still. I'm only observing."],
         "A 02": ["Interesting. Again, a little harder.", "Resistance first, then giving way. Noted."],
         "A 03": ["How far can you stretch before you let go?"],
         "A 04": ["Rotation test. Don't move."],
         "A 05": ["End of experiment. Releasing the specimen.", "Let's see what stays when I let go."] },
    T: { "T 01": ["The mark remains. Fascinating."], "T 02": ["Collapse under load. As expected."],
         "T 03": ["Recovery time unknown. I'll wait and measure."], "T 04": ["No visible change. Something changed anyway."],
         "T 05": ["Adhesion to the hand. Noted."] },
    back: ["The specimen speaks. That's not in my notes.", "Please don't talk, I'm measuring."],
    leave: ["Thank you, specimen.", "Data collected. You may go."] }
];
function pickPersona() {
  let last = null; try { last = localStorage.getItem("iam.persona.last"); } catch {}
  const p = pick(PERSONAS.filter(x => x.mood !== last));
  try { localStorage.setItem("iam.persona.last", p.mood); } catch {}
  return p;
}

function planActions() {
  const total = 3 + Math.floor(Math.random() * (MAX_ROUNDS - 2));
  const pool = ACTIONS.filter(a => a.n !== "A 05"), out = [];
  for (let i = 0; i < total - 1; i++) out.push(pick(pool.filter(a => a !== out[i - 1]))); // never the same card twice in a row
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
  <article class="become become--table become--immersive" aria-labelledby="b-title">
    <pre class="tb-code tb-code--a" aria-hidden="true">${esc(`# I.A.M. ${o.no} ${o.name.toUpperCase()}  the table
${o.slug.replace(/-/g, "_")} = Material(no="${o.no}", action="${(o.primaryAction || "compression").toLowerCase()}")
human = Seat("the human", hand=ACTIONS)
you = Seat("${o.slug.replace(/-/g, "_")}", hand=RESPONSES, identity="${identity.word}")
while human.wants_more():
    act = human.play(face_down=True)
    you.answer(act)  # no stop button
human.leave(with_card="RELEASE")`)}</pre>
    <pre class="tb-code tb-code--b" aria-hidden="true">${esc(`for s in ${o.slug.replace(/-/g, "_")}.states:
    sheet = trace(s.frame, line="navy")
    force = locate(s.contact)  # where the hand went
    booklet.fold(sheet)
# we shape materials
# materials shape us
voice = translate(${o.slug.replace(/-/g, "_")}, by="human")
collection.keep(voice)`)}</pre>
    <div class="tb-head">
      <a class="tb-exit" href="${href.object(o)}" aria-label="Leave the table and go back to Object ${o.no} ${esc(o.name)}"><span aria-hidden="true">←</span> Leave the table</a>
      <h1 id="b-title" class="tb-title">Become the ${esc(o.name)}.</h1>
      <p class="tb-sub">You are the ${esc(name)}. Someone else decides how you are handled, and when it ends. Answer anyway.</p>
    </div>

    <section class="table" aria-label="Card table" data-table>
      <div class="seat seat--human">
        <div class="seat-tag"><span class="seat-dot" aria-hidden="true"></span><span class="mono">The Human</span><span class="mono seat-mood" data-mood></span><span class="mono muted" data-hstate>waiting</span></div>
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
  // full screen table; Escape leaves it (unless a card is zoomed)
  document.body.classList.add("is-immersive");
  const onEsc = ev => { if (ev.key === "Escape" && !zoom.open && !ev.target.closest("input, textarea")) location.hash = href.object(o); };
  document.addEventListener("keydown", onEsc);
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
    const spread = n > 6 ? 2 : 4, cw = els[0] ? els[0].offsetWidth : 0, avail = hand.clientWidth - 24;
    const step = n > 1 ? Math.min(cw * .78, (avail - cw) / (n - 1)) : 0;
    els.forEach((el, i) => {
      el.style.setProperty("--rot", `${(i - (n - 1) / 2) * spread}deg`);
      el.style.setProperty("--dy", `${Math.abs(i - (n - 1) / 2) * (n > 6 ? 3 : 6)}px`);
      el.style.marginLeft = i ? `${step - cw}px` : "0";
    });
  }
  const handRO = new ResizeObserver(() => layoutHand()); handRO.observe(hand);
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
    const plan = planActions(), P = pickPersona(), trail = [{ human: plan[0].n, mood: P.mood }];
    $("[data-mood]", main).textContent = `in a ${P.mood} mood`;
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

    // one round = the human acts (Action), you answer, the human reads you (Translation)
    const used = new Set();
    const line = (opts, fallback) => {
      const fresh = opts.filter(x => !used.has(x));
      const l = fresh.length ? pick(fresh) : fallback;
      used.add(l); return l;
    };
    const ECHO = {
      cruel: w => `"${w}" again? You're predictable.`,
      careless: w => `"${w}." Again. Sure.`,
      thoughtful: w => `"${w}" again. Maybe I keep doing the same thing to you.`,
      curious: w => `"${w}", second observation. Consistent.`
    };
    let lastT = null, moves = 0;
    const rounds = plan.length;
    for (let r = 0; r < rounds; r++) {
      if (gone()) return;
      const a = plan[r];
      await human(cA(a), line(P.A[a.n], a.word || "Again.")); trail.push({ human: a.n }); if (gone()) return;
      fillHand(moves ? [...RESPONSES.map(cR), ...VOICES.map(cV), cSpeak()] : RESPONSES.map(cR));
      own.value = ""; own.hidden = true;
      const tag = `Round ${r + 1}. `;
      const el = await yourTurn(tag + (moves ? "Your turn. Play a Response or Voice card, or answer in your own words." : `Your turn. How does the ${name} respond? Play a Response card.`)); if (gone()) return;
      el.classList.remove("is-sel"); el.setAttribute("aria-pressed", "false"); hint.textContent = "";
      const c = el._card.speak ? cOwn(own.value.trim()) : el._card;
      own.hidden = true;
      const copy = cardEl(c, { tag: "button" }); copy.setAttribute("aria-label", label(c));
      await land(copy, "Y", el.getBoundingClientRect()); if (gone()) return;
      moves++;
      const lastR = c.set === "R" ? RESPONSES.find(x => x.n === c.n) : null;
      trail.push(lastR ? { you: lastR.n } : c.set === "V" ? { you: c.n } : { you: "own", text: c.own });
      if (!lastR && Math.random() < .5) { const b = P.back.filter(x => !used.has(x)); if (b.length) await speak(line(b)); }
      // the human reads you: kindly or not, never the same card twice in a row
      let t = lastR ? TRANSLATIONS.find(x => x.n === lastR.t) : null;
      if (!t || t === lastT) t = pick(TRANSLATIONS.filter(x => x !== lastT));
      await human(cT(t), line(P.T[t.n], ECHO[P.mood](t.word))); trail.push({ human: t.n }); lastT = t;
    }
    // after RELEASE the human has the last word, then leaves
    if (gone()) return;
    await speak(line(P.leave)); if (gone()) return;
    say.hidden = true;
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
  return () => { alive = false; handRO.disconnect(); document.body.classList.remove("is-immersive"); document.removeEventListener("keydown", onEsc); };
}
