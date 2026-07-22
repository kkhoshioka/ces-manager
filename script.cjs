const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove includeZeroAmount: true from generateDeliveryNote
const processProjectDetailsRegex = /const processedDetails = processProjectDetails\(project\.details,\s*\{\s*includeZeroAmount:\s*true,\s*hideZeroAmountLabor:\s*true\s*\}\);/;
code = code.replace(processProjectDetailsRegex, `let processedDetails = processProjectDetails(project.details, { hideZeroAmountLabor: true });`);

// 2. Extract Invoice detail table
const invoiceTableStart = code.indexOf('// Detail Table');
const invoiceTableEndStr = `                layout: 'noBorders' // Use cell borders
            }`;
const invoiceTableEnd = code.indexOf(invoiceTableEndStr, invoiceTableStart) + invoiceTableEndStr.length;
const invoiceTableCode = code.substring(invoiceTableStart, invoiceTableEnd);

// 3. Find Delivery Note detail table
const generateDeliveryNoteStart = code.indexOf('export const generateDeliveryNote');
const deliveryNoteTableStart = code.indexOf('// Detail Table', generateDeliveryNoteStart);
const deliveryNoteTableEndStr = `                layout: 'noBorders' // Use cell borders
            }`;
const deliveryNoteTableEnd = code.indexOf(deliveryNoteTableEndStr, deliveryNoteTableStart) + deliveryNoteTableEndStr.length;

// 4. Replace Delivery Note detail table with Invoice detail table
code = code.substring(0, deliveryNoteTableStart) + invoiceTableCode + code.substring(deliveryNoteTableEnd);

// 5. Save
fs.writeFileSync(path, code, 'utf8');
console.log('Update complete');
