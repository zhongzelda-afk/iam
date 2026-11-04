# I.A.M. · The Living Material Library

Institute of Animate Matter. *One Material. Many Meanings.*
Website for Lynn Zhong's MA User Experience Design graduation project (London College of Communication, UAL, 2026).

Journey: **Home → Material Library → Material Detail → Become a Material → My Collection → (optional) Contribute to the Lab**

Plain HTML, CSS and JavaScript modules. No build step. Deploys as is on GitHub Pages (main branch, root).

## Run locally

```sh
python3 -m http.server 8000      # from the repo root, then open http://localhost:8000
```

Opening `index.html` straight from the file system does not work (browsers block modules there).

## Deploy

1. `sh bump.sh` (stamps a version so visitors get the new files)
2. Commit and push to `main`. GitHub Pages publishes in a minute or two.

## Where things live

| Path | What it is |
|---|---|
| `js/data/catalogue.js` | **Object numbers and record status.** The only place to renumber or publish an object, or add reserved slots |
| `js/data/materials.js` | Each material's record: profile, states, videos, observation, image paths |
| `js/data/translations.js` | Public translations with provenance (workshop participant / public contribution / creative simulation) |
| `js/lib/library.js` | Joins catalogue and records; links between pages |
| `js/lib/collection.js` | My Collection, stored in the visitor's browser |
| `js/lib/contributions.js` | Contribute to the Lab, via Supabase |
| `js/components/` | Gallery item, figure, status label, state viewer (fold / unfold), video player, translation record, record card |
| `js/pages/` | Home, Library, Material, Become, Collection, Record, Contribute, About |
| `js/app.js` | Router (`#/library`, `#/object/orange`, `#/object/orange/become`, `#/collection/P-001`, …) |
| `css/styles.css` | All styles. Tokens at the top |
| `assets/objects/<slug>/` | `cutout.webp` (gallery and hero) and `state-01..04.jpg` |
| `assets/materials/` | Research videos and earlier images |
| `tools/extract-assets.py` | Re-cuts objects and state frames from the videos |
| `supabase/contributions.sql` | Contribution queue with moderation (run once) |
| `screen/` | Show screen (parked, untouched) |

## Common edits

**Publish an object** (e.g. Rose): in `catalogue.js` set its `status` to `"published"`. Fill its `observation` and translations first; empty fields show as "Not yet written".

**Renumber**: change `no` in `catalogue.js`. Never change `key` (saved translations and the database use it).

**Add a new material**: add a line to `CATALOGUE` with a new `key`, `slug` and the next `no`, add its record to `MATERIALS`, put images in `assets/objects/<slug>/`, and remove that number from `RESERVED`.

**Add workshop translations**: add entries to `TRANSLATIONS` with `sourceType: "WORKSHOP_PARTICIPANT"` only for words participants actually said. Anything written to illustrate must be `CREATIVE_SIMULATION`, which the page labels.

## Replacing temporary images with final photographs

Every gallery image is currently a **temporary cut-out from a Workshop B video frame** (the page says so).
To replace one: save the final photograph (square, transparent background, about 1200 px, WebP or PNG) as
`assets/objects/<slug>/cutout.webp`, or put it anywhere and point `heroImage` and `galleryImage` in `materials.js` to it.
Then set `imageTemporary: false` for that material.

Objects with no footage yet (Aluminium Foil, Cleaning Sponge, Pear, Shaving Foam, Madeleine) show a dotted outline.
When they are filmed: add the video to `assets/materials/`, add the slug and frame times to `J` in
`tools/extract-assets.py`, run it, then fill `states`, `experimentVideo` and `heroImage` in `materials.js`.

## My Collection (browser storage)

Translations a visitor writes are saved in their own browser (`localStorage`, key `iam.collection.v1`).
Limits: they stay on that device and browser only, disappear if browser data is cleared, and private windows may not keep them.
Nothing is uploaded unless the visitor submits it to the Lab with consent.

## Contribute to the Lab (Supabase, moderated)

Switch on once: Supabase → SQL Editor → New query → paste `supabase/contributions.sql` → Run.

- Submissions arrive as `pending_review` and are **not readable by the public**.
- Review in Table Editor → `library_contributions`. Set `status` to `published` to show it on the material page, or `rejected`.
- Visitors can withdraw from My Collection; this deletes the row (their browser holds a secret token, which the public API cannot read).
- Until the SQL is run, or when offline, a submission is held in the visitor's browser and labelled "Pending review · held in this browser". It is sent the next time My Collection opens. It is never shown as published.

The earlier `library_readings` and `entries` tables are left untouched in Supabase; this version does not display them.
