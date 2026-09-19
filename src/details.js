import {
    LIFE_STATES,
    TRUST_LEVELS,
    addPing,
    addRole,
    getBoardEntry,
    getBoardPlayers,
    getDay,
    getEdition,
    getPlayer,
    getSharedRoles,
    removePing,
    removeRole,
    setLifeState,
    setNotes,
    setTrust,
    subscribe,
    updatePing
} from './state.js';
import { findRoleDescription, getRoleId, getRoleNames, getRoleTeam, normalizeRoleName } from './catalog.js';
import { displayName } from './player.js';
import { t } from './i18n.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Does this board entry carry a Traveller role tag? */
function isTravellerEntry(entry) {
    return entry.roles.some((role) => getRoleTeam(role) === 'traveller');
}

/**
 * Both choice groups are identical apart from values, icons and the setter –
 * hence one shared definition instead of duplicating the build logic twice.
 * `prefix` feeds both the i18n keys (trust.evil) and the color variables
 * (--trust-evil). `sectionId` points at the wrapper around title + list, so a
 * whole group can be hidden at once. `columns` is the number of choices ever
 * visible at the same time – for the life group that's 3, even though 4
 * choices exist in the DOM ("executed" and "exiled" are never both visible).
 * `hiddenValues` returns the subset of `values` to hide for the current player.
 */
const GROUPS = [
    {
        current: (entry) => entry.trust,
        columns: TRUST_LEVELS.length,
        hiddenValues: () => [],
        icon: 'face',
        id: 'trust-list',
        list: null,
        prefix: 'trust',
        section: null,
        sectionId: 'trust-section',
        set: setTrust,
        // Trustworthiness is meaningless for the own player.
        visible: (player) => !player.isSelf,
        values: TRUST_LEVELS
    },
    {
        current: (entry) => entry.lifeState,
        columns: 3,
        // "exiled" applies only to Travellers; everyone else sees "executed" instead.
        hiddenValues: (player, entry) => [isTravellerEntry(entry) ? 'executed' : 'exiled'],
        icon: 'life',
        id: 'life-list',
        list: null,
        prefix: 'life',
        section: null,
        sectionId: 'life-section',
        set: setLifeState,
        visible: () => true,
        values: LIFE_STATES
    }
];

let currentId = null;
let nameOutput = null;
let newPingDayInput = null;
let newPingPlayerSelect = null;
let newPingRoleInput = null;
let notesInput = null;
let pingAddButton = null;
let pingElements = new Map();
let pingList = null;
let pingsEmptyHint = null;
let roleAddButton = null;
let roleDatalist = null;
let roleDescription = null;
let roleInput = null;
let roleTagList = null;
let selectedRole = null;

/**
 * A radio group instead of individual buttons: selection is exclusive by
 * definition and the arrow keys navigate without extra code. Only the icon
 * is visible; the text remains as a label for screen readers.
 */
function buildGroup(group) {
    group.list.replaceChildren();
    group.list.style.setProperty('--choice-count', group.columns);

    group.values.forEach((value) => {
        const option = document.createElement('label');

        option.className = 'choice';
        option.style.setProperty('--choice-color', `var(--${group.prefix}-${value})`);

        const input = document.createElement('input');

        input.className = 'choice__input';
        input.name = group.prefix;
        input.type = 'radio';
        input.value = value;
        input.addEventListener('change', () => {
            if (currentId && input.checked) {
                group.set(currentId, value);
            }
        });

        const icon = document.createElement('span');
        const svg = document.createElementNS(SVG_NS, 'svg');
        const use = document.createElementNS(SVG_NS, 'use');

        icon.className = 'choice__icon';
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        use.setAttribute('href', `#${group.icon}-${value}`);
        svg.append(use);
        icon.append(svg);

        const text = document.createElement('span');

        text.className = 'visually-hidden';
        text.dataset.choiceLabel = `${group.prefix}.${value}`;

        option.append(input, icon, text);
        group.list.append(option);
    });
}

