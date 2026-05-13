const fs = require('fs');
let content = fs.readFileSync('api/_server/pdfService.ts', 'utf8');

// 1. Add customTableLayout at top
const targetStr = "const BORDER_COLOR = '#cbd5e1';";
const replacementStr = `const BORDER_COLOR = '#cbd5e1';

const customTableLayout = {
    hLineWidth: function (i, node) { return 1; },
    vLineWidth: function (i, node) { return 1; },
    hLineColor: function (i, node) { return BORDER_COLOR; },
    vLineColor: function (i, node) { return BORDER_COLOR; },
    paddingLeft: function (i, node) { return 4; },
    paddingRight: function (i, node) { return 4; },
    paddingTop: function (i, node) { return 4; },
    paddingBottom: function (i, node) { return 4; }
};`;

if (!content.includes('customTableLayout = {')) {
    content = content.replace(targetStr, replacementStr);
}

// 2. Change layout
content = content.replace(/layout:\s*'noBorders'/g, 'layout: customTableLayout');

// 3. To prevent cell borders from overriding the custom layout
content = content.replace(/const rowBorder = \[[true, false\s,]+\];/g, 'const rowBorder = undefined;');
content = content.replace(/const rowBorderColor = \[BORDER_COLOR[\s,BORDER_COLOR]+\];/g, 'const rowBorderColor = undefined;');

// 4. Remove ANY explicit border and borderColor arrays from cells
content = content.replace(/,\s*border:\s*\[.*?\]/g, '');
content = content.replace(/,\s*borderColor:\s*\[.*?\]/g, '');

fs.writeFileSync('api/_server/pdfService.ts', content);
console.log('Fixed pdfService.ts with fixPdf4.cjs');
