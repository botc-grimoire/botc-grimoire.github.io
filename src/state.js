import { BOARD_KEY, EDITION_KEY, FABLED_KEY, LORICS_KEY, ROSTER_KEY, load, save } from './storage.js';

export const PALETTE = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6',
    '#1abc9c', '#e67e22', '#ec7fb0', '#16a085', '#95a5a6'
];

// Order is deliberately from "evil" to "good" – the UI displays it exactly like this.
export const TRUST_LEVELS = ['evil', 'suspect', 'unknown', 'maybe-good', 'good'];

export const DEFAULT_TRUST = 'unknown';

export const LIFE_ALIVE = 'alive';

// "exiled" only applies to Travellers; details.js decides per player whether
// to offer "executed" or "exiled" as the selectable option.
export const LIFE_STATES = [LIFE_ALIVE, 'murdered', 'executed', 'exiled'];

/**
 * The own player is not an entry in the player list: it is never created,
 * renamed, or deleted, but exists as a fixed board entry with this reserved
 * id. Starting position bottom center – the player's own seat.
 */
export const SELF_ID = 'self';

const SELF_COLOR = '#ffffff';
const SELF_X = 50;
const SELF_Y = 88;

/**
 * Editions are deliberately kept in English, even in the German UI – that's
 * simply what the sets are called. Order as requested; "experimental" is the
 * default value.
 */
export const EDITIONS = [
    { id: 'trouble-brewing', label: 'Trouble Brewing' },
    { id: 'bad-moon-rising', label: 'Bad Moon Rising' },
    { id: 'sects-violets', label: 'Sects & Violets' },
    { id: 'travellers', label: 'Travellers' },
    { id: 'experimental', label: 'Experimental' }
];

export const DEFAULT_EDITION = 'experimental';

/**
 * Lorics are not characters that players get assigned, but special rules for
 * the Storyteller – hence a separate, small catalog instead of
 * data/roles.json, but using the same {de, en} name/text format, resolved via
 * localize(). Source (original English text): the BotC wiki. There is no
 * official German terminology for "Loric" – the German names/texts are
 * original translations, not official terms.
 */
export const LORICS = [
    {
        description: {
            de: 'Jeder Nominierte wählt einen Spieler: Bis zur Abstimmung darf nur dieser sprechen und muss behaupten, dass der Nominierte gut ist, sonst könnte er sterben.',
            en: 'Each nominee chooses a player: until voting, only they may speak & they are mad the nominee is good or they might die.'
        },
        id: 'big-wig',
        name: { de: 'Hohes Tier', en: 'Big Wig' }
    },
    {
        description: {
            de: 'Dieses Skript enthält Homebrew-Charaktere oder -Regeln.',
            en: 'This script has homebrew characters or rules.'
        },
        id: 'bootlegger',
        name: { de: 'Schwarzbrenner', en: 'Bootlegger' }
    },
    {
        description: {
            de: 'Der Erzähler weist allen Spielern ihre Rollen selbst zu.',
            en: "The Storyteller assigns all players' characters."
        },
        id: 'gardener',
        name: { de: 'Gärtner', en: 'Gardener' }
    },
    {
        description: {
            de: 'Ein Ug-Hut. Wer Ug-Hut tragen, nur ein Laut sprechen dürfen, aber zwei Stimmen haben. Bei Fehler, Ug-Hut weitergeben.',
            en: 'One Ug hat. When wear Ug hat, must speak one sound at a time but vote twice. If fail, pass Ug hat.'
        },
        id: 'god-of-ug',
        name: { de: 'Gott von Ug', en: 'God of Ug' }
    },
    {
        description: {
            de: 'Die ersten 4 sterbenden Spieler werden sofort als Reisende derselben Gesinnung wiedergeboren.',
            en: 'The first 4 players to die are immediately reincarnated as Travellers of the same alignment.'
        },
        id: 'hindu',
        name: { de: 'Hindu', en: 'Hindu' }
    },
    {
        description: {
            de: 'Es gibt 2 Erzähler: einer lügt, einer sagt die Wahrheit. Einmal pro Spiel, bei Einbruch der Dunkelheit, dürfen sie tauschen.',
            en: 'There are 2 Storytellers: one lies & one tells the truth. Once per game, at dusk, they might switch.'
        },
        id: 'knaves',
        name: { de: 'Schurken', en: 'Knaves' }
    },
    {
        description: {
            de: 'Es sind doppelte gute Rollen im Spiel. Sie könnten auch bluffen.',
            en: 'There are duplicate good characters in play. They might also be bluffs.'
        },
        id: 'pope',
        name: { de: 'Papst', en: 'Pope' }
    },
    {
        description: {
            de: 'Nenne eine gute Rolle. Ist sie im Spiel, kann sie nur durch Hinrichtung sterben, aber die Bösen erfahren, welcher Spieler es ist.',
            en: 'Name a good character. If in play, they can only die by execution, but evil players learn which player it is.'
        },
        id: 'storm-catcher',
        name: { de: 'Sturmfänger', en: 'Storm Catcher' }
    },
    {
        description: {
            de: 'Spieler kennen ihre Rolle und Gesinnung nicht. Sie erfahren sie erst, wenn sie sterben.',
            en: "Players don't know their character or alignment. They learn them when they die."
        },
        id: 'tor',
        name: { de: 'Tor', en: 'Tor' }
    },
    {
        description: {
            de: 'Ist ein Spieler bei seiner Nominierung mit einer neuen Rolle vermerkt, stirbt er bei heutiger Hinrichtung womöglich nicht.',
            en: 'If a player is mad as a fresh character during their nomination, they might not die if executed today.'
        },
        id: 'ventriloquist',
        name: { de: 'Bauchredner', en: 'Ventriloquist' }
    },
    {
        description: {
            de: 'Ein oder mehrere Spieler haben je ein Ziel. Wird es erreicht, erfährt dieser Spieler eine wahre Information.',
            en: 'One or more players each have a goal. When achieved, that player learns a piece of true info.'
        },
        id: 'zenomancer',
        name: { de: 'Zenomant', en: 'Zenomancer' }
    }
];