function buildRoleTag(playerId, role, shared) {
    const tag = document.createElement('li');
    const classes = ['tag'];

    if (shared) {
        classes.push('tag--shared');
    }

    if (role === selectedRole) {
        classes.push('tag--active');
    }

    tag.className = classes.join(' ');
    // Selection applies to the whole chip (bigger target), but not to the remove button.
    tag.addEventListener('click', (event) => {
        if (event.target.closest('.tag__remove')) {
            return;
        }

        selectedRole = selectedRole === role ? null : role;
        render();
    });

    const label = document.createElement('span');

    label.className = 'tag__label';
    // Displayed in the active UI language even if stored in the other one –
    // the underlying `role` value (used for identity/removal) stays untouched.
    label.textContent = normalizeRoleName(role);

    const remove = document.createElement('button');

    remove.className = 'tag__remove icon-button';
    remove.setAttribute('aria-label', t('details.role.remove'));
    remove.title = t('details.role.remove');
    remove.type = 'button';
    remove.innerHTML = '&times;';
    remove.addEventListener('click', () => removeRole(playerId, role));

    tag.append(label, remove);

    return tag;
}

function commitRoleInput() {
    if (currentId && addRole(currentId, normalizeRoleName(roleInput.value), getRoleId)) {
        roleInput.value = '';
    }
}

/**
 * All board players as display text; `excludePlayerId` removes the player
 * currently being viewed from the list – you can't ping yourself.
 */
function boardPlayerOptions(excludePlayerId) {
    return getBoardPlayers()
        .filter((entry) => entry.playerId !== excludePlayerId)
        .map((entry) => {
            const player = getPlayer(entry.playerId);

            return player ? { id: entry.playerId, label: displayName(player) } : null;
        })
        .filter((option) => option !== null);
}

/**
 * Rebuilds the player selection of a ping card. If the stored source player
 * has since been deleted from the roster, the snapshot name is prepended as
 * an extra option instead of silently changing the selection.
 */
function rebuildPlayerOptions(select, ping) {
    const boardOptions = boardPlayerOptions(currentId);
    const hasLiveMatch = boardOptions.some((option) => option.id === ping.sourcePlayerId);
    const options = hasLiveMatch
        ? boardOptions
        : [{ id: ping.sourcePlayerId, label: ping.sourceName || '?' }, ...boardOptions];

    select.replaceChildren();

    options.forEach((option) => {
        const opt = document.createElement('option');

        opt.value = option.id;
        opt.textContent = option.label;
        opt.selected = option.id === ping.sourcePlayerId;
        select.append(opt);
    });
}

/**
 * Builds the DOM structure of a ping card once; the event handlers close
 * over `entry.playerId`/`ping.id` (stable) and `ping` itself (mutated
 * in-place by updatePing(), never replaced) – no rebuild on every render().
 */
function buildPingCard(entry, ping) {
    const card = document.createElement('li');

    card.className = 'ping-card';

    const playerSelect = document.createElement('select');

    playerSelect.className = 'ping-card__player';
    playerSelect.setAttribute('aria-label', t('details.pings.player'));
    playerSelect.addEventListener('change', () => {
        updatePing(entry.playerId, ping.id, { sourcePlayerId: playerSelect.value });
    });

    const remove = document.createElement('button');

    remove.className = 'ping-card__remove icon-button';
    remove.setAttribute('aria-label', t('details.pings.remove'));
    remove.title = t('details.pings.remove');
    remove.type = 'button';
    remove.innerHTML = '&times;';
    remove.addEventListener('click', () => removePing(entry.playerId, ping.id));

    const playerRow = document.createElement('div');

    playerRow.className = 'ping-card__row';
    playerRow.append(playerSelect, remove);

    const roleInput = document.createElement('input');

    roleInput.className = 'ping-card__role text-input';
    roleInput.autocomplete = 'off';
    roleInput.setAttribute('list', 'role-options');
    roleInput.setAttribute('aria-label', t('details.role'));
    roleInput.placeholder = t('details.pings.role.placeholder');
    roleInput.type = 'text';
    // Take the raw value on every keystroke (cursor stays stable, like the
    // comment field); the spelling is only corrected once the field is left –
    // just like the role tag input field, only not per character.
    roleInput.addEventListener('input', () => {
        updatePing(entry.playerId, ping.id, { sourceRole: roleInput.value });
    });
    roleInput.addEventListener('blur', () => {
        updatePing(entry.playerId, ping.id, { sourceRole: normalizeRoleName(roleInput.value) });
    });

    const dayInput = document.createElement('input');

    dayInput.className = 'ping-card__day text-input';
    dayInput.type = 'number';
    dayInput.min = '1';
    dayInput.step = '1';
    dayInput.inputMode = 'numeric';
    dayInput.setAttribute('aria-label', t('details.pings.day'));
    dayInput.placeholder = t('details.pings.day');
    dayInput.addEventListener('input', () => {
        const raw = dayInput.value.trim();

        if (raw === '') {
            updatePing(entry.playerId, ping.id, { day: null });

            return;
        }

        const parsed = Number(raw);

        // Invalid intermediate states (e.g. "0", negative) are not applied –
        // the last valid value stays in place until it's corrected.
        if (Number.isInteger(parsed) && parsed > 0) {
            updatePing(entry.playerId, ping.id, { day: parsed });
        }
    });

    const roleRow = document.createElement('div');

    roleRow.className = 'ping-card__row';
    roleRow.append(roleInput, dayInput);

    const commentInput = document.createElement('input');

    commentInput.className = 'text-input';
    commentInput.autocomplete = 'off';
    commentInput.placeholder = t('details.pings.comment.placeholder');
    commentInput.type = 'text';
    commentInput.addEventListener('input', () => {
        updatePing(entry.playerId, ping.id, { comment: commentInput.value });
    });

    card.append(playerRow, roleRow, commentInput);
    rebuildPlayerOptions(playerSelect, ping);
    roleInput.value = ping.sourceRole;
    dayInput.value = ping.day === null ? '' : String(ping.day);
    commentInput.value = ping.comment;

    return { card, commentInput, dayInput, playerSelect, roleInput };
}

