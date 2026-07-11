(function (root) {
    const STORAGE_KEY = 'medicost-consent-v1';
    const GA_MEASUREMENT_ID = 'G-YCKQ2W2BWT';
    const ADS_SCRIPT_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1927730301151401';
    const DEFAULT_CONSENT = Object.freeze({ analytics: false, ads: false, updatedAt: null });

    function isValidConsent(value) {
        return Boolean(
            value
            && typeof value === 'object'
            && typeof value.analytics === 'boolean'
            && typeof value.ads === 'boolean'
            && typeof value.updatedAt === 'string'
        );
    }

    function parseConsent(raw) {
        if (!raw) return { ...DEFAULT_CONSENT };
        try {
            const parsed = JSON.parse(raw);
            return isValidConsent(parsed) ? parsed : { ...DEFAULT_CONSENT };
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

    function canLoadAds(consent) {
        return consent.ads === true;
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

    function applyConsent(consent) {
        const analyticsEnabled = canLoadAnalytics(consent);
        syncAnalyticsRuntime(analyticsEnabled);
        syncScript('medicost-analytics', analyticsEnabled, 'assets/js/analytics.js');
        syncScript('medicost-ads', canLoadAds(consent), ADS_SCRIPT_URL, { crossorigin: 'anonymous' });
        if (!analyticsEnabled) removeAnalyticsLoader();
    }

    function saveConsent(analytics, ads) {
        const consent = { analytics, ads, updatedAt: new Date().toISOString() };
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
        applyConsent(consent);
        root.dispatchEvent(new CustomEvent('medicost:consent-changed', { detail: consent }));
        return consent;
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
        const analyticsInput = root.document.getElementById('consent-analytics');
        const adsInput = root.document.getElementById('consent-ads');
        const saveButton = banner.querySelector('[data-consent-save]');
        const settingsButton = banner.querySelector('[data-consent-settings]');
        const status = root.document.getElementById('consent-status');

        function openSettings() {
            analyticsInput.checked = readConsent().analytics;
            adsInput.checked = readConsent().ads;
            settings.hidden = false;
            saveButton.hidden = false;
            settingsButton.hidden = true;
            banner.hidden = false;
            analyticsInput.focus();
        }

        function closeWith(consent, message) {
            saveConsent(consent.analytics, consent.ads);
            status.textContent = message;
            root.setTimeout(() => {
                banner.hidden = true;
                status.textContent = '';
            }, 350);
        }

        banner.querySelector('[data-consent-all]').addEventListener('click', () => {
            closeWith({ analytics: true, ads: true }, '분석과 광고를 허용했습니다.');
        });
        banner.querySelector('[data-consent-essential]').addEventListener('click', () => {
            closeWith({ analytics: false, ads: false }, '필수 기능만 사용합니다.');
        });
        settingsButton.addEventListener('click', openSettings);
        saveButton.addEventListener('click', () => {
            closeWith({ analytics: analyticsInput.checked, ads: adsInput.checked }, '선택한 설정을 저장했습니다.');
        });
        root.document.querySelectorAll('[data-open-consent]').forEach(button => button.addEventListener('click', openSettings));

        if (hasStoredConsent(raw)) {
            applyConsent(stored);
            banner.hidden = true;
        } else {
            banner.hidden = false;
        }
    }

    const api = { STORAGE_KEY, parseConsent, canLoadAnalytics, canLoadAds, readConsent, saveConsent, applyConsent };
    root.MEDICostConsent = api;

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root.document) {
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', initConsentUi, { once: true });
        else initConsentUi();
    }
}(typeof window === 'undefined' ? globalThis : window));
