import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const year = 2026;
    const month = 2;
    const closingDate = '25';

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const whereClause: any = {};
    if (closingDate !== 'all') {
        if (closingDate === 'others') {
            whereClause.NOT = { closingDate: { in: ['5', '10', '15', '20', '25', '99'] } };
        } else {
            whereClause.closingDate = closingDate;
        }
    }

    const projects = await prisma.project.findMany({
        where: {
            AND: [
                { customer: whereClause },
                {
                    OR: [
                        { completionDate: { gte: startDate, lte: endDate } },
                        { createdAt: { gte: startDate, lte: endDate } }
                    ]
                }
            ]
        },
        include: {
            customer: true
        }
    });

    console.log(`Found ${projects.length} projects for ${year}/${month} closing on ${closingDate}`);
    projects.forEach(p => {
        console.log(`- Project ID: ${p.id}, Customer: ${p.customer?.name}, Created: ${p.createdAt}, Completed: ${p.completionDate}`);
    });
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
