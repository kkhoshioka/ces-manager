import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./dev.db'
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const customers = await prisma.customer.findMany();
    console.log('Customers:', customers.length);
    customers.forEach(c => console.log(`- ${c.name} (${c.code})`));

    const categories = await prisma.productCategory.findMany();
    console.log('Categories:', categories.length);
    categories.forEach(c => console.log(`- ${c.name}`));

    const expenses = await prisma.operatingExpense.findMany();
    console.log('Expenses:', expenses.length);
    expenses.forEach(e => console.log(`- ${e.name}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
