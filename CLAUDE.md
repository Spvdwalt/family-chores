# Family Chores — project notes for Claude

A zero-dependency Node.js chore app for SP's children Luan (🦁, b. 2019-09-09) and
Arno (🐻, b. 2021-10-04). Currency is South African Rand. UI is English/Afrikaans
(toggle in Parent Zone → Settings).

## Hard rules

- **Zero dependencies, no frameworks, no build step.** One `server.js` + vanilla
  HTML/CSS/JS in `public/`. The user explicitly wants it simple — keep it that way.
- **Never commit `data/`** — it holds the family's PINs and history (gitignored).
- **Test every changed flow in the browser preview before pushing.** The user
  expects this; click through as both child and parent.
- **On every release:** bump `APP_VERSION` in `server.js` (shown in the dashboard
  footer to expose stale caches) and the `?v=` stamps in `index.html` when
  `app.js`/`style.css` changed.
- The app is embedded in Home Assistant via an iframe on a wall tablet. Keep it
  iframe-friendly: no frame-blocking headers, no controls hugging the right edge,
  keep the cache-busting (`no-cache`/`no-store` headers, timestamped GET URLs,
  30s dashboard auto-refresh).
- New UI strings go into BOTH `STR.en` and `STR.af` in `app.js`.

## Workflow

- Develop and test here on Windows: `node server.js` or `Start Chore App.bat`
  (http://localhost:3000).
- Ship: commit + push to https://github.com/Spvdwalt/family-chores (this folder is
  the git repo).
- The user then runs on his Ubuntu server:
  `cd ~/family-chores && git pull && docker compose up -d --build`
- Live data on the server is volume-mounted in `./data` — pulls/rebuilds never
  touch it.

## Architecture cheat-sheet

- `server.js`: plain `http` server. JSON file store (`data/data.json`), atomic
  writes. Routes in a `routes` map. Admin routes check the `x-admin-pin` header.
- Chore availability is **computed from completion history**, never queued — so
  missed chores don't pile up. Daily = fresh per calendar day (optional start
  hour). Weekly = 7-day cooldown from last completion. Custom = N-day cooldown.
  Once-off = until done. `assignedTo`: child id | `each` (both, own instance) |
  `any` (first one wins).
- All actions need PINs (child 4-digit, parent 5-digit). The Parent Zone asks the
  PIN on EVERY open — never store it.
- Deleting a chore sets `active: false` (history stays); the toggle uses `enabled`.
