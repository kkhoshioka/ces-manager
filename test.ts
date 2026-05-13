import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const profiles = await prisma.profile.findMany();
    console.log(profiles);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
