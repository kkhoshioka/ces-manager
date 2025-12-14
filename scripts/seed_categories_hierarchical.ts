import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./dev.db'
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding Hierarchical Master Categories...');

    // 1. Clear existing categories (careful in prod, ok for dev setup)
    // First, unlink products to avoid FK errors if possible, or just delete children then parents.
    // If strict FK, might need to update products to null categoryId first.
    // For now, let's assume we can wipe.
    /*
    await prisma.product.updateMany({ data: { categoryId: null } });
    await prisma.productCategory.deleteMany({}); 
    */

    // Strategy: Upsert Majors, then Upsert Minors linking to Majors.

    const hierarchy = [
        {
            major: "新車",
            minors: [
                { code: "M-01", name: "ミニHE" },
                { code: "M-02", name: "HE" },
                { code: "M-03", name: "TRC" },
                { code: "M-04", name: "その他" }
            ]
        },
        {
            major: "中古車",
            minors: [
                { code: "U-01", name: "ミニHE" },
                { code: "U-02", name: "HE" },
                { code: "U-03", name: "TRC" },
                { code: "U-04", name: "その他" }
            ]
        },
        {
            major: "新品",
            minors: [
                { code: "SA-01", name: "機械式ATT" },
                { code: "SA-02", name: "油圧式ATT" },
                { code: "SA-03", name: "ATTその他" },
                { code: "G-01", name: "現場用品" },
                { code: "P-01", name: "部品 本体用" },
                { code: "P-02", name: "部品 ATT用" },
                { code: "P-03", name: "部品 その他" }
            ]
        },
        {
            major: "中古品",
            minors: [
                { code: "UA-01", name: "機械式ATT" },
                { code: "UA-02", name: "油圧式ATT" },
                { code: "UA-03", name: "ATTその他" },
                { code: "G-02", name: "現場用品" },
                { code: "UP-01", name: "部品 本体用" },
                { code: "UP-02", name: "部品 ATT用" },
                { code: "UP-03", name: "部品 その他" }
            ]
        },
        {
            major: "レンタル",
            minors: [
                { code: "R-01", name: "本体" },
                { code: "R-02", name: "ATT" },
                { code: "R-03", name: "その他" }
            ]
        },
        {
            major: "修理",
            minors: [
                { code: "S-01", name: "本体" },
                { code: "S-02", name: "ATT" },
                { code: "S-03", name: "その他" },
                { code: "S-04", name: "特自" }
            ]
        },
        {
            major: "I-TEC",
            minors: [
                { code: "I-01", name: "化粧品" },
                { code: "I-02", name: "美容機器" },
                { code: "I-03", name: "その他" },
                { code: "I-04", name: "試供品転用" }
            ]
        },
        {
            major: "下取",
            minors: [
                { code: "T-01", name: "本体" },
                { code: "T-02", name: "ATT" },
                { code: "T-03", name: "現場用品" },
                { code: "T-04", name: "その他" }
            ]
        },
        {
            major: "その他",
            minors: [
                { code: "Other", name: "その他" }
            ]
        }
    ];

    for (const group of hierarchy) {
        // 1. Create/Update Major Category
        // We use name as unique key for 'Major' usually, but schema has code unique too.
        // Let's create Major categories without code or with a prefix code if needed.
        // For simplicity, Major categories might not have a "code" or use a generated one.
        const major = await prisma.productCategory.upsert({
            where: { code: `MAJOR_${group.major}` },
            update: { name: group.major },
            create: {
                name: group.major,
                code: `MAJOR_${group.major}`
            }
        });

        console.log(`Major: ${major.name} (ID: ${major.id})`);

        // 2. Create/Update Minor Categories
        for (const minor of group.minors) {
            // Need to handle potential duplicate codes if any, but our seed data seems unique (M-01 vs U-01).
            // Schema has code @unique.
            await prisma.productCategory.upsert({
                where: { code: minor.code },
                update: {
                    parentId: major.id,
                    name: minor.name // Update name if needed (e.g. removing prefix)
                },
                create: {
                    code: minor.code,
                    name: minor.name,
                    parentId: major.id
                }
            });
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
