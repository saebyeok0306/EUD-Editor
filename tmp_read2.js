const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/renderer/src/data/iscript_data.json', 'utf8'));
console.log(JSON.stringify(data.labels['ShadowHeaderInit'], null, 2));
