// Run: node --test test/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildResume, splitDetails, dateRange, withDefaults, DEFAULT_SETTINGS } = require('../src/model.js');

const extracted = () => ({
  source: { url: 'https://www.linkedin.com/in/jane-doe/', pageType: 'profile', capturedAt: '2026-11-18T10:00:00Z' },
  profile: { name: ' Jane  Doe ', headline: 'Engineer', location: 'Berlin, Germany', website: 'https://jane.dev', photoUrl: 'https://media/x.jpg' },
  about: 'I build things.\n\nSecond paragraph.  ',
  experience: [
    {
      title: 'Lead Developer',
      company: 'Acme',
      employmentType: 'Full-time',
      start: 'May 2017',
      end: 'Present',
      duration: '9 yrs 7 mos',
      location: null,
      details: ['Present', 'Led the API platform.', 'PSD2, Software Architecture and +5 skills'],
    },
  ],
  education: [{ school: 'Uni X', degree: 'MSc, CS', start: '1996', end: '2004', details: [] }],
  projects: [{ name: 'MCP server', start: 'Sep 2026', end: 'Present', details: ['One process, many tenants.', 'Skills: Node.js · MCP'] }],
  skills: [{ name: 'Java', context: ['Lead Developer at Acme'] }, { name: 'Scala', context: [] }],
  languages: [{ name: 'English', proficiency: 'Full professional proficiency' }],
  certifications: [{ name: 'Cert A', issuer: 'Org', issued: 'Aug 2026', credentialId: 'X1', details: [] }],
  courses: [{ name: 'Statistics', number: 'PW1301', details: ['PW1301', 'Associated with Uni X'] }],
  recommendations: [{ title: 'Someone', lines: ['Great'] }],
});

test('basics come from the profile, LinkedIn URL is shortened', () => {
  const r = buildResume(extracted());
  assert.equal(r.basics.name, 'Jane Doe');
  assert.equal(r.basics.linkedin, 'linkedin.com/in/jane-doe');
  assert.equal(r.basics.summary, 'I build things.\n\nSecond paragraph.');
  assert.equal(r.basics.email, '');
  assert.equal(r.basedOn, '2026-11-18T10:00:00Z');
  assert.equal(r.edited, false);
});

test('job details: noise dropped, skills line separated', () => {
  const [job] = buildResume(extracted()).experience;
  assert.deepEqual(job.description, ['Led the API platform.']);
  assert.equal(job.skills, 'PSD2, Software Architecture and +5 skills');
  assert.equal(job.location, '');
});

test('"Skills:" prefix is removed from project skills', () => {
  const [proj] = buildResume(extracted()).projects;
  assert.deepEqual(proj.description, ['One process, many tenants.']);
  assert.equal(proj.skills, 'Node.js · MCP');
});

test('skills become plain names; recommendations are not part of a CV', () => {
  const r = buildResume(extracted());
  assert.deepEqual(r.skills, ['Java', 'Scala']);
  assert.equal(r.recommendations, undefined);
});

test('email and phone survive a rebuild from new LinkedIn data', () => {
  const old = buildResume(extracted());
  old.basics.email = 'jane@example.com';
  old.basics.phone = '+49 123';
  const fresh = buildResume(extracted(), old);
  assert.equal(fresh.basics.email, 'jane@example.com');
  assert.equal(fresh.basics.phone, '+49 123');
});

test('missing sections give empty lists', () => {
  const r = buildResume({ source: { url: '' }, profile: { name: 'X' } });
  for (const k of ['experience', 'education', 'certifications', 'projects', 'skills', 'languages', 'courses']) assert.deepEqual(r[k], []);
});

test('splitDetails handles empty and odd input', () => {
  assert.deepEqual(splitDetails(undefined), { description: [], skills: '' });
  assert.deepEqual(splitDetails(['  ', 'Show all 8 licenses', '12 endorsements', 'Real text']), { description: ['Real text'], skills: '' });
});

test('date ranges', () => {
  assert.equal(dateRange({ start: 'May 2017', end: 'Present', duration: '9 yrs' }, false), 'May 2017 – Present');
  assert.equal(dateRange({ start: 'May 2017', end: 'Present', duration: '9 yrs' }, true), 'May 2017 – Present · 9 yrs');
  assert.equal(dateRange({ start: '2005' }, false), '2005');
  assert.equal(dateRange({}, true), '');
});

test('settings from an older version get the new defaults', () => {
  const s = withDefaults({ template: 'sidebar', sections: { courses: true } });
  assert.equal(s.template, 'sidebar');
  assert.equal(s.accent, DEFAULT_SETTINGS.accent);
  assert.equal(s.sections.courses, true);
  assert.equal(s.sections.experience, true);
});