/**
 * Like Lorics, Fabled are not characters that players get assigned, but
 * special rules for the Storyteller – hence the same kind of separate catalog
 * instead of data/roles.json. Source: official Fabled characters from the
 * BotC wiki.
 */
export const FABLED = [
    {
        description: {
            de: 'Wenn ein neuer Spieler stirbt, könnte demjenigen etwas Schlimmes passieren, der dafür am meisten verantwortlich ist.',
            en: 'Something bad might happen to whoever is most responsible for the death of a new player.'
        },
        id: 'angel',
        name: { de: 'Engel', en: 'Angel' }
    },
    {
        description: {
            de: 'In den ersten 2 Minuten jedes Tages dürfen Spieler mit Spielerfahrung (Veteranen) nicht sprechen.',
            en: 'For the first 2 minutes of each day, veteran players may not talk.'
        },
        id: 'buddhist',
        name: { de: 'Buddhist', en: 'Buddhist' }
    },
    {
        description: {
            de: 'Leben 4 oder mehr Spieler, darf jeder lebende Spieler einmal pro Spiel öffentlich bestimmen, dass ein Spieler der eigenen Gesinnung stirbt.',
            en: 'If 4 or more players live, each living player may publicly choose (once per game) that a player of their own alignment dies.'
        },
        id: 'doomsayer',
        name: { de: 'Unheilsverkünder', en: 'Doomsayer' }
    },
    {
        description: {
            de: 'Einmal pro Spiel wählt der Dämon heimlich einen gegnerischen Spieler: alle Spieler bestimmen, welcher der beiden gewinnt.',
            en: 'Once per game, the Demon secretly chooses an opposing player: all players choose which of these 2 players win.'
        },
        id: 'fiddler',
        name: { de: 'Geiger', en: 'Fiddler' }
    },
    {
        description: {
            de: 'Wer spricht, nachdem der Erzähler um Ruhe gebeten hat, dem könnte etwas Schlimmes passieren.',
            en: 'Something bad might happen to whoever talks when the Storyteller has asked for silence.'
        },
        id: 'hells_librarian',
        name: { de: 'Bibliothekarin der Hölle', en: "Hell's Librarian" }
    },
    {
        description: {
            de: 'Von zwei benachbarten Spielern ist bekannt, dass sie dieselbe Gesinnung haben. Einmal pro Spiel registriert einer von ihnen falsch.',
            en: '2 neighboring players are known to be the same alignment. Once per game, 1 of them registers falsely.'
        },
        id: 'revolutionary',
        name: { de: 'Revolutionär', en: 'Revolutionary' }
    },
    {
        description: {
            de: 'Der Dämon darf darauf verzichten anzugreifen und muss dies mindestens einmal pro Spiel tun. Böse Spieler erhalten normale Startinformationen.',
            en: 'The Demon may choose not to attack & must do this at least once per game. Evil players get normal starting info.'
        },
        id: 'toymaker',
        name: { de: 'Spielzeugmacher', en: 'Toymaker' }
    },
    {
        description: {
            de: 'Die Sonderregel des Dschinns gilt. Alle Spieler kennen diese Regel.',
            en: "Use the Djinn's special rule. All players know what it is."
        },
        id: 'djinn',
        name: { de: 'Dschinn', en: 'Djinn' }
    },
    {
        description: {
            de: 'An jedem Tag dürfen dich 3 Spieler besuchen. In der folgenden Nacht erfährt jeder Besucher, wie viele Besucher böse sind, aber einer davon erhält eine falsche Information.',
            en: 'Each day, 3 players may choose to visit you. At night*, each visitor learns how many visitors are evil, but 1 gets false info.'
        },
        id: 'duchess',
        name: { de: 'Herzogin', en: 'Duchess' }
    },
    {
        description: {
            de: 'Einmal pro Spiel könnte ein guter Spieler eine falsche Information erhalten.',
            en: 'Once per game, 1 good player might get incorrect information.'
        },
        id: 'fibbin',
        name: { de: 'Fibbin', en: 'Fibbin' }
    },
    {
        description: {
            de: 'Es könnte ein Außenseiter mehr oder weniger im Spiel sein.',
            en: 'There might be 1 extra or 1 fewer Outsider in play.'
        },
        id: 'sentinel',
        name: { de: 'Wächter', en: 'Sentinel' }
    },
    {
        description: {
            de: 'Es kann höchstens einen zusätzlichen bösen Spieler geben.',
            en: "There can't be more than 1 extra evil player."
        },
        id: 'spirit_of_ivory',
        name: { de: 'Geist aus Elfenbein', en: 'Spirit of Ivory' }
    },
    {
        description: {
            de: 'Mindestens einmal pro Spiel macht der Erzähler einen Fehler, korrigiert ihn und gibt ihn öffentlich zu.',
            en: 'At least once per game, the Storyteller will make a mistake, correct it, and publicly admit to it.'
        },
        id: 'deus_ex_fiasco',
        name: { de: 'Deus ex Fiasco', en: 'Deus ex Fiasco' }
    },
    {
        description: {
            de: 'Am letzten Tag erhalten alle toten Spieler ihr Stimmrecht zurück.',
            en: 'On the final day, all dead players regain their vote token.'
        },
        id: 'ferryman',
        name: { de: 'Fährmann', en: 'Ferryman' }
    }
];

