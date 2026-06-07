import { PrismaClient } from '@prisma/client';
import { handleProjectStock } from './api/_server/index';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing handleProjectStock...');
        // Find the latest completed project
        const project = await prisma.project.findFirst({
            where: { status: 'completed' },
            orderBy: { updatedAt: 'desc' },
            include: { details: true }
        });

        if (!project) {
            console.log('No completed projects found');
            return;
        }

        console.log(`Found project ${project.id}. Stock deducted: ${project.stockDeducted}`);
        console.log(`Details:`, project.details.map((d: any) => ({
            id: d.id,
            lineType: d.lineType,
            productId: d.productId,
            quantity: d.quantity
        })));

        // Test deduct
        await prisma.$transaction(async (tx) => {
            await handleProjectStock(tx, project.id, 'deduct');
            const afterProject = await tx.project.findUnique({ where: { id: project.id } });
            console.log(`After deduct: stockDeducted = ${afterProject?.stockDeducted}`);
            throw new Error("Rollback");
        }).catch(e => { if (e.message !== "Rollback") throw e; });
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
