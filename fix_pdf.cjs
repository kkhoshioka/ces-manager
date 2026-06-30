const fs = require('fs');
let f = fs.readFileSync('api/_server/pdfService.ts', 'utf8');

// Remove customerContactName from Invoice
const invoiceRegex = /\.\.\.\(project\.customerContactName \? \[\{ text: `\\n\$\{project\.customerContactName\} 様`, fontSize: 11, margin: \[10, 0, 0, 0\] \}\] : \[\]\),\r?\n\s*/g;
f = f.replace(invoiceRegex, '');

// Wait, the regex might replace the one in Delivery Note too, but Delivery Note needs it!
// Delivery Note is around line 720. Let's instead just do index-based replacement.
f = fs.readFileSync('api/_server/pdfService.ts', 'utf8');
let lines = f.split('\n');

// 1. Remove customerContactName from Invoice
// Look for line containing 'project.customerContactName' around line 390
for(let i=380; i<410; i++) {
    if(lines[i] && lines[i].includes('project.customerContactName')) {
        lines.splice(i, 1);
        break;
    }
}

// 2. Add internalRep to Invoice
// Look for '登録番号 T4260001033325' around line 414
for(let i=400; i<440; i++) {
    if(lines[i] && lines[i].includes("'登録番号 T4260001033325'")) {
        lines[i] = lines[i].replace("'登録番号 T4260001033325'", "'登録番号 T4260001033325' + (project.internalRep ? `\\n\\n担当: ${project.internalRep}` : '')");
        break;
    }
}

// 3. Add internalRep to Delivery Note
// Look for '登録番号 T4260001033325' around line 740
for(let i=720; i<780; i++) {
    if(lines[i] && lines[i].includes("'登録番号 T4260001033325'")) {
        lines[i] = lines[i].replace("'登録番号 T4260001033325'", "'登録番号 T4260001033325' + (project.internalRep ? `\\n\\n担当: ${project.internalRep}` : '')");
        break;
    }
}

fs.writeFileSync('api/_server/pdfService.ts', lines.join('\n'));
