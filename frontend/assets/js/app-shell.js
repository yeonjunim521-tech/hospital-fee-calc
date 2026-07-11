(function (root) {
    const CALCULATOR_SCRIPTS = Object.freeze([
        'assets/js/hira_codes.js',
        'assets/js/nonbenefit_data.js',
        'assets/js/script.js'
    ]);
    const DEFERRED_CALCULATOR_SCRIPTS = Object.freeze([
        'assets/js/fee_schedule_items.js',
        'assets/js/medical_statistics.js'
    ]);

    function getMissingRequiredSelections(selections) {
        const missing = [];
        if (!selections.hospitalClass) missing.push('병원 등급');
        if (!selections.treatmentType) missing.push('진료 형태');
        if (!selections.nonBenefitRegion) missing.push('비급여 기준 지역');
        return missing;
    }

    function shouldLoadForHash(hash) {
        return hash === '#calculator';
    }

    function initShell() {
        const section = root.document.getElementById('calculator');
        const runtime = section?.querySelector('.calculator-runtime');
        const loader = root.document.getElementById('calculator-loader');
        if (!section || !runtime || !loader) return;

        let loadPromise = null;
        let activeStep = 1;

        function replaceIcons() {
            if (root.lucide) root.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
        }

        function loadScript(src) {
            return new Promise((resolve, reject) => {
                const existing = root.document.querySelector(`script[data-calculator-src="${src}"]`);
                if (existing?.dataset.loaded === 'true') {
                    resolve();
                    return;
                }
                if (existing) {
                    existing.addEventListener('load', resolve, { once: true });
                    existing.addEventListener('error', reject, { once: true });
                    return;
                }
                const script = root.document.createElement('script');
                script.src = src;
                script.dataset.calculatorSrc = src;
                script.addEventListener('load', () => {
                    script.dataset.loaded = 'true';
                    resolve();
                }, { once: true });
                script.addEventListener('error', () => {
                    script.remove();
                    reject(new Error('calculator_asset_failed'));
                }, { once: true });
                root.document.body.appendChild(script);
            });
        }

        function setLoaderError() {
            loader.replaceChildren();
            const content = root.document.createElement('div');
            content.className = 'loader-content';
            const title = root.document.createElement('strong');
            title.textContent = '계산 데이터를 불러오지 못했습니다';
            const message = root.document.createElement('span');
            message.textContent = '네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
            const retry = root.document.createElement('button');
            retry.type = 'button';
            retry.className = 'button-primary';
            retry.textContent = '다시 시도';
            retry.addEventListener('click', () => {
                loadPromise = null;
                loader.replaceChildren(content);
                loadCalculator();
            }, { once: true });
            content.append(title, message, retry);
            loader.append(content);
        }

        function updateDataDates() {
            const feeDate = root.PUBLIC_FEE_SCHEDULE_ITEMS?.sourceDate || '급여 수가 준비 중';
            const nonBenefitDate = root.NONBENEFIT_REGION_PRICES?.fetchedAt || '비급여 기준일 확인 불가';
            const label = `급여 ${feeDate} · 비급여 ${nonBenefitDate}`;
            const footerDate = root.document.getElementById('data-reference-date');
            const heroDate = root.document.getElementById('hero-data-date');
            if (footerDate) footerDate.textContent = label;
            if (heroDate) heroDate.textContent = label;
        }

        function loadCalculator() {
            if (loadPromise) return loadPromise;
            section.classList.add('is-loading');
            loadPromise = CALCULATOR_SCRIPTS.reduce(
                (chain, src) => chain.then(() => loadScript(src)),
                Promise.resolve()
            ).then(async () => {
                if (root.MEDICostCalculator) await root.MEDICostCalculator.init();
                runtime.inert = false;
                section.classList.remove('is-loading');
                section.classList.add('is-ready');
                updateDataDates();
                replaceIcons();
                Promise.all(DEFERRED_CALCULATOR_SCRIPTS.map(loadScript))
                    .then(() => {
                        updateDataDates();
                        replaceIcons();
                    })
                    .catch(() => undefined);
            }).catch(() => {
                section.classList.remove('is-loading');
                setLoaderError();
                throw new Error('calculator_load_failed');
            });
            return loadPromise;
        }

        function currentSelections() {
            return {
                hospitalClass: root.document.querySelector('input[name="hospital_class"]:checked')?.value || '',
                treatmentType: root.document.querySelector('input[name="treatment_type"]:checked')?.value || '',
                nonBenefitRegion: root.document.getElementById('nonbenefit_region')?.value || ''
            };
        }

        function showStep(nextStep, focusHeading = true) {
            activeStep = nextStep;
            root.document.querySelectorAll('[data-step-panel]').forEach(panel => {
                panel.hidden = Number(panel.dataset.stepPanel) !== activeStep;
            });
            root.document.querySelectorAll('[data-step-target]').forEach(button => {
                const step = Number(button.dataset.stepTarget);
                if (step === activeStep) button.setAttribute('aria-current', 'step');
                else button.removeAttribute('aria-current');
                button.dataset.complete = String(step < activeStep);
            });
            const descriptions = {
                1: '1단계: 병원 등급, 진료 형태, 비급여 기준 지역을 선택하세요.',
                2: '2단계: 알고 있는 상병코드와 치료·검사 항목을 선택적으로 추가하세요.',
                3: '3단계: 실손보험 적용 여부를 확인하고 결과보기를 눌러주세요.'
            };
            root.document.getElementById('step-status').textContent = descriptions[activeStep];
            if (focusHeading) {
                const heading = root.document.getElementById(`step-${activeStep}-title`);
                heading.tabIndex = -1;
                heading.focus();
            }
        }

        function validateStepOne() {
            const missing = getMissingRequiredSelections(currentSelections());
            const error = root.document.getElementById('step-1-error');
            if (missing.length === 0) {
                error.textContent = '';
                return true;
            }
            error.textContent = `${missing.join(', ')}을(를) 선택해 주세요.`;
            const focusTarget = !currentSelections().hospitalClass
                ? root.document.querySelector('input[name="hospital_class"]')
                : !currentSelections().treatmentType
                    ? root.document.querySelector('input[name="treatment_type"]')
                    : root.document.getElementById('nonbenefit_region');
            focusTarget?.focus();
            return false;
        }

        function goToStep(step) {
            if (step > 1 && !validateStepOne()) {
                showStep(1, false);
                return false;
            }
            showStep(step);
            return true;
        }

        const specialBox = root.document.querySelector('.sanjeong-toggle-box');
        const specialSlot = root.document.getElementById('sanjeong-step-slot');
        if (specialBox && specialSlot) specialSlot.appendChild(specialBox);

        root.document.querySelectorAll('[data-load-calculator]').forEach(link => {
            link.addEventListener('click', () => loadCalculator().catch(() => undefined));
        });
        root.document.querySelectorAll('[data-step-target]').forEach(button => button.addEventListener('click', () => goToStep(Number(button.dataset.stepTarget))));
        root.document.querySelectorAll('[data-step-next]').forEach(button => button.addEventListener('click', () => {
            const step = Number(button.dataset.stepNext);
            if (!goToStep(step) || step !== 3) return;
            root.requestCalculation?.();
            root.document.querySelector('.result-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));
        root.document.querySelectorAll('[data-step-back]').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.stepBack))));

        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                loadCalculator().catch(() => undefined);
                observer.disconnect();
            }
        }, { rootMargin: '0px', threshold: 0.05 });
        observer.observe(section);

        replaceIcons();
        showStep(1, false);
        if (shouldLoadForHash(root.location.hash)) loadCalculator().catch(() => undefined);
    }

    const api = { CALCULATOR_SCRIPTS, DEFERRED_CALCULATOR_SCRIPTS, getMissingRequiredSelections, shouldLoadForHash };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root.document) {
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', initShell, { once: true });
        else initShell();
    }
}(typeof window === 'undefined' ? globalThis : window));
