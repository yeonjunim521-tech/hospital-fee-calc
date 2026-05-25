const fs = require('fs');
const path = require('path');

async function main() {
    console.log('Fetching KCD Korean auto-complete data...');
    const korRes = await fetch('https://kcdcode.kr/json/auto_kor.json');
    const korData = await korRes.json();

    console.log('Fetching KCD English auto-complete data...');
    const engRes = await fetch('https://kcdcode.kr/json/auto_eng.json');
    const engData = await engRes.json();

    const kcdMap = {};

    // 한글명 파싱
    korData.JSONObjectList.forEach(item => {
        const code = item.value.trim().toUpperCase();
        if (code === '@@') return;
        const label = item.label;
        const match = label.match(/\[(.*)\]/);
        if (match) {
            const name = match[1].trim();
            if (!kcdMap[code]) {
                kcdMap[code] = { code };
            }
            kcdMap[code].ko = name;
        }
    });

    // 영문명 파싱
    engData.JSONObjectList.forEach(item => {
        const code = item.value.trim().toUpperCase();
        if (code === '@@') return;
        const label = item.label;
        const match = label.match(/\[(.*)\]/);
        if (match) {
            const name = match[1].trim();
            if (!kcdMap[code]) {
                kcdMap[code] = { code };
            }
            kcdMap[code].en = name;
        }
    });

    const items = Object.values(kcdMap);
    console.log(`Parsed ${items.length} KCD codes.`);

    const outputPath = path.join(__dirname, '../frontend/assets/data/kcd_codes.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8');
    console.log(`Saved to ${outputPath}`);
}

main().catch(console.error);