const events = new EventTarget();

let board = normalizeBoard(load(BOARD_KEY, null));
let edition = normalizeEdition(load(EDITION_KEY, DEFAULT_EDITION));
let fabled = normalizeFabled(load(FABLED_KEY, []));
let lorics = normalizeLorics(load(LORICS_KEY, []));
let roster = normalizeRoster(load(ROSTER_KEY, null));

/* ---------------------------------------------------------------------- Helpers */

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function createId() {
    if (window.crypto?.randomUUID) {
        return `p-${window.crypto.randomUUID()}`;
    }

    return `p-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function createBoardEntry(playerId, x, y) {
    return {
        actions: [],
        claims: [],
        lifeState: LIFE_ALIVE,
        notes: '',
        pings: [],
        playerId,
        roles: [],
        trust: DEFAULT_TRUST,
        x: clamp(x, 0, 100),
        y: clamp(y, 0, 100)
    };
}

function emit(name) {
    events.dispatchEvent(new CustomEvent(name));
}

/**
 * Default role-comparison key when no catalog-aware canonicalizer is
 * supplied: today's behavior, trim+lowercase. state.js stays free of any
 * catalog/i18n dependency (it's tested standalone, without a loaded
 * catalog) – callers that know about the role catalog pass catalog.js's
 * getRoleId() instead, so e.g. "Waschweib" and "Washerwoman" compare equal.
 */
function defaultCanonicalize(text) {
    return text.trim().toLowerCase();
}

/** Trims, drops empty values, and deduplicates case-insensitively. */
function normalizeRoleTags(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    const seen = new Set();
    const roles = [];

    value.forEach((item) => {
        const trimmed = typeof item === 'string' ? item.trim() : '';
        const key = trimmed.toLowerCase();

        if (trimmed === '' || seen.has(key)) {
            return;
        }

        seen.add(key);
        roles.push(trimmed);
    });

    return roles;
}

/** Drops entries with the wrong shape; fills in an id if it's missing (legacy data). */
function normalizePings(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const sourcePlayerId = typeof item.sourcePlayerId === 'string' ? item.sourcePlayerId : '';
            const sourceRole = typeof item.sourceRole === 'string' ? item.sourceRole.trim() : '';

            if (sourcePlayerId === '' || sourceRole === '') {
                return null;
            }

            return {
                comment: typeof item.comment === 'string' ? item.comment : '',
                day: Number.isInteger(item.day) && item.day > 0 ? item.day : null,
                id: typeof item.id === 'string' && item.id !== '' ? item.id : createId(),
                sourceColor: typeof item.sourceColor === 'string' ? item.sourceColor : PALETTE[0],
                sourceName: typeof item.sourceName === 'string' ? item.sourceName : '',
                sourcePlayerId,
                sourceRole
            };
        })
        .filter((ping) => ping !== null);
}

function normalizeBoard(value) {
    const source = value && typeof value === 'object' ? value : {};
    const stored = Array.isArray(source.players) ? source.players : [];
    const players = stored
        .filter((entry) => entry && typeof entry.playerId === 'string')
        .map((entry) => ({
            actions: Array.isArray(entry.actions) ? entry.actions : [],
            claims: Array.isArray(entry.claims) ? entry.claims : [],
            lifeState: LIFE_STATES.includes(entry.lifeState) ? entry.lifeState : LIFE_ALIVE,
            notes: typeof entry.notes === 'string' ? entry.notes : '',
            pings: normalizePings(entry.pings),
            playerId: entry.playerId,
            roles: normalizeRoleTags(entry.roles),
            trust: TRUST_LEVELS.includes(entry.trust) ? entry.trust : DEFAULT_TRUST,
            x: clamp(Number(entry.x) || 0, 0, 100),
            y: clamp(Number(entry.y) || 0, 0, 100)
        }));

    // Guarantees exactly one own token, always in first place.
    const self = players.find((entry) => entry.playerId === SELF_ID)
        ?? createBoardEntry(SELF_ID, SELF_X, SELF_Y);

    return {
        locked: source.locked === true,
        players: [self, ...players.filter((entry) => entry.playerId !== SELF_ID)]
    };
}

function normalizeEdition(value) {
    return EDITIONS.some((entry) => entry.id === value) ? value : DEFAULT_EDITION;
}

/** Drops unknown/duplicate ids, keeps the order of first occurrence. */
function normalizeFabled(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    const seen = new Set();
    const ids = [];

    value.forEach((id) => {
        if (typeof id === 'string' && !seen.has(id) && FABLED.some((entry) => entry.id === id)) {
            seen.add(id);
            ids.push(id);
        }
    });

    return ids;
}

/** Drops unknown/duplicate ids, keeps the order of first occurrence. */
function normalizeLorics(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    const seen = new Set();
    const ids = [];

    value.forEach((id) => {
        if (typeof id === 'string' && !seen.has(id) && LORICS.some((loric) => loric.id === id)) {
            seen.add(id);
            ids.push(id);
        }
    });

    return ids;
}

function normalizeRoster(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((entry) => entry && typeof entry.id === 'string' && typeof entry.name === 'string')
        .map((entry) => ({
            color: /^#[0-9a-f]{6}$/i.test(entry.color) ? entry.color : PALETTE[0],
            id: entry.id,
            name: entry.name
        }));
}

function persistBoard() {
    save(BOARD_KEY, board);
    emit('board-changed');
}

function persistEdition() {
    save(EDITION_KEY, edition);
    emit('edition-changed');
}

function persistFabled() {
    save(FABLED_KEY, fabled);
    emit('fabled-changed');
}

function persistLorics() {
    save(LORICS_KEY, lorics);
    emit('lorics-changed');
}

function persistRoster() {
    save(ROSTER_KEY, roster);
    emit('roster-changed');
}

/* -------------------------------------------------------------------- Players */

export function addRosterPlayer(name) {
    const trimmed = name.trim();

    if (trimmed === '') {
        return null;
    }

    // Names may repeat – identification happens via the internal id.
    const player = {
        color: PALETTE[roster.length % PALETTE.length],
        id: createId(),
        name: trimmed
    };

    roster.push(player);
    persistRoster();

    return player;
}

export function getPlayer(id) {
    if (id === SELF_ID) {
        // Not a list entry: name stays empty, the view fills in "Ich" resp. "Me".
        return { color: SELF_COLOR, id: SELF_ID, isSelf: true, name: null };
    }

    return roster.find((player) => player.id === id) ?? null;
}

export function getRoster() {
    return [...roster].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function renamePlayer(id, name) {
    const player = id === SELF_ID ? null : getPlayer(id);
    const trimmed = name.trim();

    if (!player || trimmed === '') {
        return false;
    }

    player.name = trimmed;
    persistRoster();

    return true;
}

export function removeRosterPlayer(id) {
    if (id === SELF_ID) {
        return;
    }

    roster = roster.filter((player) => player.id !== id);
    persistRoster();
    removeFromBoard(id);
}

export function setPlayerColor(id, color) {
    const player = id === SELF_ID ? null : getPlayer(id);

    if (!player || !/^#[0-9a-f]{6}$/i.test(color)) {
        return;
    }

    player.color = color;
    persistRoster();
}

/* ------------------------------------------------------------------ Edition */

// A separate storage slot, like the player list: "clear board" only affects
// the game state, not the setup decision of which edition is being played.
export function getEdition() {
    return edition;
}

export function setEdition(value) {
    if (!EDITIONS.some((entry) => entry.id === value) || value === edition) {
        return;
    }

    edition = value;
    persistEdition();
}

/* ------------------------------------------------------------------- Fabled */

// A separate storage slot, like the edition: a setup decision that "clear
// board" does not affect.
export function addFabled(id) {
    if (fabled.includes(id) || !FABLED.some((entry) => entry.id === id)) {
        return;
    }

    fabled.push(id);
    persistFabled();
}

/** The currently active Fabled, resolved to full catalog entries. */
export function getActiveFabled() {
    return fabled
        .map((id) => FABLED.find((entry) => entry.id === id))
        .filter((entry) => entry !== undefined);
}

export function removeFabled(id) {
    const before = fabled.length;

    fabled = fabled.filter((existing) => existing !== id);

    if (fabled.length !== before) {
        persistFabled();
    }
}

/* -------------------------------------------------------------------- Loric */

// A separate storage slot, like the edition: a setup decision that "clear
// board" does not affect.
export function addLoric(id) {
    if (lorics.includes(id) || !LORICS.some((loric) => loric.id === id)) {
        return;
    }

    lorics.push(id);
    persistLorics();
}

/** The currently active Lorics, resolved to full catalog entries. */
export function getActiveLorics() {
    return lorics
        .map((id) => LORICS.find((loric) => loric.id === id))
        .filter((loric) => loric !== undefined);
}

export function removeLoric(id) {
    const before = lorics.length;

    lorics = lorics.filter((existing) => existing !== id);

    if (lorics.length !== before) {
        persistLorics();
    }
}

/* --------------------------------------------------------------------- Board */

/**
 * `sourcePlayerId`/`sourceRole` reference a current role tag of some (any)
 * board player – the source of the ping, not its target. The source's color
 * and display name are stored as a fallback in case the source is later
 * removed from the roster (role tags have no stable id, so `sourceRole`
 * always remains a plain snapshot).
 */
export function addPing(playerId, { sourcePlayerId, sourceRole, day, comment }, canonicalize = defaultCanonicalize) {
    const entry = getBoardEntry(playerId);
    const source = getPlayer(sourcePlayerId);
    const trimmedRole = typeof sourceRole === 'string' ? sourceRole.trim() : '';

    if (!entry || !source || trimmedRole === '') {
        return null;
    }

    const normalizedDay = Number.isInteger(day) && day > 0 ? day : null;
    const normalizedComment = typeof comment === 'string' ? comment : '';

    // No duplicate entries for the same source on one player: an existing
    // entry is updated instead of duplicated (e.g. when the quick dialog
    // creates the same ping again for a target that was already recorded).
    const existing = entry.pings.find(
        (ping) => ping.sourcePlayerId === sourcePlayerId && canonicalize(ping.sourceRole) === canonicalize(trimmedRole)
    );

    if (existing) {
        existing.comment = normalizedComment;
        existing.day = normalizedDay;
        existing.sourceColor = source.color;
        existing.sourceName = source.name ?? '';
        persistBoard();

        return existing;
    }

    const ping = {
        comment: normalizedComment,
        day: normalizedDay,
        id: createId(),
        sourceColor: source.color,
        sourceName: source.name ?? '',
        sourcePlayerId,
        sourceRole: trimmedRole
    };

    entry.pings.push(ping);
    persistBoard();

    return ping;
}

export function addRole(playerId, role, canonicalize = defaultCanonicalize) {
    const entry = getBoardEntry(playerId);
    const trimmed = typeof role === 'string' ? role.trim() : '';

    if (!entry || trimmed === '' || entry.roles.some((r) => canonicalize(r) === canonicalize(trimmed))) {
        return false;
    }

    entry.roles.push(trimmed);
    persistBoard();

    return true;
}

export function addToBoard(playerId, x, y) {
    if (!getPlayer(playerId) || isOnBoard(playerId)) {
        return;
    }

    board.players.push(createBoardEntry(playerId, x, y));
    persistBoard();
}

/** Angle of a board entry around the board's center, same convention as the placement below (0 = top, clockwise). */
function angleOf(entry) {
    return Math.atan2(entry.x - 50, 50 - entry.y);
}

/**
 * Distributes all players evenly around a ring. The own token always ends up
 * exactly centered on the bottom arc (6 o'clock) – the board is viewed from
 * the visitor's own first-person perspective, with the other players lining
 * up clockwise from there, in their current clockwise order around the
 * board – e.g. after manually dragging them into a seating order – rather
 * than by unrelated array/add order (which would silently swap neighbors).
 * `aspect` is the board's width/height; it's used to turn the ellipse into a
 * circle that looks right.
 */
export function arrangeInCircle(aspect = 1) {
    const count = board.players.length;

    if (count === 0) {
        return;
    }

    // According to normalizeBoard(), "self" is always at index 0; still looked up robustly.
    const selfIndex = board.players.findIndex((entry) => entry.playerId === SELF_ID);
    const selfAngle = selfIndex === -1 ? 0 : angleOf(board.players[selfIndex]);
    const base = 38;
    const radiusX = aspect >= 1 ? base / aspect : base;
    const radiusY = aspect >= 1 ? base : base * aspect;

    const ordered = board.players
        .map((entry, index) => ({
            entry,
            // Self always sorts first (forced to the bottom below); others by
            // their current angle, measured clockwise starting from self.
            relative: index === selfIndex ? -1 : (angleOf(entry) - selfAngle + Math.PI * 2) % (Math.PI * 2)
        }))
        .sort((a, b) => a.relative - b.relative);

    ordered.forEach(({ entry }, rank) => {
        const angle = Math.PI + (rank / count) * Math.PI * 2;

        entry.x = clamp(50 + radiusX * Math.sin(angle), 0, 100);
        entry.y = clamp(50 - radiusY * Math.cos(angle), 0, 100);
    });
    persistBoard();
}

/** Resets the board – only the own token remains, the player list is untouched anyway. */
export function clearBoard() {
    board = normalizeBoard(null);
    persistBoard();
}

export function getBoardEntry(playerId) {
    return board.players.find((entry) => entry.playerId === playerId) ?? null;
}

export function getBoardPlayers() {
    return board.players;
}

/**
 * All currently used (source player, role tag) combinations across all board
 * players, deduplicated. The basis for the board filter list.
 */
export function getPingSources(canonicalize = defaultCanonicalize) {
    const sources = new Map();

    board.players.forEach((entry) => {
        entry.pings.forEach((ping) => {
            const key = `${ping.sourcePlayerId} ${canonicalize(ping.sourceRole)}`;

            if (!sources.has(key)) {
                sources.set(key, {
                    sourceColor: ping.sourceColor,
                    sourceName: ping.sourceName,
                    sourcePlayerId: ping.sourcePlayerId,
                    sourceRole: ping.sourceRole
                });
            }
        });
    });

    return [...sources.values()];
}

/** Target `playerId`s whose ping history has an entry with this source. */
export function getPlayersPingedBy(sourcePlayerId, sourceRole, canonicalize = defaultCanonicalize) {
    return board.players
        .filter((entry) => entry.pings.some(
            (ping) => ping.sourcePlayerId === sourcePlayerId && canonicalize(ping.sourceRole) === canonicalize(sourceRole)
        ))
        .map((entry) => entry.playerId);
}

/**
 * Roles that are currently recorded for more than one player – used to
 * highlight possible bluffs/mix-ups. Keys are built via `canonicalize`
 * (the caller's language-independent role id when supplied, otherwise a
 * lowercased tag).
 */
export function getSharedRoles(canonicalize = defaultCanonicalize) {
    const counts = new Map();

    board.players.forEach((entry) => {
        entry.roles.forEach((role) => {
            const key = canonicalize(role);

            counts.set(key, (counts.get(key) ?? 0) + 1);
        });
    });

    return new Set([...counts].filter(([, count]) => count > 1).map(([key]) => key));
}

export function isLocked() {
    return board.locked;
}

export function isOnBoard(playerId) {
    return getBoardEntry(playerId) !== null;
}

export function removeFromBoard(playerId) {
    if (playerId === SELF_ID) {
        return;
    }

    const before = board.players.length;

    board.players = board.players.filter((entry) => entry.playerId !== playerId);

    if (board.players.length !== before) {
        persistBoard();
    }
}

export function removePing(playerId, pingId) {
    const entry = getBoardEntry(playerId);

    if (!entry) {
        return;
    }

    const before = entry.pings.length;

    entry.pings = entry.pings.filter((ping) => ping.id !== pingId);

    if (entry.pings.length !== before) {
        persistBoard();
    }
}

export function removeRole(playerId, role) {
    const entry = getBoardEntry(playerId);

    if (!entry) {
        return;
    }

    const before = entry.roles.length;

    entry.roles = entry.roles.filter((r) => r !== role);

    if (entry.roles.length !== before) {
        persistBoard();
    }
}

export function setLifeState(playerId, lifeState) {
    const entry = getBoardEntry(playerId);

    if (!entry || !LIFE_STATES.includes(lifeState)) {
        return;
    }

    entry.lifeState = lifeState;
    persistBoard();
}

export function setLocked(locked) {
    board.locked = locked === true;
    persistBoard();
}

export function setNotes(playerId, notes) {
    const entry = getBoardEntry(playerId);

    if (!entry) {
        return;
    }

    entry.notes = notes;
    persistBoard();
}

export function setPosition(playerId, x, y) {
    const entry = getBoardEntry(playerId);

    if (!entry) {
        return;
    }

    entry.x = clamp(x, 0, 100);
    entry.y = clamp(y, 0, 100);
    persistBoard();
}

export function setTrust(playerId, trust) {
    const entry = getBoardEntry(playerId);

    if (!entry || !TRUST_LEVELS.includes(trust)) {
        return;
    }

    entry.trust = trust;
    persistBoard();
}

/**
 * Only changes the fields contained in `patch`. If the source changes,
 * `sourceColor`/`sourceName` are re-resolved from its current state.
 */
export function updatePing(playerId, pingId, patch) {
    const entry = getBoardEntry(playerId);
    const ping = entry?.pings.find((p) => p.id === pingId);

    if (!ping) {
        return;
    }

    if (patch.sourcePlayerId !== undefined || patch.sourceRole !== undefined) {
        const sourcePlayerId = patch.sourcePlayerId ?? ping.sourcePlayerId;
        const sourceRole = patch.sourceRole !== undefined ? patch.sourceRole.trim() : ping.sourceRole;
        const source = getPlayer(sourcePlayerId);

        if (!source || sourceRole === '') {
            return;
        }

        ping.sourceColor = source.color;
        ping.sourceName = source.name ?? '';
        ping.sourcePlayerId = sourcePlayerId;
        ping.sourceRole = sourceRole;
    }

    if (patch.day !== undefined) {
        ping.day = Number.isInteger(patch.day) && patch.day > 0 ? patch.day : null;
    }

    if (patch.comment !== undefined) {
        ping.comment = typeof patch.comment === 'string' ? patch.comment : ping.comment;
    }

    persistBoard();
}

/* -------------------------------------------------------------------- Events */

/** Redraws all views without changing any data – e.g. after a language switch. */
export function refresh() {
    emit('board-changed');
    emit('fabled-changed');
    emit('lorics-changed');
    emit('roster-changed');
}

export function subscribe(name, handler) {
    events.addEventListener(name, handler);
}
