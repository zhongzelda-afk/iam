// BORROW A BODY: a jointed figure with 2 to 3 poses and a looping animation.
// A body is { frames: [pose, ...], speed: 0..1, ending: "return" | "hold" }.
// A pose is { x, y, squash, a: { joint: relativeAngleDeg } }.

const W = 300, H = 340, FLOOR = 300;

// joint: [parent, length]
const BONES = {
  chest: ["hip", 62],
  neck: ["chest", 16],
  head: ["neck", 20],
  lElbow: ["chest", 44], lHand: ["lElbow", 42],
  rElbow: ["chest", 44], rHand: ["rElbow", 42],
  lKnee: ["hip", 54], lFoot: ["lKnee", 54],
  rKnee: ["hip", 54], rFoot: ["rKnee", 54]
};
const ORDER = ["chest", "neck", "head", "lElbow", "lHand", "rElbow", "rHand", "lKnee", "lFoot", "rKnee", "rFoot"];
const LIMBS = [["hip", "chest"], ["chest", "neck"], ["neck", "head"], ["neck", "lElbow"], ["lElbow", "lHand"], ["neck", "rElbow"], ["rElbow", "rHand"], ["hip", "lKnee"], ["lKnee", "lFoot"], ["hip", "rKnee"], ["rKnee", "rFoot"]];
const LABELS = { hip: "hips", chest: "spine", neck: "neck", head: "head", lElbow: "left elbow", lHand: "left hand", rElbow: "right elbow", rHand: "right hand", lKnee: "left knee", lFoot: "left foot", rKnee: "right knee", rFoot: "right foot" };
const TRAIL_JOINTS = ["head", "lHand", "rHand", "lFoot", "rFoot"];

export function defaultPose() {
  return { x: 150, y: 192, squash: 1, a: { chest: -90, neck: 0, head: 0, lElbow: 205, lHand: -10, rElbow: 155, rHand: 10, lKnee: 100, lFoot: -4, rKnee: 80, rFoot: 4 } };
}
export const clonePose = p => JSON.parse(JSON.stringify(p));
export function defaultBody() { return { frames: [defaultPose()], speed: 0.45, ending: "return" }; }

const rad = d => d * Math.PI / 180;
const norm = d => ((d + 540) % 360) - 180;

export function positions(pose) {
  const P = { hip: { x: pose.x, y: pose.y } }, world = { hip: 0 };
  for (const j of ORDER) {
    const [par, len] = BONES[j];
    const w = (par === "hip" ? 0 : world[par]) + pose.a[j];
    world[j] = w;
    // arms hang from the shoulder line near the neck
    const base = (j === "lElbow" || j === "rElbow") ? P.neck : P[par];
    P[j] = { x: base.x + len * Math.cos(rad(w)), y: base.y + len * Math.sin(rad(w)) };
  }
  // squash: compress toward the floor and widen, like a pressed material
  const sq = pose.squash ?? 1;
  if (sq !== 1) {
    const wide = 1 / Math.sqrt(sq);
    for (const k in P) { P[k] = { x: pose.x + (P[k].x - pose.x) * wide, y: FLOOR - (FLOOR - P[k].y) * sq }; }
  }
  return P;
}

export function lerpPose(p, q, t) {
  const a = {};
  for (const j of ORDER) a[j] = p.a[j] + norm(q.a[j] - p.a[j]) * t;
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, squash: (p.squash ?? 1) + ((q.squash ?? 1) - (p.squash ?? 1)) * t, a };
}

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// timeline sampler: returns pose at time ms
export function sampler(body) {
  const frames = body.frames.length ? body.frames : [defaultPose()];
  const seg = 2600 - 2300 * (body.speed ?? .5); // fast 300ms, slow 2600ms per move
  const hold = 500;
  let path;
  if (frames.length === 1) path = [frames[0]];
  else if (body.ending === "hold") path = [...frames];               // goes and stays, then begins again
  else path = [...frames, ...frames.slice(0, -1).reverse()];      // goes and comes back
  const moves = Math.max(1, path.length - 1);
  const endHold = body.ending === "hold" ? 1600 : hold;
  const total = moves * (seg + hold) + endHold;
  return function at(ms) {
    if (path.length === 1) return path[0];
    let t = ms % total;
    for (let i = 0; i < moves; i++) {
      if (t < seg) return lerpPose(path[i], path[i + 1], ease(t / seg));
      t -= seg;
      if (t < hold) return path[i + 1];
      t -= hold;
    }
    return path[path.length - 1];
  };
}

