
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expenses = [
    // --- 人件費 ---
    { name: '役員報酬', group: '人件費' },
    { name: '給与', group: '人件費' },
    { name: '社会保険料', group: '人件費' },
    { name: '福利厚生費', group: '人件費' },

    // --- 車両・設備費 ---
    { name: '減価償却費', group: '車両・設備費' },
    { name: '消耗機器費', group: '車両・設備費' },
    { name: '車両費', group: '車両・設備費' },
    { name: 'リース料', group: '車両・設備費' },
    { name: '修繕費', group: '車両・設備費' },
    { name: '設備費', group: '車両・設備費' },

    // --- 営業活動費 ---
    { name: '荷造運賃', group: '営業活動費' },
    { name: '旅費交通費', group: '営業活動費' },
    { name: '広告宣伝費', group: '営業活動費' },
    { name: '接待交際費', group: '営業活動費' },
    { name: '販売促進費', group: '営業活動費' },
    { name: '販売手数料', group: '営業活動費' },
    // New Items
    { name: '会議費', group: '営業活動費' },
    { name: '諸会費', group: '営業活動費' },

    // --- 一般管理費 ---
    { name: '地代家賃', group: '一般管理費' },
    { name: '水道光熱費', group: '一般管理費' },
    { name: '通信費', group: '一般管理費' },
    { name: '租税公課', group: '一般管理費' },
    { name: '損害保険料', group: '一般管理費' },
    { name: '備品', group: '一般管理費' },
    { name: '消耗品費', group: '一般管理費' },
    { name: '事務用品費', group: '一般管理費' },
    { name: '教育費', group: '一般管理費' },
    { name: '雑費', group: '一般管理費' },
    { name: '支払手数料', group: '一般管理費' },
    // New Items
    { name: '新聞図書費', group: '一般管理費' },

    // --- その他/営業外 ---
    { name: '雑収入', group: '営業外' },
    { name: '未払費用', group: 'その他' },
];

async function main() {
    console.log('Start refining expenses...');

    for (const item of expenses) {
        await prisma.operatingExpense.upsert({
            where: { name: item.name },
            update: { group: item.group }, // Update group for existing
            create: {
                name: item.name,
                group: item.group,
                unit: '',
                standardCost: 0,
                standardPrice: 0
            }
        });
    }

    console.log('Refining expenses finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
