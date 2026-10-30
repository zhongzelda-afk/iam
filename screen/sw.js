// Keeps the screen working offline: every file of the page is cached after the first visit.
// Supabase requests are not cached here (the page keeps its own copy of the voices).
const CACHE = "iam-screen-v3";
const FILES = ["./", "index.html", "config.js", "screen.js", "lib/vision_bundle.mjs",
  "lib/wasm/vision_wasm_internal.js", "lib/wasm/vision_wasm_internal.wasm",
  "lib/wasm/vision_wasm_nosimd_internal.js", "lib/wasm/vision_wasm_nosimd_internal.wasm",
  "models/face_detector.tflite", "models/gesture_recognizer.task",
  "lib/three.module.min.js", "heads3d.js", "heads-live.js"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys()
  .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== "GET") return;
  // network first so edits to config.js show up; the cache is the fallback when offline
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});
