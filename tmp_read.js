const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/renderer/src/data/iscript_data.json', 'utf8'));
const header = data.headers.find(h => h.is_id === 275);
console.log(JSON.stringify(header, null, 2));
