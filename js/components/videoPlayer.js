// Video Evidence Player: native controls, poster, caption, text description, state chapters.
import { esc, fmtTime } from "../lib/util.js?v=202611042201";

export function videoPlayer(v, { id, states = [], label = "Experiment video" } = {}) {
  if (!v) return "";
  const did = `${id}-desc`;
  return `
  <figure class="video">
    <div class="video-frame">
      <video id="${id}" controls playsinline preload="metadata" poster="${esc(v.poster || "")}" aria-describedby="${did}" muted>
        <source src="${esc(v.src)}" type="video/mp4">
        Your browser cannot play this video. <a href="${esc(v.src)}">Download it</a>.
      </video>
    </div>
    <figcaption>
      <p class="mono video-cap">${esc(label)} · ${esc(v.caption)}</p>
      <p id="${did}" class="video-desc">${esc(v.description || "")}</p>
      ${states.length ? `<div class="chapters" role="group" aria-label="Jump to a physical state">${states.map(s => `<button type="button" class="chip" data-seek="${s.t}" data-for="${id}"><span class="mono">${s.n}</span> ${esc(s.name)} <span class="mono muted">${fmtTime(s.t)}</span></button>`).join("")}</div>` : ""}
    </figcaption>
  </figure>`;
}

export function mountVideo(root) {
  root.addEventListener("click", ev => {
    const b = ev.target.closest("[data-seek]"); if (!b) return;
    const v = root.querySelector("#" + b.dataset.for); if (!v) return;
    v.currentTime = +b.dataset.seek; v.play().catch(() => {});
  });
}
