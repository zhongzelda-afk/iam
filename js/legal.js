// Plain-language drafts. They are not final legal or ethics documents:
// every page says so, and the wording must be checked against UAL's own requirements before the site is used for research.

const DRAFT = `<p class="notice draft-note"><strong>Draft for review.</strong> This text has not yet been checked against the University of the Arts London's research ethics and data protection requirements. It does not claim ethics approval or legal compliance. Contact details will be added before launch.</p>`;

export const LEGAL = {
  terms: {
    title: "Terms of Use",
    html: `${DRAFT}
      <h2 class="sub">What this site is</h2>
      <p>I.A.M. (Institute of Animate Matter) is a fictional institute made for <em>UX of Respond</em>, an MA UX Design project by Lynn Zhong at the University of the Arts London. It is an archive of everyday materials and the meanings people give to how they respond.</p>
      <h2 class="sub">Using the site</h2>
      <ul>
        <li>You can browse the archive without an account.</li>
        <li>A contributor account lets you keep a private dictionary of your entries.</li>
        <li>You must be 18 or over to create an account.</li>
        <li>Keep your password to yourself. You are responsible for what is posted from your account.</li>
      </ul>
      <h2 class="sub">What you contribute</h2>
      <ul>
        <li>Your meanings, notes, imagined voices and body movements remain yours.</li>
        <li>Entries are private unless you choose to share one. If you share an entry, you allow it to be shown publicly on this site until you withdraw it.</li>
        <li>Please do not post anything unlawful, hateful, or anything that identifies another person without their permission.</li>
        <li>Entries that break these rules may be removed.</li>
      </ul>
      <h2 class="sub">What the site is not</h2>
      <p>Interpretations, including the Institute's own, are subjective. Materials are not claimed to think or feel. The site is a student project, offered as it is, and may change or close when the project ends.</p>
      <h2 class="sub">Contact</h2>
      <p>To be added.</p>`
  },
  privacy: {
    title: "Privacy Notice",
    html: `${DRAFT}
      <h2 class="sub">What is stored</h2>
      <ul>
        <li><strong>Account:</strong> your email address and a securely hashed password, held by the authentication service (Supabase). The project never sees your password.</li>
        <li><strong>Consent choices:</strong> whether you agreed to research use and to publishing, and when.</li>
        <li><strong>Your dictionary:</strong> the meanings, notes, imagined voices and body movements you save.</li>
        <li><strong>Shared entries:</strong> only the entries you choose to share, with the name you sign with (optional) and the date.</li>
      </ul>
      <p>No tracking cookies, no advertising, no location. Your browser keeps a sign-in token so you stay signed in.</p>
      <h2 class="sub">Why</h2>
      <p>To run your account and your dictionary, to show shared entries in the archive, and, only if you agree separately, to use your entries in the research.</p>
      <h2 class="sub">Who can see it</h2>
      <ul>
        <li><strong>Private entries:</strong> only you. The database refuses anyone else's request for them.</li>
        <li><strong>Shared entries:</strong> anyone visiting the site. Your email is never shown.</li>
        <li><strong>The researcher</strong> can technically access the database to run the site. Private entries are only used in the research if you gave research consent.</li>
      </ul>
      <h2 class="sub">Where</h2>
      <p>Data is held by Supabase. The storage region and retention period will be confirmed before launch.</p>
      <h2 class="sub">Your choices</h2>
      <ul>
        <li>Make any entry private again at any time. It leaves the public archive straight away.</li>
        <li>Withdraw research consent or publishing consent at any time from your account.</li>
        <li>Download a copy of your dictionary.</li>
        <li>Delete your account. This deletes your profile, your dictionary, your shared entries and your sign-in.</li>
      </ul>
      <h2 class="sub">Contact</h2>
      <p>To be added.</p>`
  },
  research: {
    title: "Research Participation Information",
    html: `${DRAFT}
      <h2 class="sub">The research</h2>
      <p><em>UX of Respond</em> asks how the way materials change, how they press, deform and spring back, can become a language that people read and perform with their bodies. I.A.M. collects many personal readings of the same material.</p>
      <h2 class="sub">What taking part means</h2>
      <p>If you give research consent, the entries you save may be read and analysed for the project, and short quotes or drawings of body movements may appear in the MA essay, blog and presentations.</p>
      <h2 class="sub">It is optional</h2>
      <ul>
        <li>You can use the site fully without taking part.</li>
        <li>Research consent is separate from publishing. You can agree to one, both or neither.</li>
        <li>You can withdraw at any time from your account. Entries not yet used will not be used. Work already submitted for assessment may not be possible to change.</li>
      </ul>
      <h2 class="sub">How you appear</h2>
      <p>Quotes are attributed only to the name you sign with, or to "Anonymous". Your email is never published.</p>
      <h2 class="sub">Risks</h2>
      <p>Low. You choose what to write. Please do not include personal details you would not want read.</p>
      <h2 class="sub">Contact</h2>
      <p>Researcher: Lynn Zhong, MA UX Design, University of the Arts London. Contact details to be added. Supervisor contact to be added.</p>`
  },
  consent: {
    title: "Research Consent Details",
    html: `${DRAFT}
      <p>There are two optional permissions. Neither is ticked for you, and you can change either at any time from your account.</p>
      <h2 class="sub">1. Research use</h2>
      <p>I agree that the entries I save on I.A.M. may be used in the <em>UX of Respond</em> research as described in the Research Participation Information. I understand that taking part is voluntary and that I can withdraw.</p>
      <h2 class="sub">2. Publishing selected entries</h2>
      <p>I agree that entries I choose to share may be shown publicly in the I.A.M. archive. Nothing is published unless I share that specific entry, and I can make it private again.</p>
      <h2 class="sub">Withdrawal</h2>
      <p>Withdrawing research consent stops future use. Withdrawing publishing consent removes your shared entries from the public archive. Deleting your account removes everything.</p>`
  }
};
