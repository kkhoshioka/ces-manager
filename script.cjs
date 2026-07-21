const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let data = fs.readFileSync(path, 'utf8');

if (!data.includes("import fs from 'fs';")) {
    data = data.replace("import path from 'path';", "import path from 'path';\nimport fs from 'fs';");
}

if (!data.includes("const sealPath")) {
    data = data.replace("const fontDir", "const sealPath = path.join(process.cwd(), 'public', 'seal.png');\nconst fontDir");
}

const searchStr = "{ text: '株式会社シーイーエス中国', fontSize: 12, bold: true, alignment: 'right' },";
const replaceStr = `{ text: '株式会社シーイーエス中国', fontSize: 12, bold: true, alignment: 'right' },
                            ...(fs.existsSync(sealPath) ? [{
                                image: sealPath,
                                width: 45,
                                alignment: 'right',
                                margin: [0, -35, 10, -10]
                            }] : []),`;

data = data.split(searchStr).join(replaceStr);

fs.writeFileSync(path, data, 'utf8');
console.log('Update complete');
