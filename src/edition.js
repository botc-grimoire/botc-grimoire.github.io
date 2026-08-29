import { EDITIONS, getEdition, setEdition } from './state.js';

/**
 * Options are deliberately kept outside of i18n: edition names are proper
 * nouns and, per spec, are shown in English even in the German UI.
 */
function buildOptions(select) {
    select.replaceChildren();

    EDITIONS.forEach(({ id, label }) => {
        const option = document.createElement('option');

        option.value = id;
        option.textContent = label;
        select.append(option);
    });
}

export function initEdition() {
    const select = document.getElementById('edition-select');

    buildOptions(select);
    select.value = getEdition();
    select.addEventListener('change', () => setEdition(select.value));
}
