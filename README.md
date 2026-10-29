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

## Turning on contributor accounts (free)

1. Create a project at supabase.com.
2. SQL Editor → New query → paste `supabase/schema.sql` → Run. Re-run it after updates; it is safe to run again.
3. Authentication → Sign In / Providers → Email: keep **Confirm email** on. Anonymous sign-ins can be turned off.
4. Authentication → URL Configuration: set **Site URL** to the live address (for example `https://<user>.github.io/iam/`) and add the same address under **Redirect URLs**. Sign-up confirmation and password reset links return there.
5. Project Settings → API: copy the Project URL and the publishable key into `config.js`. Never the secret or service_role key.
6. Optional but recommended: Authentication → Emails → set up custom SMTP. The built-in sender only sends a few emails per hour.

How data is separated:
- `profiles`: one row per contributor with consent choices (research use, publishing) and when they were given. Only the owner can read or change it.
- `collection`: the private collection. Row level security lets only the owner read or change their rows.
- `entries`: public entries. A contributor can only add one if their profile has publishing consent, and only change or remove their own.
- `delete_my_account()`: removes everything a contributor owns, then their login.

The legal pages in `js/legal.js` are drafts. Check them against UAL's research ethics and data protection requirements before using the site for research.
To remove an unwanted public entry or material: Supabase → Table Editor → `entries` or `materials` → delete the row.

## Adding real footage

Put `assets/materials/004.jpg` in the repo, then add `photo: true` to
material `004` in `js/data.js`.

## Running locally

Any static server, e.g. `python3 -m http.server` in this folder, then open http://localhost:8000.
