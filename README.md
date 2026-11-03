# The Library of Found Materials (I.A.M.)

Website for *UX of Respond* (Lynn Zhong, MA UX Design, UAL, 2026).
Eleven ordinary things, pressed by hand. A visitor borrows one, watches it change,
tries the press with their own body, and returns it with one line of their own reading.

Journey (map v0.1, 2 Nov 2026): **Home** → **Library** shelf → **Item** (film and stills
of a hand pressing it, one response word, "Try it" prompt, readings, one box) → **Returned**
(your reading in place, plus an item that behaves the opposite way). No accounts.

Plain HTML, CSS and JavaScript. No build step.

| Path | What it is |
|---|---|
| `index.html` | Page shell |
| `css/styles.css` | All styles |
| `js/data.js` | The 11 items and their records, Response words R01 to R05 |
| `js/app.js` | The four screens and the router |
| `js/store.js` | Readings: Supabase table `library_readings`, falls back to this browser |
| `supabase/library.sql` | Run once in Supabase to switch on shared readings |
| `screen/` | Show screen (parked) |

Items without a video show as **Loading**. To add footage, put the files in
`assets/materials/` and list them in that item's `media` in `js/data.js`.

## Switching on shared readings

Supabase → SQL Editor → New query → paste `supabase/library.sql` → Run.
Until then, readings are kept in the visitor's own browser and the Returned page says so.
Remove unwanted readings in Table Editor → `library_readings`.

Run `sh bump.sh` before each commit so browsers load the new files.
