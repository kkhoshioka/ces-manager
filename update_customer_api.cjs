const fs = require('fs');

let code = fs.readFileSync('api/_server/index.ts', 'utf8');
code = code.replace(/\r\n/g, '\n');

const getCustomerBlock = `app.get('/api/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { customerMachines: true }
        });
        res.json(customers);
    } catch {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});`;

const newGetCustomerBlock = `app.get('/api/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { customerMachines: true, contacts: true }
        });
        res.json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});`;

const postCustomerBlock = `app.post('/api/customers', async (req, res) => {
    try {
        const customer = await prisma.customer.create({
            data: req.body
        });
        res.json(customer);
    } catch {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});`;

const newPostCustomerBlock = `app.post('/api/customers', async (req, res) => {
    try {
        const { id, customerMachines, contacts, createdAt, updatedAt, ...customerData } = req.body;
        const customer = await prisma.customer.create({
            data: {
                ...customerData,
                contacts: contacts && Array.isArray(contacts) && contacts.length > 0 ? {
                    create: contacts.map((c: any) => ({
                        name: c.name,
                        position: c.position,
                        mobile: c.mobile
                    }))
                } : undefined
            }
        });
        res.json(customer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});`;

const putCustomerBlock = `app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(customer);
    } catch {
        res.status(500).json({ error: 'Failed to update customer' });
    }
});`;

const newPutCustomerBlock = `app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { id: bodyId, customerMachines, contacts, createdAt, updatedAt, ...customerData } = req.body;
        const customer = await prisma.customer.update({
            where: { id: Number(id) },
            data: {
                ...customerData,
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
        res.json(customer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});`;

if (code.includes(getCustomerBlock) && code.includes(postCustomerBlock) && code.includes(putCustomerBlock)) {
    code = code.replace(getCustomerBlock, newGetCustomerBlock);
    code = code.replace(postCustomerBlock, newPostCustomerBlock);
    code = code.replace(putCustomerBlock, newPutCustomerBlock);
    fs.writeFileSync('api/_server/index.ts', code);
    console.log("Successfully updated API endpoints.");
} else {
    console.log("Failed to find blocks");
    if (!code.includes(getCustomerBlock)) console.log("Missing GET");
    if (!code.includes(postCustomerBlock)) console.log("Missing POST");
    if (!code.includes(putCustomerBlock)) console.log("Missing PUT");
}
