const assert = require('node:assert/strict');
const path = require('node:path');

const { isPathInsideDir } = require('../backend/server');

const frontendDir = 'C:\\repo\\frontend';

assert.equal(isPathInsideDir(frontendDir, path.resolve(frontendDir, 'index.html')), true);
assert.equal(
  isPathInsideDir(frontendDir, path.resolve(frontendDir, '..', 'frontend-evil', 'index.html')),
  false
);
