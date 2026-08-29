import { getBoardPlayers, subscribe } from './state.js';
import { getOutsiderModifier, getRoleId, getRoleTeam } from './catalog.js';

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

/**
 * Bonus from known roles like the Baron. Counts each known modifier role
 * only once, regardless of how often/on how many players it appears as a
 * tag – in the actual game it only exists once anyway. Per the official
 * rules, the Baron trades Townsfolk for Outsiders, so it doesn't change the
 * total player count.
 */
function countOutsiderBonus(players) {
    const seen = new Set();
    let bonus = 0;

    players.forEach((entry) => {
        entry.roles.forEach((role) => {
            const modifier = getOutsiderModifier(role);
            const key = getRoleId(role);

            if (modifier > 0 && !seen.has(key)) {
                seen.add(key);
                bonus += modifier;
            }
        });
    });

    return bonus;
}

function render() {
    const players = getBoardPlayers();
    const travellers = countTravellerPlayers(players);
    const table = DISTRIBUTION_BY_PLAYER_COUNT[players.length - travellers];
    const bonus = countOutsiderBonus(players);

    const currentTownsfolk = countDistinctRoles(players, 'townsfolk');
    const currentOutsiders = countDistinctRoles(players, 'outsider');
    const expectedTownsfolk = table === undefined ? '–' : table.townsfolk - bonus;
    const expectedOutsiders = table === undefined ? '–' : table.outsiders + bonus;
    const expectedMinions = table === undefined ? '–' : table.minions;
    const expectedDemons = table === undefined ? '–' : table.demons;

    badge.textContent = `${currentTownsfolk} / ${expectedTownsfolk} - ${currentOutsiders} / ${expectedOutsiders} - ${travellers} - ${expectedMinions} - ${expectedDemons}`;
}

export function initDistribution() {
    badge = document.getElementById('team-distribution');

    subscribe('board-changed', render);
    render();
}
