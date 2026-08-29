import { DEFAULT_DAY, getDay, setDay, subscribe } from './state.js';

let decrementButton = null;
let incrementButton = null;
let valueOutput = null;

function render() {
    const day = getDay();

    valueOutput.textContent = String(day);
    decrementButton.disabled = day <= DEFAULT_DAY;
}

export function initDayCounter() {
    decrementButton = document.getElementById('day-counter-decrement');
    incrementButton = document.getElementById('day-counter-increment');
    valueOutput = document.getElementById('day-counter-value');

    decrementButton.addEventListener('click', () => setDay(getDay() - 1));
    incrementButton.addEventListener('click', () => setDay(getDay() + 1));

    subscribe('board-changed', render);
    render();
}
