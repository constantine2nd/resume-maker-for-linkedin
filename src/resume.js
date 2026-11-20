// Resume page: renders the CV from chrome.storage.local, lets you edit text and settings, prints to PDF.
(async () => {
  const { buildResume, dateRange, withDefaults, SECTIONS } = window.L2RModel;
  const KEYS = { extracted: 'l2r:extracted', resume: 'l2r:resume', settings: 'l2r:settings', button: 'l2r:button' };
  const SECTION_TITLES = {
    summary: 'Summary',
    experience: 'Experience',
    education: 'Education',
    certifications: 'Certifications',
    projects: 'Projects',
    skills: 'Skills',
    languages: 'Languages',
    courses: 'Courses',
  };

  const $ = (id) => document.getElementById(id);
  const cv = $('cv');
  let resume = null;
  let extracted = null;
  let settings = null;
  let editing = false;

  // ---------- storage ----------

  const stored = await chrome.storage.local.get([KEYS.extracted, KEYS.resume, KEYS.settings]);
  extracted = stored[KEYS.extracted] || null;
  resume = stored[KEYS.resume] || null;
  settings = withDefaults(stored[KEYS.settings]);

  let saveTimer = null;
  function saveResume() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => chrome.storage.local.set({ [KEYS.resume]: resume }), 300);
  }
  const saveSettings = () => chrome.storage.local.set({ [KEYS.settings]: settings });

  // ---------- DOM helpers (text always via textContent) ----------

  function el(tag, cls, ...children) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    for (const c of children) if (c != null && c !== false) e.append(c);
    return e;
  }

  // a text bound to obj[key]: editable in edit mode, hidden when empty outside edit mode
  function field(tag, cls, obj, key, placeholder) {
    const value = obj[key] ?? '';
    if (!editing && !String(value).trim()) return null;
    const e = el(tag, `${cls || ''} f`.trim());
    e.textContent = value;
    if (editing) {
      e.contentEditable = 'plaintext-only';
      e.spellcheck = true;
      e.dataset.placeholder = placeholder || '';
      e.addEventListener('input', () => {
        obj[key] = e.innerText.replace(/ /g, ' ');
        resume.edited = true;
        saveResume();
      });
      e.addEventListener('blur', () => {
        obj[key] = e.innerText.trim();
        saveResume();
      });
    }
    return e;
  }

  // "×" in edit mode: remove an entry from its list
  function removable(node, list, index) {
    if (!editing) return node;
    const x = el('button', 'remove');
    x.textContent = '×';
    x.title = 'Remove from the CV';
    x.addEventListener('click', () => {
      list.splice(index, 1);
      resume.edited = true;
      saveResume();
      render();
    });
    node.prepend(x);
    return node;
  }

  const joinNodes = (nodes, sep = ' · ') => {
    const out = [];
    nodes.filter(Boolean).forEach((n, i) => {
      if (i) out.push(el('span', 'sep', sep));
      out.push(n);
    });
    return out;
  };

  function dates(item) {
    if (editing) {
      return el('span', 'dates', field('span', '', item, 'start', 'start'), ' – ', field('span', '', item, 'end', 'end'));
    }
    const text = dateRange(item, settings.showDurations);
    return text ? el('span', 'dates', text) : null;
  }

  function lines(list) {
    return list.map((_, i) => field('p', 'desc', list, i, 'description')).filter(Boolean);
  }

  const jobSkills = (item) => (settings.showJobSkills ? field('p', 'jobskills', item, 'skills', 'skills') : null);

  // ---------- sections ----------

  const ENTRY = {
    experience: (j) => [
      el('div', 'entry-head', el('div', 'entry-title', field('span', 'title', j, 'title', 'Job title')), dates(j)),
      el('div', 'entry-sub', ...joinNodes([field('span', 'org', j, 'company', 'Company'), field('span', '', j, 'employmentType', 'type'), field('span', '', j, 'location', 'location')])),
      ...lines(j.description),
      jobSkills(j),
    ],
    education: (e) => [
      el('div', 'entry-head', el('div', 'entry-title', field('span', 'title', e, 'school', 'School')), dates(e)),
      field('div', 'entry-sub', e, 'degree', 'Degree'),
      ...lines(e.description),
    ],
    certifications: (c) => [
      el('div', 'entry-head', el('div', 'entry-title', field('span', 'title', c, 'name', 'Certificate')), field('span', 'dates', c, 'issued', 'issued')),
      el('div', 'entry-sub', ...joinNodes([field('span', 'org', c, 'issuer', 'Issuer'), field('span', 'muted', c, 'credentialId', 'credential ID')])),
    ],
    projects: (p) => [
      el('div', 'entry-head', el('div', 'entry-title', field('span', 'title', p, 'name', 'Project')), dates(p)),
      ...lines(p.description),
      jobSkills(p),
    ],
    courses: (c) => [el('div', 'entry-head', el('div', 'entry-title', field('span', 'title', c, 'name', 'Course')), field('span', 'dates', c, 'number', 'number'))],
  };

  function section(name, ...content) {
    const s = el('section', `cv-section s-${name}`, el('h2', '', SECTION_TITLES[name]));
    s.append(...content.filter(Boolean));
    return s;
  }

  function renderSection(name) {
    if (!settings.sections[name]) return null;
    if (name === 'summary') {
      const p = field('p', 'summary', resume.basics, 'summary', 'A few sentences about you');
      return p ? section(name, p) : null;
    }
    const list = resume[name] || [];
    if (!list.length) return null;
    if (name === 'skills') {
      const tags = list.map((_, i) => field('span', 'tag', list, i, 'skill')).filter(Boolean);
      return section(name, el('div', 'tags', ...tags.map((t, i) => removable(el('span', 'tag-wrap', t), list, i))));
    }
    if (name === 'languages') {
      return section(
        name,
        ...list.map((l, i) =>
          removable(el('div', 'lang', field('span', 'title', l, 'name', 'Language'), editing || l.proficiency ? el('span', 'sep', ' — ') : null, field('span', 'muted', l, 'proficiency', 'level')), list, i),
        ),
      );
    }
    return section(name, ...list.map((item, i) => removable(el('div', 'entry', ...ENTRY[name](item).filter(Boolean)), list, i)));
  }

  function contacts(stacked) {
    const b = resume.basics;
    const items = [
      field('span', 'c-location', b, 'location', 'City, Country'),
      field('span', 'c-email', b, 'email', 'email@example.com'),
      field('span', 'c-phone', b, 'phone', '+00 000 000 000'),
      field('span', 'c-linkedin', b, 'linkedin', 'linkedin.com/in/…'),
      field('span', 'c-website', b, 'website', 'website'),
    ].filter(Boolean);
    return stacked ? el('div', 'contacts stacked', ...items.map((i) => el('div', '', i))) : el('div', 'contacts', ...joinNodes(items));
  }

  function photo() {
    if (!settings.showPhoto || !resume.basics.photoUrl) return null;
    const img = el('img', 'photo');
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.src = resume.basics.photoUrl;
    img.addEventListener('error', () => img.remove()); // LinkedIn photo links expire: make the CV again to refresh
    return img;
  }

  const SIDEBAR_LEFT = ['skills', 'languages', 'certifications'];

  function render() {
    cv.replaceChildren();
    cv.className = `cv ${settings.template}${editing ? ' editing' : ''}`;
    cv.style.setProperty('--accent', settings.accent);
    const b = resume.basics;
    const nameBlock = el('div', 'name-block', field('h1', 'name', b, 'name', 'Your name'), field('div', 'headline', b, 'headline', 'Headline'));

    if (settings.template === 'sidebar') {
      const side = el('aside', 'cv-side', photo(), contacts(true), ...SIDEBAR_LEFT.map(renderSection));
      const main = el('div', 'cv-main', el('header', 'cv-head', nameBlock), ...SECTIONS.filter((s) => !SIDEBAR_LEFT.includes(s)).map(renderSection));
      cv.append(side, main);
    } else {
      cv.append(el('header', 'cv-head', el('div', 'head-text', nameBlock, contacts(false)), photo()), ...SECTIONS.map(renderSection).filter(Boolean)); // append(null) would print "null"
    }
    document.title = `${b.name || 'CV'} - CV`; // the suggested PDF file name
    $('page-size').textContent = `@page { size: ${settings.paper}; margin: 12mm; }`;
    document.body.dataset.paper = settings.paper;
    updateDataInfo();
    updateCounts();
  }

  // ---------- panel ----------

  // item counts next to the section switches
  function updateCounts() {
    for (const name of SECTIONS) {
      const span = document.querySelector(`#sections [data-count="${name}"]`);
      if (span) span.textContent = ` ${name === 'summary' ? (resume.basics.summary ? 1 : 0) : (resume[name] || []).length}`;
    }
  }

  function updateDataInfo() {
    const when = resume.source?.capturedAt ? new Date(resume.source.capturedAt).toLocaleString() : '?';
    $('data-info').textContent = `From LinkedIn: ${when}${resume.edited ? ' · edited by you' : ''}`;
  }

  function bindPanel() {
    for (const r of document.querySelectorAll('input[name=template]')) {
      r.checked = r.value === settings.template;
      r.addEventListener('change', () => {
        settings.template = r.value;
        saveSettings();
        render();
      });
    }
    const bindValue = (id, key, prop = 'value') => {
      const input = $(id);
      input[prop] = settings[key];
      input.addEventListener(prop === 'checked' ? 'change' : 'input', () => {
        settings[key] = input[prop];
        saveSettings();
        render();
      });
    };
    bindValue('accent', 'accent');
    bindValue('paper', 'paper');
    bindValue('showPhoto', 'showPhoto', 'checked');
    bindValue('showDurations', 'showDurations', 'checked');
    bindValue('showJobSkills', 'showJobSkills', 'checked');

    const box = $('sections');
    for (const name of SECTIONS) {
      const input = el('input');
      input.type = 'checkbox';
      input.checked = settings.sections[name];
      input.addEventListener('change', () => {
        settings.sections[name] = input.checked;
        saveSettings();
        render();
      });
      const count = el('span', 'count');
      count.dataset.count = name;
      box.append(el('label', '', input, ` ${SECTION_TITLES[name]}`, count));
    }

    // the floating button on LinkedIn (src/floating-button.js reads the same key and updates live)
    const showButton = $('showButton');
    chrome.storage.local.get(KEYS.button).then((r) => (showButton.checked = !r[KEYS.button]?.hidden));
    showButton.addEventListener('change', async () => {
      const cur = (await chrome.storage.local.get(KEYS.button))[KEYS.button] || {};
      chrome.storage.local.set({ [KEYS.button]: { ...cur, hidden: !showButton.checked } });
    });
    $('resetButton').addEventListener('click', () => {
      chrome.storage.local.set({ [KEYS.button]: { right: 20, bottom: 20, hidden: false } });
      showButton.checked = true;
    });

    $('edit').addEventListener('change', (e) => {
      editing = e.target.checked;
      $('edit-hint').hidden = !editing;
      render();
    });
    $('print').addEventListener('click', () => {
      if (editing) $('edit').click(); // print the clean version
      window.print();
    });
    // two clicks: no confirm() dialog
    const reset = $('reset');
    reset.disabled = !extracted;
    reset.addEventListener('click', () => {
      if (reset.dataset.armed !== '1') {
        reset.dataset.armed = '1';
        reset.textContent = 'Click again: your edits will be lost';
        return;
      }
      reset.dataset.armed = '';
      reset.textContent = 'Reset to LinkedIn data';
      resume = buildResume(extracted, resume);
      chrome.storage.local.set({ [KEYS.resume]: resume });
      render();
    });
  }

  // new LinkedIn data while the saved CV has edits: let the user choose
  function offerUpdate() {
    const banner = $('banner');
    const use = el('button', 'primary', 'Use the new data');
    const keep = el('button', '', 'Keep my edited CV');
    banner.replaceChildren(
      el('span', '', `New LinkedIn data (${new Date(extracted.source.capturedAt).toLocaleString()}). Your CV has edits that would be replaced (email and phone are kept).`),
      use,
      keep,
    );
    banner.hidden = false;
    use.addEventListener('click', () => {
      resume = buildResume(extracted, resume);
      chrome.storage.local.set({ [KEYS.resume]: resume });
      banner.hidden = true;
      render();
    });
    keep.addEventListener('click', () => {
      resume.basedOn = extracted.source.capturedAt; // don't ask again for this extraction
      saveResume();
      banner.hidden = true;
    });
  }

  // ---------- start ----------

  if (!resume && !extracted) {
    document.body.classList.add('empty');
    cv.replaceChildren(
      el('div', 'empty-state', el('h1', '', 'No CV yet'), el('p', '', 'Open your LinkedIn profile (linkedin.com/in/…) and click 📄 Make CV in the bottom-right corner.')),
    );
    return;
  }
  const isNewExtraction = extracted && resume && extracted.source?.capturedAt !== resume.basedOn;
  if (!resume || (isNewExtraction && !resume.edited)) {
    resume = buildResume(extracted, resume);
    await chrome.storage.local.set({ [KEYS.resume]: resume });
  } else if (isNewExtraction) {
    offerUpdate();
  }
  bindPanel();
  render();
})();
