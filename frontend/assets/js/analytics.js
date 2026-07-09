window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.trackGAEvent = function (name, params) {
    if (typeof window.gtag === 'function') {
        window.gtag('event', name, params || {});
    }
};
gtag('js', new Date());
gtag('config', 'G-YCKQ2W2BWT');

(function () {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-YCKQ2W2BWT';
    document.head.appendChild(script);
})();
