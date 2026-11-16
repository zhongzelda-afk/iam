// Video Evidence Player: the video in a booklet frame, state chapters as a red index,
// with the written description kept for screen readers.
import { esc, fmtTime, reduceMotion } from "../lib/util.js?v=202611161712";

export function videoPlayer(v, { id, states = [], label = "Experiment video" } = {}) {
  if (!v) return "";
  const did = `${id}-desc`;
  return `
  <figure class="video">
    <div class="video-frame">
      <video id="${id}" controls playsinline ${reduceMotion() ? 'preload="metadata"' : "autoplay loop preload=\"auto\""} poster="${esc(v.poster || "")}" aria-describedby="${did}" muted>
        <source src="${esc(v.src)}" type="video/mp4">
        Your browser cannot play this video. <a href="${esc(v.src)}">Download it</a>.
      </video>
    </div>
    <figcaption class="video-side">
      <p id="${did}" class="visually-hidden">${esc(v.description || "")}</p>
      ${states.length ? `<ol class="chapters" aria-label="Jump to a physical state">${states.map(s => `<li><button type="button" class="chap" data-seek="${s.t}" data-for="${id}"><span class="dot-ring" aria-hidden="true"></span><span class="chap-n">${s.n} / ${esc(s.name.toUpperCase())}</span><span class="chap-t">${fmtTime(s.t)}</span></button></li>`).join("")}</ol>` : ""}
      <p class="mono video-cap">${esc(label)} · ${esc(v.caption)}</p>
    </figcaption>
  </figure>`;
}

export function mountVideo(root) {
  root.addEventListener("click", ev => {
    const b = ev.target.closest("[data-seek]"); if (!b) return;
    const v = root.querySelector("#" + b.dataset.for); if (!v) return;
    v.currentTime = +b.dataset.seek; v.play().catch(() => {});
  });
  // light up the state the video is in
  root.querySelectorAll(".video video").forEach(v => {
    const chaps = [...root.querySelectorAll(`[data-for="${v.id}"]`)];
    v.addEventListener("timeupdate", () => {
      let at = -1; chaps.forEach((c, i) => { if (v.currentTime + .05 >= +c.dataset.seek) at = i; });
      chaps.forEach((c, i) => c.classList.toggle("is-now", i === at));
    });
  });
}
