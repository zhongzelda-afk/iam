// I.A.M. screen: a passerby gets a material head; closing a hand beside it squeezes the head
// the way that material responds, and floats up one imagined voice written on the website.
// Face and hand tracking run locally in the browser (MediaPipe, files in lib/ and models/).

import { FilesetResolver, FaceDetector, GestureRecognizer } from "./lib/vision_bundle.mjs";

const CFG = window.IAM_SCREEN;
const $ = (id) => document.getElementById(id);
const video = $("video"), canvas = $("stage"), ctx = canvas.getContext("2d");
const layer = document.createElement("canvas"), lctx = layer.getContext("2d"); // heads, so holes can be cut
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const DYN = { instant: { press: 14, release: 9 }, delayed: { press: 3, release: 1.5 }, "": { press: 7, release: 4 } };
const SEED = [ // Response Cards R01 to R05, shown only while no visitor voice exists
  ["retain", "Retain", "I can't just go back to how things were."],
  ["recover", "Recover", "Give me a moment, I'll be back."],
  ["collapse", "Collapse", "I can't keep everything together anymore."],
  ["stick", "Stick", "I'm not ready to let go."],
  ["rupture", "Rupture", "You can't always see what has changed inside me."],
].map(([id, label, voice]) => ({ id: "seed-" + id, label, voice, who: "iam", material_id: "" }));

let W = 0, H = 0, DPR = 1;
let mirror = store.get("iam.mirror", true);
let faceDetector, gestures, running = false, lastVideoTime = -1, lastT = 0;
let faces = [], hands = [], showDebug = false, lastSqueeze = 0, fps = 0;
const heads = Array.from({ length: CFG.maxHeads }, () => ({ active: false, alpha: 0, x: .5, y: .5, w: .1, angle: 0, mat: null,
  seen: 0, squash: 0, dent: 0, peak: 0, closure: 0, pressed: false, lastPress: -99, holes: null }));
const subs = [];
const recent = [];
const images = {};
const ALL_NAMES = Object.fromEntries(CFG.materials.map((m) => [m.id, m.name]));
const MATS = CFG.materials.filter((m) => m.png);

// ---------- data: public voices from the website, cached for offline use ----------

const data = { voices: store.get("iam.voices", []), names: store.get("iam.names", {}), source: "cache", updated: store.get("iam.updated", null), error: "" };

async function fetchVoices() {
  const base = CFG.SUPABASE_URL.replace(/\/$/, ""), headers = { apikey: CFG.SUPABASE_ANON_KEY, Accept: "application/json" };
  if (CFG.SUPABASE_ANON_KEY.startsWith("eyJ")) headers.Authorization = "Bearer " + CFG.SUPABASE_ANON_KEY;
  try {
    const r = await fetch(base + "/rest/v1/entries?select=id,owner,material_id,alias,voice,created_at&order=created_at.desc&limit=500", { headers });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const rows = await r.json();
    let names = data.names;
    try {
      const m = await fetch(base + "/rest/v1/materials?select=id,name", { headers });
      if (m.ok) names = Object.fromEntries((await m.json()).map((x) => [x.id, x.name]));
    } catch {}
    const voices = [];
    for (const e of rows) {
      const v = (e.voice || "").trim();
      if (!v) continue;
      voices.push({ id: e.id, material_id: e.material_id || "", alias: (e.alias || "").trim(), voice: v.slice(0, 200), who: await hash(e.owner || e.id) });
    }
    Object.assign(data, { voices, names, source: "online", updated: new Date().toLocaleTimeString(), error: "" });
    store.set("iam.voices", voices); store.set("iam.names", names); store.set("iam.updated", data.updated);
  } catch (err) {
    data.source = "offline (cached)"; data.error = String(err.message || err);
  }
}

async function hash(s) { // only used to count different people, never shown
  const b = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].slice(0, 5).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function pool() {
  const block = CFG.blocklist.map((w) => w.toLowerCase()), hidden = new Set(CFG.hiddenIds), ok = new Set(CFG.approvedIds);
  const real = data.voices.filter((v) => !hidden.has(v.id) && !block.some((w) => v.voice.toLowerCase().includes(w)) && (!CFG.approvedOnly || ok.has(v.id)));
  return real.length ? real : SEED;
}
const peopleCount = () => new Set(pool().filter((v) => v.who !== "iam").map((v) => v.who)).size;

