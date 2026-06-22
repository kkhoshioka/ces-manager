const fs = require('fs');

// 1. Update pdfService.ts
let pdfServiceCode = fs.readFileSync('api/_server/pdfService.ts', 'utf8');

const generateMachineRegistryPdf = `
export const generateMachineRegistryPdf = (machines: any[], title: string) => {
    const docDefinition: any = {
        pageMargins: [20, 30, 20, 30],
        pageSize: 'A4',
        pageOrientation: 'portrait',
        content: [
            { text: title || '機材台帳', fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
            {
                columns: [
                    { text: \`出力日: \${new Date().toLocaleDateString('ja-JP')} \${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}\`, fontSize: 9 },
                    { text: \`総件数: \${machines.length}件\`, alignment: 'right', fontSize: 9 }
                ],
                margin: [0, 0, 0, 5]
            },
            {
                table: {
                    headerRows: 1,
                    dontBreakRows: true,
                    widths: [80, 100, 80, 60, 60, '*'],
                    body: [
                        [
                            { text: '顧客名', style: 'tableHeaderMain' },
                            { text: '機種名(モデル)', style: 'tableHeaderMain' },
                            { text: 'シリアルNo', style: 'tableHeaderMain' },
                            { text: 'アワーメーター', style: 'tableHeaderMain' },
                            { text: '次回点検期限', style: 'tableHeaderMain' },
                            { text: '備考', style: 'tableHeaderMain' }
                        ],
                        ...machines.map((m, index) => {
                            const fillColor = index % 2 === 0 ? null : '#EBF5FF';
                            return [
                                { text: m.customer?.name || '', fontSize: 9, fillColor },
                                { text: m.machineModel || '', fontSize: 9, fillColor },
                                { text: m.serialNumber || '', fontSize: 9, fillColor },
                                { text: m.hourMeter?.toString() || '', alignment: 'right', fontSize: 9, fillColor },
                                { text: m.nextInspectionDate ? new Date(m.nextInspectionDate).toLocaleDateString('ja-JP') : '', alignment: 'center', fontSize: 9, fillColor },
                                { text: m.notes || '', fontSize: 9, fillColor }
                            ];
                        })
                    ]
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#5B9BD5',
                    vLineColor: () => '#5B9BD5',
                    paddingLeft: () => 4,
                    paddingRight: () => 4,
                    paddingTop: () => 4,
                    paddingBottom: () => 4,
                }
            }
        ],
        defaultStyle: {
            font: 'Roboto',
            fontSize: 10
        },
        styles: {
            tableHeaderMain: {
                fillColor: '#5B9BD5',
                color: 'white',
                fontSize: 9,
                alignment: 'center',
                bold: true
            }
        }
    };

    return printer.createPdfKitDocument(docDefinition);
};
`;

if (!pdfServiceCode.includes('generateMachineRegistryPdf')) {
    fs.appendFileSync('api/_server/pdfService.ts', generateMachineRegistryPdf);
    console.log("Added generateMachineRegistryPdf to pdfService.ts");
} else {
    console.log("generateMachineRegistryPdf already exists.");
}

// 2. Update index.ts
let indexCode = fs.readFileSync('api/_server/index.ts', 'utf8');

const importRegex = /import \{ generateInvoice, generateDeliveryNote, generateQuotation \}/;
const importReplacement = "import { generateInvoice, generateDeliveryNote, generateQuotation, generateMachineRegistryPdf }";
if (indexCode.includes('generateMachineRegistryPdf }')) {
    console.log('Already imported in index.ts');
} else {
    indexCode = indexCode.replace(importRegex, importReplacement);
}

const endpoint = `
app.post('/api/machines/pdf', async (req, res) => {
    try {
        const { machines, title } = req.body;
        
        const pdfDoc = generateMachineRegistryPdf(machines, title);
        
        res.setHeader('Content-Type', 'application/pdf');
        
        // This makes sure res.send can take the chunks
        let chunks: any[] = [];
        pdfDoc.on('data', (chunk) => {
            chunks.push(chunk);
        });
        
        pdfDoc.on('end', () => {
            const result = Buffer.concat(chunks);
            res.send(result);
        });
        
        pdfDoc.end();
        
    } catch (error) {
        console.error('Failed to generate machine registry pdf:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});
`;

if (!indexCode.includes('/api/machines/pdf')) {
    // Insert right after app.post('/api/machines')
    const insertPoint = /app\.post\('\/api\/machines', async \(req, res\) => \{[\s\S]*?\}\);\r?\n/;
    indexCode = indexCode.replace(insertPoint, '$&\n' + endpoint);
    fs.writeFileSync('api/_server/index.ts', indexCode);
    console.log("Added /api/machines/pdf to index.ts");
} else {
    console.log("/api/machines/pdf already exists in index.ts");
}
