# I.A.M. — Institute of Animate Matter

A public website for *UX of Respond* (Lynn Zhong, MA UX Design, UAL, 2026).
Dark, minimal material archive. Three pages: **Home**, **Archive** (11 founding
materials, filters, empty slots to register community materials) with a case
file per material (physical response, I.A.M. interpretation, View Full Record with
the original research content, interpretation carousel, Add Your Meaning panel)
and **My Collection** (revisit, share, delete).

Plain HTML, CSS and JavaScript. No build step, nothing to install.

## Files

| Path | What it is |
|---|---|
| `index.html` | Page shell, header, footer |
| `css/styles.css` | Dark design tokens, specimen interactions and all styles |
| `js/data.js` | The 11 founding materials with their original records, I.A.M. interpretations |
| `js/app.js` | Pages and flows |
| `js/body.js` | Borrow a Body editor and players |
| `js/art.js` | Logo mark, cube and jar drawings |
| `js/store.js` | Saving: browser storage + Supabase |
| `config.js` | Supabase URL and publishable key (public) |
| `supabase/schema.sql` | Database tables and access rules |

## Turning on the shared archive (free)

1. Create a project at supabase.com.
2. SQL Editor → New query → paste `supabase/schema.sql` → Run.
3. Authentication → Sign In / Providers → turn on **Allow anonymous sign-ins** → Save.
4. Project Settings → API: copy the Project URL and the publishable (anon) key into `config.js`. Never the secret key.

Without these, the site still works; shared entries just stay on the visitor's device.
Re-run `schema.sql` after updates; it is safe to run again.
To remove an unwanted public entry or material: Supabase → Table Editor → `entries` or `materials` → delete the row.

## Adding real footage

Put `assets/materials/004.jpg` in the repo, then add `photo: true` to
material `004` in `js/data.js`.

## Running locally

Any static server, e.g. `python3 -m http.server` in this folder, then open http://localhost:8000.
