import { applyTranslations, getLanguage, setLanguage } from './i18n.js';
import { clearSelection, hasSelection, initDetails, resetNewPingDay, showDetails } from './details.js';
import { initSidebar, openSidebar, refreshLabels, showPanel } from './sidebar.js';
import { isLocked, refresh, subscribe } from './state.js';
import { initBoard } from './board.js';
import { initDayCounter } from './daycounter.js';
import { initEdition, refreshCustomRoleLabels } from './edition.js';
import { initGameSettings } from './gamesettings.js';
import { initDistribution } from './distribution.js';
import { initPingDialog } from './pingdialog.js';
import { initRoster } from './roster.js';
import { setCatalog } from './catalog.js';

/**
 * Role and bluff data are fetched once on startup and then live in memory.
 * Everything after that runs without server contact.
 */
async function readBootstrapData() {
    try {
        const response = await fetch('data/roles.json');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.warn('[botc] Rollendaten konnten nicht geladen werden:', error);

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
        refreshCustomRoleLabels();
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

async function main() {
    setCatalog(await readBootstrapData());

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
