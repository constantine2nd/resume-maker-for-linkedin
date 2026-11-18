// A made-up profile in the shape src/extract.js produces (used by test/harness.html).
window.L2RFixture = (capturedAt = '2026-11-18T10:00:00Z') => ({
  schemaVersion: 1,
  source: { url: 'https://www.linkedin.com/in/jane-doe-example/', pageType: 'profile', capturedAt },
  profile: {
    name: 'Jane Doe',
    headline: 'Senior Software Engineer · Java, Scala & Spring Boot · API platforms · OAuth2 / OIDC',
    currentOrgs: ['Acme Banking', 'University of Example'],
    location: 'Novi Sad, Vojvodina, Serbia',
    website: 'https://jane.example.dev',
    connections: '500+ connections',
    photoUrl:
      'data:image/svg+xml,' +
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#c9d8ea"/><circle cx="50" cy="38" r="18" fill="#7f9cc0"/><rect x="20" y="62" width="60" height="40" rx="30" fill="#7f9cc0"/></svg>'),
  },
  about:
    'Software engineer and architect with 20 years of experience building banking APIs and integration platforms.\n\nI like clear contracts (OpenAPI), secure identity flows (OAuth2, OIDC) and small, well-tested services.',
  experience: [
    {
      title: 'Lead Software Developer',
      company: 'Acme Banking',
      employmentType: 'Contract',
      start: 'May 2017',
      end: 'Present',
      duration: '9 yrs 7 mos',
      location: null,
      details: [
        'Present',
        'One of two lead contributors to an open-source banking API platform (4,500+ commits). Designed the consent and OAuth2/OIDC flows used by 30+ banks.',
        'Payment Services Directive (PSD2), Software Architecture and +5 skills',
      ],
    },
    {
      title: 'Senior Software Developer',
      company: 'Example Software & Design',
      employmentType: 'Full-time',
      start: 'Nov 2012',
      end: 'May 2017',
      duration: '4 yrs 7 mos',
      location: 'Novi Sad, Vojvodina, Serbia',
      details: ['Built payment and reporting back ends in Java and Spring.'],
    },
    {
      title: 'Software Developer',
      company: 'Example Insurance a.d.o.',
      employmentType: 'Full-time',
      start: 'Apr 2006',
      end: 'Oct 2012',
      duration: '6 yrs 7 mos',
      location: 'Novi Sad, Vojvodina, Serbia',
      details: ['PL/SQL'],
    },
  ],
  education: [{ school: 'Faculty of Technical Sciences, University of Example', degree: 'Masters degree, Computer Science', start: '1996', end: '2004', details: [] }],
  certifications: [{ name: 'Certified Kubernetes Application Developer', issuer: 'CNCF', issued: 'Aug 2025', credentialId: 'ABC-123', details: [] }],
  projects: [
    { name: 'Multi-tenant MCP server', start: 'Sep 2026', end: 'Present', details: ['One Node.js process serving many tenants over the Model Context Protocol.', 'Model Context Protocol (MCP), Node.js and +3 skills'] },
    { name: 'Keycloak user storage provider', start: 'Jul 2025', end: 'Present', details: ['Open-source Keycloak SPI that reads users from a banking API.'] },
  ],
  skills: ['Java', 'Scala', 'Spring Boot', 'PostgreSQL', 'Redis', 'RabbitMQ', 'OpenAPI', 'OAuth2', 'OpenID Connect', 'Keycloak', 'Node.js', 'TypeScript', 'React', 'Model Context Protocol', 'Software Architecture', 'REST APIs'].map((name) => ({ name, context: [] })),
  languages: [
    { name: 'English', proficiency: 'Full professional proficiency' },
    { name: 'Serbian', proficiency: 'Native or bilingual proficiency' },
  ],
  courses: [{ name: 'Basic Statistics', number: 'ST101', details: ['ST101', 'Associated with University of Example'] }],
  meta: { truncatedSections: [], warnings: [] },
});
