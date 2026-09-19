import { FABLED, LORICS, addFabled, addLoric, getActiveFabled, getActiveLorics, getEdition, removeFabled, removeLoric, subscribe } from './state.js';
import { TEAMS, getRoleById, getRolesByTeam } from './catalog.js';
import { localize, t } from './i18n.js';

let dialog = null;
let fabledAddSelect = null;
let fabledList = null;
let glossaryBluffDescription = null;
let glossaryBluffTags = null;
let glossaryHintsList = null;
let glossaryPanel = null;
let glossaryRoleDescription = null;
let glossaryRoleSelect = null;
let glossaryTab = null;
let loricAddSelect = null;
let loricList = null;
let selectedBluffRoleId = null;
let settingsPanel = null;
let settingsTab = null;

function buildFabledItem(entry) {
    const item = document.createElement('li');

    item.className = 'fabled-item';

    const text = document.createElement('div');

    text.className = 'fabled-item__text';

    const name = document.createElement('strong');

    name.textContent = localize(entry.name);

    const description = document.createElement('p');

    description.className = 'fabled-item__description';
    description.textContent = localize(entry.description);

    text.append(name, description);

    const remove = document.createElement('button');

    remove.className = 'fabled-item__remove icon-button';
    remove.setAttribute('aria-label', t('settings.fabled.remove'));
    remove.title = t('settings.fabled.remove');
    remove.type = 'button';
    remove.innerHTML = '&times;';
    remove.addEventListener('click', () => removeFabled(entry.id));

    item.append(text, remove);

    return item;
}

/** The placeholder option is itself the "add" trigger – no separate button needed. */
function rebuildFabledAddOptions(activeIds) {
    fabledAddSelect.replaceChildren();

    const placeholder = document.createElement('option');

    placeholder.selected = true;
    placeholder.textContent = t('settings.fabled.add');
    placeholder.value = '';
    fabledAddSelect.append(placeholder);

    FABLED.filter((entry) => !activeIds.has(entry.id)).forEach((entry) => {
        const option = document.createElement('option');

        option.textContent = localize(entry.name);
        option.value = entry.id;
        fabledAddSelect.append(option);
    });
}

function buildLoricItem(loric) {
    const item = document.createElement('li');

    item.className = 'loric-item';

    const text = document.createElement('div');

    text.className = 'loric-item__text';

    const name = document.createElement('strong');

    name.textContent = localize(loric.name);

    const description = document.createElement('p');

    description.className = 'loric-item__description';
    description.textContent = localize(loric.description);

    text.append(name, description);

    const remove = document.createElement('button');

    remove.className = 'loric-item__remove icon-button';
    remove.setAttribute('aria-label', t('settings.lorics.remove'));
    remove.title = t('settings.lorics.remove');
    remove.type = 'button';
    remove.innerHTML = '&times;';
    remove.addEventListener('click', () => removeLoric(loric.id));

    item.append(text, remove);

    return item;
}

/** The placeholder option is itself the "add" trigger – no separate button needed. */
function rebuildLoricAddOptions(activeIds) {
    loricAddSelect.replaceChildren();

    const placeholder = document.createElement('option');

    placeholder.selected = true;
    placeholder.textContent = t('settings.lorics.add');
    placeholder.value = '';
    loricAddSelect.append(placeholder);

    LORICS.filter((loric) => !activeIds.has(loric.id)).forEach((loric) => {
        const option = document.createElement('option');

        option.textContent = localize(loric.name);
        option.value = loric.id;
        loricAddSelect.append(option);
    });
}

function renderFabled() {
    const active = getActiveFabled();

    fabledList.replaceChildren();
    active.forEach((entry) => fabledList.append(buildFabledItem(entry)));

    rebuildFabledAddOptions(new Set(active.map((entry) => entry.id)));
}

function renderLorics() {
    const active = getActiveLorics();

    loricList.replaceChildren();
    active.forEach((loric) => loricList.append(buildLoricItem(loric)));

    rebuildLoricAddOptions(new Set(active.map((loric) => loric.id)));
}

/**
 * Rebuilds the glossary's role <select>, grouped by team via <optgroup>,
 * restricted to the currently selected edition (#edition-select).
 */
function rebuildGlossaryRoleOptions() {
    const edition = getEdition();

    glossaryRoleSelect.replaceChildren();

    TEAMS.forEach((team) => {
        const roles = getRolesByTeam(team, edition);

        if (roles.length === 0) {
            return;
        }

        const group = document.createElement('optgroup');

        group.label = t(`settings.glossary.${team}`);

        roles.forEach((role) => {
            const option = document.createElement('option');

            option.textContent = role.name;
            option.value = role.id;
            group.append(option);
        });

        glossaryRoleSelect.append(group);
    });
}

