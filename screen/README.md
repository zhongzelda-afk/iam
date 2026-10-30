# I.A.M. screen (graduation show)

Open `/screen/` in Chrome, choose the camera, press Start. A passerby gets a 3D material head (11 designs, direction C "soft relief"); closing a hand beside the head presses it where the hand is, the way that material responds, and floats up one imagined voice from the public archive (`entries.voice`, read only).

* Face and hand tracking: MediaPipe Tasks Vision 0.10.14 (Apache 2.0), bundled in `lib/` and `models/`, runs locally.
* Offline: after one visit a service worker keeps every file; voices are cached in the browser.
* Settings and moderation (blocklist, hidden ids, approved only): `config.js`.
* Keys: F full screen, C camera, D debug, S test squeeze, M mirror.
* Heads are drawn live with three.js 0.169.0 (MIT, `lib/`): models in `heads3d.js`, pressing and traces in `heads-live.js`. Materials that keep a change hold part of every press (`traceKeeps` in `config.js`), so each visitor leaves with a head shaped by them; a new visitor starts fresh.
* Keys: S runs a pretend press from the right, to test without a hand; N switches the first head to the next material.