// ---------- camera ----------

async function listCameras(keep) {
  const sel = $("camera");
  const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
  const saved = keep || store.get("iam.camera", "");
  sel.innerHTML = cams.map((c, i) => `<option value="${c.deviceId}">${c.label || "Camera " + (i + 1)}</option>`).join("");
  if (cams.some((c) => c.deviceId === saved)) sel.value = saved;
  return cams;
}

async function openCamera(deviceId) {
  if (video.srcObject) video.srcObject.getTracks().forEach((t) => t.stop());
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false,
    video: { deviceId: deviceId ? { exact: deviceId } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } } });
  video.srcObject = stream;
  await video.play();
  const id = stream.getVideoTracks()[0].getSettings().deviceId;
  if (id) store.set("iam.camera", id);
  return id;
}

// ---------- tracking ----------

async function loadModels() {
  const fileset = await FilesetResolver.forVisionTasks(new URL("lib/wasm", location.href).href.replace(/\/$/, ""));
  const make = async (delegate) => {
    faceDetector = await FaceDetector.createFromOptions(fileset, { baseOptions: { modelAssetPath: "models/face_detector.tflite", delegate },
      runningMode: "VIDEO", minDetectionConfidence: 0.5 });
    gestures = await GestureRecognizer.createFromOptions(fileset, { baseOptions: { modelAssetPath: "models/gesture_recognizer.task", delegate },
      runningMode: "VIDEO", numHands: 2 });
  };
  try { await make("GPU"); } catch { await make("CPU"); }
}

function track(now) {
  if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;
  const fx = (x) => (mirror ? 1 - x : x);
  const fr = faceDetector.detectForVideo(video, now);
  faces = (fr.detections || []).filter((d) => (d.keypoints || []).length >= 6).map((d) => {
    const k = d.keypoints.map((p) => ({ x: fx(p.x), y: p.y })); // 0 right eye, 1 left eye, 2 nose, 3 mouth, 4/5 ears
    const x = (k[0].x + k[1].x + k[2].x + k[3].x) / 4, y = (k[0].y + k[1].y + k[2].y + k[3].y) / 4;
    const [a, b] = k[0].x < k[1].x ? [k[0], k[1]] : [k[1], k[0]];
    const angle = Math.atan2((b.y - a.y) * video.videoHeight, (b.x - a.x) * video.videoWidth);
    return { x, y, w: Math.max(Math.abs(k[4].x - k[5].x), 0.03), angle, holes: [[k[0].x, k[0].y], [k[1].x, k[1].y], [k[3].x, k[3].y]] };
  });
  const gr = gestures.recognizeForVideo(video, now);
  const asp = video.videoWidth / video.videoHeight;
  hands = (gr.landmarks || []).map((lm, i) => {
    const d = (p, q) => Math.hypot((lm[p].x - lm[q].x) * asp, lm[p].y - lm[q].y);
    const ratio = [8, 12, 16, 20].reduce((s, t) => s + d(t, 0), 0) / 4 / Math.max(d(0, 9), 1e-4); // open about 1.9, fist about 1.0
    let closure = Math.min(1, Math.max(0, (CFG.handOpenRatio - ratio) / Math.max(CFG.handOpenRatio - CFG.handFistRatio, 0.1)));
    const g = (gr.gestures || [])[i] || [];
    if (g[0] && g[0].categoryName === "Closed_Fist") closure = Math.max(closure, 0.9);
    const palm = [0, 5, 9, 13, 17];
    return { x: fx(palm.reduce((s, j) => s + lm[j].x, 0) / 5), y: palm.reduce((s, j) => s + lm[j].y, 0) / 5, closure, ratio, pts: lm.map((p) => [fx(p.x), p.y]) };
  });
}

// ---------- heads ----------

function pickMaterial() {
  const used = new Set(heads.filter((h) => h.active && h.mat).map((h) => h.mat.id));
  const free = MATS.filter((m) => !used.has(m.id));
  const list = free.length ? free : MATS;
  return list[Math.floor(Math.random() * list.length)];
}

