const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let code = fs.readFileSync(path, 'utf8');

// We need to remove the seal block inside generateDeliveryNote.
const deliveryNoteStart = code.indexOf('export const generateDeliveryNote =');
const sealCallIndex = code.indexOf('const seal = getSealImage();', deliveryNoteStart);
const sealBlockStart = code.lastIndexOf('...( (() => {', sealCallIndex);
const sealBlockEndStr = '})() ),';
const sealBlockEnd = code.indexOf(sealBlockEndStr, sealBlockStart) + sealBlockEndStr.length;

code = code.substring(0, sealBlockStart) + code.substring(sealBlockEnd);

fs.writeFileSync(path, code, 'utf8');
console.log('Seal removed from Delivery Note.');
