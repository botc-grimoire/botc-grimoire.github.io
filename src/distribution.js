import { getBoardPlayers, getDay, subscribe } from './state.js';
import { getRoleId, getRoleModifier, getRoleTeam, getUndeterminedTeams } from './catalog.js';

/**
 * Official Grimoire distribution by player count WITHOUT travellers (5–15
 * players). Outside this range there is no official rule – the display
 * then shows "–" instead of guessing a number. Per the official rules,
 * travellers don't count toward the base distribution but are tracked
 * separately (excess players become travellers).
 */
const DISTRIBUTION_BY_PLAYER_COUNT = {
    5: { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 },
    6: { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 },
    7: { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 },
    8: { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 },
    9: { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 },
    10: { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 },
    11: { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 },
    12: { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 },
    13: { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 },
    14: { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 },
    15: { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 }
};

/** Riot only takes effect from day 3 onward (see ability text: "On day 3..."). */
const RIOT_DAY = 3;

let badge = null;

/**
 * Number of distinct roles of a team that are currently tagged anywhere.
 * Counts by role name, not by player: e.g. if two players are both tagged
 * as "Butler", that role still only exists once in the actual game.
 */
function countDistinctRoles(players, team) {
    const seen = new Set();

    players.forEach((entry) => {
        entry.roles.forEach((role) => {
            const key = getRoleId(role);

            if (!seen.has(key) && getRoleTeam(role) === team) {
                seen.add(key);
            }
        });
    });

    return seen.size;
}

/**
 * Number of players who carry (at least) one traveller role. Counts by
 * player, not by role name: whether a traveller is tagged depends on the
 * person at the table, not on a role that exists in limited supply in the
 * game.
 */
function countTravellerPlayers(players) {
    return players.filter((entry) => entry.roles.some((role) => getRoleTeam(role) === 'traveller')).length;
}

/** Whether any tagged role resolves to the given catalog role id. */
function hasRoleId(players, id) {
    return players.some((entry) => entry.roles.some((role) => getRoleId(role) === id));
}

/**
 * Combined {min, max} bonus for one team (outsider/minion/demon) from known
 * roles like the Baron. Counts each known modifier role only once, regardless
 * of how often/on how many players it appears as a tag – in the actual game
 * it only exists once anyway. Per the official rules, these roles trade
 * Townsfolk for the other team (or vice versa), so they don't change the
 * total player count.
 */
function countTeamBonus(players, team) {
    const seen = new Set();
    let min = 0;
    let max = 0;

    players.forEach((entry) => {
        entry.roles.forEach((role) => {
            const modifier = getRoleModifier(role);
            const key = getRoleId(role);

            if (modifier && modifier.team === team && !seen.has(key)) {
                seen.add(key);
                min += modifier.min;
                max += modifier.max;
            }
        });
    });

    return { min, max };
}

/** Union of teams that any currently tagged role makes unpredictable (see catalog.js). */
function collectUndeterminedTeams(players) {
    const teams = new Set();

    players.forEach((entry) => {
        entry.roles.forEach((role) => {
            getUndeterminedTeams(role).forEach((team) => teams.add(team));
        });
    });

    return teams;
}

/**
 * Formats a base count adjusted by a {min, max} bonus as "n" or "lo-hi".
 * Clamped at 0 – e.g. Godfather's "-1 or +1 Outsider" can't actually remove
 * an Outsider from a base distribution that has none.
 */
function formatRange(base, min, max) {
    const lo = Math.max(0, base + min);
    const hi = Math.max(0, base + max);

    return lo === hi ? `${lo}` : `[${lo}-${hi}]`;
}

/**
 * Legion's own line: "the recommended number of good and evil players is the
 * reverse of the normal" – i.e. the normal evil count (Minions + Demons)
 * becomes the good count, and the normal good count (Townsfolk + Outsiders)
 * becomes the number of Legion. This replaces the usual four-team badge
 * entirely, since Legion has no separate Minion/Demon split of its own.
 */
function renderLegion(players, table) {
    const currentGood = countDistinctRoles(players, 'townsfolk') + countDistinctRoles(players, 'outsider');
    const currentEvil = countDistinctRoles(players, 'minion') + countDistinctRoles(players, 'demon');
    const expectedGood = table === undefined ? '–' : table.minions + table.demons;
    const expectedEvil = table === undefined ? '–' : table.townsfolk + table.outsiders;

    badge.textContent = `${currentGood} / ${expectedGood} - ${currentEvil} / ${expectedEvil}`;
}

function render() {
    const players = getBoardPlayers();
    const travellers = countTravellerPlayers(players);
    const table = DISTRIBUTION_BY_PLAYER_COUNT[players.length - travellers];

    if (hasRoleId(players, 'legion')) {
        renderLegion(players, table);
        return;
    }

    // Riot: "On day 3, Minions become Riot" – from then on every Minion slot
    // is an additional Demon instead.
    const effectiveTable = table === undefined ? undefined : { ...table };

    if (effectiveTable !== undefined && hasRoleId(players, 'riot') && getDay() >= RIOT_DAY) {
        effectiveTable.demons += effectiveTable.minions;
        effectiveTable.minions = 0;
    }

    const outsiderBonus = countTeamBonus(players, 'outsider');
    const minionBonus = countTeamBonus(players, 'minion');
    const demonBonus = countTeamBonus(players, 'demon');

    // Atheist: "remove all evil character tokens and add Townsfolk or
    // Outsider character tokens to match the player count" – Minions and
    // Demon become 0, and the Storyteller may turn any of those freed slots
    // into Outsiders instead of Townsfolk.
    if (effectiveTable !== undefined && hasRoleId(players, 'atheist')) {
        const freed = effectiveTable.minions + effectiveTable.demons;

        minionBonus.min -= effectiveTable.minions;
        minionBonus.max -= effectiveTable.minions;
        demonBonus.min -= effectiveTable.demons;
        demonBonus.max -= effectiveTable.demons;
        outsiderBonus.max += freed;
    }

    const combinedMin = outsiderBonus.min + minionBonus.min + demonBonus.min;
    const combinedMax = outsiderBonus.max + minionBonus.max + demonBonus.max;

    const currentTownsfolk = countDistinctRoles(players, 'townsfolk');
    const currentOutsiders = countDistinctRoles(players, 'outsider');

    const undetermined = collectUndeterminedTeams(players);

    const expectedTownsfolk = effectiveTable === undefined
        ? '–'
        : undetermined.size > 0 ? '?' : formatRange(effectiveTable.townsfolk, -combinedMax, -combinedMin);
    const expectedOutsiders = effectiveTable === undefined
        ? '–'
        : undetermined.has('outsider') ? '?' : formatRange(effectiveTable.outsiders, outsiderBonus.min, outsiderBonus.max);
    const expectedMinions = effectiveTable === undefined
        ? '–'
        : undetermined.has('minion') ? '?' : formatRange(effectiveTable.minions, minionBonus.min, minionBonus.max);
    const expectedDemons = effectiveTable === undefined
        ? '–'
        : undetermined.has('demon') ? '?' : formatRange(effectiveTable.demons, demonBonus.min, demonBonus.max);

    badge.textContent
        = `${currentTownsfolk} / ${expectedTownsfolk} - ${currentOutsiders} / ${expectedOutsiders}`
        + ` - ${travellers} - ${expectedMinions} - ${expectedDemons}`;
}

export function initDistribution() {
    badge = document.getElementById('team-distribution');

    subscribe('board-changed', render);
    render();
}
