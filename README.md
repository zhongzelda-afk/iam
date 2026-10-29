# I.A.M. — Institute of Animate Matter

A public website for *UX of Respond* (Lynn Zhong, MA UX Design, UAL, 2026).
Visitors browse a specimen archive, translate a material in the Translation Lab
(observe, interpret, imagine, perform with **Borrow a Body**), keep a personal
dictionary, revise meanings over time, and optionally share to a Collective
Dictionary where others read their bodies before the meaning is revealed.

Plain HTML, CSS and JavaScript. No build step, nothing to install.

## Files

| Path | What it is |
|---|---|
| `index.html` | Page shell, header, footer |
| `css/styles.css` | Design tokens (palette, emboss/deboss shadows) and all styles |
| `js/data.js` | The specimen register: edit names, behaviours, notes here |
| `js/app.js` | Pages and flows |
| `js/body.js` | Borrow a Body editor and players |
| `js/art.js` | Rosette seal and specimen drawings |
| `js/store.js` | Saving: browser storage + Supabase |
| `config.js` | Supabase URL and anon key, optional hero video |
| `supabase/schema.sql` | Database tables and access rules |

## Turning on the shared Collective Dictionary (free)

1. Create a project at supabase.com.
2. SQL Editor → New query → paste `supabase/schema.sql` → Run.
3. Authentication → Sign In / Providers → turn on **Allow anonymous sign-ins** → Save.
4. Project Settings → API: copy the Project URL and the `anon` `public` key into `config.js`.

Without these, the site still works; shared entries just stay on the visitor's device.
To remove an unwanted public entry: Supabase → Table Editor → `entries` → delete the row.

## Adding real footage

Put `assets/materials/004.jpg` (and/or `004.mp4`) in the repo, then add
`photo: true` / `video: true` to material `004` in `js/data.js`.
For the homepage film, add `assets/hero.mp4` and set `HERO_VIDEO: "assets/hero.mp4"` in `config.js`.

## Running locally

Any static server, e.g. `python3 -m http.server` in this folder, then open http://localhost:8000.
