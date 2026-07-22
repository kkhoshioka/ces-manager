const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add formatHourMeter helper
const formatHelper = `const formatDate = (date: Date | string | null) => {`;
const newFormatHelper = `const formatHourMeter = (hm?: string | null) => {
    if (!hm) return '';
    const numericOnly = hm.replace(/[^0-9.]/g, '');
    if (!numericOnly) return hm;
    return Number(numericOnly).toLocaleString() + ' hr';
};

const formatDate = (date: Date | string | null) => {`;
code = code.replace(formatHelper, newFormatHelper);

// 2. Update Invoice PDF (around line 427 after previous edits)
// Actually we can just do a regex replace or string replace for the hourMeter logic
const search1 = `\\nアワーメーター: \${project.hourMeter}`;
const replace1 = `\\nアワーメーター: \${formatHourMeter(project.hourMeter)}`;
code = code.split(search1).join(replace1);

fs.writeFileSync(path, code, 'utf8');
console.log('Update pdfService.ts complete');
