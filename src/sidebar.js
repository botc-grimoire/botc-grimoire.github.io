import { t } from './i18n.js';

const OPEN_CLASS = 'sidebar--expanded';

let backdrop = null;
let panels = {};
let sidebar = null;
let toggle = null;

function updateToggle() {
    const open = isOpen();

    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', t(open ? 'sidebar.close' : 'sidebar.open'));
    toggle.setAttribute('title', t(open ? 'sidebar.close' : 'sidebar.open'));
}

export function closeSidebar() {
    sidebar.classList.remove(OPEN_CLASS);
    backdrop.hidden = true;
    updateToggle();
}

export function initSidebar() {
    backdrop = document.getElementById('sidebar-backdrop');
    sidebar = document.getElementById('sidebar');
    toggle = document.getElementById('sidebar-toggle');
    panels = {
        details: document.getElementById('panel-details'),
        locked: document.getElementById('panel-locked'),
        roster: document.getElementById('panel-roster')
    };

    toggle.addEventListener('click', () => {
        if (isOpen()) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    backdrop.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isOpen()) {
            closeSidebar();
        }
    });

    // Which panel is visible is decided by main.js based on the lock state.
    updateToggle();
}

export function isOpen() {
    return sidebar.classList.contains(OPEN_CLASS);
}

/**
 * The handle reads "open" or "close" depending on state – applyTranslations()
 * doesn't know this distinction, so it has to be applied here separately.
 */
export function refreshLabels() {
    updateToggle();
}

export function openSidebar() {
    sidebar.classList.add(OPEN_CLASS);
    backdrop.hidden = false;
    updateToggle();
}

export function showPanel(name) {
    Object.entries(panels).forEach(([key, panel]) => {
        panel.hidden = key !== name;
    });
}
