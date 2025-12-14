import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customer.findMany();
    console.log('Customers:', customers.length);
    customers.forEach((c: any) => console.log(`- ${c.name} (${c.code})`));

    const categories = await prisma.productCategory.findMany();
    console.log('Categories:', categories.length);
    categories.forEach((c: any) => console.log(`- ${c.name}`));

    const expenses = await prisma.operatingExpense.findMany();
    console.log('Expenses:', expenses.length);
    expenses.forEach((e: any) => console.log(`- ${e.name}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
