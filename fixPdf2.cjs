const fs = require('fs');
let content = fs.readFileSync('api/_server/pdfService.ts', 'utf8');

// Strip any definitions of customTableLayout
content = content.replace(/const customTableLayout = \{[\s\S]*?\};\n?/g, '');

// Put customTableLayout exactly once right after the first BORDER_COLOR at the top
content = content.replace(
    /const BORDER_COLOR = '#cbd5e1';/,
    "const BORDER_COLOR = '#cbd5e1';\n\nconst customTableLayout = {\n    hLineWidth: function (i, node) { return 1; },\n    vLineWidth: function (i, node) { return 1; },\n    hLineColor: function (i, node) { return BORDER_COLOR; },\n    vLineColor: function (i, node) { return BORDER_COLOR; },\n    paddingLeft: function (i, node) { return 4; },\n    paddingRight: function (i, node) { return 4; },\n    paddingTop: function (i, node) { return 4; },\n    paddingBottom: function (i, node) { return 4; }\n};"
);

fs.writeFileSync('api/_server/pdfService.ts', content);
console.log('Fixed pdfService.ts');