/** Updates an existing card without replacing its DOM nodes (focus/cursor are preserved). */
function updatePingCard(refs, ping) {
    rebuildPlayerOptions(refs.playerSelect, ping);

    if (refs.roleInput.value !== ping.sourceRole) {
        refs.roleInput.value = ping.sourceRole;
    }

    const dayValue = ping.day === null ? '' : String(ping.day);

    if (refs.dayInput.value !== dayValue) {
        refs.dayInput.value = dayValue;
    }

    if (refs.commentInput.value !== ping.comment) {
        refs.commentInput.value = ping.comment;
    }
}

/**
 * Rebuilds the player selection of the "add ping" form. Unlike an existing
 * card, there's no snapshot to preserve here – the selection gets reset to
 * the first available player after every successful addition anyway.
 */
function rebuildNewPingPlayerOptions() {
    const previous = newPingPlayerSelect.value;
    const options = boardPlayerOptions(currentId);

    newPingPlayerSelect.replaceChildren();

    options.forEach((option) => {
        const opt = document.createElement('option');

        opt.value = option.id;
        opt.textContent = option.label;
        newPingPlayerSelect.append(opt);
    });

    if (options.some((option) => option.id === previous)) {
        newPingPlayerSelect.value = previous;
    }

    return options;
}

/**
 * Defaults the "add ping" form's day field to the current day counter.
 * Called whenever the sidebar is opened (see main.js), regardless of whether
 * that happened via a token tap or the toggle button – and again after a
 * successful submit, ready for the next entry.
 */
export function resetNewPingDay() {
    newPingDayInput.value = String(getDay());
}

function commitNewPing() {
    if (!currentId || newPingPlayerSelect.disabled) {
        return;
    }

    const trimmedRole = normalizeRoleName(newPingRoleInput.value);

    if (trimmedRole === '' || !newPingPlayerSelect.value) {
        return;
    }

    const rawDay = newPingDayInput.value.trim();
    const parsedDay = Number(rawDay);
    const day = rawDay !== '' && Number.isInteger(parsedDay) && parsedDay > 0 ? parsedDay : null;

    addPing(currentId, {
        comment: '',
        day,
        sourcePlayerId: newPingPlayerSelect.value,
        sourceRole: trimmedRole
    }, getRoleId);
    newPingRoleInput.value = '';
    // Day usually stays the same across several claims recorded in a row –
    // reset to the current day counter, not to empty, ready for the next one.
    resetNewPingDay();
}

/** Renders the current player's ping history; keeps existing cards. */
function renderPings(entry) {
    const hasOtherPlayers = rebuildNewPingPlayerOptions().length > 0;

    newPingPlayerSelect.disabled = !hasOtherPlayers;
    newPingRoleInput.disabled = !hasOtherPlayers;
    newPingDayInput.disabled = !hasOtherPlayers;
    pingAddButton.disabled = !hasOtherPlayers;
    pingsEmptyHint.hidden = hasOtherPlayers;

    const currentIds = new Set(entry.pings.map((ping) => ping.id));

    entry.pings.forEach((ping, index) => {
        let refs = pingElements.get(ping.id);

        if (refs) {
            updatePingCard(refs, ping);
        } else {
            refs = buildPingCard(entry, ping);
            pingElements.set(ping.id, refs);
        }

        // Only move it if the position is actually wrong now: per the DOM
        // spec, an unconditional append()/insertBefore() always removes and
        // re-inserts, even if the target position is already correct – that
        // would destroy the focus of a field currently being edited (e.g.
        // while typing in the comment field).
        if (pingList.children[index] !== refs.card) {
            pingList.insertBefore(refs.card, pingList.children[index] ?? null);
        }
    });

    [...pingElements.keys()].forEach((id) => {
        if (!currentIds.has(id)) {
            pingElements.get(id).card.remove();
            pingElements.delete(id);
        }
    });
}

