const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'frontend', 'assets', 'js', 'fee_schedule_items.js');
const outputPath = path.join(root, 'database', 'medical-overlay-2026-07-01.sql');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context);

const source = context.window.PUBLIC_FEE_SCHEDULE_ITEMS;
const sourceUrl = 'https://www.hira.or.kr/bbsDummy.do?brdBltNo=12130&brdScnBltNo=4&pgmid=HIRAA020002000100';
const sourceDate = '2026-07-01';
const mriCodes = new Set(['FEE_HE118', 'FEE_HE120', 'FEE_HE121', 'FEE_HE123']);
const selected = source.items.filter(item =>
    mriCodes.has(item.code)
    || /^FEE_G/.test(item.code)
    || (/^FEE_N/.test(item.code) && /골절/.test(item.name) && !/골절제|연골절|미세골절|골절술/.test(item.name))
    || /^FEE_L(?:0|1|2)/.test(item.code)
    || /^FEE_EA00[1-4]$/.test(item.code)
);

const bodyRules = [
    { labels: ['머리', '두개골'], pattern: /두개골|후두골|두부|안면골|하악|상악|관골|비사골|코뼈/ },
    { labels: ['척추'], pattern: /척추|경추|흉추|요추|천추/ },
    { labels: ['흉부'], pattern: /흉부|흉곽|늑골|흉골/ },
    { labels: ['어깨'], pattern: /견관절|견갑골|쇄골/ },
    { labels: ['팔'], pattern: /상완골|전완골|요골|척골|상지/ },
    { labels: ['팔꿈치'], pattern: /주관절|주두/ },
    { labels: ['손', '손목'], pattern: /수관절|수근골|중수골|수부/ },
    { labels: ['손가락'], pattern: /수지|(?<!족)지골/ },
    { labels: ['골반'], pattern: /골반|비구|천장골/ },
    { labels: ['엉덩이', '고관절'], pattern: /고관절|대퇴골두|대퇴경부/ },
    { labels: ['허벅지'], pattern: /대퇴골/ },
    { labels: ['무릎'], pattern: /슬관절|슬개골/ },
    { labels: ['종아리'], pattern: /하퇴골|경골|비골/ },
    { labels: ['발목'], pattern: /족관절/ },
    { labels: ['발'], pattern: /족부|족근골|중족골/ },
    { labels: ['발가락'], pattern: /족지/ }
];

function sql(value) {
    return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function itemAliases(item) {
    const aliases = new Set([item.code, item.publicActionCode, item.name]);
    (item.keywords || []).forEach(keyword => {
        if (!['검사', '시술', '수술', '영상', '혈액'].includes(keyword)) aliases.add(keyword);
    });
    bodyRules.filter(rule => rule.pattern.test(item.name)).forEach(rule => {
        rule.labels.forEach(label => {
            if (/^FEE_G/.test(item.code)) [`${label} 엑스레이`, `${label} xray`, `${label} x-ray`].forEach(alias => aliases.add(alias));
            if (/^FEE_N/.test(item.code)) [`${label} 골절`, `${label} 골절 치료`].forEach(alias => aliases.add(alias));
        });
    });

    const mriAliases = {
        FEE_HE118: ['고관절 mri', '엉덩이 mri', '하지 mri', '하지 자기공명'],
        FEE_HE120: ['무릎 mri', '슬관절 mri', '하지 mri', '하지 자기공명'],
        FEE_HE121: ['발목 mri', '족관절 mri', '하지 mri', '하지 자기공명'],
        FEE_HE123: ['관절외 하지 mri', '다리 mri', '하지 mri', '하지 자기공명']
    };
    (mriAliases[item.code] || []).forEach(alias => aliases.add(alias));

    if (['FEE_L0102', 'FEE_L1213', 'FEE_L1214', 'FEE_L1215', 'FEE_L1216'].includes(item.code)) aliases.add('부분마취');
    if (['FEE_L0101', 'FEE_L1211', 'FEE_L1212'].includes(item.code)) aliases.add('전신마취');
    if (['FEE_L0103', 'FEE_L0104'].includes(item.code)) ['진정관리', '진정관리료', '수술 진정'].forEach(alias => aliases.add(alias));
    if (item.code === 'FEE_N0606') ['손가락골절핀', '손가락 골절 핀', '지골 골절 핀고정'].forEach(alias => aliases.add(alias));
    return [...new Set([...aliases].map(normalize).filter(alias => alias.length >= 2))];
}

const lines = [];
selected.forEach(item => {
    lines.push(`INSERT INTO medical_items (code, name, category, item_group, item_type, clinic_price, hospital_price, is_benefit, source_url, source_date, status, updated_at) VALUES (${[
        sql(item.code), sql(item.name), sql(item.category), sql(item.group), sql(item.type),
        Number(item.clinicPrice), Number(item.hospitalPrice), item.isBenefit ? 1 : 0,
        sql(sourceUrl), sql(sourceDate), sql('approved'), 'CURRENT_TIMESTAMP'
    ].join(', ')}) ON CONFLICT(code) DO UPDATE SET name=excluded.name, category=excluded.category, item_group=excluded.item_group, item_type=excluded.item_type, clinic_price=excluded.clinic_price, hospital_price=excluded.hospital_price, is_benefit=excluded.is_benefit, source_url=excluded.source_url, source_date=excluded.source_date, status='approved', updated_at=CURRENT_TIMESTAMP;`);
    lines.push(`DELETE FROM medical_item_aliases WHERE item_code=${sql(item.code)};`);
    itemAliases(item).forEach(alias => {
        lines.push(`INSERT OR IGNORE INTO medical_item_aliases (item_code, normalized_alias) VALUES (${sql(item.code)}, ${sql(alias)});`);
    });
});

const candidateMappings = [
    ['하지 mri', 'FEE_HE123'],
    ['하지 자기공명', 'FEE_HE123'],
    ['부분마취', 'FEE_L0102'],
    ['손가락골절핀', 'FEE_N0606']
];
candidateMappings.forEach(([query, code]) => {
    lines.push(`UPDATE search_candidates SET item_id=${sql(code)}, item_name=(SELECT name FROM medical_items WHERE code=${sql(code)}), item_category=(SELECT category FROM medical_items WHERE code=${sql(code)}), status='approved', updated_at=CURRENT_TIMESTAMP WHERE status='pending' AND normalized_query=${sql(query)};`);
});
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`WROTE ${path.relative(root, outputPath)}: ${selected.length} items`);
