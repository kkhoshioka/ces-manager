const fs = require('fs');

let code = fs.readFileSync('api/_server/index.ts', 'utf8');

const getSupplierBlock = `app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany();
        res.json(suppliers);
    } catch {
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});`;

const newGetSupplierBlock = `app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: { contacts: true }
        });
        res.json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});`;

const postSupplierBlock = `app.post('/api/suppliers', async (req, res) => {
    try {
        const supplier = await prisma.supplier.create({
            data: req.body
        });
        res.json(supplier);
    } catch {
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});`;

const newPostSupplierBlock = `app.post('/api/suppliers', async (req, res) => {
    try {
        const { id, contacts, createdAt, updatedAt, ...supplierData } = req.body;
        const supplier = await prisma.supplier.create({
            data: {
                ...supplierData,
                contacts: contacts && Array.isArray(contacts) && contacts.length > 0 ? {
                    create: contacts.map((c: any) => ({
                        name: c.name,
                        position: c.position,
                        mobile: c.mobile
                    }))
                } : undefined
            }
        });
        res.json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});`;

const putSupplierBlock = `app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(supplier);
    } catch {
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});`;

const newPutSupplierBlock = `app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { id: bodyId, contacts, createdAt, updatedAt, ...supplierData } = req.body;
        const supplier = await prisma.supplier.update({
            where: { id: Number(id) },
            data: {
                ...supplierData,
                contacts: contacts && Array.isArray(contacts) ? {
                    deleteMany: {},
                    create: contacts.map((c: any) => ({
                        name: c.name,
                        position: c.position,
                        mobile: c.mobile
                    }))
                } : undefined
            }
        });
        res.json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});`;

if (!code.includes(getSupplierBlock)) console.log("Missing getSupplierBlock");
if (!code.includes(postSupplierBlock)) console.log("Missing postSupplierBlock");
if (!code.includes(putSupplierBlock)) console.log("Missing putSupplierBlock");

code = code.replace(getSupplierBlock, newGetSupplierBlock);
code = code.replace(postSupplierBlock, newPostSupplierBlock);
code = code.replace(putSupplierBlock, newPutSupplierBlock);

fs.writeFileSync('api/_server/index.ts', code);
console.log("Updated api/_server/index.ts for suppliers.");
