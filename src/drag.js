/**
 * Drag helper based on Pointer Events.
 *
 * The HTML5 Drag & Drop API (dragstart/drop) practically doesn't work on
 * mobile browsers – since smartphones are the primary target, this relies
 * exclusively on Pointer Events. A pointer is held via setPointerCapture so
 * the operation doesn't abort when the finger leaves the element.
 *
 * Below the movement threshold the input counts as a tap, above it as a drag.
 */

const THRESHOLD = 8;

export function draggable(element, options) {
    const {
        canDrag = () => true,
        onDragEnd = () => {},
        onDragMove = () => {},
        onDragStart = () => {},
        onTap = () => {}
    } = options;

    let pointerId = null;
    let dragging = false;
    let startX = 0;
    let startY = 0;

    function finish(event, cancelled) {
        if (pointerId === null) {
            return;
        }

        if (element.hasPointerCapture(pointerId)) {
            element.releasePointerCapture(pointerId);
        }

        pointerId = null;

        if (dragging) {
            dragging = false;
            onDragEnd(buildState(event), cancelled);
        } else if (!cancelled) {
            onTap(event);
        }
    }

    function buildState(event) {
        return {
            dx: event.clientX - startX,
            dy: event.clientY - startY,
            event,
            startX,
            startY,
            x: event.clientX,
            y: event.clientY
        };
    }

    element.addEventListener('pointerdown', (event) => {
        if (pointerId !== null) {
            return;
        }

        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        // Buttons & inputs inside the element should stay normally clickable.
        if (event.target.closest('[data-no-drag]')) {
            return;
        }

        try {
            element.setPointerCapture(event.pointerId);
        } catch (error) {
            // Pointer no longer active – so there's nothing to drag either.
            return;
        }

        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        event.preventDefault();
    });

    element.addEventListener('pointermove', (event) => {
        if (event.pointerId !== pointerId) {
            return;
        }

        const state = buildState(event);

        if (!dragging) {
            if (Math.hypot(state.dx, state.dy) < THRESHOLD) {
                return;
            }

            if (!canDrag()) {
                finish(event, true);

                return;
            }

            dragging = true;
            onDragStart(state);
        }

        onDragMove(state);
    });

    element.addEventListener('pointerup', (event) => {
        if (event.pointerId === pointerId) {
            finish(event, false);
        }
    });

    element.addEventListener('pointercancel', (event) => {
        if (event.pointerId === pointerId) {
            finish(event, true);
        }
    });

    element.addEventListener('lostpointercapture', (event) => {
        if (event.pointerId === pointerId) {
            finish(event, true);
        }
    });
}

/** Creates the floating preview element shown while dragging from the player list. */
export function createGhost(label, color) {
    const ghost = document.createElement('div');

    ghost.className = 'drag-ghost';
    ghost.style.setProperty('--player-color', color);
    ghost.textContent = label;
    document.body.append(ghost);

    return ghost;
}

export function moveGhost(ghost, x, y) {
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
}
