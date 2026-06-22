const fs = require('fs');

let code = fs.readFileSync('api/_server/index.ts', 'utf8');

// I need to extract the `/api/machines/pdf` block and put it outside.
const badInsertionRegex = /app\.post\('\/api\/machines\/pdf', async \(req, res\) => \{[\s\S]*?\}\);\s*/;

const match = code.match(badInsertionRegex);
if (match) {
    const pdfRoute = match[0];
    
    // Remove it from its current position
    code = code.replace(pdfRoute, '');
    
    // Insert it properly AFTER app.post('/api/machines') finishes
    const insertPointRegex = /app\.post\('\/api\/machines', async \(req, res\) => \{[\s\S]*?\}\);\r?\n/;
    code = code.replace(insertPointRegex, '$&\n' + pdfRoute);
    
    fs.writeFileSync('api/_server/index.ts', code);
    console.log("Fixed the nested route issue");
} else {
    console.log("Could not find the pdf route block");
}
