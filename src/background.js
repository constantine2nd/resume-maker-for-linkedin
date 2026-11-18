// Resume Maker for LinkedIn. Toolbar icon: open the resume page (works without LinkedIn once a CV has been made).
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('resume.html') });
});
