import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        const project = await prisma.project.findFirst({
            orderBy: { updatedAt: 'desc' },
            include: { details: true }
        });

        if (!project) {
            console.log('No projects found');
            return;
        }

        console.log(`Latest project ID: ${project.id}, status: ${project.status}, stockDeducted: ${project.stockDeducted}`);
        console.dir(project.details.map(d => ({
            id: d.id,
            lineType: d.lineType,
            productId: d.productId,
            productCategoryId: d.productCategoryId,
            productCode: d.productCode,
            description: d.description
        })), { depth: null });
        
        const products = await prisma.product.findMany({
            where: { code: 'UP-01-001' }
        });
        console.log('Products matching UP-01-001:');
        console.dir(products, { depth: null });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
