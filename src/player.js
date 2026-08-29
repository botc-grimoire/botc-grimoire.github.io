import { t } from './i18n.js';

/** Display name – the own player doesn't have one, instead showing "Ich"/"Me". */
export function displayName(player) {
    return player.isSelf ? t('player.self') : player.name;
}

/** First three characters of the name – also works with emoji/umlauts. */
export function initial(name) {
    const chars = [...name.trim()].slice(0, 3).join('');

    return (chars || '?').toUpperCase();
}

/** Label in the circle: three letters, or the whole word for the own token. */
export function tokenLabel(player) {
    return player.isSelf ? t('player.self') : initial(player.name);
}
