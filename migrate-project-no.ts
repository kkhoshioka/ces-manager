import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany();
    let updatedCount = 0;

    for (const project of projects) {
        if (!project.notes) continue;
        
        // Match numbers-numbers like "7-18" or "10-2"
        const match = project.notes.match(/(\d+-\d+)/);
        
        if (match && !project.projectNo) {
            const projectNo = match[1];
            
            // For now, I will just copy it to projectNo. I will also remove it from the beginning of notes if it's there.
            // Often it looks like "7-18\n\n備考: ..." or something.
            // Let's just set the projectNo.
            
            await prisma.project.update({
                where: { id: project.id },
                data: { projectNo: projectNo }
            });
            updatedCount++;
            console.log(`Updated Project ${project.id} with projectNo: ${projectNo}`);
        }
    }
    
    console.log(`Finished processing. Updated ${updatedCount} projects.`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
