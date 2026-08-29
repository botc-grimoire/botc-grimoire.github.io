import {
    LIFE_ALIVE,
    SELF_ID,
    addToBoard,
    arrangeInCircle,
    clearBoard,
    getBoardPlayers,
    getPingSources,
    getPlayer,
    getPlayersPingedBy,
    isLocked,
    removeFromBoard,
    setLocked,
    setPosition,
    subscribe
} from './state.js';
import { displayName, tokenLabel } from './player.js';
import { draggable } from './drag.js';
import { getRoleId, normalizeRoleName } from './catalog.js';
import { t } from './i18n.js';

let arrangeButton = null;
let board = null;
let clearButton = null;
let lockButton = null;
let pingFilter = null;
let pingFilterOptions = null;
let pingQuickAddButton = null;
let selectHandler = () => {};
let tokenLayer = null;

// Pure UI state (not in localStorage) – which ping sources are currently
// checked as filters. Keys as in pingSourceKey().
const activePingFilters = new Set();

function pingSourceKey(source) {
    return `${source.sourcePlayerId} ${getRoleId(source.sourceRole)}`;
}

/** Small dots above the token, one per active filter that matches. */
function buildPingDots(entry, pingSourceLookup) {
    const container = document.createElement('div');

    container.className = 'token__pings';

    activePingFilters.forEach((key) => {
        const source = pingSourceLookup.get(key);

        if (!source || !getPlayersPingedBy(source.sourcePlayerId, source.sourceRole, getRoleId).includes(entry.playerId)) {
            return;
        }

        // Live color if the source still exists – otherwise the snapshot.
        const livePlayer = getPlayer(source.sourcePlayerId);
        const dot = document.createElement('span');

        dot.className = 'token__ping-dot';
        dot.style.setProperty('--ping-dot-color', livePlayer ? livePlayer.color : source.sourceColor);
        container.append(dot);
    });

    return container;
}

/** Rebuilds the checkbox list in the filter popover; selection is preserved via activePingFilters. */
function rebuildPingFilterOptions(pingSources) {
    pingFilterOptions.replaceChildren();

    if (pingSources.length === 0) {
        const hint = document.createElement('p');

        hint.className = 'panel__hint';
        hint.textContent = t('board.ping-filter.empty');
        pingFilterOptions.append(hint);

        return;
    }

    pingSources.forEach((source) => {
        const key = pingSourceKey(source);
        const label = document.createElement('label');
        const checkbox = document.createElement('input');

        label.className = 'ping-filter__option';
        checkbox.checked = activePingFilters.has(key);
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                activePingFilters.add(key);
            } else {
                activePingFilters.delete(key);
            }

            render();
        });

        const livePlayer = getPlayer(source.sourcePlayerId);
        const text = document.createElement('span');

        text.textContent = `${livePlayer ? displayName(livePlayer) : source.sourceName} (${normalizeRoleName(source.sourceRole)})`;

        label.append(checkbox, text);
        pingFilterOptions.append(label);
    });
}

function buildToken(entry, pingSourceLookup) {
    const player = getPlayer(entry.playerId);
    const token = document.createElement('div');
    const classes = ['token'];

    // Murdered, executed, and exiled are treated the same: dimmed out.
    if (entry.lifeState !== LIFE_ALIVE) {
        classes.push('token--inactive');
    }

    if (player.isSelf) {
        classes.push('token--self');
    }

    token.className = classes.join(' ');
    token.dataset.playerId = entry.playerId;
    token.style.left = `${entry.x}%`;
    token.style.setProperty('--player-color', player.color);
    token.style.setProperty('--trust-color', `var(--trust-${entry.trust})`);
    token.style.top = `${entry.y}%`;
    token.title = displayName(player);

    const label = document.createElement('span');

    label.className = 'token__label';
    label.textContent = tokenLabel(player);
    token.append(label);

    // Your own token always stays on the board – no remove button.
    if (!player.isSelf) {
        const remove = document.createElement('button');

        remove.className = 'token__remove icon-button';
        remove.dataset.noDrag = '';
        remove.setAttribute('aria-label', t('board.remove'));
        remove.title = t('board.remove');
        remove.type = 'button';
        remove.innerHTML = '&times;';
        remove.addEventListener('click', () => removeFromBoard(entry.playerId));
        token.append(remove);
    }

    if (activePingFilters.size > 0) {
        token.append(buildPingDots(entry, pingSourceLookup));
    }

    makeTokenDraggable(token, entry);

    return token;
}

