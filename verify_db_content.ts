
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Checking DB content...');
    // Get the latest project
    const project = await prisma.project.findFirst({
        orderBy: { id: 'desc' },
        include: { details: true }
    });

    if (!project) {
        console.log('No projects found');
        return;
    }

    console.log('Latest Project ID:', project.id);
    console.log('Details count:', project.details.length);
    if (project.details.length > 0) {
        console.log('First Detail Supplier:', project.details[0].supplier);
        console.log('First Detail Remarks:', project.details[0].remarks);

        if (project.details[0].supplier === 'Test Supplier') {
            console.log('VERIFICATION SUCCESS: Data matches verification script input.');
        }
    }
}

main().finally(() => prisma.$disconnect());
