// Resume model: turns the extracted LinkedIn JSON into the fields a CV needs.
// Pure functions (no DOM, no chrome.*), shared by the resume page and the Node tests.
(function (root) {
  const SECTIONS = ['summary', 'experience', 'education', 'certifications', 'projects', 'skills', 'languages', 'courses'];

  const DEFAULT_SETTINGS = {
    template: 'classic', // 'classic' (one column) | 'sidebar' (two columns)
    accent: '#0a66c2',
    paper: 'A4', // 'A4' | 'Letter'
    showPhoto: true,
    showDurations: false,
    showJobSkills: true,
    sections: { summary: true, experience: true, education: true, certifications: true, projects: true, skills: true, languages: true, courses: false },
  };

  // lines that are LinkedIn UI or leftovers, not CV content
  const NOISE = /^(present|show all.*|show credential|see more|…\s*more|\d+\s+endorsements?|endorsed by .*)$/i;
  // "PSD2, Software Architecture and +5 skills" / "Skills: Java · Scala"
  const SKILLS_LINE = /(\band \+\d+ skills?$|^skills?:)/i;

  const clean = (s) => (s == null ? '' : String(s).replace(/\s+/g, ' ').trim());

  function splitDetails(lines) {
    const description = [];
    let skills = '';
    for (const raw of lines || []) {
      const line = clean(raw);
      if (!line || NOISE.test(line)) continue;
      if (SKILLS_LINE.test(line)) skills = line.replace(/^skills?:\s*/i, '');
      else description.push(line);
    }
    return { description, skills };
  }

  function experienceItem(e) {
    const { description, skills } = splitDetails(e.details);
    return {
      title: clean(e.title),
      company: clean(e.company),
      employmentType: clean(e.employmentType),
      start: clean(e.start),
      end: clean(e.end),
      duration: clean(e.duration),
      location: clean(e.location),
      description,
      skills,
    };
  }

  function educationItem(e) {
    const { description } = splitDetails(e.details);
    return { school: clean(e.school), degree: clean(e.degree), start: clean(e.start), end: clean(e.end), description };
  }

  function projectItem(p) {
    const { description, skills } = splitDetails(p.details);
    return { name: clean(p.name), start: clean(p.start), end: clean(p.end), description, skills };
  }

  const certificationItem = (c) => ({ name: clean(c.name), issuer: clean(c.issuer), issued: clean(c.issued), credentialId: clean(c.credentialId) });
  const courseItem = (c) => ({ name: clean(c.name), number: clean(c.number) });
  const languageItem = (l) => ({ name: clean(l.name), proficiency: clean(l.proficiency) });

  // previous: the resume being replaced; fields LinkedIn never provides (email, phone) are carried over
  function buildResume(extracted, previous) {
    const p = extracted?.profile || {};
    const keep = previous?.basics || {};
    return {
      basedOn: extracted?.source?.capturedAt || null,
      edited: false,
      source: { url: extracted?.source?.url || '', capturedAt: extracted?.source?.capturedAt || null },
      basics: {
        name: clean(p.name),
        headline: clean(p.headline),
        location: clean(p.location),
        email: keep.email || '',
        phone: keep.phone || '',
        website: clean(p.website),
        linkedin: (extracted?.source?.url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
        photoUrl: p.photoUrl || '',
        summary: (extracted?.about || '').trim(),
      },
      experience: (extracted?.experience || []).map(experienceItem),
      education: (extracted?.education || []).map(educationItem),
      certifications: (extracted?.certifications || []).map(certificationItem),
      projects: (extracted?.projects || []).map(projectItem),
      skills: (extracted?.skills || []).map((s) => clean(s.name)).filter(Boolean),
      languages: (extracted?.languages || []).map(languageItem),
      courses: (extracted?.courses || []).map(courseItem),
    };
  }

  // "May 2017", "Present" → "May 2017 – Present"; with duration when asked
  function dateRange(item, withDuration) {
    const range = item.start && item.end ? `${item.start} – ${item.end}` : item.start || item.end || '';
    return withDuration && item.duration ? `${range} · ${item.duration}` : range;
  }

  // settings saved by an older version may miss newer keys
  function withDefaults(settings) {
    const s = settings || {};
    return { ...DEFAULT_SETTINGS, ...s, sections: { ...DEFAULT_SETTINGS.sections, ...(s.sections || {}) } };
  }

  const api = { SECTIONS, DEFAULT_SETTINGS, buildResume, splitDetails, dateRange, withDefaults };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.L2RModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
