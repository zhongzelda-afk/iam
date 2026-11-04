// About: the method, what the translations are (and are not), and where data lives.
import { href } from "../lib/library.js?v=202611041523";

export function render(main) {
  main.innerHTML = `
  <article class="about narrow" aria-labelledby="a-title">
    <p class="mono eyebrow">I.A.M. · Institute of Animate Matter</p>
    <h1 id="a-title" class="page-title">About the Library</h1>
    <ol class="seq mono" aria-label="Method"><li>Material</li><li>Physical action</li><li>Embodied interpretation</li><li>Material translation</li></ol>
    <h2>Become a Material</h2>
    <p>Each record documents one everyday material under a physical action. Workshop participants watched the material change, watched how others embodied that action with their bodies, imagined becoming the material, and said what it might say, in the first person.</p>
    <h2>What a translation is</h2>
    <p>Translations are human interpretations. They are not scientific claims that materials have emotions or consciousness, and they are not personality tests. Observed facts and interpretations are kept apart on every record, and every translation carries its source.</p>
    <h2>Your translations and privacy</h2>
    <p>What you write in Become a Material is saved only in your own browser, in My Collection. Nothing is sent anywhere unless you choose Contribute to the Lab and tick the consent box. Contributions are reviewed before they appear, can be anonymous, and can be withdrawn from My Collection at any time.</p>
    <h2>Images</h2>
    <p>Object images are temporary cut-outs from the research videos, to be replaced with final photographs. Physical states are real frames from the same videos.</p>
    <p class="mono small muted">A graduation project by Lynn Zhong · MA User Experience Design · London College of Communication, UAL · 2026</p>
    <p><a class="cta" href="${href.library}">Explore the Library <span aria-hidden="true">→</span></a></p>
  </article>`;
}
