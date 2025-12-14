import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Master Data...');

    // 1. Customers
    const customers = [
        { code: "001", name: "㈱〇〇商事", address: "東京都...", phone: "03-XXXX-XXXX", email: "info@example.com" },
        { code: "002", name: "㈱△△興業", address: "神奈川県...", phone: "045-XXX-XXXX", "email": "info@example.com" },
        { code: "003", name: "㈱□□建設", address: "千葉県...", phone: "043-XXX-XXXX", "email": "contact@example.com" },
        { code: "004", name: "〇〇リース㈱", address: "東京都...", phone: "03-YYYY-YYYY", email: "lease@example.com" },
        { code: "005", name: "△△レンタル㈱", address: "神奈川県...", phone: "045-YYY-YYYY", email: "rental@example.com" }
    ];

    for (const c of customers) {
        await prisma.customer.upsert({
            where: { code: c.code },
            update: c,
            create: c
        });
    }
    console.log(`Seeded ${customers.length} customers.`);

    // 2. Product Categories
    const categories = ["部品", "修理", "レンタル", "新車", "中古車"];
    for (const name of categories) {
        // Map simple name to a valid record
        let section = "部品・他";
        if (name === "新車") section = "新車販売";
        if (name === "中古車") section = "中古車販売";
        if (name === "レンタル") section = "レンタル";
        if (name === "修理") section = "修理";

        // Generate a dummy code if it's a top level
        const code = "GEN-" + name;

        await prisma.productCategory.upsert({
            where: { code }, // Use code as unique identifier
            update: { section, name },
            create: { section, code, name }
        });
    }
    console.log(`Seeded ${categories.length} product categories.`);

    // 3. Operating Expenses
    const expenses = [
        { name: "Labor Cost", unit: "hour", standardCost: 3000, standardPrice: 5000 },
        { name: "Travel Expense", unit: "km", standardCost: 50, standardPrice: 80 },
        { name: "Outsourcing", unit: "job", standardCost: 0, standardPrice: 0 }
    ];

    for (const e of expenses) {
        await prisma.operatingExpense.upsert({
            where: { name: e.name },
            update: e,
            create: e
        });
    }
    console.log(`Seeded ${expenses.length} operating expenses.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
