// LinkedIn profile extraction (from the linkedin-profile-json PoC, tested on LinkedIn's 2026 "SDUI" layout).
// Reads the profile page you are viewing, loads "Show all" lists from the details pages in a hidden iframe,
// and returns plain JSON. Runs only on a user click; nothing is sent anywhere.
(() => {
  const CARD_PREFIX = 'com.linkedin.sdui.profile.card';
  // id suffix of the card → key in the output JSON
  const KNOWN_CARDS = {
    About: 'about',
    ExperienceTopLevelSection: 'experience',
    EducationTopLevelSection: 'education',
    Projects: 'projects',
    Skills: 'skills',
    LanguageTopLevel: 'languages',
    CertificationTopLevel: 'certifications',
    CourseTopLevelSection: 'courses',
    RecommendationsTopLevel: 'recommendations',
  };
  // cards that are UI noise, not profile data
  const IGNORED_CARDS = /(Topcard|SuggestedForYou|SalesInsightsOrHighlights|Activity|SupportedLocales|Services|Featured|ConnectedAccountsTopLevel)$/;
  const DATE_RE = /\b(19|20)\d{2}\b|\bPresent\b/;

  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isProfileUrl = () => /^\/in\/[^/]+\/?$/.test(location.pathname);
  const isDetailsUrl = () => /^\/in\/[^/]+\/details\/[^/]+\/?$/.test(location.pathname);

  // ---------- DOM helpers ----------

  function linesOf(el) {
    const out = [];
    if (!el) return out;
    el.querySelectorAll('p').forEach((p) => {
      if (p.parentElement.closest('p')) return;
      const t = clean(p.innerText);
      if (t && out[out.length - 1] !== t) out.push(t);
    });
    return out;
  }

  function allCards() {
    return [...document.querySelectorAll(`[id^="${CARD_PREFIX}"]`)];
  }

  // card ids look like "<prefix>ref<random>ExperienceTopLevelSection": match on the known ending
  const isIgnored = (card) => IGNORED_CARDS.test(card.id);
  function knownKey(card) {
    const hit = Object.keys(KNOWN_CARDS).find((suffix) => card.id.endsWith(suffix));
    return hit ? KNOWN_CARDS[hit] : null;
  }

  function cardBySuffix(suffix) {
    return allCards().find((c) => c.id.endsWith(suffix));
  }

  const textKids = (el) => [...el.children].filter((k) => k.tagName === 'P' || k.querySelector('p'));
  const kidLines = (k) => (k.tagName === 'P' ? [clean(k.innerText)].filter(Boolean) : linesOf(k));

  // Split a card into items without relying on class names: go down while one child holds all the text,
  // and at the first level where the text splits, each child is one item.
  // skipHeading (details pages): a "1-line heading + list" level is skipped by going into the list.
  function splitItems(root, skipHeading = false) {
    let el = root;
    for (let depth = 0; depth < 60; depth++) {
      const kids = textKids(el);
      if (kids.length === 1 && kids[0].tagName !== 'P') {
        el = kids[0];
        continue;
      }
      const lines = kids.map(kidLines);
      if (kids.length > 1) {
        const sizes = lines.map((l) => l.length);
        const big = sizes.indexOf(Math.max(...sizes));
        const others = sizes.reduce((a, b) => a + b, 0) - sizes[big];
        if (skipHeading && others <= 1 && kids[big].tagName !== 'P' && sizes[big] >= 2) {
          const inner = splitItems(kids[big], true);
          if (inner.length >= 2) return inner;
        }
      }
      return lines.filter((l) => l.length);
    }
    return [];
  }

  // Main-page cards: use the per-item div[componentkey] blocks when they hold all of the card's text
  // (this also keeps a single-item section as one item); otherwise split by structure.
  function itemsOf(root) {
    const sec = root.querySelector('section') || root;
    const blocks = [...sec.querySelectorAll('div[componentkey]')]
      .filter((d) => {
        const a = d.parentElement.closest('div[componentkey]');
        return !a || !sec.contains(a);
      })
      .map(linesOf)
      .filter((lines) => lines.length);
    const covered = blocks.reduce((n, l) => n + l.length, 0);
    if (blocks.length && covered === linesOf(sec).length) return blocks;
    return splitItems(sec);
  }

  // "Skills 26" → { title: "Skills", count: 26 }
  function headingOf(card) {
    const raw = clean(card.querySelector('h2')?.innerText);
    const m = raw.match(/(\d+)\)?\s*$/);
    return { raw, title: clean(raw.replace(/\(?\s*\d+\s*\)?\s*$/, '')), count: m ? +m[1] : null };
  }

  // only the section's own "Show all" link, not the per-item links
  function showAllUrl(card) {
    const a = [...card.querySelectorAll('a')].find((x) => /^show all/i.test(clean(x.innerText)));
    return a ? a.href.split('?')[0] : null;
  }

  // ---------- parsers (heuristics on the visible lines) ----------

  function splitDot(s) {
    return (s || '').split(' · ').map(clean).filter(Boolean);
  }

  function parseDates(line) {
    const [range, duration] = splitDot(line);
    const [start, end] = (range || '').split(/\s[-–]\s/).map(clean);
    return { start: start || null, end: end || null, duration: duration || null };
  }

  function parseExperience(lines) {
    const di = lines.findIndex((l, i) => i > 0 && DATE_RE.test(l) && /[-–]/.test(l));
    const [company, employmentType] = splitDot(lines[1]);
    const after = di >= 0 ? lines.slice(di + 1) : lines.slice(2);
    // a short line with a comma, right after the dates, is usually the location
    let location = null;
    if (after[0] && after[0].length < 80 && /,/.test(after[0]) && !/\.$/.test(after[0])) location = after.shift();
    return {
      title: lines[0] || null,
      company: company || null,
      employmentType: employmentType || null,
      ...(di >= 0 ? parseDates(lines[di]) : { start: null, end: null, duration: null }),
      location,
      details: after,
      raw: lines,
    };
  }

  function parseEducation(lines) {
    const di = lines.findIndex((l, i) => i > 0 && DATE_RE.test(l));
    return {
      school: lines[0] || null,
      degree: di === 1 ? null : lines[1] || null,
      ...(di >= 0 ? parseDates(lines[di]) : { start: null, end: null, duration: null }),
      details: di >= 0 ? lines.slice(di + 1) : lines.slice(2),
      raw: lines,
    };
  }

  function parseProject(lines) {
    const di = lines.findIndex((l, i) => i > 0 && DATE_RE.test(l));
    return {
      name: lines[0] || null,
      ...(di >= 0 ? parseDates(lines[di]) : { start: null, end: null }),
      details: lines.slice(di >= 0 ? di + 1 : 1),
      raw: lines,
    };
  }

  function parseCertification(lines) {
    const find = (re) => lines.find((l) => re.test(l)) || null;
    const issued = find(/^Issued\b/);
    const credential = find(/^Credential ID\b/);
    return {
      name: lines[0] || null,
      issuer: lines[1] && lines[1] !== issued ? lines[1] : null,
      issued: issued ? issued.replace(/^Issued\s*/, '') : null,
      credentialId: credential ? credential.replace(/^Credential ID\s*/, '') : null,
      details: lines.slice(2).filter((l) => l !== issued && l !== credential),
      raw: lines,
    };
  }

  const parseCourse = (lines) => ({ name: lines[0] || null, number: lines[1] && !/^Associated with/.test(lines[1]) ? lines[1] : null, details: lines.slice(1), raw: lines });
  const parseSkill = (lines) => ({ name: lines[0], context: lines.slice(1) });
  const parseLanguage = (lines) => ({ name: lines[0], proficiency: lines[1] || null });
  const parseGeneric = (lines) => ({ title: lines[0], lines: lines.slice(1) });

  const PARSERS = {
    experience: parseExperience,
    education: parseEducation,
    projects: parseProject,
    skills: parseSkill,
    languages: parseLanguage,
    certifications: parseCertification,
    courses: parseCourse,
  };

  function parseTopCard(card) {
    const lines = linesOf(card);
    const find = (re) => lines.find((l) => re.test(l)) || null;
    const ci = lines.indexOf('Contact info');
    const beforeContact = (ci >= 0 ? lines.slice(0, ci) : lines.slice(0, 3)).filter((l) => l !== '·');
    // profile photo = the largest square picture; the first image is the wide cover photo, small squares are logos
    const img = [...card.querySelectorAll('img')]
      .filter((i) => i.src && !/^data:/.test(i.src) && !/cover/i.test(i.alt || ''))
      .map((i) => ({ i, r: i.getBoundingClientRect() }))
      .filter(({ r }) => r.width >= 64 && Math.abs(r.width - r.height) <= 4)
      .sort((a, b) => b.r.width - a.r.width)[0]?.i;
    return {
      name: headingOf(card).raw || clean(document.title.split('|')[0]),
      headline: beforeContact[0] || null,
      currentOrgs: beforeContact.length > 2 ? splitDot(beforeContact[1]) : [],
      location: beforeContact.length > 1 ? beforeContact[beforeContact.length - 1] : null,
      website: find(/^https?:\/\//),
      connections: find(/\bconnections?\b/),
      followers: find(/\bfollowers?\b/),
      openTo: find(/^Open to/),
      photoUrl: img ? img.src : null,
      raw: lines,
    };
  }

  // ---------- page preparation ----------

  // The page doesn't scroll the window: it scrolls inside <main> (2026 layout).
  // Pick the tallest scrollable element and fall back to the window.
  function findScroller() {
    const candidates = [document.querySelector('main'), ...document.querySelectorAll('main *, body > *')]
      .filter((e) => e && e.scrollHeight > e.clientHeight + 100 && /(auto|scroll)/.test(getComputedStyle(e).overflowY));
    candidates.sort((a, b) => b.scrollHeight - a.scrollHeight);
    return candidates[0] || document.scrollingElement;
  }

  // LinkedIn renders lower sections only after they scroll into view
  async function loadLazySections(onProgress) {
    const scroller = findScroller();
    const start = scroller.scrollTop;
    let lastCount = -1;
    let stable = 0;
    for (let i = 0; i < 60 && stable < 3; i++) {
      scroller.scrollTop += 700;
      await sleep(400);
      const count = allCards().length + document.querySelectorAll('main h2').length;
      const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 5;
      stable = count === lastCount && atBottom ? stable + 1 : 0;
      lastCount = count;
      onProgress?.(i);
    }
    scroller.scrollTop = start;
  }

  // Only inside profile-data cards: "…more" on an Activity post opens the post and leaves the profile.
  // Only <button>s: a link would navigate away.
  function expandSeeMore() {
    for (const card of allCards()) {
      if (isIgnored(card)) continue;
      card.querySelectorAll('button').forEach((b) => {
        if (b.closest('a')) return;
        if (/^(…\s*)?see more$|^…\s*more$/i.test(clean(b.innerText))) b.click();
      });
    }
  }

  // ---------- extraction ----------

  function extractProfilePage() {
    const warnings = [];
    const sections = {};
    const truncated = [];

    const top = cardBySuffix('Topcard');
    if (!top) warnings.push('Top card not found: the LinkedIn layout may have changed.');

    for (const card of allCards()) {
      if (isIgnored(card)) continue;
      const h = headingOf(card);
      if (!h.raw) continue;
      const heading = h.title;
      const key = knownKey(card) || heading.toLowerCase().replace(/[^\p{L}0-9]+/gu, '_').replace(/^_|_$/g, '');

      if (key === 'about') {
        sections.about = linesOf(card).filter((l) => l !== h.raw && l !== heading).join('\n');
        continue;
      }
      let items = itemsOf(card).filter((l) => !(l.length === 1 && (l[0] === h.raw || l[0] === heading)));
      if (!items.length) {
        const lines = linesOf(card).filter((l) => l !== h.raw && l !== heading);
        if (lines.length) items = [lines];
      }
      // Languages can come as flat "name, proficiency, name, proficiency…" lines
      if (key === 'languages' && items.every((l) => l.length === 1)) {
        const lines = items.flat();
        items = [];
        for (let i = 0; i < lines.length; i += /proficiency/i.test(lines[i + 1] || '') ? 2 : 1) {
          items.push(/proficiency/i.test(lines[i + 1] || '') ? lines.slice(i, i + 2) : [lines[i]]);
        }
      }
      const parse = PARSERS[key] || parseGeneric;
      sections[key] = items.map(parse);

      const more = showAllUrl(card);
      if (more) truncated.push({ section: key, shown: items.length, total: h.count, detailsUrl: more });
    }

    for (const k of ['experience', 'education', 'skills']) {
      if (!sections[k]) warnings.push(`Section "${k}" not found (missing on the profile, or not loaded yet).`);
    }

    return {
      schemaVersion: 1,
      source: { url: location.href.split('?')[0], pageType: 'profile', capturedAt: new Date().toISOString() },
      profile: top ? parseTopCard(top) : null,
      ...sections,
      meta: { truncatedSections: truncated, warnings },
    };
  }

  // ---------- details pages (/in/<id>/details/<section>/) ----------
  // The list sits in one card whose id ends with "Details" (SkillDetails, ProjectsDetails, …).
  // Items load in chunks of 10 as the last one scrolls into view.

  // id ends with SkillDetails, KmsExperienceDetailsSection, KmsCertificationDetailsLevel, …
  const detailsCardIn = (doc) => doc.querySelector(`[id^="${CARD_PREFIX}"][id*="Details"]`);

  // innermost div[componentkey] blocks that contain text: one per item
  function detailLeaves(card) {
    const withText = [...card.querySelectorAll('div[componentkey]')].filter((d) => d.querySelector('p'));
    return withText.filter((d) => !withText.some((x) => x !== d && d.contains(x)));
  }

  // Two layouts: per-item div[componentkey] blocks (loaded in chunks of 10), or plain nested divs.
  // For the first, grow each leaf up to the largest container holding no other item (keeps descriptions).
  function detailItems(card, section) {
    const leaves = detailLeaves(card);
    if (leaves.length < 2) {
      const word = (section || '').toLowerCase().replace(/s$/, '').slice(0, 6);
      return splitItems(card, true).filter((l) => !(l.length === 1 && word && l[0].toLowerCase().includes(word)));
    }
    return leaves
      .map((leaf) => {
        let el = leaf;
        while (el.parentElement && el.parentElement !== card && !leaves.some((o) => o !== leaf && el.parentElement.contains(o))) {
          el = el.parentElement;
        }
        return linesOf(el);
      })
      .filter((lines) => lines.length);
  }

  // scroll a details page until all items are there (or nothing new arrives)
  async function loadAllDetailItems(doc, expectedTotal, onCount) {
    let last = -1;
    let stable = 0;
    const started = Date.now();
    while (Date.now() - started < 30000) {
      const card = detailsCardIn(doc);
      if (!card) {
        if (Date.now() - started > 8000) return; // not a details layout we know
        await sleep(250);
        continue;
      }
      const leaves = detailLeaves(card);
      const n = Math.max(leaves.length, leaves.length < 2 ? detailItems(card).length : 0);
      onCount?.(n);
      if (expectedTotal && n >= expectedTotal) break;
      // the card often renders empty first: an empty list is never "done" (up to 15 s)
      if (n === 0 && Date.now() - started < 15000) {
        await sleep(500);
        continue;
      }
      stable = n === last ? stable + 1 : 0;
      if (stable >= 6) break; // ~5 s without new items
      last = n;
      leaves[leaves.length - 1]?.scrollIntoView({ block: 'end' });
      const main = doc.querySelector('main');
      if (main) main.scrollTop += 400;
      await sleep(800);
    }
  }

  // load a details page in a hidden same-origin iframe and read its items
  async function fetchDetailsSection(url, expectedTotal, onCount) {
    const scroller = findScroller();
    const keepTop = scroller.scrollTop;
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;height:900px;border:0;visibility:hidden;';
    frame.setAttribute('aria-hidden', 'true');
    const loaded = new Promise((resolve, reject) => {
      frame.onload = resolve;
      setTimeout(() => reject(new Error('details page did not load in 20 s')), 20000);
    });
    frame.src = url;
    document.body.appendChild(frame);
    try {
      await loaded;
      await loadAllDetailItems(frame.contentDocument, expectedTotal, onCount);
      const card = detailsCardIn(frame.contentDocument);
      if (!card) throw new Error('no "…Details" card on the page');
      return detailItems(card, new URL(url).pathname.split('/').filter(Boolean)[3]);
    } finally {
      frame.remove();
      scroller.scrollTop = keepTop; // scrollIntoView in the frame may move the page
    }
  }

  // replace the truncated main-page lists with the full ones from the details pages
  async function completeTruncatedSections(data, onProgress) {
    const meta = data.meta;
    meta.detailsLoaded = [];
    for (const t of meta.truncatedSections) {
      try {
        const items = await fetchDetailsSection(t.detailsUrl, t.total, (n) =>
          onProgress?.(`Loading ${t.section}… ${n}${t.total ? '/' + t.total : ''}`),
        );
        const parse = PARSERS[t.section] || parseGeneric;
        const result = { section: t.section, shownOnProfile: t.shown, loaded: items.length, total: t.total };
        // keep the main-page items if the details page gave us fewer (layout surprise)
        if (items.length >= t.shown) {
          data[t.section] = items.map(parse);
          result.complete = t.total ? items.length >= t.total : null;
        } else {
          result.complete = false;
          meta.warnings.push(`Details page for "${t.section}" returned fewer items than the profile; kept the profile items.`);
        }
        if (t.total && items.length < t.total) {
          meta.warnings.push(`"${t.section}": loaded ${items.length} of ${t.total}.`);
        }
        meta.detailsLoaded.push(result);
      } catch (err) {
        console.error('[LPJ]', t.section, err);
        meta.warnings.push(`Could not load the details page for "${t.section}": ${err.message}`);
      }
    }
  }

  // when you open a details page yourself and click the button
  async function extractDetailsPage(onProgress) {
    const section = location.pathname.split('/').filter(Boolean)[3];
    const key = section;
    const parse = PARSERS[key] || parseGeneric;
    await loadAllDetailItems(document, null, (n) => onProgress?.(`Loading ${key}… ${n}`));
    const card = detailsCardIn(document);
    const items = card ? detailItems(card, section) : itemsOf(document.querySelector('main') || document.body);
    return {
      schemaVersion: 1,
      source: { url: location.href.split('?')[0], pageType: 'details', section: key, capturedAt: new Date().toISOString() },
      [key]: items.map(parse),
      meta: { warnings: items.length ? [] : ['No items found on this details page.'] },
    };
  }

  async function extract(onProgress) {
    if (isDetailsUrl()) return extractDetailsPage(onProgress);
    await loadLazySections((i) => onProgress?.(`Loading sections… ${i + 1}`));
    expandSeeMore();
    await sleep(400);
    const data = extractProfilePage();
    await completeTruncatedSections(data, onProgress);
    return data;
  }

  window.L2RExtract = { extract, isProfileUrl, isDetailsUrl };
})();
