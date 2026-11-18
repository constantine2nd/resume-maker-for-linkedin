// "📄 Make CV" button on LinkedIn profile pages: extract the profile, store it, open the resume page.
// The button can be dragged anywhere and hidden with ×; the CV page has "Show button on LinkedIn" to bring it back.
(() => {
  if (window.__l2rLoaded) return;
  window.__l2rLoaded = true;

  const { extract, isProfileUrl } = window.L2RExtract;
  const LABEL = '📄 Make CV';

  function flash(btn, text) {
    btn.textContent = text;
    setTimeout(() => (btn.textContent = LABEL), 4000);
  }

  async function onClick(btn) {
    btn.disabled = true;
    try {
      const data = await extract((text) => (btn.textContent = text));
      if (!data?.profile?.name) {
        console.warn('[resume-maker]', data?.meta?.warnings);
        flash(btn, '⚠ Could not read this profile');
        return;
      }
      await chrome.storage.local.set({ 'l2r:extracted': data });
      window.open(chrome.runtime.getURL('resume.html'), '_blank');
      btn.textContent = LABEL;
    } catch (err) {
      console.error('[resume-maker]', err);
      flash(btn, '⚠ Failed, see the console');
    } finally {
      btn.disabled = false;
    }
  }

  const fb = window.FloatingButton({
    id: 'l2r-btn',
    storageKey: 'l2r:button',
    label: LABEL,
    title: 'Resume Maker for LinkedIn: make a CV (PDF) from this profile',
    defaultPos: { right: 20, bottom: 20 },
    onClick,
  });

  // LinkedIn is a single-page app: the URL changes without a reload, so check every second
  const update = () => fb.setOnPage(isProfileUrl());
  update();
  setInterval(update, 1000);
})();
