
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting and seeding database for Sales Management...');

    // Clean up
    await prisma.projectDetail.deleteMany();
    await prisma.project.deleteMany();
    await prisma.product.deleteMany();
    await prisma.productCategory.deleteMany();
    await prisma.customer.deleteMany();

    // 1. Seed Categories with Sections
    console.log('Seeding Categories...');

    // Define the new structure: Section -> [ { Code, Name } ]
    const categoriesData = [
        {
            section: '新車販売', items: [
                { code: 'M-01', name: 'ミニHE' },
                { code: 'M-02', name: 'HE' }
            ]
        },
        {
            section: '中古車販売', items: [
                { code: 'U-01', name: '中古ミニHE' },
                { code: 'U-02', name: '中古HE' }
            ]
        },
        {
            section: 'レンタル', items: [
                { code: 'R-01', name: 'レンタル機' }
            ]
        },
        {
            section: '修理', items: [
                { code: 'S-01', name: '修理全般' }, // Default bucket for Labor?
                { code: 'S-PART', name: '部品' }
            ]
        },
        {
            section: '部品・他', items: [
                { code: 'P-01', name: 'タイヤ' },
                { code: 'P-02', name: 'オイル' }
            ]
        }
    ];

    for (const group of categoriesData) {
        for (const item of group.items) {
            await prisma.productCategory.create({
                data: {
                    section: group.section,
                    code: item.code,
                    name: item.name
                }
            });
        }
    }

    // 2. Seed Customers
    console.log('Seeding Customers...');
    const customer = await prisma.customer.create({
        data: {
            code: 'C001',
            name: '株式会社テスト建機',
            address: '東京都新宿区',
            phone: '03-1234-5678'
        }
    });

    // 3. Seed Products
    console.log('Seeding Products...');
    // Find category IDs
    const newCarCat = await prisma.productCategory.findFirst({ where: { code: 'M-01' } });
    const partCat = await prisma.productCategory.findFirst({ where: { code: 'P-01' } });

    if (newCarCat) {
        await prisma.product.create({
            data: {
                code: 'PROD-001',
                name: '新型ショベル A',
                productCategory: { connect: { id: newCarCat.id } },
                category: newCarCat.name, // Legacy field
                standardPrice: 5000000,
                standardCost: 3500000,
                stockQuantity: 3
            }
        });
    }

    if (partCat) {
        await prisma.product.create({
            data: {
                code: 'PART-001',
                name: '建機用タイヤ 20inch',
                productCategory: { connect: { id: partCat.id } },
                category: partCat.name, // Legacy field
                standardPrice: 50000,
                standardCost: 30000,
                stockQuantity: 20
            }
        });
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