function updateHeads(now, dt) {
  const k = Math.min(1, dt * 12), asp = video.videoWidth / video.videoHeight || 16 / 9, taken = new Set();
  for (const h of heads) {
    if (!h.active) continue;
    let best = -1, bd = 0.25;
    faces.forEach((f, j) => { if (taken.has(j)) return; const dd = Math.hypot((f.x - h.x) * asp, f.y - h.y); if (dd < bd) { best = j; bd = dd; } });
    if (best < 0) continue;
    taken.add(best);
    const f = faces[best];
    for (const key of ["x", "y", "w", "angle"]) h[key] += (f[key] - h[key]) * k;
    h.holes.forEach((p, i) => { p[0] += (f.holes[i][0] - p[0]) * k; p[1] += (f.holes[i][1] - p[1]) * k; });
    h.seen = now;
  }
  faces.forEach((f, j) => {
    if (taken.has(j)) return;
    const h = heads.find((x) => !x.active && x.alpha < 0.05);
    if (!h || !MATS.length) return;
    Object.assign(h, { active: true, x: f.x, y: f.y, w: f.w, angle: f.angle, mat: pickMaterial(), seen: now,
      squash: 0, dent: 0, peak: 0, closure: 0, pressed: false, holes: f.holes.map((p) => p.slice()) });
  });
  for (const h of heads) if (h.active && now - h.seen > 1500) h.active = false; // the person has left

  // squeeze: each hand works on the nearest head
  for (const h of heads) h.closure = 0;
  for (const hand of hands) {
    const live = heads.filter((h) => h.active);
    if (!live.length) break;
    const near = live.reduce((a, b) => (Math.hypot((hand.x - a.x) * asp, hand.y - a.y) < Math.hypot((hand.x - b.x) * asp, hand.y - b.y) ? a : b));
    near.closure = Math.max(near.closure, hand.closure);
  }
  for (const h of heads) {
    h.alpha += ((h.active ? 1 : 0) - h.alpha) * Math.min(1, dt * 6);
    if (!h.active) continue;
    const dyn = DYN[h.mat.speed || ""] || DYN[""], c = h.closure;
    if (c > h.squash) h.squash += (c - h.squash) * Math.min(1, dt * dyn.press);
    else h.squash += (Math.max(c, h.dent) - h.squash) * Math.min(1, dt * dyn.release);
    h.peak = Math.max(h.peak, h.squash);
    if (!h.pressed && c >= CFG.pressThreshold) {
      h.pressed = true;
      if (now - h.lastPress > CFG.cooldownSeconds * 1000) { h.lastPress = now; spawnSubtitle(h, now); }
    } else if (h.pressed && c <= CFG.releaseThreshold) {
      h.pressed = false;
      if (CFG.keepDent && h.mat.after === "keeps") h.dent = Math.min(0.35, Math.max(h.dent, h.peak * 0.4)); // stays a little changed
      h.peak = 0;
    }
  }
}

// ---------- subtitles ----------

function chooseVoice(matId) {
  const all = pool(), fresh = all.filter((v) => !recent.includes(v.id));
  const p = fresh.length ? fresh : all, same = p.filter((v) => v.material_id === matId);
  const list = same.length && Math.random() < CFG.sameMaterialChance ? same : p;
  const v = list[Math.floor(Math.random() * list.length)];
  recent.push(v.id);
  while (recent.length > Math.max(0, Math.min(8, all.length - 1))) recent.shift();
  return v;
}

function caption(v) {
  if (v.who === "iam") return "Institute of Animate Matter · " + v.label;
  const mat = ALL_NAMES[v.material_id] || data.names[v.material_id] || "";
  const who = v.alias || "Anonymous visitor";
  return mat ? who + " · " + mat : who;
}

function spawnSubtitle(h, now) {
  const v = chooseVoice(h.mat ? h.mat.id : "");
  if (!v) return;
  lastSqueeze = now;
  const top = h.y - h.w * CFG.headScale * (W / H) * 0.6;
  const y = top > 0.28 ? top - 0.05 : h.y + h.w * CFG.headScale * (W / H) * 0.62;
  subs.push({ text: "“" + v.voice + "”", cap: caption(v), id: v.id, t0: now,
    x: Math.min(0.7, Math.max(0.3, h.x + (Math.random() - 0.5) * 0.2)), y: Math.min(0.88, Math.max(0.14, y)), phase: Math.random() * 6.28 });
  while (subs.length > 4) subs.shift();
}

