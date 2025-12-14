import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const cat = await prisma.productCategory.findFirst();
        console.log('Category Sample:', cat);

        const prod = await prisma.product.findFirst({
            include: { productCategory: true }
        });
        console.log('Product Relation:', prod?.productCategory ? 'Found' : 'Not Found/Null');

        console.log('Runtime Check Passed');
    } catch (e) {
        console.error('Runtime Check Failed:', e);
    }
}
main();
