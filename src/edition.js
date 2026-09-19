import { CUSTOM_EDITION_ID, EDITIONS, clearCustomRoleIds, getEdition, isCustomRoleSelected, setCustomRoleSelected, setEdition, subscribe } from './state.js';
import { TEAMS, getAllRolesByTeam } from './catalog.js';

let customRolesList = null;
let customRolesReset = null;
let customRolesSection = null;
let select = null;

/**
 * Options are deliberately kept outside of i18n: edition names are proper
 * nouns and, per spec, are shown in English even in the German UI.
 */
function buildOptions() {
    select.replaceChildren();

    EDITIONS.forEach(({ id, label }) => {
        const option = document.createElement('option');

        option.value = id;
        option.textContent = label;
        select.append(option);
    });
}

function buildCustomRoleOption(role) {
    const wrapper = document.createElement('label');
    const checkbox = document.createElement('input');

    wrapper.className = 'checkbox-list__option';
    checkbox.checked = isCustomRoleSelected(role.id);
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', () => setCustomRoleSelected(role.id, checkbox.checked));

    const text = document.createElement('span');

    text.textContent = role.name;

    wrapper.append(checkbox, text);

    return wrapper;
}

/**
 * Every catalog role, alphabetical – the "Custom" edition picks from the
 * full catalog, independent of any other edition's role set. Rebuilt (not
 * just re-checked) on every relevant change, like the other settings lists.
 */
function rebuildCustomRoleOptions() {
    customRolesList.replaceChildren();

    TEAMS.flatMap((team) => getAllRolesByTeam(team))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((role) => customRolesList.append(buildCustomRoleOption(role)));
}

function updateCustomRolesVisibility() {
    customRolesSection.hidden = select.value !== CUSTOM_EDITION_ID;
}

export function initEdition() {
    customRolesList = document.getElementById('custom-roles-list');
    customRolesReset = document.getElementById('custom-roles-reset');
    customRolesSection = document.getElementById('custom-roles-section');
    select = document.getElementById('edition-select');

    buildOptions();
    select.value = getEdition();
    updateCustomRolesVisibility();
    rebuildCustomRoleOptions();

    select.addEventListener('change', () => {
        setEdition(select.value);
        updateCustomRolesVisibility();
    });

    customRolesReset.addEventListener('click', clearCustomRoleIds);

    subscribe('custom-roles-changed', rebuildCustomRoleOptions);
}