function buildBluffTag(roleId, roleName) {
    const tag = document.createElement('li');

    tag.className = roleId === selectedBluffRoleId ? 'tag tag--active' : 'tag';
    tag.addEventListener('click', () => {
        selectedBluffRoleId = selectedBluffRoleId === roleId ? null : roleId;
        renderGlossaryRole();
    });

    const label = document.createElement('span');

    label.className = 'tag__label';
    label.textContent = roleName;
    tag.append(label);

    return tag;
}

/**
 * Renders the description, bluff-suggestion tags (from bluffRoles), and
 * hints (from strategies) for the currently selected glossary role.
 */
function renderGlossaryRole() {
    const role = getRoleById(glossaryRoleSelect.value);
    const bluffRoleIds = role?.bluffRoles ?? [];

    glossaryRoleDescription.textContent = role ? localize(role.description) : '';

    if (!bluffRoleIds.includes(selectedBluffRoleId)) {
        selectedBluffRoleId = null;
    }

    glossaryBluffTags.replaceChildren();
    bluffRoleIds
        .map((bluffId) => ({ bluffId, bluffRole: getRoleById(bluffId) }))
        .filter(({ bluffRole }) => bluffRole !== null)
        .forEach(({ bluffId, bluffRole }) => {
            glossaryBluffTags.append(buildBluffTag(bluffId, localize(bluffRole.name)));
        });

    glossaryBluffDescription.textContent = selectedBluffRoleId
        ? localize(getRoleById(selectedBluffRoleId).description)
        : '';

    glossaryHintsList.replaceChildren();
    (role?.strategies ?? []).forEach((strategy) => {
        const hint = document.createElement('li');

        hint.textContent = localize(strategy);
        glossaryHintsList.append(hint);
    });
}

function switchTab(tab) {
    const showGlossary = tab === 'glossary';

    settingsTab.setAttribute('aria-selected', String(!showGlossary));
    glossaryTab.setAttribute('aria-selected', String(showGlossary));
    settingsPanel.hidden = showGlossary;
    glossaryPanel.hidden = !showGlossary;
}

export function openGameSettings() {
    switchTab('settings');
    selectedBluffRoleId = null;
    rebuildGlossaryRoleOptions();
    renderGlossaryRole();
    dialog.showModal();
}

export function initGameSettings() {
    dialog = document.getElementById('game-settings-dialog');
    fabledAddSelect = document.getElementById('fabled-add-select');
    fabledList = document.getElementById('fabled-list');
    glossaryBluffDescription = document.getElementById('glossary-bluff-description');
    glossaryBluffTags = document.getElementById('glossary-bluff-tags');
    glossaryHintsList = document.getElementById('glossary-hints-list');
    glossaryPanel = document.getElementById('game-settings-panel-glossary');
    glossaryRoleDescription = document.getElementById('glossary-role-description');
    glossaryRoleSelect = document.getElementById('glossary-role-select');
    glossaryTab = document.getElementById('game-settings-tab-glossary');
    loricAddSelect = document.getElementById('loric-add-select');
    loricList = document.getElementById('loric-list');
    settingsPanel = document.getElementById('game-settings-panel-settings');
    settingsTab = document.getElementById('game-settings-tab-settings');

    document.getElementById('game-settings-open').addEventListener('click', openGameSettings);
    document.getElementById('game-settings-close').addEventListener('click', () => dialog.close());

    settingsTab.addEventListener('click', () => switchTab('settings'));
    glossaryTab.addEventListener('click', () => switchTab('glossary'));
    glossaryRoleSelect.addEventListener('change', () => {
        selectedBluffRoleId = null;
        renderGlossaryRole();
    });

    fabledAddSelect.addEventListener('change', () => {
        if (fabledAddSelect.value) {
            addFabled(fabledAddSelect.value);
        }
    });

    loricAddSelect.addEventListener('change', () => {
        if (loricAddSelect.value) {
            addLoric(loricAddSelect.value);
        }
    });

    const onRoleSetChanged = () => {
        selectedBluffRoleId = null;
        rebuildGlossaryRoleOptions();
        renderGlossaryRole();
    };

    subscribe('fabled-changed', renderFabled);
    subscribe('lorics-changed', renderLorics);
    subscribe('edition-changed', onRoleSetChanged);
    subscribe('custom-roles-changed', onRoleSetChanged);
    renderFabled();
    renderLorics();
}
