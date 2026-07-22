const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let code = fs.readFileSync(path, 'utf8');

const funcStart = code.indexOf('export const generateDeliveryNote = (project: Project) => {');
const funcEnd = code.indexOf('export const generateQuotation = (project: Project) => {');

if (funcStart !== -1 && funcEnd !== -1) {
    let funcCode = code.substring(funcStart, funcEnd);
    
    const replacement1 = `    const subtotal = processedDetails.reduce((sum: number, d: ProjectDetail) => {
        if (d.lineType === 'padding') return sum;
        return sum + (Number(d.quantity) * Number(d.unitPrice));
    }, 0);
    const taxableSubtotal = processedDetails.reduce((sum: number, d: ProjectDetail) => {
        if (d.lineType === 'padding' || d.isTaxExempt) return sum;
        return sum + (Number(d.quantity) * Number(d.unitPrice));
    }, 0);
    const tax = Math.floor(taxableSubtotal * 0.1);
    const total = subtotal + tax;

    const summaryTableBody = [
        [
            { text: '御請求金額', style: 'tableHeaderMain' },
            { text: '内、消費税', style: 'tableHeaderMain' },
            { text: '', border: [false, false, false, false] },
            { text: '税抜金額計', style: 'tableHeaderMain' },
            { text: '消費税額計', style: 'tableHeaderMain' },
            { text: '', border: [false, false, false, false] },
            { text: '今回御請求額', style: 'blueHeaderUnique' }
        ],
        [
            { text: formatCurrency(total).replace('¥', ''), style: 'summaryCell', border: [true, false, true, true], borderColor: [BORDER_COLOR, BORDER_COLOR, BORDER_COLOR, BORDER_COLOR] },
            { text: formatCurrency(tax).replace('¥', ''), style: 'summaryCell', border: [true, false, true, true], borderColor: [BORDER_COLOR, BORDER_COLOR, BORDER_COLOR, BORDER_COLOR] },
            { text: '', border: [false, false, false, false] },
            { text: formatCurrency(subtotal).replace('¥', ''), style: 'summaryCell', border: [true, false, true, true], borderColor: [BORDER_COLOR, BORDER_COLOR, BORDER_COLOR, BORDER_COLOR] },
            { text: formatCurrency(tax).replace('¥', ''), style: 'summaryCell', border: [true, false, true, true], borderColor: [BORDER_COLOR, BORDER_COLOR, BORDER_COLOR, BORDER_COLOR] },
            { text: '', border: [false, false, false, false] },
            { text: formatCurrency(total).replace('¥', ''), style: 'summaryCell', border: [true, false, true, true], borderColor: ['#1a3c7e', '#1a3c7e', '#1a3c7e', '#1a3c7e'], fillColor: '#EBF5FF' }
        ]
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {`;
    
    // Replace docDefinition declaration
    const docDefRegex = /\/\/\s*eslint-disable-next-line\s*@typescript-eslint\/no-explicit-any\s+const\s+docDefinition:\s*any\s*=\s*\{/;
    funcCode = funcCode.replace(docDefRegex, replacement1);
    
    // Replace Spacing
    const replacement2 = `            // Summary Table (Top)
            {
                unbreakable: true,
                stack: [
                    {
                        table: {
                            widths: [80, 80, 80, 80, 80, 5, 80],
                            body: summaryTableBody
                        },
                        layout: {
                            hLineWidth: (i: number) => 1,
                            vLineWidth: (i: number) => 1,
                            hLineColor: BORDER_COLOR,
                            vLineColor: BORDER_COLOR,
                        }
                    }
                ],
                margin: [0, 20, 0, 15]
            },`;
            
    const spacingRegex = /\/\/\s*Spacing\s+\{\s*text:\s*'',\s*margin:\s*\[0,\s*0,\s*0,\s*20\]\s*\},/;
    funcCode = funcCode.replace(spacingRegex, replacement2);
    
    code = code.substring(0, funcStart) + funcCode + code.substring(funcEnd);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Update complete');
} else {
    console.log('Could not find generateDeliveryNote');
}
