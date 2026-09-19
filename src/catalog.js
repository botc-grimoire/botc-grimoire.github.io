import { localize } from './i18n.js';
import { CUSTOM_EDITION_ID, getCustomRoleIds } from './state.js';

// Order the glossary's role list, and the "Custom" edition's role picker,
// are grouped in – one section per team.
export const TEAMS = ['townsfolk', 'outsider', 'traveller', 'minion', 'demon'];

let editions = [];

export function setCatalog(data) {
    editions = Array.isArray(data?.editions) ? data.editions : [];
}

/**
 * The roles a given edition offers. "experimental" deliberately has no fixed
 * set of its own in roles.json – for that (and for any unknown edition), all
 * roles across all editions are returned. CUSTOM_EDITION_ID is resolved to
 * whichever roles the user hand-picked (see state.js's getCustomRoleIds()).
 */
function resolveRoles(editionId) {
    if (editionId === CUSTOM_EDITION_ID) {
        const selected = new Set(getCustomRoleIds());

        return editions.flatMap((entry) => entry.roles).filter((role) => selected.has(role.id));
    }

    const edition = editionId === 'experimental' ? null : editions.find((entry) => entry.id === editionId);

    return edition ? edition.roles : editions.flatMap((entry) => entry.roles);
}

/** Role names for the suggestion list, alphabetical and without duplicates. */
export function getRoleNames(editionId) {
    const names = resolveRoles(editionId).map((role) => localize(role.name));

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/**
 * This edition's catalog roles of a given team (one of TEAMS), as {id, name}
 * pairs (name localized to the active language), alphabetically sorted. Used
 * for the settings glossary's role list, grouped by team via <optgroup>.
 */
export function getRolesByTeam(team, editionId) {
    return resolveRoles(editionId)
        .filter((role) => role.team === team)
        .map((role) => ({ id: role.id, name: localize(role.name) }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Every catalog role of a given team, across all editions – used for the
 * "Custom" edition's role picker, which lets the user choose from the full
 * catalog regardless of any edition (unlike getRolesByTeam(), this never
 * narrows by the currently selected custom roles).
 */
export function getAllRolesByTeam(team) {
    return editions
        .flatMap((entry) => entry.roles)
        .filter((role) => role.team === team)
        .map((role) => ({ id: role.id, name: localize(role.name) }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/** The full catalog entry for a role id (unlocalized), or `null` if unknown. */
export function getRoleById(id) {
    return editions.flatMap((entry) => entry.roles).find((role) => role.id === id) ?? null;
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
