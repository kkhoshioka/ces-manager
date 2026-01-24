
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuppliers() {
    console.log('--- Checking Suppliers ---');
    const suppliers = await prisma.supplier.findMany();
    suppliers.forEach(s => {
        console.log(`ID: ${s.id}, Name: ${s.name}, Code: ${s.code}`);
    });
}

checkSuppliers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
