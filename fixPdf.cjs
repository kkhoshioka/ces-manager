const fs = require('fs');
let content = fs.readFileSync('api/_server/pdfService.ts', 'utf8');

const deliveryNoteColorBlock = `    const PRIMARY_COLOR = '#4a90e2';
const ACCENT_COLOR = '#f8fafc';
const BORDER_COLOR = '#cbd5e1';

const customTableLayout = {`;

if (content.includes(deliveryNoteColorBlock)) {
    content = content.replace(
        /    const PRIMARY_COLOR = '#4a90e2';\nconst ACCENT_COLOR = '#f8fafc';\nconst BORDER_COLOR = '#cbd5e1';\n\nconst customTableLayout = \{[\s\S]*?paddingBottom: function\(i: number\) \{ return 4; \}\n\};\n/m,
        `    const PRIMARY_COLOR = '#5B9BD5';\n    const ACCENT_COLOR = '#EBF5FF';\n    const BORDER_COLOR = '#5B9BD5';\n`
    );
}

content = content.replace(/layout:\s*'noBorders'/g, 'layout: customTableLayout');
content = content.replace(/,\s*border:\s*\[.*?\]\s*,\s*borderColor:\s*\[.*?\]/g, '');

fs.writeFileSync('api/_server/pdfService.ts', content);
console.log('Fixed pdfService.ts');
