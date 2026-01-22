
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting closing date updates...');

    // 1. Update Test Kogyo to 20th
    const res1 = await prisma.customer.updateMany({
        where: { name: 'テスト工業' },
        data: { closingDate: '20' }
    });
    console.log(`Updated Test Kogyo (20th): ${res1.count} records`);

    // 2. Update Kaitai & Shiseido to 25th
    const res2 = await prisma.customer.updateMany({
        where: {
            name: { in: ['解体屋さん', '資〇堂'] }
        },
        data: { closingDate: '25' }
    });
    console.log(`Updated Kaitai/Shiseido (25th): ${res2.count} records`);

    // 3. Update all others to End of Month (99)
    const res3 = await prisma.customer.updateMany({
        where: {
            AND: [
                { name: { not: 'テスト工業' } },
                { name: { notIn: ['解体屋さん', '資〇堂'] } }
            ]
        },
        data: { closingDate: '99' }
    });
    console.log(`Updated others (End of Month): ${res3.count} records`);

    console.log('Update complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