function makeTokenDraggable(token, entry) {
    let halfHeight = 0;
    let halfWidth = 0;
    let rect = null;

    draggable(token, {
        canDrag: () => !isLocked(),
        onDragStart() {
            rect = tokenLayer.getBoundingClientRect();
            halfHeight = (token.offsetHeight / 2 / rect.height) * 100;
            halfWidth = (token.offsetWidth / 2 / rect.width) * 100;
            token.classList.add('token--dragging');
        },
        onDragMove(state) {
            const x = entry.x + (state.dx / rect.width) * 100;
            const y = entry.y + (state.dy / rect.height) * 100;

            token.style.left = `${clamp(x, halfWidth, 100 - halfWidth)}%`;
            token.style.top = `${clamp(y, halfHeight, 100 - halfHeight)}%`;
        },
        onDragEnd(state) {
            token.classList.remove('token--dragging');
            setPosition(
                entry.playerId,
                clamp(entry.x + (state.dx / rect.width) * 100, halfWidth, 100 - halfWidth),
                clamp(entry.y + (state.dy / rect.height) * 100, halfHeight, 100 - halfHeight)
            );
        },
        onTap() {
            // States are only set on a locked board – otherwise the sidebar
            // shows just the player list.
            if (isLocked()) {
                selectHandler(entry.playerId);
            }
        }
    });
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function render() {
    const entries = getBoardPlayers();
    const locked = isLocked();
    const pingSources = getPingSources(getRoleId);
    const pingSourceLookup = new Map(pingSources.map((source) => [pingSourceKey(source), source]));

    tokenLayer.replaceChildren();
    entries.forEach((entry) => {
        if (getPlayer(entry.playerId)) {
            tokenLayer.append(buildToken(entry, pingSourceLookup));
        }
    });

    board.classList.toggle('board--locked', locked);
    arrangeButton.hidden = locked;
    clearButton.hidden = locked;
    // Both are only visible on a locked board (like the rest of the ping
    // feature) – dots already set on tokens remain, though, even after
    // unlocking.
    pingFilter.hidden = !locked;
    pingQuickAddButton.hidden = !locked;
    rebuildPingFilterOptions(pingSources);

    // Your own token doesn't count – otherwise the hint would never show.
    const others = entries.filter((entry) => entry.playerId !== SELF_ID).length;

    document.getElementById('board-empty').hidden = others > 0;

    lockButton.setAttribute('aria-pressed', String(locked));
    lockButton.setAttribute('aria-label', t(locked ? 'board.unlock' : 'board.lock'));
    lockButton.setAttribute('title', t(locked ? 'board.unlock' : 'board.lock'));
}

/**
 * Drops a player at the pointer position. If it's outside the board,
 * nothing happens – the drag then counts as cancelled.
 */
export function dropOnBoard(playerId, clientX, clientY) {
    if (isLocked()) {
        return false;
    }

    const rect = tokenLayer.getBoundingClientRect();
    const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;

    if (!inside) {
        return false;
    }

    addToBoardAt(playerId, ((clientX - rect.left) / rect.width) * 100, ((clientY - rect.top) / rect.height) * 100);

    return true;
}

function addToBoardAt(playerId, x, y) {
    // The token should stay fully within the board, even when dropped at the edge.
    const rect = tokenLayer.getBoundingClientRect();
    const size = Number.parseFloat(getComputedStyle(board).getPropertyValue('--token-size')) || 48;
    const halfWidth = (size / 2 / rect.width) * 100;
    const halfHeight = (size / 2 / rect.height) * 100;

    addToBoard(playerId, clamp(x, halfWidth, 100 - halfWidth), clamp(y, halfHeight, 100 - halfHeight));
}

export function initBoard(options = {}) {
    selectHandler = options.onSelect ?? (() => {});

    arrangeButton = document.getElementById('board-arrange');
    board = document.getElementById('board');
    clearButton = document.getElementById('board-clear');
    lockButton = document.getElementById('board-lock');
    pingFilter = document.getElementById('ping-filter');
    pingFilterOptions = document.getElementById('ping-filter-options');
    pingQuickAddButton = document.getElementById('ping-quick-add');
    tokenLayer = document.getElementById('token-layer');

    arrangeButton.addEventListener('click', () => {
        const rect = tokenLayer.getBoundingClientRect();

        arrangeInCircle(rect.width / rect.height);
    });

    clearButton.addEventListener('click', () => {
        if (window.confirm(t('board.clear.confirm'))) {
            clearBoard();
        }
    });

    lockButton.addEventListener('click', () => setLocked(!isLocked()));

    subscribe('board-changed', render);
    subscribe('roster-changed', render);
    render();
}
