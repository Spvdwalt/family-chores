# Family Chores ⭐

A simple, clean chore app for Luan 🦁 and Arno 🐻. Kids tap their name, pick a chore,
enter their secret code, and earn pocket money. Parents manage everything behind a PIN.

No database, no dependencies — one small Node.js server and a `data.json` file.

## Run on Windows (testing)

Double-click **`Start Chore App.bat`** — it opens http://localhost:3000 in your browser.

(Or from a terminal: `node server.js`)

## Run on your Ubuntu server (Docker)

Copy this folder to the server, then:

```bash
docker compose up -d --build
```

The app is then at `http://<server-ip>:3000`. All data lives in `./data/data.json`
(mounted as a volume, so it survives container updates). Back up that one file and
you've backed up everything.

## Default codes — change these in Settings!

| Who | Code |
|---|---|
| Luan | `1111` |
| Arno | `2222` |
| Parent Zone | `12345` |

Open the Parent Zone (⚙️ top-right) → **Settings** to change them.

## How it works

- **Dashboard** shows each child's **Pocket** (what you still owe them), **Earned**
  (all-time total) and **Paid out**, plus a banner with how many chores are waiting.
- **Chores** can be assigned to one child, **Both (own chore each)** — e.g. making
  beds — or **Anyone (first one wins)** — e.g. sweeping the pool: once one child
  does it, it's gone for both until it comes back.
- **Frequency**: *Every day* (fresh each morning, expires at midnight if missed),
  *Once a week* (comes back 7 days after it was last done), *Once-off* (gone once
  done), or *Custom* — every 2–365 days after it was last done.
- Missed chores never pile up — a chore shows **once** when it's due, no matter
  how long ago it was last done. Come back from holiday to one of each, not ten.
- In Settings you can choose when daily chores appear each morning (midnight
  through 09:00).
- A child confirms a chore with their 4-digit code. Wrong code = shake, no money. 😉
- **Pay Day** (Parent Zone): record what you paid out — "Pay all" fills in their
  full pocket amount.
- Every chore has an **on/off switch** in the Parent Zone — switch it off to hide
  it from the kids temporarily without deleting it.
- **💡 Ideas**: 20 prebuilt chores with suggested prices — tap one to pre-fill the
  form, tweak, and save.
- **Avatars**: pick each child's face in Settings (lion, bear, dino, unicorn…).
- **History**: every completion and payout, with an **undo** button in case a chore
  was marked done but the bed mysteriously still looks like a nest.
- Deleting a chore keeps its history; totals never change retroactively.

## Notes

- Chores reset at midnight / Monday based on the **server's** clock and timezone.
- This is a trusted-home-network app: codes are stored in plain text and there is no
  HTTPS. Don't expose it to the internet as-is.
