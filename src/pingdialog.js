import { addPing, getBoardPlayers, getPlayer } from './state.js';
import { normalizeRoleName } from './catalog.js';
import { rebuildRoleOptions } from './details.js';
import { displayName } from './player.js';

let commentInput = null;
let dayInput = null;
let dialog = null;
let form = null;
let sourcePlayerSelect = null;
let sourceRoleInput = null;
let submitButton = null;
let targetsContainer = null;

function checkedTargetIds() {
    return [...targetsContainer.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function updateSubmitAvailability() {
    submitButton.disabled = sourceRoleInput.value.trim() === '' || checkedTargetIds().length === 0;
}

/** The selected source player can't ping themself – they're excluded from the target list. */
function rebuildTargets() {
    const sourcePlayerId = sourcePlayerSelect.value;

    targetsContainer.replaceChildren();

    getBoardPlayers()
        .filter((entry) => entry.playerId !== sourcePlayerId)
        .forEach((entry) => {
            const player = getPlayer(entry.playerId);

            if (!player) {
                return;
            }

            const label = document.createElement('label');
            const checkbox = document.createElement('input');

            label.className = 'ping-filter__option';
            checkbox.type = 'checkbox';
            checkbox.value = entry.playerId;
            checkbox.addEventListener('change', updateSubmitAvailability);

            const text = document.createElement('span');

            text.textContent = displayName(player);

            label.append(checkbox, text);
            targetsContainer.append(label);
        });

    updateSubmitAvailability();
}

function rebuildSourcePlayerOptions() {
    sourcePlayerSelect.replaceChildren();

    getBoardPlayers().forEach((entry) => {
        const player = getPlayer(entry.playerId);

        if (!player) {
            return;
        }

        const option = document.createElement('option');

        option.value = entry.playerId;
        option.textContent = displayName(player);
        sourcePlayerSelect.append(option);
    });

    rebuildTargets();
}

/**
 * `method="dialog"` closes the dialog natively on every submit – more
 * reliable than a manual close() call, which might never be reached if an
 * error occurs during processing (or in a subscriber triggered by
 * addPing()/persistBoard()). Pings are only written on "create"; on an
 * invalid selection the submit is aborted (the submit button is already
 * disabled for that anyway, this is just a safeguard).
 */
function handleSubmit(event) {
    if (event.submitter?.value !== 'create') {
        return;
    }

    const sourcePlayerId = sourcePlayerSelect.value;
    const sourceRole = normalizeRoleName(sourceRoleInput.value);
    const targetIds = checkedTargetIds();

    if (!sourcePlayerId || sourceRole === '' || targetIds.length === 0) {
        event.preventDefault();

        return;
    }

    const raw = dayInput.value.trim();
    const parsed = Number(raw);
    const day = raw !== '' && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    const comment = commentInput.value;

    // If a target already has an entry for this source, addPing() overwrites
    // it instead of creating a duplicate.
    targetIds.forEach((targetId) => {
        addPing(targetId, { comment, day, sourcePlayerId, sourceRole });
    });
}

/** Enter in the role/day/comment field should always trigger "Create", never the first submit element (Cancel). */
function redirectEnterToSubmit(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitButton.click();
    }
}

export function openPingDialog() {
    dayInput.value = '';
    commentInput.value = '';
    sourceRoleInput.value = '';
    // The datalist is otherwise only kept up to date while a player is
    // selected in the sidebar – that's not guaranteed when opening the dialog.
    rebuildRoleOptions();
    rebuildSourcePlayerOptions();
    dialog.showModal();
}

export function initPingDialog() {
    commentInput = document.getElementById('ping-dialog-comment');
    dayInput = document.getElementById('ping-dialog-day');
    dialog = document.getElementById('ping-dialog');
    form = document.getElementById('ping-dialog-form');
    sourcePlayerSelect = document.getElementById('ping-dialog-source-player');
    sourceRoleInput = document.getElementById('ping-dialog-source-role');
    submitButton = document.getElementById('ping-dialog-submit');
    targetsContainer = document.getElementById('ping-dialog-targets');

    sourcePlayerSelect.addEventListener('change', rebuildTargets);
    sourceRoleInput.addEventListener('input', updateSubmitAvailability);
    form.addEventListener('submit', handleSubmit);
    dayInput.addEventListener('keydown', redirectEnterToSubmit);
    sourceRoleInput.addEventListener('keydown', redirectEnterToSubmit);
    commentInput.addEventListener('keydown', redirectEnterToSubmit);
    document.getElementById('ping-quick-add').addEventListener('click', openPingDialog);
}
