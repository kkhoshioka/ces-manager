import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findUnique({
        where: { id: 18 },
        include: { details: true }
    });
    console.log(JSON.stringify(project, null, 2));
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
