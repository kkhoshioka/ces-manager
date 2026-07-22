const fs = require('fs');
const path = 'api/_server/index.ts';
let code = fs.readFileSync(path, 'utf8');

// We want to replace `});` that closes a `prisma.$transaction` block with `}, { timeout: 30000 });`
// But we must be careful to only target those specific transactions.

// Let's use a regex to replace `prisma.$transaction(async (tx) => {`
// Actually, it's easier to find the exact blocks.

const fixes = [
    // 1. /api/projects/:id/invoice
    {
        search: `            await prisma.$transaction(async (tx) => {
                await tx.project.update({
                    where: { id: Number(id) },
                    data: { isInvoiceIssued: true }
                });
                await handleProjectStock(tx, Number(id), 'deduct');
            });`,
        replace: `            await prisma.$transaction(async (tx) => {
                await tx.project.update({
                    where: { id: Number(id) },
                    data: { isInvoiceIssued: true }
                });
                await handleProjectStock(tx, Number(id), 'deduct');
            }, { timeout: 30000 });`
    },
    // 2. /api/billing/pdf-custom
    {
        search: `            const snapshot = await prisma.$transaction(async (tx) => {
                return await calculateBillingSnapshotForCustomer(tx, Number(custId), Number(year), Number(month), customer.closingDate);
            });`,
        replace: `            const snapshot = await prisma.$transaction(async (tx) => {
                return await calculateBillingSnapshotForCustomer(tx, Number(custId), Number(year), Number(month), customer.closingDate);
            }, { timeout: 30000 });`
    },
    // 3. /api/billing/pdf/:customerId/:year/:month
    {
        search: `        const snapshot = await prisma.$transaction(async (tx) => {
            return await calculateBillingSnapshotForCustomer(tx, Number(customerId), Number(year), Number(month), customer.closingDate);
        });`,
        replace: `        const snapshot = await prisma.$transaction(async (tx) => {
            return await calculateBillingSnapshotForCustomer(tx, Number(customerId), Number(year), Number(month), customer.closingDate);
        }, { timeout: 30000 });`
    },
    // 4. /api/billing/generate-invoices
    {
        search: `        await prisma.$transaction(async (tx) => {
            for (const c of customers) {
                await calculateBillingSnapshotForCustomer(tx, c.id, y, m, c.closingDate);
            }
        });`,
        replace: `        await prisma.$transaction(async (tx) => {
            for (const c of customers) {
                await calculateBillingSnapshotForCustomer(tx, c.id, y, m, c.closingDate);
            }
        }, { timeout: 120000 });` // 2 minutes for bulk generation
    }
];

let replaced = 0;
fixes.forEach(f => {
    if (code.includes(f.search)) {
        code = code.replace(f.search, f.replace);
        replaced++;
    } else {
        console.warn("Could not find block:\n" + f.search);
    }
});

fs.writeFileSync(path, code, 'utf8');
console.log('Replaced ' + replaced + ' blocks.');