// ---------- drawing ----------
function figureSVG(P, { stroke = "#292724", joints = false, color = "#873F48", sw = 6 } = {}) {
  const bones = LIMBS.map(([a, b]) => `<line x1="${P[a].x.toFixed(1)}" y1="${P[a].y.toFixed(1)}" x2="${P[b].x.toFixed(1)}" y2="${P[b].y.toFixed(1)}"/>`).join("");
  const headR = 15;
  const hx = P.head.x, hy = P.head.y;
  let out = `<g stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" fill="none">${bones}</g>
    <circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${headR}" fill="#FFFFFF" stroke="${stroke}" stroke-width="${sw * .5}"/>`;
  if (joints) {
    out += ["hip", ...ORDER].map(j => `<g class="joint" data-j="${j}" tabindex="0" role="slider" aria-label="${LABELS[j]}. Drag, or use arrow keys">
      <circle cx="${P[j].x.toFixed(1)}" cy="${P[j].y.toFixed(1)}" r="20" fill="transparent" stroke="none"/>
      <circle class="j-ring" cx="${P[j].x.toFixed(1)}" cy="${P[j].y.toFixed(1)}" r="${j === "hip" ? 10 : 8}" fill="${j === "hip" ? "#77716A" : color}" stroke="#FFFFFF" stroke-width="2" filter="url(#raise)"/>
    </g>`).join("");
  }
  return out;
}

function guides() {
  let g = `<defs><filter id="raise" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#292724" flood-opacity=".35"/></filter></defs>`;
  g += `<g stroke="#292724" stroke-width=".6" opacity=".16">`;
  for (let x = 30; x < W; x += 30) g += `<line x1="${x}" y1="10" x2="${x}" y2="${FLOOR}" stroke-dasharray="2 4"/>`;
  for (let y = 30; y < FLOOR; y += 30) g += `<line x1="10" y1="${y}" x2="${W - 10}" y2="${y}" stroke-dasharray="2 4"/>`;
  g += `</g><line x1="12" y1="${FLOOR}" x2="${W - 12}" y2="${FLOOR}" stroke="#292724" stroke-width="1.2"/>`;
  for (let x = 20; x < W; x += 20) g += `<line x1="${x}" y1="${FLOOR}" x2="${x}" y2="${FLOOR + (x % 100 === 0 ? 8 : 4)}" stroke="#292724" stroke-width=".8"/>`;
  g += `<text x="${W - 14}" y="${FLOOR + 22}" text-anchor="end" font-family="Inter, sans-serif" font-size="8" fill="#77716A">floor</text>`;
  return g;
}

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- mini looping player ----------
const players = new Set();
let rafOn = false;
function tick(now) {
  for (const p of players) {
    if (!p.el.isConnected) { players.delete(p); continue; }
    p.draw(now - p.t0);
  }
  if (players.size) requestAnimationFrame(tick); else rafOn = false;
}
export function mountPlayer(el, body, { trails = false, label = "" } = {}) {
  if (!body || !body.frames || !body.frames.length) {
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}"><text x="150" y="170" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#77716A">No body</text></svg>`;
    return;
  }
  const at = sampler(body);
  el.innerHTML = `<svg viewBox="20 40 260 290" role="img" aria-label="${label || "A body performing a material change"}"><line x1="12" y1="${FLOOR}" x2="${W - 12}" y2="${FLOOR}" stroke="#292724" stroke-width="1"/><g class="tr"></g><g class="fig"></g></svg>`;
  const fig = el.querySelector(".fig"), tr = el.querySelector(".tr");
  const hist = {};
  const p = {
    el, t0: performance.now(),
    draw(ms) {
      const P = positions(at(ms));
      fig.innerHTML = figureSVG(P);
      if (trails) {
        tr.innerHTML = TRAIL_JOINTS.map(j => {
          (hist[j] ||= []).push(`${P[j].x.toFixed(1)},${P[j].y.toFixed(1)}`);
          if (hist[j].length > 70) hist[j].shift();
          return `<polyline points="${hist[j].join(" ")}" fill="none" stroke="#D8B7B8" stroke-width="1.2" opacity=".55"/>`;
        }).join("");
      }
    }
  };
  if (reduceMotion()) { p.draw(0); const last = body.frames[body.frames.length - 1]; fig.innerHTML = figureSVG(positions(last)); return; }
  players.add(p);
  if (!rafOn) { rafOn = true; requestAnimationFrame(tick); }
}

// static thumbnail
export function poseThumb(pose) {
  return `<svg viewBox="0 0 ${W} ${H}"><line x1="12" y1="${FLOOR}" x2="${W - 12}" y2="${FLOOR}" stroke="#292724" stroke-width="2"/>${figureSVG(positions(pose), { sw: 9 })}</svg>`;
}

// all traces of several bodies, overlaid (for the Traces view)
export function tracesSVG(bodies) {
  let lines = "";
  bodies.forEach((b, bi) => {
    const at = sampler(b);
    const hist = {};
    for (let ms = 0; ms < 9000; ms += 60) {
      const P = positions(at(ms));
      for (const j of TRAIL_JOINTS) (hist[j] ||= []).push(`${P[j].x.toFixed(1)},${P[j].y.toFixed(1)}`);
    }
    const col = ["#D8B7B8", "#77716A", "#292724", "#B9A89A", "#9C6B72"][bi % 5];
    lines += Object.values(hist).map(h => `<polyline points="${h.join(" ")}" fill="none" stroke="${col}" stroke-width="1" opacity=".5"/>`).join("");
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Movement traces"><line x1="12" y1="${FLOOR}" x2="${W - 12}" y2="${FLOOR}" stroke="#292724" stroke-width="1"/>${lines}</svg>`;
}

