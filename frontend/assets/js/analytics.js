const GA_MEASUREMENT_ID = 'G-YCKQ2W2BWT';
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.trackGAEvent = function (name, params) {
    const consent = window.MEDICostConsent?.readConsent?.();
    if (consent?.analytics === true && typeof window.gtag === 'function') {
        window.gtag('event', name, params || {});
    }
};
gtag('js', new Date());
gtag('config', GA_MEASUREMENT_ID);

(function () {
    const script = document.createElement('script');
    script.id = 'medicost-analytics-loader';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
})();
