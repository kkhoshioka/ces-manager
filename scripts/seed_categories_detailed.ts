import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./dev.db'
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding Detailed Category Master...');

    const data = [
        { code: "M-01", name: "新車　ミニHE" },
        { code: "M-02", name: "新車　HE" },
        { code: "M-03", name: "新車　TRC" },
        { code: "M-04", name: "新車　その他" },
        { code: "U-01", name: "中古車　ミニＨＥ" },
        { code: "U-02", name: "中古車　HE" },
        { code: "U-03", name: "中古車　TRC" },
        { code: "U-04", name: "中古車　その他" },
        { code: "SA-01", name: "新品　機械式ATT" },
        { code: "SA-02", name: "新品　油圧式ATT" },
        { code: "SA-03", name: "新品　ATTその他" },
        { code: "UA-01", name: "中古品　機械式ATT" },
        { code: "UA-02", name: "中古品　油圧式ATT" },
        { code: "UA-03", name: "中古品　ATTその他" },
        { code: "R-01", name: "レンタル　本体" },
        { code: "R-02", name: "レンタル　ATT" },
        { code: "R-03", name: "レンタル　その他" },
        { code: "P-01", name: "新品部品　本体用" },
        { code: "P-02", name: "新品部品　ATT用" },
        { code: "P-03", name: "新品部品　その他" },
        { code: "UP-01", name: "中古部品　本体用" },
        { code: "UP-02", name: "中古部品　ATT用" },
        { code: "UP-03", name: "中古部品　その他" },
        { code: "S-01", name: "修理　本体" },
        { code: "S-02", name: "修理　ATT" },
        { code: "S-03", name: "修理　その他" },
        { code: "S-04", name: "特自" },
        { code: "G-01", name: "新品　現場用品" },
        { code: "G-02", name: "中古品　現場用品" },
        { code: "Other", name: "その他" },
        { code: "I-01", name: "I-TEC 化粧品" },
        { code: "I-02", name: "I-TEC 美容機器" },
        { code: "I-03", name: "I-TEC　その他" },
        { code: "I-04", name: "I-TEC　試供品転用" },
        { code: "T-01", name: "下取機" },
        { code: "T-02", name: "下取　ATT" },
        { code: "T-03", name: "下取　現場用品" },
        { code: "T-04", name: "下取　その他" }
    ];

    // Optional: Clean up existing categories that don't have codes or conflict
    // But upsert is safer.
    // However, if we want to REPLACE the list, we should delete all first.
    // Given this is a "Master Setup" request, clearing is cleaner.

    // Check if we have data first
    const count = await prisma.productCategory.count();
    if (count > 0) {
        console.log(`Deleting ${count} existing categories...`);
        // We can't easily delete items that are referenced by other tables (RESTRICT/FOREIGN KEY).
        // schema.prisma doesn't show explicit relation from Product to Category (it's just a string).
        // So deletion should be safe.
        await prisma.productCategory.deleteMany({});
    }

    for (const item of data) {
        await prisma.productCategory.create({
            data: item
        });
    }

    console.log(`Seeded ${data.length} detailed categories.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
