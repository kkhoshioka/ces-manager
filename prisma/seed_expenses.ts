
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expenses = [
    // Top Level
    { name: '役員報酬', group: null },
    { name: '給与', group: null },
    { name: '社会保険料', group: null },
    { name: '減価償却費', group: null },
    { name: '消耗機器費', group: null },
    { name: '地代家賃', group: null },
    { name: '車両費', group: null },
    { name: 'リース料', group: null },
    // Group: その他経費
    { name: '租税公課', group: 'その他経費' },
    { name: '荷造運賃', group: 'その他経費' },
    { name: '水道光熱費', group: 'その他経費' },
    { name: '旅費交通費', group: 'その他経費' },
    { name: '通信費', group: 'その他経費' },
    { name: '広告宣伝費', group: 'その他経費' },
    { name: '接待交際費', group: 'その他経費' },
    { name: '販売促進費', group: 'その他経費' },
    { name: '販売手数料', group: 'その他経費' },
    { name: '損害保険料', group: 'その他経費' },
    { name: '修繕費', group: 'その他経費' },
    { name: '備品', group: 'その他経費' },
    { name: '消耗品費', group: 'その他経費' },
    { name: '事務用品費', group: 'その他経費' },
    { name: '福利厚生費', group: 'その他経費' },
    { name: '教育費', group: 'その他経費' },
    { name: '雑費', group: 'その他経費' },
    { name: '支払手数料', group: 'その他経費' },
    { name: '雑収入', group: 'その他経費' }, // Included as requested
    { name: '未払費用', group: 'その他経費' }, // Included as requested
    { name: '設備費', group: 'その他経費' }
];

async function main() {
    console.log('Start seeding expenses...');

    // Optional: Clear existing if needed, or just upsert.
    // Given user request "Insert this", we upsert.

    for (const item of expenses) {
        await prisma.operatingExpense.upsert({
            where: { name: item.name },
            update: { group: item.group },
            create: {
                name: item.name,
                group: item.group,
                unit: '',
                standardCost: 0,
                standardPrice: 0
            }
        });
    }

    console.log('Seeding expenses finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
