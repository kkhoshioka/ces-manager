const fs = require('fs');
let content = fs.readFileSync('api/_server/pdfService.ts', 'utf8');

const layoutDef = `
    const customTableLayout = {
        hLineWidth: function (i, node) { return 1; },
        vLineWidth: function (i, node) { return 1; },
        hLineColor: function (i, node) { return BORDER_COLOR; },
        vLineColor: function (i, node) { return BORDER_COLOR; },
        paddingLeft: function (i, node) { return 4; },
        paddingRight: function (i, node) { return 4; },
        paddingTop: function (i, node) { return 4; },
        paddingBottom: function (i, node) { return 4; }
    };
`;

// Insert the customTableLayout into all three functions
content = content.replace(
    /const BORDER_COLOR = '#cbd5e1';/g,
    "const BORDER_COLOR = '#cbd5e1';" + layoutDef
);
content = content.replace(
    /const BORDER_COLOR = '#5B9BD5';/g,
    "const BORDER_COLOR = '#5B9BD5';" + layoutDef
);
content = content.replace(
    /const BORDER_COLOR = '#1a3c7e';/g,
    "const BORDER_COLOR = '#1a3c7e';" + layoutDef
); // actually quotation uses '#cbd5e1', so the first replace covers it.

// Change layout
content = content.replace(/layout:\s*'noBorders'/g, 'layout: customTableLayout');

// Prevent manual borders in data rows
content = content.replace(/const rowBorder = \[[true, false\s,]+\];/g, 'const rowBorder = undefined;');
content = content.replace(/const rowBorderColor = \[BORDER_COLOR[\s,BORDER_COLOR]+\];/g, 'const rowBorderColor = undefined;');

// Strip manual borders from footers and elsewhere
content = content.replace(/,\s*border:\s*\[[true, false\s,]+\]/g, '');
content = content.replace(/,\s*borderColor:\s*\[[BORDER_COLOR\s,'#1a3c7e]+\]/g, '');

fs.writeFileSync('api/_server/pdfService.ts', content);
console.log('Fixed pdfService.ts with fixPdf5.cjs');
