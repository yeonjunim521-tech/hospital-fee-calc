(function (root) {
    let loadPromise;

    function render() {
        if (root.lucide) root.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
    }

    function load() {
        if (root.lucide) {
            render();
            return Promise.resolve();
        }
        if (loadPromise) return loadPromise;
        loadPromise = new Promise((resolve, reject) => {
            const script = root.document.createElement('script');
            script.src = 'assets/vendor/lucide.min.js';
            script.addEventListener('load', () => {
                render();
                resolve();
            }, { once: true });
            script.addEventListener('error', reject, { once: true });
            root.document.body.appendChild(script);
        });
        return loadPromise;
    }

    function schedule() {
        const start = () => {
            if ('requestIdleCallback' in root) root.requestIdleCallback(() => load().catch(() => undefined), { timeout: 2000 });
            else root.setTimeout(() => load().catch(() => undefined), 500);
        };
        if (root.document.readyState === 'complete') start();
        else root.addEventListener('load', start, { once: true });
    }

    root.MEDICostIcons = { load, render };
    schedule();
}(window));
