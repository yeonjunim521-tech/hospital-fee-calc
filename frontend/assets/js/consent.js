(function (root) {
    const STORAGE_KEY = 'medicost-consent-v3';
    const VISITOR_ID_KEY = 'medicost-anonymous-visitor-v1';
    const GA_MEASUREMENT_ID = 'G-YCKQ2W2BWT';
    const DEFAULT_CONSENT = Object.freeze({ enhancedFeatures: false, analytics: false, updatedAt: null });
    let visitLogged = false;
    let lastFocusedElement = null;

    function isValidConsent(value) {
        return Boolean(
            value
            && typeof value === 'object'
            && typeof value.enhancedFeatures === 'boolean'
            && typeof value.analytics === 'boolean'
            && typeof value.updatedAt === 'string'
        );
    }

    function parseConsent(raw) {
        if (!raw) return { ...DEFAULT_CONSENT };
        try {
            const parsed = JSON.parse(raw);
            return isValidConsent(parsed)
                ? {
                    enhancedFeatures: parsed.enhancedFeatures,
                    analytics: parsed.analytics,
                    updatedAt: parsed.updatedAt
                }
                : { ...DEFAULT_CONSENT };
        } catch (error) {
            return { ...DEFAULT_CONSENT };
        }
    }

    function hasStoredConsent(raw) {
        if (!raw) return false;
        try {
            return isValidConsent(JSON.parse(raw));
        } catch (error) {
            return false;
        }
    }

    function canLoadAnalytics(consent) {
        return consent.analytics === true;
    }

    function canUseEnhancedFeatures(consent = readConsent()) {
        return consent.enhancedFeatures === true;
    }

    function readConsent() {
        if (!root.localStorage) return { ...DEFAULT_CONSENT };
        return parseConsent(root.localStorage.getItem(STORAGE_KEY));
    }

    function loadScript(id, src, attributes = {}) {
        if (!root.document || root.document.getElementById(id)) return;
        const script = root.document.createElement('script');
        script.id = id;
        script.async = true;
        script.src = src;
        Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
        root.document.head.appendChild(script);
    }

    function syncScript(id, enabled, src, attributes = {}) {
        if (!root.document) return;
        const existing = root.document.getElementById(id);
        if (!enabled && existing) {
            existing.remove();
            return;
        }
        if (enabled && !existing) loadScript(id, src, attributes);
    }

    function removeAnalyticsLoader() {
        const loader = root.document?.getElementById('medicost-analytics-loader');
        if (loader) loader.remove();
    }

    function syncAnalyticsRuntime(enabled) {
        root[`ga-disable-${GA_MEASUREMENT_ID}`] = !enabled;
        if (typeof root.gtag === 'function') {
            root.gtag('consent', 'update', { analytics_storage: enabled ? 'granted' : 'denied' });
        }
    }

    function createBrowserId() {
        if (root.crypto?.randomUUID) return root.crypto.randomUUID();
        if (root.crypto?.getRandomValues) {
            const bytes = new Uint8Array(24);
            root.crypto.getRandomValues(bytes);
            return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
        }
        return '';
    }

    function readOrCreateBrowserId() {
        if (!root.localStorage) return '';
        const stored = root.localStorage.getItem(VISITOR_ID_KEY);
        if (typeof stored === 'string' && /^[A-Za-z0-9_-]{20,80}$/.test(stored)) return stored;
        const created = createBrowserId();
        if (created) root.localStorage.setItem(VISITOR_ID_KEY, created);
        return created;
    }

    function removeBrowserId() {
        root.localStorage?.removeItem(VISITOR_ID_KEY);
        visitLogged = false;
    }

    function sendAnonymousVisit() {
        if (visitLogged || typeof root.fetch !== 'function') return;
        const browserId = readOrCreateBrowserId();
        if (!browserId) return;
        visitLogged = true;
        root.fetch('/api/visit-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ browserId, operationalConsent: true }),
            keepalive: true
        }).catch(() => {
            visitLogged = false;
        });
    }

    function applyConsent(consent) {
        const analyticsEnabled = canLoadAnalytics(consent);
        syncAnalyticsRuntime(analyticsEnabled);
        syncScript('medicost-analytics', analyticsEnabled, 'assets/js/analytics.js');
        if (!analyticsEnabled) removeAnalyticsLoader();
        if (canUseEnhancedFeatures(consent)) sendAnonymousVisit();
        else removeBrowserId();
    }

    function normalizeConsentInput(value, analyticsValue) {
        if (value && typeof value === 'object') {
            return {
                enhancedFeatures: value.enhancedFeatures === true,
                analytics: value.analytics === true
            };
        }
        return {
            enhancedFeatures: value === true,
            analytics: analyticsValue === true
        };
    }

    function saveConsent(value, analyticsValue = false) {
        const selection = normalizeConsentInput(value, analyticsValue);
        const consent = { ...selection, updatedAt: new Date().toISOString() };
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
        applyConsent(consent);
        root.dispatchEvent(new CustomEvent('medicost:consent-changed', { detail: consent }));
        return consent;
    }

    function showDialog(banner, focusTarget) {
        lastFocusedElement = root.document.activeElement;
        banner.hidden = false;
        if (typeof banner.showModal === 'function' && !banner.open) banner.showModal();
        root.setTimeout(() => focusTarget?.focus(), 0);
    }

    function hideDialog(banner) {
        if (typeof banner.close === 'function' && banner.open) banner.close();
        banner.hidden = true;
        if (lastFocusedElement instanceof root.HTMLElement) lastFocusedElement.focus();
        lastFocusedElement = null;
    }

    function initConsentUi() {
        if (root.lucide) root.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
        const banner = root.document.getElementById('consent-banner');
        const raw = root.localStorage.getItem(STORAGE_KEY);
        const stored = parseConsent(raw);
        if (!banner) {
            if (hasStoredConsent(raw)) applyConsent(stored);
            return;
        }

        const settings = root.document.getElementById('consent-settings');
        const enhancedInput = root.document.getElementById('consent-enhanced');
        const analyticsInput = root.document.getElementById('consent-analytics');
        const saveButton = banner.querySelector('[data-consent-save]');
        const settingsButton = banner.querySelector('[data-consent-settings]');
        const status = root.document.getElementById('consent-status');
        const primaryButton = banner.querySelector('[data-consent-all]');

        function syncInputs(consent) {
            if (enhancedInput) enhancedInput.checked = consent.enhancedFeatures;
            if (analyticsInput) analyticsInput.checked = consent.analytics;
        }

        function openDialog(options = {}) {
            syncInputs(readConsent());
            settings.hidden = options.showSettings !== true;
            saveButton.hidden = options.showSettings !== true;
            settingsButton.hidden = options.showSettings === true;
            status.textContent = options.message || '';
            showDialog(banner, options.showSettings ? (enhancedInput || analyticsInput) : primaryButton);
        }

        function openSettings() {
            openDialog({ showSettings: true });
        }

        function closeWith(consent, message) {
            saveConsent(consent);
            status.textContent = message;
            root.setTimeout(() => {
                hideDialog(banner);
                status.textContent = '';
            }, 250);
        }

        primaryButton.addEventListener('click', () => {
            closeWith(
                { enhancedFeatures: true, analytics: readConsent().analytics },
                '필수 자체 방문·검색 통계 수집에 동의했습니다. 프로토타입 선택 기능과 추가 검색을 사용할 수 있습니다.'
            );
        });
        banner.querySelector('[data-consent-essential]').addEventListener('click', () => {
            closeWith(
                { enhancedFeatures: false, analytics: false },
                '동의하지 않았습니다. 필수 조건을 통한 기본 계산만 사용할 수 있습니다.'
            );
        });
        settingsButton.addEventListener('click', openSettings);
        saveButton.addEventListener('click', () => {
            closeWith({
                enhancedFeatures: enhancedInput?.checked === true,
                analytics: analyticsInput?.checked === true
            }, enhancedInput?.checked === true
                ? '필수 자체 방문·검색 통계 수집 동의를 저장했습니다.'
                : '동의를 철회했습니다. 기본 계산만 사용할 수 있습니다.');
        });
        root.document.querySelectorAll('[data-open-consent]').forEach(button => {
            button.addEventListener('click', openSettings);
        });
        banner.addEventListener('cancel', (event) => {
            if (!hasStoredConsent(root.localStorage.getItem(STORAGE_KEY))) event.preventDefault();
        });
        banner.addEventListener('click', (event) => {
            if (event.target === banner && hasStoredConsent(root.localStorage.getItem(STORAGE_KEY))) hideDialog(banner);
        });

        api.openDialog = openDialog;
        if (hasStoredConsent(raw)) {
            applyConsent(stored);
            hideDialog(banner);
        } else {
            removeBrowserId();
            openDialog();
        }
    }

    const api = {
        STORAGE_KEY,
        VISITOR_ID_KEY,
        parseConsent,
        canLoadAnalytics,
        canUseEnhancedFeatures,
        readConsent,
        saveConsent,
        applyConsent,
        openDialog() {}
    };
    root.MEDICostConsent = api;

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root.document) {
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', initConsentUi, { once: true });
        else initConsentUi();
    }
}(typeof window === 'undefined' ? globalThis : window));
