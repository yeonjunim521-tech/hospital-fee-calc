(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.MedicalEstimator = api;
}(typeof globalThis === 'undefined' ? this : globalThis, function () {
    const SOURCE_DATE = '2026-07-01';
    const ANESTHESIA_FEES = Object.freeze({
        L0103: { clinic: 124350, hospital: 109000 },
        L0104: { clinic: 27980, hospital: 24520 },
        L1211: { clinic: 145420, hospital: 127470 },
        L1212: { clinic: 142280, hospital: 124720 },
        L1213: { clinic: 117170, hospital: 102710 },
        L1214: { clinic: 117660, hospital: 103140 },
        L1215: { clinic: 131920, hospital: 115630 },
        L1216: { clinic: 123600, hospital: 108340 },
        L1221: { clinic: 27980, hospital: 24520 },
        L1222: { clinic: 22440, hospital: 19670 },
        L1223: { clinic: 19360, hospital: 16970 },
        L1224: { clinic: 19360, hospital: 16970 },
        L1225: { clinic: 19360, hospital: 16970 },
        L1226: { clinic: 19360, hospital: 16970 }
    });
    const ANESTHESIA_TYPES = Object.freeze({
        general: { label: '완전히 잠드는 전신마취', base: 'L1211', extra: 'L1221' },
        mask: { label: '마스크 전신마취', base: 'L1212', extra: 'L1222' },
        spinal: { label: '하반신·척추마취', base: 'L1213', extra: 'L1223' },
        epidural: { label: '경막외마취', base: 'L1214', extra: 'L1224' },
        'nerve-block': { label: '팔·다리 신경차단마취', base: 'L1215', extra: 'L1225' },
        combined: { label: '척추·경막외 병용마취', base: 'L1216', extra: 'L1226' }
    });
    const BODY_RULES = Object.freeze([
        { key: 'finger', label: '손가락', query: /손가락|수지|finger/i, names: /수지|지골/ },
        { key: 'hand', label: '손·손목', query: /손목|손(?!가락)|수관절|수부|hand|wrist/i, names: /수관절|수부|수근골|중수골/ },
        { key: 'elbow', label: '팔꿈치', query: /팔꿈치|주관절|elbow/i, names: /주관절|주두/ },
        { key: 'shoulder', label: '어깨', query: /어깨|견관절|shoulder/i, names: /견관절|견갑골|쇄골/ },
        { key: 'arm', label: '팔', query: /팔|상지|상완|전완|arm/i, names: /상지|상완골|전완골|요골|척골/ },
        { key: 'toe', label: '발가락', query: /발가락|족지|toe/i, names: /족지|지골/ },
        { key: 'foot', label: '발', query: /발(?!목|가락)|족부|foot/i, names: /족부|족근골|중족골/ },
        { key: 'ankle', label: '발목', query: /발목|족관절|ankle/i, names: /발목|족관절|족근골/ },
        { key: 'knee', label: '무릎', query: /무릎|슬관절|슬개골|knee/i, names: /슬관절|슬개골/ },
        { key: 'lower-leg', label: '종아리', query: /종아리|하퇴|경골|비골|tibia|fibula/i, names: /하퇴|경골|비골/ },
        { key: 'thigh', label: '허벅지', query: /허벅지|대퇴|femur|thigh/i, names: /대퇴|대퇴골/ },
        { key: 'hip', label: '엉덩이·고관절', query: /엉덩이|고관절|hip/i, names: /고관절|대퇴골두|대퇴경부|대퇴골/ },
        { key: 'leg', label: '다리', query: /다리|하지|leg|lower limb/i, names: /하지|대퇴|하퇴|경골|비골|슬관절|슬개골|족관절|족부/ },
        { key: 'pelvis', label: '골반', query: /골반|천장골|pelvis/i, names: /골반|천장골|비구/ },
        { key: 'lumbar', label: '허리·요추', query: /허리|요추|요천추|lumbar|l-spine/i, names: /요추|요천추/ },
        { key: 'thoracic-spine', label: '등·흉추', query: /흉추|등뼈|thoracic spine|t-spine/i, names: /흉추/ },
        { key: 'cervical', label: '목·경추', query: /목뼈|경추|cervical|c-spine/i, names: /경추/ },
        { key: 'spine', label: '척추', query: /척추|spine/i, names: /척추|경추|흉추|요추|천추/ },
        { key: 'chest', label: '가슴·흉부', query: /가슴|흉부|흉곽|갈비뼈|늑골|chest|rib/i, names: /흉부|흉곽|늑골|흉골/ },
        { key: 'skull', label: '머리·두개골', query: /머리|두부|두개골|skull|head/i, names: /두부|두개골|안면골|하악|상악|관골/ }
    ]);

    function median(values) {
        const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
        if (!sorted.length) return 0;
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
    }

    function providerKey(provider) {
        return provider === 'clinic' ? 'clinic' : 'hospital';
    }

    function itemPrice(item, provider) {
        const key = providerKey(provider);
        return Number(key === 'clinic'
            ? (item.clinicPrice ?? item.clinic_price ?? item.price)
            : (item.hospitalPrice ?? item.hospital_price ?? item.price)) || 0;
    }

    function feePrice(code, provider) {
        return ANESTHESIA_FEES[code][providerKey(provider)];
    }

    function durationPrice(type, durationMinutes, provider) {
        const rule = ANESTHESIA_TYPES[type];
        const extraUnits = Math.ceil(Math.max(0, Number(durationMinutes || 60) - 60) / 15);
        return feePrice(rule.base, provider) + (feePrice(rule.extra, provider) * extraUnits);
    }

    function ageMultiplier(ageGroup) {
        if (ageGroup === 'newborn') return 1.6;
        if (ageGroup === 'infant' || ageGroup === 'elderly') return 1.3;
        return 1;
    }

    function estimateEpisode(plan, provider) {
        const duration = Math.max(1, Number(plan.durationMinutes || 60));
        let mainCharge = 0;
        let range = null;
        let label = plan.type === 'local' ? '작은 부위 국소마취(별도 산정 없음)' : '마취 없음';
        let codes = [];

        if (ANESTHESIA_TYPES[plan.type]) {
            const rule = ANESTHESIA_TYPES[plan.type];
            mainCharge = durationPrice(plan.type, duration, provider);
            label = rule.label;
            codes = [rule.base, rule.extra];
        } else if (plan.type === 'unknown') {
            const candidates = Object.keys(ANESTHESIA_TYPES).map(type => durationPrice(type, duration, provider));
            mainCharge = median(candidates);
            range = { min: Math.min(...candidates), max: Math.max(...candidates) };
            label = '마취 방법을 잘 모름(공식 마취료 중앙값)';
        }

        let sedationCharge = 0;
        let sedationNote = '';
        if (plan.sedation && ['local', 'none'].includes(plan.type)) {
            const extraUnits = Math.ceil(Math.max(0, duration - 30) / 15);
            sedationCharge = feePrice('L0103', provider) + (feePrice('L0104', provider) * extraUnits);
            codes.push('L0103', 'L0104');
            sedationNote = '감시하 전신마취관리(MAC) 진정관리료 반영';
        } else if (plan.sedation) {
            sedationNote = '전신·부위마취와 진정관리료는 중복 산정하지 않음';
        }

        const multiplier = ageMultiplier(plan.ageGroup);
        const total = Math.round((mainCharge + sedationCharge) * multiplier);
        return { total, durationMinutes: duration, label, codes, range, sedationNote, ageMultiplier: multiplier };
    }

    function estimateAnesthesia(surgeries, provider) {
        const episodesById = new Map();
        (surgeries || []).forEach((surgery, index) => {
            const plan = surgery && surgery.anesthesia;
            if (!plan) return;
            const sessionId = plan.sessionId || `surgery-${surgery.id || index}`;
            episodesById.set(sessionId, { ...plan, sessionId });
        });
        const episodes = Array.from(episodesById.values()).map(plan => ({
            sessionId: plan.sessionId,
            ...estimateEpisode(plan, provider)
        }));
        return {
            total: episodes.reduce((sum, episode) => sum + episode.total, 0),
            episodes,
            sourceDate: SOURCE_DATE
        };
    }

    function resolveBody(query) {
        return BODY_RULES.find(rule => rule.query.test(String(query || ''))) || null;
    }

    function estimateItem(body, kind, bucket, rows, provider) {
        const prices = rows.map(item => itemPrice(item, provider)).filter(price => price > 0);
        if (!prices.length) return null;
        const bucketLabels = { surgery: '수술 치료', nonsurgery: '수술하지 않는 치료', unknown: '치료 방법 잘 모름' };
        const isFracture = kind === 'fracture';
        return {
            code: `ESTIMATE_${kind.toUpperCase()}_${body.key.toUpperCase()}_${bucket || 'MEDIAN'}`,
            category: isFracture && bucket === 'surgery' ? 'surgery' : (isFracture ? 'procedure' : 'imaging'),
            group: isFracture && bucket === 'surgery' ? 'surgery' : (isFracture ? 'procedure_hira' : 'test'),
            type: `${kind}_estimate`,
            name: isFracture
                ? `${body.label} 골절 · ${bucketLabels[bucket]} 대표 예상`
                : `${body.label} 엑스레이 대표 예상`,
            price: median(prices),
            clinicPrice: median(rows.map(item => itemPrice(item, 'clinic')).filter(price => price > 0)),
            hospitalPrice: median(rows.map(item => itemPrice(item, 'hospital')).filter(price => price > 0)),
            isBenefit: true,
            alreadyPricedByProvider: true,
            estimateKind: kind,
            estimateBucket: bucket || 'median',
            estimateRange: { min: Math.min(...prices), max: Math.max(...prices) },
            estimateSampleCount: prices.length,
            publicFeeScheduleSource: `심평원 ${SOURCE_DATE} 공식 수가 ${prices.length}개 중앙값`,
            keywords: [body.label, isFracture ? '골절' : '엑스레이']
        };
    }

    function createConsumerEstimateItems(query, items, provider) {
        const body = resolveBody(query);
        if (!body) return [];
        const clean = String(query || '').toLowerCase();

        if (/엑스레이|x\s*-?\s*(?:ray|lay)/i.test(clean)) {
            const rows = (items || []).filter(item =>
                /^FEE_G/i.test(String(item.code || ''))
                && body.names.test(String(item.name || ''))
                && !/C-Arm|투시|단층|조영|증폭|골밀도|파노라마|특수/i.test(String(item.name || ''))
                && /\d매|매 또는 그 이상/.test(String(item.name || ''))
            );
            return [estimateItem(body, 'xray', null, rows, provider)].filter(Boolean);
        }

        if (/골절/.test(clean)) {
            const rows = (items || []).filter(item =>
                /^FEE_N/i.test(String(item.code || ''))
                && /골절/.test(String(item.name || ''))
                && !/골절제|연골절|미세골절|골절술/.test(String(item.name || ''))
                && body.names.test(String(item.name || ''))
            );
            const surgeryRows = rows.filter(item => /관혈|수술|pinning|고정/i.test(String(item.name || '')));
            const nonSurgeryRows = rows.filter(item => /도수|비관혈/i.test(String(item.name || '')));
            return [
                estimateItem(body, 'fracture', 'surgery', surgeryRows, provider),
                estimateItem(body, 'fracture', 'nonsurgery', nonSurgeryRows, provider),
                estimateItem(body, 'fracture', 'unknown', rows, provider)
            ].filter(Boolean);
        }

        return [];
    }

    return Object.freeze({ ANESTHESIA_FEES, sourceDate: SOURCE_DATE, createConsumerEstimateItems, estimateAnesthesia, resolveBody });
}));
