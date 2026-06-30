const fs = require('fs');
let f = fs.readFileSync('api/_server/pdfService.ts', 'utf8');
let lines = f.split('\n');

for(let i=710; i<730; i++) {
    if(lines[i] && lines[i].includes('得意先不明')) {
        lines.splice(i+1, 0, '                            ...(project.customerContactName ? [{ text: `\\n${project.customerContactName} 様`, fontSize: 11, margin: [10, 0, 0, 0] }] : []),');
        break;
    }
}
fs.writeFileSync('api/_server/pdfService.ts', lines.join('\n'));
