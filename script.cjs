const fs = require('fs');
const path = 'api/_server/index.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix projectForPdf in /api/projects/:id/pdf/:type
const search1 = `        const projectForPdf = {
            ...project,
            details: project.details.map(toNum),
            machineModel: project.customerMachine?.machineModel || '',
            serialNumber: project.customerMachine?.serialNumber || '',
            notes: project.notes || undefined
        };`;
const replace1 = `        const projectForPdf = {
            ...project,
            details: project.details.map(toNum),
            machineModel: project.machineModel || project.customerMachine?.machineModel || '',
            serialNumber: project.serialNumber || project.customerMachine?.serialNumber || '',
            hourMeter: project.hourMeter || project.customerMachine?.hourMeter || '',
            notes: project.notes || undefined
        };`;
code = code.replace(search1, replace1);

// 2. Fix quotation projectLike in /api/projects/:id/pdf
const search2 = `                customer: quotation.project.customer,
                machineModel: quotation.project.machineModel || quotation.project.customerMachine?.machineModel,
                serialNumber: quotation.project.serialNumber || quotation.project.customerMachine?.serialNumber,
                notes: quotation.notes || quotation.project.notes, // Prefer quotation notes`;
const replace2 = `                customer: quotation.project.customer,
                machineModel: quotation.project.machineModel || quotation.project.customerMachine?.machineModel,
                serialNumber: quotation.project.serialNumber || quotation.project.customerMachine?.serialNumber,
                hourMeter: quotation.project.hourMeter || quotation.project.customerMachine?.hourMeter,
                notes: quotation.notes || quotation.project.notes, // Prefer quotation notes`;
code = code.replace(search2, replace2);

// 3. Fix pdfData in /api/projects/:id/pdf
const search3 = `            const pdfData = {
                id: project.id,
                customer: { name: project.customer?.name || '得意先不明', code: project.customer?.code },
                machineModel: project.machineModel || project.customerMachine?.machineModel || '',
                serialNumber: project.serialNumber || project.customerMachine?.serialNumber || '',
                details: safeDetails,
                notes: project.notes || '',
                createdAt: project.createdAt,
                completionDate: project.completionDate
            };`;
const replace3 = `            const pdfData = {
                id: project.id,
                customer: { name: project.customer?.name || '得意先不明', code: project.customer?.code },
                machineModel: project.machineModel || project.customerMachine?.machineModel || '',
                serialNumber: project.serialNumber || project.customerMachine?.serialNumber || '',
                hourMeter: project.hourMeter || project.customerMachine?.hourMeter || '',
                details: safeDetails,
                notes: project.notes || '',
                createdAt: project.createdAt,
                completionDate: project.completionDate
            };`;
code = code.replace(search3, replace3);

fs.writeFileSync(path, code, 'utf8');
console.log('Update index.ts complete');
