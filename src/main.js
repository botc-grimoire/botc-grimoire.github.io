import { applyTranslations, getLanguage, setLanguage } from './i18n.js';
import { clearSelection, hasSelection, initDetails, resetNewPingDay, showDetails } from './details.js';
import { initSidebar, openSidebar, refreshLabels, showPanel } from './sidebar.js';
import { isLocked, refresh, subscribe } from './state.js';
import { initBoard } from './board.js';
import { initDayCounter } from './daycounter.js';
import { initEdition } from './edition.js';
import { initGameSettings } from './gamesettings.js';
import { initDistribution } from './distribution.js';
import { initPingDialog } from './pingdialog.js';
import { initRoster } from './roster.js';
import { setCatalog } from './catalog.js';

/**
 * Role and bluff data arrive once from the server on the first request and
 * then live in the document. Everything after that runs without server contact.
 */
function readBootstrapData() {
    const element = document.getElementById('bootstrap-data');

    if (!element) {
        return { editions: [] };
    }

    try {
        return JSON.parse(element.textContent);
    } catch (error) {
        console.warn('[botc] Rollendaten konnten nicht gelesen werden:', error);

        return { editions: [] };
    }
}

function initLanguageSwitch() {
    const input = document.getElementById('language-switch');

    input.checked = getLanguage() === 'en';
    input.addEventListener('change', () => {
        setLanguage(input.checked ? 'en' : 'de');
        applyTranslations();
        refreshLabels();
        // Re-renders the player list, board and detail panel with the new texts.
        refresh();
    });
}

/**
 * Which panel is visible follows solely from the lock state: unlocked shows
 * only the player list, locked shows the player states.
 */
function syncPanel() {
    if (!isLocked()) {
        clearSelection();
        showPanel('roster');

        return;
    }

    showPanel(hasSelection() ? 'details' : 'locked');
}

function main() {
    setCatalog(readBootstrapData());

    applyTranslations();
    initSidebar({ onOpen: resetNewPingDay });
    initDetails();
    initBoard({
        onSelect(playerId) {
            showDetails(playerId);
            syncPanel();
            openSidebar();
        }
    });
    initRoster();
    initDayCounter();
    initEdition();
    initGameSettings();
    initDistribution();
    initPingDialog();
    initLanguageSwitch();

    subscribe('board-changed', syncPanel);
    subscribe('roster-changed', syncPanel);
    syncPanel();
}

main();
