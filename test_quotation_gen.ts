
import { generateQuotation } from './server/pdfService';
import fs from 'fs';
import path from 'path';

// Mock Data
const project = {
    id: 12345,
    customer: { name: 'Test Customer Co., Ltd.' },
    machineModel: 'EX-200',
    serialNumber: 'SN-9999',
    details: [
        { description: 'Repair Part A', quantity: 2, unitPrice: 5000, unitCost: 3000, lineType: 'part' },
        { description: 'Service Labor', quantity: 1, unitPrice: 15000, unitCost: 0, lineType: 'labor' },
        { description: '【移動時間】Travel', quantity: 2, unitPrice: 3000, unitCost: 0, lineType: 'travel' }
    ],
    notes: 'Test Quotation Generation'
};

async function test() {
    console.log('Generating Quotation PDF...');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfDoc: any = generateQuotation(project as any);

        const chunks: Buffer[] = [];
        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => {
            const result = Buffer.concat(chunks);
            fs.writeFileSync('test_quotation_output.pdf', result);
            console.log('SUCCESS: test_quotation_output.pdf created');
        });
        pdfDoc.end();
    } catch (e) {
        console.error('Error generating PDF:', e);
    }
}

test();
