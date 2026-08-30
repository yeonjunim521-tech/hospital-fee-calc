(function initResponsiveAdFit(root) {
    'use strict';

    const SCRIPT_SRC = 'https://t1.kakaocdn.net/kas/static/ba.min.js';
    let activeSlot = null;
    let activeObserver = null;
    let generation = 0;

    function getSlots() {
        return [...root.document.querySelectorAll('[data-adfit-unit]')];
    }

    function matchesViewport(slot) {
        const query = slot.dataset.adfitMedia;
        return !query || root.matchMedia(query).matches;
    }

    function createAdArea(slot) {
        const area = root.document.createElement('ins');
        area.className = 'kakao_ad_area';
        area.style.display = 'none';
        area.dataset.adUnit = slot.dataset.adfitUnit;
        area.dataset.adWidth = slot.dataset.adfitWidth;
        area.dataset.adHeight = slot.dataset.adfitHeight;
        return area;
    }

    function requestAd(slot, expectedGeneration) {
        if (slot !== activeSlot || expectedGeneration !== generation || slot.dataset.adfitState !== 'waiting') return;

        slot.dataset.adfitState = 'requested';
        const script = root.document.createElement('script');
        script.id = 'medicost-adfit-loader';
        script.src = SCRIPT_SRC;
        script.async = true;
        script.addEventListener('error', () => {
            if (slot === activeSlot && expectedGeneration === generation) {
                slot.dataset.adfitState = 'error';
            }
        }, { once: true });
        slot.append(script);
    }

    function observeSlot(slot, expectedGeneration) {
        if (typeof root.IntersectionObserver !== 'function') {
            requestAd(slot, expectedGeneration);
            return;
        }

        activeObserver = new root.IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            activeObserver?.disconnect();
            activeObserver = null;
            requestAd(slot, expectedGeneration);
        }, { rootMargin: '400px 0px' });
        activeObserver.observe(slot);
    }

    function syncSlot() {
        const slots = getSlots();
        const nextSlot = slots.find(matchesViewport) || null;
        if (nextSlot === activeSlot) return;

        generation += 1;
        activeObserver?.disconnect();
        activeObserver = null;
        activeSlot = nextSlot;

        slots.forEach((slot) => {
            const isActive = slot === activeSlot;
            slot.hidden = !isActive;
            slot.dataset.adfitActive = String(isActive);
            slot.dataset.adfitState = isActive ? 'waiting' : 'inactive';
            slot.replaceChildren();
        });

        if (!activeSlot) return;
        activeSlot.append(createAdArea(activeSlot));
        observeSlot(activeSlot, generation);
    }

    function start() {
        syncSlot();
        const queries = new Set(getSlots().map((slot) => slot.dataset.adfitMedia).filter(Boolean));
        queries.forEach((query) => {
            const media = root.matchMedia(query);
            if (typeof media.addEventListener === 'function') {
                media.addEventListener('change', syncSlot);
            } else if (typeof media.addListener === 'function') {
                media.addListener(syncSlot);
            }
        });
    }

    if (root.document.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})(window);
