const fs = require('fs');

let code = fs.readFileSync('api/_server/index.ts', 'utf8');

// I will split the file by lines and reconstruct it
const lines = code.split('\n');
const fixedLines = [];

let insideBadBlock = false;
let foundStart = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we hit line 188
    if (!foundStart && line.includes("app.post('/api/machines', async (req, res) => {")) {
        foundStart = true;
        insideBadBlock = true;
        
        fixedLines.push("app.post('/api/machines', async (req, res) => {");
        fixedLines.push("    try {");
        fixedLines.push("        const { customerId, productCategoryId, ...data } = req.body;");
        fixedLines.push("        const machine = await prisma.customerMachine.create({");
        fixedLines.push("            data: {");
        fixedLines.push("                ...data,");
        fixedLines.push("                customerId: Number(customerId),");
        fixedLines.push("                productCategoryId: productCategoryId ? Number(productCategoryId) : null");
        fixedLines.push("            },");
        fixedLines.push("            include: { customer: true, category: true }");
        fixedLines.push("        });");
        fixedLines.push("        res.json(machine);");
        fixedLines.push("    } catch (error) {");
        fixedLines.push("        console.error('Failed to create machine:', error);");
        fixedLines.push("        res.status(500).json({");
        fixedLines.push("            error: 'Failed to create machine',");
        fixedLines.push("            details: error instanceof Error ? error.message : String(error)");
        fixedLines.push("        });");
        fixedLines.push("    }");
        fixedLines.push("});");
        fixedLines.push("");
        fixedLines.push("app.post('/api/machines/pdf', async (req, res) => {");
        fixedLines.push("    try {");
        fixedLines.push("        const { machines, title } = req.body;");
        fixedLines.push("        const pdfDoc = generateMachineRegistryPdf(machines, title);");
        fixedLines.push("        res.setHeader('Content-Type', 'application/pdf');");
        fixedLines.push("        let chunks: any[] = [];");
        fixedLines.push("        pdfDoc.on('data', (chunk: any) => { chunks.push(chunk); });");
        fixedLines.push("        pdfDoc.on('end', () => {");
        fixedLines.push("            const result = Buffer.concat(chunks);");
        fixedLines.push("            res.send(result);");
        fixedLines.push("        });");
        fixedLines.push("        pdfDoc.end();");
        fixedLines.push("    } catch (error) {");
        fixedLines.push("        console.error('Failed to generate machine registry pdf:', error);");
        fixedLines.push("        res.status(500).json({ error: 'Failed to generate PDF' });");
        fixedLines.push("    }");
        fixedLines.push("});");
        
        // Skip ahead to the next route `app.get('/api/machines/:id'`
        let j = i;
        while (j < lines.length) {
            if (lines[j].includes("app.get('/api/machines/:id', async (req, res) => {")) {
                i = j - 1; // loop will increment it to j
                insideBadBlock = false;
                break;
            }
            j++;
        }
        
    } else if (!insideBadBlock) {
        fixedLines.push(line);
    }
}

fs.writeFileSync('api/_server/index.ts', fixedLines.join('\n'));
console.log("Fixed the nested route issue reliably");
