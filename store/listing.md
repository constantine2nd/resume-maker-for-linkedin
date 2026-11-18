# Chrome Web Store listing – Resume Maker for LinkedIn

Each text field has its own file in [`fields/`](fields/): open it, select all, copy, paste. The files contain only
the text for that field. Choices that are not text (drop-downs, checkboxes) are listed here.

## Store listing tab

| Field | Paste / choose |
|---|---|
| Name, Summary | come from `manifest.json` automatically (summary: 128 of 132 characters) |
| Description | [`fields/store-listing-description.txt`](fields/store-listing-description.txt) |
| Category | Productivity → Workflow & Planning ("Tools" also fits) |
| Language | English |
| Store icon (128×128) | `icons/icon128.png` |
| Screenshots (1280×800) | `store/screenshots/1-classic.png`, `2-sidebar.png`, `3-edit.png` |
| Small promo tile (440×280) | `store/promo-440x280.png` |
| Marquee (1400×560) | optional, not made |
| Official URL | **None** (only lists sites verified in Google Search Console) |
| Homepage URL | [`fields/store-listing-homepage-url.txt`](fields/store-listing-homepage-url.txt) |
| Support URL | [`fields/store-listing-support-url.txt`](fields/store-listing-support-url.txt) |

## Privacy practices tab

| Field | Paste / choose |
|---|---|
| Single purpose description | [`fields/privacy-single-purpose.txt`](fields/privacy-single-purpose.txt) |
| Justification: storage | [`fields/privacy-justification-storage.txt`](fields/privacy-justification-storage.txt) |
| Justification: host permission | [`fields/privacy-justification-host-permission.txt`](fields/privacy-justification-host-permission.txt) |
| Remote code | **No, I am not using remote code** (all JavaScript is in the package) |
| Data usage: types | tick **Personally identifiable information** and **Website content**; leave the rest unticked |
| Data usage: certifications | tick all three (no selling/transfer, no unrelated use, no creditworthiness/lending) |
| Privacy policy URL | [`fields/privacy-policy-url.txt`](fields/privacy-policy-url.txt) |

Why those two data types: the extension handles the user's name and location (and email/phone if they type them in)
and the text of the profile page. It keeps them only on the user's device and never transmits them; ticking what it
handles is the safe choice, and the privacy policy explains that nothing leaves the browser.

## Distribution tab

| Field | Choose |
|---|---|
| Visibility | Public (or Unlisted to share only by link first) |
| Regions | All regions |
| Pricing | Free |

## Test instructions (optional, for the reviewer)

[`fields/test-instructions.txt`](fields/test-instructions.txt)

## Account (Settings page, once)

- Trader / non-trader (EEA): non-trader for a free personal open-source project; trader if published for a business or paid.
- Contact email: enter, save, and click the link in Google's verification email.
