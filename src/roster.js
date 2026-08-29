import {
    addRosterPlayer,
    getRoster,
    isOnBoard,
    removeRosterPlayer,
    renamePlayer,
    setPlayerColor,
    subscribe
} from './state.js';
import { createGhost, draggable, moveGhost } from './drag.js';
import { dropOnBoard } from './board.js';
import { initial } from './player.js';
import { t } from './i18n.js';

let addButton = null;
let list = null;
let nameInput = null;

function buildItem(player) {
    const item = document.createElement('li');
    const placed = isOnBoard(player.id);

    item.className = `player-item${placed ? ' player-item--placed' : ''}`;
    item.dataset.playerId = player.id;
    item.style.setProperty('--player-color', player.color);

    const color = document.createElement('input');

    color.className = 'player-item__color';
    color.dataset.noDrag = '';
    color.setAttribute('aria-label', t('roster.color'));
    color.title = t('roster.color');
    color.type = 'color';
    color.value = player.color;
    color.addEventListener('input', () => setPlayerColor(player.id, color.value));

    const name = document.createElement('span');

    name.className = 'player-item__name';
    name.textContent = player.name;

    const rename = document.createElement('button');

    rename.className = 'player-item__action icon-button';
    rename.dataset.noDrag = '';
    rename.setAttribute('aria-label', t('roster.rename'));
    rename.title = t('roster.rename');
    rename.type = 'button';
    rename.innerHTML = '&#9998;';
    rename.addEventListener('click', () => startEditing(name, player));

    const remove = document.createElement('button');

    remove.className = 'player-item__action player-item__action--danger icon-button';
    remove.dataset.noDrag = '';
    remove.setAttribute('aria-label', t('roster.remove'));
    remove.title = t('roster.remove');
    remove.type = 'button';
    remove.innerHTML = '&times;';
    remove.addEventListener('click', () => removeRosterPlayer(player.id));

    item.append(color, name);

    if (placed) {
        const badge = document.createElement('span');

        badge.className = 'player-item__badge';
        badge.textContent = t('roster.onboard');
        item.append(badge);
    }

    item.append(rename, remove);
    makeItemDraggable(item, player);

    return item;
}

/** Swaps the name for an input field; Enter commits, Escape discards. */
function startEditing(nameElement, player) {
    const input = document.createElement('input');
    let settled = false;

    input.className = 'player-item__input';
    input.dataset.noDrag = '';
    input.type = 'text';
    input.value = player.name;
    input.autocomplete = 'off';

    function settle(commit) {
        if (settled) {
            return;
        }

        settled = true;

        // renamePlayer re-renders itself on success; otherwise restore the original state.
        if (!commit || input.value.trim() === player.name || !renamePlayer(player.id, input.value)) {
            render();
        }
    }

    input.addEventListener('blur', () => settle(true));
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            settle(true);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            settle(false);
        }
    });

    nameElement.replaceWith(input);
    input.focus();
    input.select();
}

function makeItemDraggable(item, player) {
    let ghost = null;

    draggable(item, {
        canDrag: () => !isOnBoard(player.id),
        onDragStart(state) {
            ghost = createGhost(initial(player.name), player.color);
            moveGhost(ghost, state.x, state.y);
            item.classList.add('player-item--dragging');
        },
        onDragMove(state) {
            moveGhost(ghost, state.x, state.y);
        },
        onDragEnd(state, cancelled) {
            ghost?.remove();
            ghost = null;
            item.classList.remove('player-item--dragging');

            if (!cancelled) {
                dropOnBoard(player.id, state.x, state.y);
            }
        }
    });
}

function handleAdd() {
    if (addRosterPlayer(nameInput.value)) {
        nameInput.value = '';
        updateAddButton();
    }

    nameInput.focus();
}

/** An empty input is the only reason adding a player can fail. */
function updateAddButton() {
    addButton.disabled = nameInput.value.trim() === '';
}

function render() {
    const players = getRoster();

    list.replaceChildren();
    players.forEach((player) => list.append(buildItem(player)));

    document.getElementById('roster-empty').hidden = players.length > 0;
}

export function initRoster() {
    addButton = document.getElementById('add-player');
    list = document.getElementById('player-list');
    nameInput = document.getElementById('new-player-name');

    addButton.addEventListener('click', handleAdd);
    nameInput.addEventListener('input', updateAddButton);

    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAdd();
        }
    });

    subscribe('board-changed', render);
    subscribe('roster-changed', render);
    updateAddButton();
    render();
}
