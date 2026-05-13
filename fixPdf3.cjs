const fs = require('fs');
let content = fs.readFileSync('api/_server/pdfService.ts', 'utf8');

// 1. Add customTableLayout to the top
const customLayoutDefinition = `const BORDER_COLOR = '#cbd5e1';

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
    content = content.replace("const BORDER_COLOR = '#cbd5e1';", customLayoutDefinition);
}

// 2. Change layout for all tables
content = content.replace(/layout:\s*'noBorders'/g, 'layout: customTableLayout');

// 3. Clean up the Invoice footers (lines ~483-510)
// Replace the exact blocks for invoice
content = content.replace(
    /\[\s*\{\s*text:\s*'',\s*border:\s*\[true,\s*true,\s*true,\s*false\].*?border:\s*\[true,\s*true,\s*true,\s*false\].*?\]/s,
    `[
                            { text: '' },
                            { text: '消費税', fontSize: 9 },
                            { text: '' },
                            { text: '' },
                            { text: '' },
                            { text: formatCurrency(tax).replace('¥', ''), alignment: 'right', fontSize: 9 },
                            { text: '', fontSize: 9 }
                        ]`
);

content = content.replace(
    /\[\s*\{\s*text:\s*'',\s*border:\s*\[true,\s*false,\s*true,\s*true\].*?【合計 課税10\.0% 税抜額】.*?border:\s*\[true,\s*false,\s*true,\s*true\].*?\]/s,
    `[
                            { text: '' },
                            { text: '【合計 課税10.0% 税抜額】', colSpan: 3, fontSize: 9 },
                            {}, {},
                            { text: formatCurrency(subtotal).replace('¥', ''), colSpan: 2, alignment: 'right', fontSize: 9 },
                            {},
                            { text: '' }
                        ]`
);

content = content.replace(
    /\[\s*\{\s*text:\s*'',\s*border:\s*\[false,\s*false,\s*true,\s*true\].*?【合計 課税10\.0% 消費税額】.*?border:\s*\[true,\s*false,\s*true,\s*true\].*?\]/s,
    `[
                            { text: '' },
                            { text: '【合計 課税10.0% 消費税額】', colSpan: 3, fontSize: 9 },
                            {}, {},
                            { text: formatCurrency(tax).replace('¥', ''), colSpan: 2, alignment: 'right', fontSize: 9 },
                            {},
                            { text: '' }
                        ]`
);

// 4. Clean up Quotation footers (lines ~993-1015)
content = content.replace(
    /\[\s*\{\s*text:\s*'消費税',\s*colSpan:\s*1.*?\].*?\]/s,
    `[
                            { text: '消費税', colSpan: 1, fontSize: 9 },
                            { text: '' },
                            { text: '' },
                            { text: '' },
                            { text: formatCurrency(tax).replace('¥', ''), alignment: 'right', fontSize: 9 }
                        ]`
);

content = content.replace(
    /\[\s*\{\s*text:\s*'【合計 課税10\.0% 税抜額】'.*?\].*?\]/s,
    `[
                            { text: '【合計 課税10.0% 税抜額】', colSpan: 3, fontSize: 9 },
                            {}, {},
                            { text: '' },
                            { text: formatCurrency(subtotal).replace('¥', ''), alignment: 'right', fontSize: 9 }
                        ]`
);

content = content.replace(
    /\[\s*\{\s*text:\s*'【合計 課税10\.0% 消費税額】'.*?\].*?\]/s,
    `[
                            { text: '【合計 課税10.0% 消費税額】', colSpan: 3, fontSize: 9 },
                            {}, {},
                            { text: '' },
                            { text: formatCurrency(tax).replace('¥', ''), alignment: 'right', fontSize: 9 }
                        ]`
);

fs.writeFileSync('api/_server/pdfService.ts', content);
console.log('Fixed pdfService.ts using precise regex block replacement.');
