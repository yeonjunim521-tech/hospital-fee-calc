(function initCoupangAds(root) {
    'use strict';

    function getSlots() {
        return [...root.document.querySelectorAll('[data-coupang-id]')];
    }

    function matchesViewport(slot) {
        const query = slot.dataset.coupangMedia;
        return !query || root.matchMedia(query).matches;
    }

    function resetSlot(slot) {
        const frame = slot.querySelector('.coupang-widget-frame');
        const fallback = slot.querySelector('.coupang-widget-fallback');
        frame?.replaceChildren();
        if (fallback) fallback.hidden = false;
        delete slot.dataset.coupangRendered;
        slot.dataset.coupangState = 'fallback';
    }

    function renderSlot(slot) {
        if (!matchesViewport(slot) || slot.dataset.coupangRendered === 'true') return;

        const frame = slot.querySelector('.coupang-widget-frame');
        const fallback = slot.querySelector('.coupang-widget-fallback');
        const id = Number(slot.dataset.coupangId);
        const width = Number(slot.dataset.coupangWidth);
        const height = Number(slot.dataset.coupangHeight);

        if (!frame || !Number.isInteger(id) || !width || !height || typeof root.PartnersCoupang?.G !== 'function') {
            slot.dataset.coupangState = 'fallback';
            return;
        }

        try {
            new root.PartnersCoupang.G({
                id,
                trackingCode: 'AF2104018',
                subId: null,
                template: 'carousel',
                width: String(width),
                height: String(height),
                container: frame,
                onLoaded(hasAd) {
                    slot.dataset.coupangState = hasAd ? 'loaded' : 'fallback';
                    if (fallback) fallback.hidden = Boolean(hasAd);
                }
            });
            slot.dataset.coupangRendered = 'true';
        } catch (_error) {
            resetSlot(slot);
        }
    }

    function syncSlots() {
        getSlots().forEach((slot) => {
            if (slot.dataset.coupangTrigger) return;
            if (matchesViewport(slot)) {
                renderSlot(slot);
            } else if (slot.dataset.coupangRendered === 'true') {
                resetSlot(slot);
            }
        });
    }

    function renderTriggeredSlots(trigger) {
        getSlots()
            .filter((slot) => slot.dataset.coupangTrigger === trigger)
            .forEach(renderSlot);
    }

    function start() {
        const slots = getSlots();
        if (slots.length === 0) return;

        const queries = new Set(slots
            .filter((slot) => !slot.dataset.coupangTrigger)
            .map((slot) => slot.dataset.coupangMedia)
            .filter(Boolean));
        queries.forEach((query) => root.matchMedia(query).addEventListener('change', syncSlots));
        syncSlots();
    }

    root.MEDICostCoupangAds = Object.freeze({ renderTriggeredSlots });

    if (root.document.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})(window);
