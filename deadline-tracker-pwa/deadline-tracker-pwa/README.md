# Deadline Tracker (Android Share-to-App)

A small installable web app for tracking government/banking/PSU job deadlines,
fed by Android's **Share** sheet — no browser extension, no switching browsers.

Everything is stored only on your phone (nothing is sent to any server).

---

## 1. Put it online (one-time, ~5 minutes)

Android requires an installable app to be served over HTTPS from a real address —
a folder of files on its own can't register as a Share Target. **GitHub Pages** is
the simplest free way to do this with no coding tools.

1. Go to **github.com**, sign in (or create a free account).
2. Click **+ → New repository**. Name it e.g. `deadline-tracker`. Keep it **Public**. Create it.
3. Open the new repo → **Add file → Upload files**.
4. Drag in *every file and folder* from this package (`index.html`, `share.html`,
   `app.js`, `shared.js`, `style.css`, `sw.js`, `manifest.webmanifest`, and the
   `icons` folder with its 3 images) — keep the same folder structure. Commit.
5. Go to the repo's **Settings → Pages**. Under "Build and deployment", set
   **Source: Deploy from a branch**, **Branch: main / (root)**. Save.
6. Wait about a minute, then refresh — GitHub shows your live URL, something like:
   `https://yourusername.github.io/deadline-tracker/`

That URL is now your permanent tracker link.

*(Netlify or Vercel work too, if you'd rather use those — same idea: upload the folder, get an HTTPS URL.)*

## 2. Install it on your phone

1. Open that URL in **Chrome** on your Android phone.
2. Tap the **⋮** menu → **Add to Home screen** / **Install app**.
3. Open it once from the home screen icon (this registers it as a share target — required once).

## 3. Everyday use

1. Browse to a job notification in Chrome or Brave, as usual.
2. **Long-press and select the line with the last date** (this is optional but
   makes auto-detection reliable) → tap **Share** in the selection toolbar.
   *(You can also just tap the browser's own Share button on the page — it'll still grab the title and link, you'll just confirm the date by hand.)*
3. Pick **Deadline Tracker** from the share sheet.
4. Check the pre-filled name/date/link, fix anything that's off, tap **Save to Tracker**.
5. Open the app anytime to see the dashboard, countdowns, and priorities.

## 4. Reminders — how they actually work

This app only runs while you have it open — like any web app, it can't wake
itself up in the background to ping you. Two ways it still keeps you covered:

- **Open the app** → anything due today at the 14/7/3/1/0-day marks shows in
  a banner at the top, impossible to miss.
- **Tap the calendar icon** on any job → downloads a `.ics` file with reminders
  built in at 14, 7, 3, 1 days before and on the deadline day. Open it once and
  your phone's Calendar app (Google Calendar, etc.) will notify you at those
  points automatically — even if you never open this tracker again.

Do this once per job right after adding it, and you get real, automatic,
phone-level reminders with no extra app permissions.

## Files in this package

```
index.html            dashboard
share.html             receives shares from Chrome/Brave, extracts details
app.js                 dashboard logic
shared.js              date parsing, category detection, countdown, .ics builder
style.css               styling
sw.js                   service worker (required for "Add to Home screen")
manifest.webmanifest    app name/icons + Share Target registration
icons/                  app icons
```
