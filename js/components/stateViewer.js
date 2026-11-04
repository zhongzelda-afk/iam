// Physical State Viewer: the four states as a small concertina booklet, like the printed State Booklet.
// Folded, the sheets stack and "Trace through" shows every state at once so the change is visible.
// Unfolded, the sheets open side by side (or in a column on small screens).
import { esc, fmtTime, reduceMotion, $, $$ } from "../lib/util.js?v=202611041513";

export function stateViewer(o) {
  if (!o.states || !o.states.length) return `<p class="missing">States not yet documented.</p>`;
  const n = o.states.length;
  const sheets = o.states.map((s, i) => `
    <article class="sheet" data-i="${i}" aria-label="State ${s.n} of ${String(n).padStart(2, "0")}, ${esc(s.name)}">
      <button type="button" class="sheet-tab" data-select="${i}" aria-pressed="${i === 0}" style="--tab:${i}">${s.n} ${esc(s.name)}</button>
      <div class="sheet-paper">
        <div class="sheet-head mono"><span>Object ${o.no}</span><span>${esc(o.name)}</span><span>State ${s.n} / ${String(n).padStart(2, "0")}</span></div>
        <div class="sheet-window">
          <img src="${esc(s.image)}" alt="${esc(o.name)}, state ${s.n}, ${esc(s.name.toLowerCase())}. Frame from the experiment video at ${fmtTime(s.t)}." loading="lazy" decoding="async">
          ${o.states.filter((_, j) => j !== i).map(g => `<img class="ghost" src="${esc(g.image)}" alt="" loading="lazy" decoding="async">`).join("")}
        </div>
        <div class="sheet-body">
          <p class="sheet-state"><span class="mono">${s.n} /</span> ${esc(s.name)}</p>
          ${s.observation ? `<p class="sheet-obs">${esc(s.observation)}</p>` : `<p class="sheet-obs muted">Observation not yet written.</p>`}
          <p class="sheet-src mono">Video frame · ${fmtTime(s.t)}</p>
        </div>
      </div>
    </article>`).join("");
  return `
  <div class="states" data-states>
    <div class="states-bar">
      <div class="seg" role="group" aria-label="Booklet">
        <button type="button" class="seg-btn" data-fold-to="0" aria-pressed="true">Folded</button>
        <button type="button" class="seg-btn" data-fold-to="1" aria-pressed="false">Unfolded</button>
      </div>
      <label class="fold-range mono"><span>Fold</span><input type="range" min="0" max="100" value="0" aria-label="Fold or unfold the state booklet"><span>Open</span></label>
      <label class="trace mono"><input type="checkbox" data-trace> Trace through</label>
    </div>
    <div class="booklet" data-booklet>${sheets}</div>
    <p class="states-hint mono" aria-live="polite"></p>
  </div>`;
}

export function mountStateViewer(root, o, { onSelect } = {}) {
  const box = $("[data-states]", root); if (!box) return () => {};
  const book = $("[data-booklet]", box), sheets = $$(".sheet", book), range = $("input[type=range]", box);
  const trace = $("[data-trace]", box), hint = $(".states-hint", box), segs = $$("[data-fold-to]", box);
  const n = sheets.length;
  let t = 0, sel = 0, geo = null, raf = 0;

  function measure() {
    const W = book.clientWidth, gap = W >= 900 ? 20 : 14;
    const cols = W >= 900 ? 4 : W >= 560 ? 2 : 1;
    const pw = Math.floor((W - gap * (cols - 1)) / cols);
    sheets.forEach(s => { s.style.width = pw + "px"; s.style.height = "auto"; });
    const ph = Math.max(...sheets.map(s => $(".sheet-paper", s).offsetHeight));
    sheets.forEach(s => s.style.height = ph + "px");
    const s0 = cols === 4 ? Math.min(1.55, (W * 0.48) / pw) : cols === 2 ? Math.min(1.6, (W * 0.8) / pw) : 1;
    const tabH = $(".sheet-tab", sheets[0]).offsetHeight;
    geo = { W, gap, cols, pw, ph, s0, tabH, rows: Math.ceil(n / cols) };
  }

  function layout() {
    if (!geo) measure();
    const { W, gap, cols, pw, ph, s0, tabH, rows } = geo;
    const e = t, s = s0 + (1 - s0) * e;
    const x0 = (W - pw * s0) / 2;
    sheets.forEach((el, i) => {
      const cx = (i % cols) * (pw + gap), cy = Math.floor(i / cols) * (ph + gap + tabH);
      const x = x0 + (cx - x0) * e, y = tabH + cy * e;
      const r = Math.sin(Math.PI * e) * (cols === 1 ? 0 : (i % 2 ? -12 : 12));
      el.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotateY(${r}deg)`;
      el.style.zIndex = e < 0.5 ? (i === sel ? 20 : 10 - i) : 10;
      const tab = $(".sheet-tab", el);
      tab.style.left = `${(i * pw / n) * (1 - e)}px`;
      tab.style.width = `${(pw / n - 4) * (1 - e) + (pw * 0.62) * e}px`;
    });
    const hFold = (ph + tabH) * s0 + tabH, hOpen = rows * (ph + tabH) + (rows - 1) * gap + tabH;
    book.style.height = (hFold + (hOpen - hFold) * e) + "px";
    box.classList.toggle("is-folded", e < 0.02);
    box.classList.toggle("is-open", e > 0.98);
    segs[0].setAttribute("aria-pressed", e < 0.02); segs[1].setAttribute("aria-pressed", e > 0.98);
    range.value = Math.round(e * 100);
  }

  function animateTo(target) {
    cancelAnimationFrame(raf);
    const start = t, t0 = performance.now(), dur = reduceMotion() ? 0 : 900;
    const step = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      const ez = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      t = start + (target - start) * ez; layout();
      if (k < 1) raf = requestAnimationFrame(step);
      else hint.textContent = target ? "Booklet unfolded." : "Booklet folded.";
    };
    raf = requestAnimationFrame(step);
  }

  function select(i, focus) {
    sel = (i + n) % n;
    sheets.forEach((s, j) => { $(".sheet-tab", s).setAttribute("aria-pressed", j === sel); s.classList.toggle("is-selected", j === sel); });
    layout();
    if (focus) $(".sheet-tab", sheets[sel]).focus();
    onSelect && onSelect(o.states[sel], sel);
  }

  box.addEventListener("click", ev => {
    const b = ev.target.closest("[data-select]"); if (b) return select(+b.dataset.select);
    const f = ev.target.closest("[data-fold-to]"); if (f) return animateTo(+f.dataset.foldTo);
    const sh = ev.target.closest(".sheet"); if (sh && t > 0.5) select(+sh.dataset.i);
  });
  box.addEventListener("keydown", ev => {
    if (!ev.target.matches(".sheet-tab")) return;
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") { ev.preventDefault(); select(sel + 1, true); }
    if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") { ev.preventDefault(); select(sel - 1, true); }
  });
  range.addEventListener("input", () => { cancelAnimationFrame(raf); t = range.value / 100; layout(); });
  trace.addEventListener("change", () => box.classList.toggle("is-trace", trace.checked));
  const ro = new ResizeObserver(() => { geo = null; layout(); });
  ro.observe(book);
  select(0);
  return () => { ro.disconnect(); cancelAnimationFrame(raf); };
}
