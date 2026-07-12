const assert = require('assert');
const fs = require('fs');
const path = require('path');

const frontend = path.join(__dirname, '..', 'frontend');
const html = fs.readFileSync(path.join(frontend, 'index.html'), 'utf8');
const imagePath = path.join(frontend, 'assets', 'og-image.png');

assert.match(
    html,
    /<meta property="og:image" content="https:\/\/hospital-fee-calc\.pages\.dev\/assets\/og-image\.png">/
);
assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);

const png = fs.readFileSync(imagePath);
assert.strictEqual(png.toString('ascii', 1, 4), 'PNG');
assert.strictEqual(png.readUInt32BE(16), 1200);
assert.strictEqual(png.readUInt32BE(20), 630);

console.log('Open Graph image metadata contract passed.');