function wrap(c, text, maxW) {
  const words = /[　-鿿]/.test(text) ? [...text] : text.split(" "), sep = /[　-鿿]/.test(text) ? "" : " ";
  const lines = []; let line = "";
  for (const w of words) { const t = line ? line + sep + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

// ---------- drawing ----------

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  for (const c of [canvas, layer]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function videoRect() { // the camera fills the screen ("cover"), so normalised points map through this rectangle
  const vw = video.videoWidth || 1280, vh = video.videoHeight || 720, s = Math.max(W / vw, H / vh);
  return { x: (W - vw * s) / 2, y: (H - vh * s) / 2, w: vw * s, h: vh * s };
}

function draw(now) {
  const r = videoRect(), P = (x, y) => [r.x + x * r.w, r.y + y * r.h];
  ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
  if (video.readyState >= 2) {
    ctx.save();
    if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, mirror ? W - r.x - r.w : r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  // heads on their own layer, then eye and mouth holes cut out of it
  lctx.clearRect(0, 0, W, H);
  for (const h of heads) {
    if (h.alpha < 0.01 || !h.mat) continue;
    const img = images[h.mat.png];
    if (!img || !img.complete || !img.naturalWidth) continue;
    const size = h.w * r.w * CFG.headScale, s = size / Math.max(img.naturalWidth, img.naturalHeight), q = h.squash;
    const [cx, cy] = P(h.x, h.y);
    lctx.save();
    lctx.globalAlpha = h.alpha;
    lctx.translate(cx, cy - CFG.headOffsetY * size);
    lctx.rotate(h.angle * CFG.tilt);
    lctx.scale(s * (1 + 0.32 * q), s * (1 - 0.42 * q));
    lctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    lctx.restore();
  }
  if (CFG.holes) {
    lctx.save();
    lctx.globalCompositeOperation = "destination-out";
    for (const h of heads) {
      if (h.alpha < 0.01 || !h.holes) continue;
      const fw = h.w * r.w;
      h.holes.forEach(([x, y], i) => {
        const [px, py] = P(x, y), mouth = i === 2;
        const rx = (mouth ? CFG.mouthSize : CFG.eyeSize) * fw / 2, ry = rx * (mouth ? 0.55 : 0.72);
        lctx.save();
        lctx.translate(px, py); lctx.rotate(h.angle * CFG.tilt); lctx.scale(rx, ry);
        const g = lctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, `rgba(0,0,0,${h.alpha})`); g.addColorStop(0.6, `rgba(0,0,0,${h.alpha})`); g.addColorStop(1, "rgba(0,0,0,0)");
        lctx.fillStyle = g; lctx.fillRect(-1, -1, 2, 2);
        lctx.restore();
      });
    }
    lctx.restore();
  }
  ctx.drawImage(layer, 0, 0, W, H);

  // floating voices
  const life = CFG.subtitleSeconds * 1000, fs = Math.round(Math.max(20, H * 0.042)), cs = Math.round(fs * 0.48);
  for (let i = subs.length - 1; i >= 0; i--) {
    const s = subs[i], t = now - s.t0;
    if (t > life) { subs.splice(i, 1); continue; }
    const a = Math.min(1, t / 800, (life - t) / 1500);
    const x = s.x * W + Math.sin(s.phase + t / 1100) * 12, y = s.y * H - t * 0.018;
    ctx.save();
    ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0,0,0,.65)"; ctx.shadowBlur = 18;
    ctx.font = `500 ${fs}px Geist, Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = "#efe7d8";
    const lines = wrap(ctx, s.text, Math.min(W * 0.72, 980));
    lines.forEach((ln, j) => ctx.fillText(ln, x, y - (lines.length - 1 - j) * fs * 1.18));
    ctx.font = `400 ${cs}px Geist, Inter, "Segoe UI", sans-serif`;
    ctx.fillStyle = "#b9d6e3"; ctx.globalAlpha = a * 0.85;
    ctx.fillText(s.cap, x, y + cs * 1.9);
    ctx.restore();
  }

  // counter and hint
  ctx.save();
  ctx.font = `400 ${Math.round(Math.max(12, H * 0.018))}px Geist, Inter, "Segoe UI", sans-serif`;
  ctx.fillStyle = "rgba(239,231,216,.62)"; ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 8;
  const n = pool().filter((v) => v.who !== "iam").length;
  if (CFG.showCounter && n) ctx.fillText(`${n} imagined voices from ${peopleCount()} different people`, 24, H - 24);
  if (CFG.hint && heads.some((h) => h.active) && now - lastSqueeze > CFG.hintAfterSeconds * 1000 && !subs.length) {
    ctx.textAlign = "center"; ctx.globalAlpha = 0.55 + 0.25 * Math.sin(now / 600);
    ctx.fillText(CFG.hint, W / 2, H - 28);
  }
  ctx.restore();

  if (showDebug) {
    ctx.save();
    for (const hand of hands) {
      ctx.fillStyle = `rgba(185,214,227,${0.4 + 0.6 * hand.closure})`;
      for (const [x, y] of hand.pts) { const [px, py] = P(x, y); ctx.beginPath(); ctx.arc(px, py, 3, 0, 7); ctx.fill(); }
    }
    ctx.restore();
    $("debug").textContent = [
      `fps ${fps.toFixed(0)}   camera ${video.videoWidth}x${video.videoHeight}   mirror ${mirror}`,
      `faces ${faces.length}   hands ${hands.map((h) => `closure ${h.closure.toFixed(2)} (ratio ${h.ratio.toFixed(2)})`).join(", ") || 0}`,
      `heads ${heads.filter((h) => h.active).map((h) => `${h.mat.name} squash ${h.squash.toFixed(2)}`).join(", ") || "none"}`,
      `voices ${n} from ${peopleCount()} people   data ${data.source}${data.updated ? ", updated " + data.updated : ""}${data.error ? "   " + data.error : ""}`,
      ...subs.map((s) => `shown id ${s.id}`),
    ].join("\n");
  }
}

function loop(now) {
  if (!running) return;
  const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 1 / 60;
  fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;
  lastT = now;
  try { track(now); } catch (e) { console.error(e); }
  updateHeads(now, dt);
  draw(now);
  requestAnimationFrame(loop);
}

// ---------- start ----------

async function start(full) {
  $("status").textContent = "Starting camera…";
  try {
    await openCamera($("camera").value);
    if (full && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!faceDetector) { $("status").textContent = "Loading face and hand tracking…"; await loadModels(); }
    $("start").classList.add("hidden");
    $("status").textContent = "";
    if (!running) { running = true; requestAnimationFrame(loop); }
  } catch (e) {
    $("status").textContent = "Could not start: " + (e.message || e);
  }
}

async function init() {
  resize(); addEventListener("resize", resize);
  for (const m of MATS) { const i = new Image(); i.src = m.png; images[m.png] = i; }
  $("go").onclick = () => start(true);
  $("goWindow").onclick = () => start(false);
  $("camera").onchange = () => store.set("iam.camera", $("camera").value);
  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
    if (k === "d") { showDebug = !showDebug; $("debug").style.display = showDebug ? "block" : "none"; }
    if (k === "c") { $("start").classList.toggle("hidden"); listCameras(); }
    if (k === "m") { mirror = !mirror; store.set("iam.mirror", mirror); }
    if (k === "s") spawnSubtitle(heads.find((h) => h.active) || { x: 0.5, y: 0.5, w: 0.1, mat: null }, performance.now());
  });
  fetchVoices(); setInterval(fetchVoices, Math.max(15, CFG.refreshSeconds) * 1000);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  try { // ask once so camera names show in the list
    const s = await navigator.mediaDevices.getUserMedia({ video: true });
    s.getTracks().forEach((t) => t.stop());
  } catch (e) { $("status").textContent = "Camera access was refused. Allow it in the browser's address bar, then reload."; }
  const cams = await listCameras();
  if (!cams.length) $("status").textContent = "No camera found. Plug one in and reload.";
}

init();
