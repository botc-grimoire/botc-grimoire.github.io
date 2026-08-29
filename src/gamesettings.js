import { FABLED, LORICS, addFabled, addLoric, getActiveFabled, getActiveLorics, removeFabled, removeLoric, subscribe } from './state.js';
import { localize, t } from './i18n.js';

let dialog = null;
let fabledAddSelect = null;
let fabledList = null;
let loricAddSelect = null;
let loricList = null;

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

export function openGameSettings() {
    dialog.showModal();
}

export function initGameSettings() {
    dialog = document.getElementById('game-settings-dialog');
    fabledAddSelect = document.getElementById('fabled-add-select');
    fabledList = document.getElementById('fabled-list');
    loricAddSelect = document.getElementById('loric-add-select');
    loricList = document.getElementById('loric-list');

    document.getElementById('game-settings-open').addEventListener('click', openGameSettings);
    document.getElementById('game-settings-close').addEventListener('click', () => dialog.close());

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

    subscribe('fabled-changed', renderFabled);
    subscribe('lorics-changed', renderLorics);
    renderFabled();
    renderLorics();
}
