// A floating page button you can drag anywhere and hide with ×. Position and hidden state are kept in
// chrome.storage.local under `storageKey` and follow changes made elsewhere (e.g. "show again" in the CV page).
// Shared by Resume Maker for LinkedIn and linkedin-profile-json (same file in both).
(() => {
  if (window.FloatingButton) return;

  const DRAG_THRESHOLD = 5; // px of movement before a press counts as a drag, not a click
  const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

  window.FloatingButton = function create({ id, storageKey, label, title, defaultPos, onClick }) {
    const wrap = document.createElement('div');
    wrap.id = id;
    wrap.className = 'fb-wrap';
    const main = document.createElement('button');
    main.className = 'fb-main';
    main.type = 'button';
    main.textContent = label;
    main.title = `${title}\nDrag to move it.`;
    const close = document.createElement('button');
    close.className = 'fb-close';
    close.type = 'button';
    close.textContent = '×';
    close.title = 'Hide this button';
    close.setAttribute('aria-label', 'Hide this button');
    wrap.append(main, close);

    // distance from the window's right and bottom edges, so the button stays put when the window is resized
    let state = { right: defaultPos.right, bottom: defaultPos.bottom, hidden: false };
    let onPage = false;

    function fitInWindow() {
      state.right = clamp(state.right, 0, window.innerWidth - wrap.offsetWidth);
      state.bottom = clamp(state.bottom, 0, window.innerHeight - wrap.offsetHeight);
    }
    function apply() {
      wrap.style.right = `${state.right}px`;
      wrap.style.bottom = `${state.bottom}px`;
      wrap.style.display = onPage && !state.hidden ? '' : 'none';
    }
    const save = () => chrome.storage.local.set({ [storageKey]: { ...state } });

    chrome.storage.local.get(storageKey).then((r) => {
      if (r[storageKey]) state = { ...state, ...r[storageKey] };
      apply();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !(storageKey in changes)) return;
      state = { right: defaultPos.right, bottom: defaultPos.bottom, hidden: false, ...(changes[storageKey].newValue || {}) };
      apply();
    });

    // ---------- drag ----------
    let drag = null; // { x, y, right, bottom, moved }
    let swallowClick = false;
    main.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || main.disabled) return;
      drag = { x: e.clientX, y: e.clientY, right: state.right, bottom: state.bottom, moved: false };
      main.setPointerCapture(e.pointerId);
    });
    main.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      wrap.classList.add('fb-dragging');
      state.right = drag.right - dx;
      state.bottom = drag.bottom - dy;
      fitInWindow();
      apply();
    });
    const endDrag = () => {
      if (!drag) return;
      if (drag.moved) {
        swallowClick = true; // the click that follows a drag must not start the action
        save();
      }
      wrap.classList.remove('fb-dragging');
      drag = null;
    };
    main.addEventListener('pointerup', endDrag);
    main.addEventListener('pointercancel', endDrag);
    main.addEventListener('click', (e) => {
      if (swallowClick) {
        swallowClick = false;
        e.preventDefault();
        return;
      }
      onClick(main);
    });

    close.addEventListener('click', () => {
      state.hidden = true;
      save();
      apply();
    });
    window.addEventListener('resize', () => {
      fitInWindow();
      apply();
    });

    document.body.appendChild(wrap);
    apply();

    return {
      button: main,
      // show only on pages where the button makes sense (LinkedIn is a single-page app, so this changes)
      setOnPage(value) {
        if (onPage === value) return;
        onPage = value;
        apply();
      },
    };
  };
})();