/**
 * Independent of the selected player: only depends on the chosen edition,
 * the role catalog, and the language. Rebuilt on every render(), since any
 * of these can change while a detail view is open.
 */
export function rebuildRoleOptions() {
    roleDatalist.replaceChildren();
    getRoleNames(getEdition()).forEach((name) => {
        const option = document.createElement('option');

        option.value = name;
        roleDatalist.append(option);
    });
}

function render() {
    if (!currentId) {
        return;
    }

    const entry = getBoardEntry(currentId);
    const player = getPlayer(currentId);

    // Player was deleted or removed from the board – abandon the selection.
    if (!entry || !player) {
        currentId = null;
        pingList.replaceChildren();
        pingElements.clear();

        return;
    }

    nameOutput.textContent = displayName(player);

    renderPings(entry);
    rebuildRoleOptions();

    // Role was removed while it was selected – abandon the selection.
    if (selectedRole !== null && !entry.roles.includes(selectedRole)) {
        selectedRole = null;
    }

    const sharedRoles = getSharedRoles(getRoleId);

    roleTagList.replaceChildren();
    entry.roles.forEach((role) => {
        roleTagList.append(buildRoleTag(entry.playerId, role, sharedRoles.has(getRoleId(role))));
    });

    if (selectedRole === null) {
        roleDescription.textContent = '';
    } else {
        roleDescription.textContent = findRoleDescription(selectedRole) ?? t('details.role.unknown');
    }

    // Only set on a real difference: setNotes() itself triggers render() via
    // board-changed – an unconditional assignment would make the cursor jump
    // to the end of the text while typing.
    if (notesInput.value !== entry.notes) {
        notesInput.value = entry.notes;
    }

    GROUPS.forEach((group) => {
        group.section.hidden = !group.visible(player);

        const active = group.current(entry);
        const hidden = new Set(group.hiddenValues(player, entry));

        group.list.querySelectorAll('.choice__input').forEach((input) => {
            input.checked = input.value === active;
            input.closest('.choice').hidden = hidden.has(input.value);
        });

        // Must stay here, not in the build step: a language switch re-renders
        // but doesn't rebuild.
        group.list.querySelectorAll('[data-choice-label]').forEach((text) => {
            text.textContent = t(text.dataset.choiceLabel);
        });
    });
}

export function clearSelection() {
    currentId = null;
    selectedRole = null;
    pingList.replaceChildren();
    pingElements.clear();
}

export function hasSelection() {
    return currentId !== null;
}

export function initDetails() {
    nameOutput = document.getElementById('details-name');
    newPingDayInput = document.getElementById('new-ping-day');
    newPingPlayerSelect = document.getElementById('new-ping-player');
    newPingRoleInput = document.getElementById('new-ping-role');
    notesInput = document.getElementById('details-notes');
    pingAddButton = document.getElementById('ping-add');
    pingList = document.getElementById('ping-list');
    pingsEmptyHint = document.getElementById('pings-empty');
    roleAddButton = document.getElementById('role-add');
    roleDatalist = document.getElementById('role-options');
    roleDescription = document.getElementById('role-description');
    roleInput = document.getElementById('role-input');
    roleTagList = document.getElementById('role-tags');

    notesInput.addEventListener('input', () => {
        if (currentId) {
            setNotes(currentId, notesInput.value);
        }
    });

    pingAddButton.addEventListener('click', commitNewPing);
    newPingRoleInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commitNewPing();
        }
    });
    newPingDayInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commitNewPing();
        }
    });

    roleAddButton.addEventListener('click', commitRoleInput);
    roleInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commitRoleInput();
        }
    });

    GROUPS.forEach((group) => {
        group.list = document.getElementById(group.id);
        group.section = document.getElementById(group.sectionId);
        buildGroup(group);
    });

    subscribe('board-changed', render);
    subscribe('custom-roles-changed', render);
    subscribe('edition-changed', render);
    subscribe('roster-changed', render);
}

export function showDetails(playerId) {
    currentId = playerId;
    selectedRole = null;
    render();
}
