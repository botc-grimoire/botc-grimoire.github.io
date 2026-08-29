export const BOARD_KEY = 'botc.board';
export const EDITION_KEY = 'botc.edition';
export const FABLED_KEY = 'botc.fabled';
export const LORICS_KEY = 'botc.lorics';
export const ROSTER_KEY = 'botc.roster';

export function load(key, fallback) {
    let raw = null;

    try {
        raw = window.localStorage.getItem(key);
    } catch (error) {
        console.warn(`[botc] localStorage nicht verfügbar (${key}):`, error);

        return fallback;
    }

    if (raw === null) {
        return fallback;
    }

    try {
        const value = JSON.parse(raw);

        return value === null ? fallback : value;
    } catch (error) {
        console.warn(`[botc] Gespeicherte Daten für ${key} sind defekt und werden verworfen:`, error);
        remove(key);

        return fallback;
    }
}

export function remove(key) {
    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.warn(`[botc] Konnte ${key} nicht löschen:`, error);
    }
}

export function save(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`[botc] Konnte ${key} nicht speichern:`, error);
    }
}
