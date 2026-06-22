const fs = require('fs');
let code = fs.readFileSync('api/_server/index.ts', 'utf8');

const importRegex = /import \{ generateInvoice, generateDeliveryNote, generateQuotation, generateMonthlyInventoryPdf \} from '\.\/pdfService';/;
const importReplacement = "import { generateInvoice, generateDeliveryNote, generateQuotation, generateMonthlyInventoryPdf, generateMachineRegistryPdf } from './pdfService';";
code = code.replace(importRegex, importReplacement);

const chunkRegex = /pdfDoc\.on\('data', \(chunk\) => \{/g;
const chunkReplacement = "pdfDoc.on('data', (chunk: any) => {";
code = code.replace(chunkRegex, chunkReplacement);

fs.writeFileSync('api/_server/index.ts', code);
console.log("Fixed typescript errors");