// ---------- the editor ----------
export function mountEditor(root, initial, onChange) {
  const body = initial && initial.frames && initial.frames.length ? JSON.parse(JSON.stringify(initial)) : defaultBody();
  let cur = 0, playing = false, playT0 = 0, raf = 0;
  const trailHist = {};

  root.innerHTML = `
    <div class="body-lab">
      <div class="body-canvas">
        <span class="corner">Pose <b class="pose-no">A</b></span>
        <svg viewBox="0 0 ${W} ${H}" aria-label="Body editor. Each joint is a slider.">${guides()}<g class="trail"></g><g class="stage"></g></svg>
      </div>
      <div class="control-panel">
        <div>
          <p class="mono">Poses</p>
          <div class="frames"></div>
        </div>
        <div>
          <p class="mono">Squash</p>
          <input class="range" type="range" min="45" max="115" step="1" data-k="squash" aria-label="Squash the body">
          <div class="range-labels"><span>pressed</span><span>stretched</span></div>
        </div>
        <div>
          <p class="mono">Speed</p>
          <input class="range" type="range" min="0" max="1" step=".01" data-k="speed" aria-label="Speed of change">
          <div class="range-labels"><span>slow</span><span>instant</span></div>
        </div>
        <div>
          <p class="mono">Then</p>
          <div class="seg" role="group" aria-label="After the change">
            <button type="button" data-end="return">Comes back</button>
            <button type="button" data-end="hold">Stays changed</button>
          </div>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-primary btn-small" data-act="play">▶ Play</button>
          <button type="button" class="btn btn-small" data-act="reset">Reset pose</button>
        </div>
      </div>
    </div>`;

  const svg = root.querySelector(".body-canvas svg");
  const stage = root.querySelector(".stage");
  const trail = root.querySelector(".trail");
  const framesEl = root.querySelector(".frames");
  const squash = root.querySelector('[data-k="squash"]');
  const speed = root.querySelector('[data-k="speed"]');
  const playBtn = root.querySelector('[data-act="play"]');

  function emit() { onChange && onChange(JSON.parse(JSON.stringify(body))); }

  function renderFrames() {
    let html = "";
    for (let i = 0; i < 3; i++) {
      const f = body.frames[i];
      const L = "ABC"[i];
      if (f) html += `<button type="button" class="frame-btn ${i === cur ? "on" : ""}" data-f="${i}" aria-label="Pose ${L}${i === cur ? ", editing" : ""}"><span>${L}</span>${poseThumb(f)}</button>`;
      else if (i === body.frames.length) html += `<button type="button" class="frame-btn empty" data-add="1" aria-label="Add pose ${L}">+ ${L}</button>`;
    }
    framesEl.innerHTML = html;
    if (body.frames.length > 1) framesEl.insertAdjacentHTML("afterend", "");
    root.querySelector(".pose-no").textContent = "ABC"[cur];
    squash.value = Math.round((body.frames[cur].squash ?? 1) * 100);
    speed.value = body.speed;
    root.querySelectorAll("[data-end]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.end === body.ending)));
  }

  function draw(pose = body.frames[cur], editable = !playing) {
    const P = positions(pose);
    stage.innerHTML = figureSVG(P, { joints: editable });
    if (playing) {
      trail.innerHTML = TRAIL_JOINTS.map(j => {
        (trailHist[j] ||= []).push(`${P[j].x.toFixed(1)},${P[j].y.toFixed(1)}`);
        if (trailHist[j].length > 90) trailHist[j].shift();
        return `<polyline points="${trailHist[j].join(" ")}" fill="none" stroke="#D8B7B8" stroke-width="1.3" opacity=".6"/>`;
      }).join("");
    } else {
      trail.innerHTML = cur > 0 ? `<g opacity=".18">${figureSVG(positions(body.frames[cur - 1]), { stroke: "#77716A", sw: 4 })}</g>` : "";
    }
  }

  // pointer dragging
  let drag = null;
  function svgPoint(e) {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }
  function unsquash(pt, pose) {
    const sq = pose.squash ?? 1; if (sq === 1) return pt;
    const wide = 1 / Math.sqrt(sq);
    return { x: pose.x + (pt.x - pose.x) / wide, y: FLOOR - (FLOOR - pt.y) / sq };
  }
  function moveJoint(j, pt) {
    const pose = body.frames[cur];
    const p = unsquash(pt, pose);
    if (j === "hip") {
      pose.x = Math.max(30, Math.min(W - 30, p.x));
      pose.y = Math.max(60, Math.min(FLOOR - 10, p.y));
    } else {
      const P = positions({ ...pose, squash: 1 });
      const par = BONES[j][0];
      const base = (j === "lElbow" || j === "rElbow") ? P.neck : P[par];
      const ang = Math.atan2(p.y - base.y, p.x - base.x) * 180 / Math.PI;
      const parentWorld = worldAngle(pose, par);
      pose.a[j] = norm(ang - parentWorld);
    }
    draw();
  }
  function worldAngle(pose, j) {
    if (j === "hip") return 0;
    const par = BONES[j][0];
    return worldAngle(pose, par) + pose.a[j];
  }
  svg.addEventListener("pointerdown", e => {
    const g = e.target.closest(".joint"); if (!g || playing) return;
    drag = g.dataset.j; svg.setPointerCapture(e.pointerId); e.preventDefault();
  });
  svg.addEventListener("pointermove", e => { if (drag) moveJoint(drag, svgPoint(e)); });
  const end = () => { if (drag) { drag = null; renderFrames(); emit(); } };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
  svg.addEventListener("keydown", e => {
    const g = e.target.closest(".joint"); if (!g || playing) return;
    const j = g.dataset.j, pose = body.frames[cur];
    const step = e.shiftKey ? 15 : 5;
    let used = true;
    if (j === "hip") {
      if (e.key === "ArrowLeft") pose.x -= step; else if (e.key === "ArrowRight") pose.x += step;
      else if (e.key === "ArrowUp") pose.y -= step; else if (e.key === "ArrowDown") pose.y += step; else used = false;
    } else {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") pose.a[j] -= step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") pose.a[j] += step; else used = false;
    }
    if (used) { e.preventDefault(); draw(); root.querySelector(`.joint[data-j="${j}"]`)?.focus(); renderFrames(); emit(); }
  });

  framesEl.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    stop();
    if (b.dataset.add) { body.frames.push(clonePose(body.frames[body.frames.length - 1])); cur = body.frames.length - 1; emit(); }
    else cur = +b.dataset.f;
    renderFrames(); draw();
  });
  framesEl.addEventListener("contextmenu", e => e.preventDefault());

  squash.addEventListener("input", () => { body.frames[cur].squash = squash.value / 100; draw(); });
  squash.addEventListener("change", () => { renderFrames(); emit(); });
  speed.addEventListener("input", () => { body.speed = +speed.value; emit(); if (playing) restart(); });
  root.querySelectorAll("[data-end]").forEach(b => b.addEventListener("click", () => { body.ending = b.dataset.end; renderFrames(); emit(); if (playing) restart(); }));

  root.querySelector('[data-act="reset"]').addEventListener("click", () => {
    stop(); body.frames[cur] = defaultPose(); renderFrames(); draw(); emit();
  });

  let at = null;
  function loop(now) { draw(at(now - playT0), false); raf = requestAnimationFrame(loop); }
  function restart() { at = sampler(body); playT0 = performance.now(); for (const k in trailHist) trailHist[k] = []; }
  function play() {
    if (body.frames.length < 2) { flash("Add pose B first: press + B, then move the body."); return; }
    playing = true; playBtn.textContent = "■ Stop"; restart();
    if (reduceMotion()) { draw(body.frames[body.frames.length - 1], false); return; }
    raf = requestAnimationFrame(loop);
  }
  function stop() { if (!playing) return; playing = false; cancelAnimationFrame(raf); playBtn.textContent = "▶ Play"; draw(); }
  playBtn.addEventListener("click", () => playing ? stop() : play());

  function flash(msg) { window.dispatchEvent(new CustomEvent("iam:toast", { detail: msg })); }

  renderFrames(); draw();
  return { get: () => JSON.parse(JSON.stringify(body)), stop };
}
