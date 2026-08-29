import {
    addRosterPlayer,
    addToBoard,
    getRoster,
    isOnBoard,
    removeFromBoard,
    removeRosterPlayer,
    renamePlayer,
    setPlayerColor,
    subscribe
} from './state.js';
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
    color.setAttribute('aria-label', t('roster.color'));
    color.title = t('roster.color');
    color.type = 'color';
    color.value = player.color;
    color.addEventListener('input', () => setPlayerColor(player.id, color.value));

    const name = document.createElement('span');

    name.className = 'player-item__name';
    name.textContent = player.name;

    const toggle = buildActiveToggle(player, placed);

    const rename = document.createElement('button');

    rename.className = 'player-item__action icon-button';
    rename.setAttribute('aria-label', t('roster.rename'));
    rename.title = t('roster.rename');
    rename.type = 'button';
    rename.innerHTML = '&#9998;';
    rename.addEventListener('click', () => startEditing(name, player));

    const remove = document.createElement('button');

    remove.className = 'player-item__action player-item__action--danger icon-button';
    remove.setAttribute('aria-label', t('roster.remove'));
    remove.title = t('roster.remove');
    remove.type = 'button';
    remove.innerHTML = '&times;';
    remove.addEventListener('click', () => removeRosterPlayer(player.id));

    item.append(color, name, toggle, rename, remove);

    return item;
}

/**
 * A compact switch (visual style shared with the language switch, see
 * .lang-switch in style.css) instead of the old drag&drop onto the board:
 * checked adds the player to the board (centered), unchecked removes it.
 */
function buildActiveToggle(player, placed) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const track = document.createElement('span');
    const knob = document.createElement('span');

    label.className = 'player-item__toggle';

    input.className = 'player-item__toggle-input';
    input.setAttribute('role', 'switch');
    input.type = 'checkbox';
    input.checked = placed;
    input.setAttribute('aria-label', t(placed ? 'roster.active' : 'roster.inactive'));
    input.title = t(placed ? 'roster.active' : 'roster.inactive');
    input.addEventListener('change', () => {
        if (input.checked) {
            addToBoard(player.id, 50, 50);
        } else {
            removeFromBoard(player.id);
        }
    });

    track.className = 'player-item__toggle-track';
    track.setAttribute('aria-hidden', 'true');
    knob.className = 'player-item__toggle-knob';
    track.append(knob);

    label.append(input, track);

    return label;
}

/** Swaps the name for an input field; Enter commits, Escape discards. */
function startEditing(nameElement, player) {
    const input = document.createElement('input');
    let settled = false;

    input.className = 'player-item__input';
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
