# Resume Maker for LinkedIn

A Chrome extension that makes a CV (PDF) from your LinkedIn profile (repository: `resume-maker-for-linkedin`).
*Not affiliated with, endorsed or sponsored by LinkedIn.*
Open your profile, click **📄 Make CV**, adjust the look, **Print / Save as PDF**.
Everything stays in your browser: no server, no account, nothing is sent anywhere.

## Install (developer mode)

1. Open `chrome://extensions` and turn on **Developer mode** (top right).
2. **Load unpacked** → choose this folder.
3. Open your profile, `https://www.linkedin.com/in/<you>/` (reload the tab if it was already open).

## Use

1. Click **📄 Make CV** (bottom right). The page scrolls for a few seconds and loads the full lists
   ("Show all" skills, projects, …) in the background; the button shows the progress.
2. The CV opens in a new tab. On the left:
   - **Template**: *Classic* (one column) or *Sidebar* (two columns: photo, contacts, skills, languages and
     certifications on the left).
   - **Look**: accent color, paper (A4 / Letter), photo, job durations, the skills line under jobs and projects.
   - **Sections**: turn sections on or off (Courses is off by default; recommendations are never included).
   - **Edit text**: click any text on the CV to change it. Add your **email** and **phone** here (LinkedIn keeps
     them behind "Contact info", so they can't be read from the page). **×** removes an entry, e.g. an old job.
3. **Print / Save as PDF** → in Chrome's dialog choose **Destination: Save as PDF** and turn on
   **Background graphics** (keeps the colors). The suggested file name is `<Your name> - CV.pdf`.

The toolbar icon opens your saved CV at any time, without going to LinkedIn.

**The 📄 Make CV button** can be dragged anywhere on the page; its place is remembered. Hover it and click **×** to
hide it. To bring it back: toolbar icon → CV page → **LinkedIn button** → *Show 📄 Make CV on LinkedIn*
(**Reset its position** puts it back in the bottom-right corner).

### Updating from LinkedIn

Click **📄 Make CV** on your profile again.
- If you haven't edited the CV, it's replaced with the new data.
- If you have, the CV page asks: **Use the new data** (your edits are replaced, email and phone are kept) or
  **Keep my edited CV**.
- **Reset to LinkedIn data** (click twice) throws away your edits.

Settings, the extracted data and your edited CV are kept in `chrome.storage.local` (the extension's own storage) and
are removed when the extension is removed.

## Limitations

- Works with LinkedIn's current (2026) profile layout and the **English** interface. If LinkedIn changes its layout,
  sections may come out empty; the console (`[resume-maker]`) shows what was missing.
- What the CV contains is what LinkedIn shows on the profile page and its "Show all" pages. Text that LinkedIn cuts
  with "…see more" is expanded first, but very long descriptions may still be shortened by LinkedIn.
- Which line under a job is its "skills" line is guessed (`… and +5 skills`, `Skills: …`); check it in edit mode.
- Profiles with several roles at one company haven't been tested.
- The profile photo link from LinkedIn expires after a while; if the photo disappears, make the CV again.
- Use it on your own profile. Reading many profiles automatically is against LinkedIn's terms; the extension only
  reads the page you have open, when you click the button.

## Publishing (Chrome Web Store)

Everything for the store is in `store/` and `docs/`; the steps are in [`store/CHECKLIST.md`](store/CHECKLIST.md).

```bash
python3 scripts/build.py      # → dist/resume-maker-for-linkedin-<version>.zip (upload this)
scripts/screenshots.sh        # → store/screenshots/*.png, store/promo-440x280.png
```

Privacy policy: [docs/privacy.html](docs/privacy.html) (published with GitHub Pages from `docs/`).

## Project layout

```
manifest.json        Manifest V3; permission: storage
resume.html          the CV page (extension page)
src/extract.js       reads the LinkedIn profile page → JSON (content script)
src/content.js       the "📄 Make CV" button (content script)
src/floating-button.js  draggable button with × (position/hidden kept in chrome.storage.local)
src/content.css
src/model.js         LinkedIn JSON → resume model; settings defaults (pure, tested in Node)
src/resume.js        renders and edits the CV, settings panel, print
src/resume.css       templates, edit mode, print rules
src/background.js    toolbar icon → opens the CV page
icons/               icon.svg (48 px and up), icon-small.svg (16/32 px), render.py → icon16/32/48/128.png
scripts/build.py     store upload package (dist/…zip)
scripts/screenshots.sh  store images with headless Chromium
store/               listing.md (what goes where), fields/ (one text file per store field), CHECKLIST.md, images
docs/                GitHub Pages: landing page and privacy policy
test/model.test.js   unit tests for src/model.js
test/harness.html    the real resume.html with a made-up profile and a stand-in for chrome.storage
test/fixture.js      that made-up profile
```

## Development

```bash
node --test test/*.test.js           # unit tests (Node 18+)
python3 -m http.server 8766          # then open:
# http://127.0.0.1:8766/test/harness.html?reset            fresh made-up profile
# http://127.0.0.1:8766/test/harness.html?reset&newdata    edited CV + newer LinkedIn data (update banner)
# http://127.0.0.1:8766/test/button-harness.html?reset     the Make CV button: drag, click, ×
```

In the harness `window.print()` only counts calls (`window.__printCalls`) so no dialog opens.
Icons: edit `icons/icon.svg` / `icons/icon-small.svg`, then `python3 icons/render.py` (needs `cairosvg`).

After changing the extension: ↻ on its card in `chrome://extensions`, then reload the LinkedIn tab.

`src/extract.js` comes from the `linkedin-profile-json` proof of concept, where it was tested on two real profiles.

## License

[MIT](LICENSE)
