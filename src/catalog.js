import { localize } from './i18n.js';

let editions = [];

export function setCatalog(data) {
    editions = Array.isArray(data?.editions) ? data.editions : [];
}

/**
 * Role names for the suggestion list, alphabetical and without duplicates.
 * "experimental" deliberately has no fixed set of its own in roles.json –
 * for that (and for any unknown edition), all roles are suggested.
 */
export function getRoleNames(editionId) {
    const edition = editionId === 'experimental' ? null : editions.find((entry) => entry.id === editionId);
    const roles = edition ? edition.roles : editions.flatMap((entry) => entry.roles);
    const names = roles.map((role) => localize(role.name));

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/** Looks up a role by its displayed name, in both languages. */
function findRoleByName(tagText) {
    const needle = tagText.trim().toLowerCase();

    return editions
        .flatMap((entry) => entry.roles)
        .find((candidate) => candidate.name.de.toLowerCase() === needle || candidate.name.en.toLowerCase() === needle)
        ?? null;
}

/**
 * A stable, language-independent key for a role tag: the role `id` for
 * known roles or today's trim+lowercase fallback for unrecognized text.
 */
export function getRoleId(tagText) {
    const role = findRoleByName(tagText);

    return role ? role.id : tagText.trim().toLowerCase();
}

/**
 * Returns a role's description by its displayed name – in both languages,
 * since a tag may have been entered in a different language than the UI
 * currently shows. `null` if no catalog entry matches (e.g. a freely typed
 * tag).
 */
export function findRoleDescription(tagText) {
    const role = findRoleByName(tagText);

    return role ? localize(role.description) : null;
}

/**
 * Normalizes a tag to the currently active UI language.
 * Also used to re-translate an already-stored tag for display when the
 * active language changes.
 * Unrecognized text is kept as-is (trimmed).
 */
export function normalizeRoleName(tagText) {
    const trimmed = tagText.trim();
    const role = findRoleByName(trimmed);

    return role ? localize(role.name) : trimmed;
}

/**
 * The role's team ("townsfolk"/"outsider"/"minion"/"demon"/"traveller"),
 * looked up in both languages. `null` if no catalog entry matches.
 */
export function getRoleTeam(tagText) {
    const role = findRoleByName(tagText);

    return role ? role.team : null;
}

/**
 * Known roles that alter the base outsider count (currently only the
 * Baron, [+2 Outsiders]) – a small, explicit table instead of a dedicated
 * roles.json field, since this is so far the only such case in the catalog.
 */
const OUTSIDER_MODIFIERS = { Baron: 2 };

/** This role's modifier to the outsider count, 0 if none is known. */
export function getOutsiderModifier(tagText) {
    const role = findRoleByName(tagText);

    return role ? OUTSIDER_MODIFIERS[role.name.en] ?? 0 : 0;
}
