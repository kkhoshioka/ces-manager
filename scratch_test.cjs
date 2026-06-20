const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const billings = await prisma.monthlyBilling.findMany({
        where: { year: 2026, month: 6 }
    });
    console.log("MonthlyBillings for 2026/06:");
    console.dir(billings, { depth: null });
    
    const statuses = await prisma.monthlyBillStatus.findMany({
        where: { year: 2026, month: 6 }
    });
    console.log("MonthlyBillStatus for 2026/06:");
    console.dir(statuses, { depth: null });
}
main().finally(() => prisma.$disconnect());
