const fs = require('fs');
const path = require('path');

try {
    const filePath = path.join(__dirname, '..', 'frontend', 'assets', 'js', 'script.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    console.log("File lines total:", lines.length);

    const targets = [
        'getHierarchicalClassification',
        'handleMainCategoryChange',
        'switchTab',
        'toggleDiseaseCodeSection'
    ];

    targets.forEach(target => {
        console.log(`\n=== Matches for: ${target} ===`);
        lines.forEach((line, idx) => {
            if (line.includes(target) && (line.includes('function') || line.includes('const') || line.includes('let') || line.includes('var'))) {
                console.log(`Line ${idx + 1}: ${line.trim()}`);
            }
        });
    });

} catch (err) {
    console.error("ERROR:", err.message);
}
