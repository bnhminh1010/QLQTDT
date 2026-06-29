const fs = require('fs');
const allData = JSON.parse(fs.readFileSync('.understand-anything/intermediate/batches.json', 'utf8'));
let batch17 = null;
for (const b of allData.batches) {
  if (b.batchIndex === 17) {
    batch17 = b;
    break;
  }
}
const input = {
  projectRoot: '/home/binhminh/Developer/Interns/QLQTDT',
  batchFiles: batch17.files,
  batchImportData: batch17.batchImportData || {}
};
fs.writeFileSync('.understand-anything/tmp/ua-file-analyzer-input-17.json', JSON.stringify(input, null, 2));
console.log('Written', batch17.files.length, 'files');
console.log('batchImportData entries:', Object.keys(input.batchImportData).length);
let nonEmpty = 0;
for (const [k,v] of Object.entries(input.batchImportData)) {
  if (v.length > 0) { console.log('  non-empty:', k, v); nonEmpty++; }
}
console.log('Non-empty import entries:', nonEmpty);
