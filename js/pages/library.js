// 02 Material Library: numbered object gallery (Reference C) with archive status and a simple filter.
import { $$ } from "../lib/util.js?v=202611061240";
import { ENTRIES, OBJECTS, PUBLISHED, RESERVED_SLOTS } from "../lib/library.js?v=202611061240";
import { galleryItem } from "../components/galleryItem.js?v=202611061240";

let filter = "all";
export function render(main) {
  const inProgress = ENTRIES.length - PUBLISHED.length;
  const observing = OBJECTS.length - PUBLISHED.length;
  const first = ENTRIES[0].no, last = ENTRIES[ENTRIES.length - 1].no;
  main.innerHTML = `
  <section class="lib" aria-labelledby="lib-title">
    <aside class="lib-rail" aria-hidden="true">
      <span class="mono">Library of Found Materials · ${first}–${last}</span>
      <span class="lib-rail-word">Library</span>
      <span class="mono">I.A.M.</span>
    </aside>
    <div class="lib-main">
      <header class="lib-head">
        <div>
          <p class="mono eyebrow">The Living Material Library</p>
          <h1 id="lib-title" class="page-title">Material Library</h1>
          <p class="mono lib-count">${PUBLISHED.length} published records · ${observing} under observation · ${RESERVED_SLOTS.length} awaiting cataloguing</p>
        </div>
        <div class="seg" role="group" aria-label="Filter the library">
          <button type="button" class="seg-btn" data-f="all" aria-pressed="${filter === "all"}">All <span class="mono">${ENTRIES.length}</span></button>
          <button type="button" class="seg-btn" data-f="published" aria-pressed="${filter === "published"}">Published <span class="mono">${PUBLISHED.length}</span></button>
          <button type="button" class="seg-btn" data-f="progress" aria-pressed="${filter === "progress"}">In progress <span class="mono">${inProgress}</span></button>
        </div>
      </header>
      <ul class="gallery" data-gallery>${ENTRIES.map(galleryItem).join("")}</ul>
      <p class="mono lib-note">Under observation: research in progress, record not yet open. Awaiting cataloguing: a reserved number for the next material.</p>
    </div>
  </section>`;
  const apply = () => {
    $$(".g-item", main).forEach(li => li.hidden = filter !== "all" && li.dataset.filter !== filter);
    $$("[data-f]", main).forEach(b => b.setAttribute("aria-pressed", b.dataset.f === filter));
  };
  $$("[data-f]", main).forEach(b => b.addEventListener("click", () => { filter = b.dataset.f; apply(); }));
  apply();
}
