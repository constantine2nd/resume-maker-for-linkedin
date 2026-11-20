# Publishing checklist – Chrome Web Store

What's prepared in this repo, and the steps only you can do (account, payment, submit).

## Prepared

- [x] Package: `python3 scripts/build.py` → `dist/resume-maker-for-linkedin-<version>.zip` (checks that every file the
      manifest and `resume.html` use is inside)
- [x] Listing texts, one file per field: `store/fields/`; what goes where: `store/listing.md`
- [x] Privacy policy page: `docs/privacy.html` (→ https://constantine2nd.github.io/resume-maker-for-linkedin/privacy.html
      once GitHub Pages is on), landing page `docs/index.html`
- [x] Images: `icons/icon128.png`, `store/screenshots/1-classic.png`, `2-sidebar.png`, `3-edit.png` (1280×800),
      `store/promo-440x280.png`; re-render with `scripts/screenshots.sh`

## Before submitting

- [ ] **GitHub Pages on** (repo → Settings → Pages → *Deploy from a branch* → `main` / `docs`), then open the
      privacy URL above and check it loads
- [ ] **Test the package itself**: unzip `dist/…zip` into an empty folder → `chrome://extensions` → Load unpacked →
      make a CV from your profile, print to PDF
- [ ] Version in `manifest.json` is the one you want (now `1.0.1`; every later upload needs a higher number)

## In the Chrome Web Store

1. [x] Register: https://chrome.google.com/webstore/devconsole → sign in with the Google account that should own the
       extension → accept the developer agreement → pay the one-time **US$5** fee.
       Use a dedicated account if you prefer; its name/email can be shown publicly as the publisher.
2. [x] Account tab: publisher display name, contact email, **verify the email** (required before publishing).
3. [x] **New item** → upload `dist/resume-maker-for-linkedin-1.0.0.zip`.
4. [x] **Store listing** tab: description, category, language, icon, screenshots, promo tile, homepage and support
       URLs – see `store/listing.md` (texts in `store/fields/`).
5. [x] **Privacy** tab: single purpose, permission justifications, "no remote code", data-usage ticks and the three
       certifications, privacy policy URL – see `store/listing.md` (texts in `store/fields/`).
6. [x] **Distribution** tab: Public (or Unlisted first), all regions, free.
7. [x] **Submit for review.** Usually a few days; you get an email. If it's rejected, the email names the policy –
       the usual fixes are listing wording or a permission justification.
8. [x] After approval: put the store link on `docs/index.html` (the *Install* button) and in `README.md`.

## Later updates

1. Raise `version` in `manifest.json` (e.g. `1.0.1`).
2. `python3 scripts/build.py` → upload the new zip under *Package* → submit. Installed copies update automatically.
