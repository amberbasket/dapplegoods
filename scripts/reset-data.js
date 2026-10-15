// Deletes DATA_DIR/products.json so the next start reloads the seed products.
const fs = require('fs');
const path = require('path');
const dir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.rmSync(path.join(dir, 'products.json'), { force: true });
console.log('Product data reset; seed products load on next start.');
