import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

import 'dotenv/config';
import { generateInvoice, generateDeliveryNote } from './pdfService.ts';

const app = express();

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// --- Customers ---
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { customerMachines: true }
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const customer = await prisma.customer.create({
            data: req.body
        });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.customer.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});


// --- Products (Inventory) ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const product = await prisma.product.create({
            data: req.body
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// --- Projects (Repairs) ---
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                customer: true,
                customerMachine: true,
                details: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { customerId, customerMachineId, details, ...data } = req.body;
        const project = await prisma.project.create({
            data: {
                ...data,
                customer: { connect: { id: customerId } },
                ...(customerMachineId && { customerMachine: { connect: { id: customerMachineId } } }),
                ...(details && { details: { create: details } })
            }
        });
        res.json(project);
    } catch (error: any) {
        console.error('Failed to create project', error);
        import('fs').then(fs => fs.appendFileSync('server_error.log', `${new Date().toISOString()} - Create Project Error: ${error.message}\n${error.stack}\n`));
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            include: {
                customer: true,
                customerMachine: true,
                details: true,
                photos: true
            }
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customerId, customerMachineId, details, ...data } = req.body;

        // Transaction to ensure atomicity
        const project = await prisma.$transaction(async (tx) => {
            // 1. Update main project fields
            const updatedProject = await tx.project.update({
                where: { id: Number(id) },
                data: {
                    ...data,
                    customer: { connect: { id: customerId } },
                    ...(customerMachineId ? { customerMachine: { connect: { id: customerMachineId } } } : {})
                }
            });

            // 2. Update details (Delete all existing and recreate)
            if (details) {
                await tx.projectDetail.deleteMany({
                    where: { projectId: Number(id) }
                });

                await tx.projectDetail.createMany({
                    data: details.map((d: any) => ({
                        ...d,
                        projectId: Number(id)
                    }))
                });
            }

            return updatedProject;
        });

        res.json(project);
    } catch (error) {
        console.error('Failed to update project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});


// Import PDF Service


app.get('/api/projects/:id/pdf/:type', async (req, res) => {
    try {
        const { id, type } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            include: {
                customer: true,
                customerMachine: true,
                details: true
            }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        let pdfDoc;
        let filename;

        if (type === 'invoice') {
            pdfDoc = generateInvoice(project);
            filename = `Invoice_${project.id}.pdf`;
        } else if (type === 'delivery') {
            pdfDoc = generateDeliveryNote(project);
            filename = `Delivery_${project.id}.pdf`;
        } else {
            return res.status(400).json({ error: 'Invalid PDF type' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// --- Customer Machines ---
app.get('/api/machines', async (req, res) => {
    try {
        const machines = await prisma.customerMachine.findMany({
            include: { customer: true }
        });
        res.json(machines);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch machines' });
    }
});

app.post('/api/machines', async (req, res) => {
    try {
        const { customerId, ...data } = req.body;
        const machine = await prisma.customerMachine.create({
            data: {
                ...data,
                customer: { connect: { id: customerId } }
            }
        });
        res.json(machine);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create machine' });
    }
});

// --- Product Categories ---
app.get('/api/product-categories', async (req, res) => {
    try {
        const categories = await prisma.productCategory.findMany();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product categories' });
    }
});

app.post('/api/product-categories', async (req, res) => {
    try {
        const category = await prisma.productCategory.create({
            data: req.body
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product category' });
    }
});

app.put('/api/product-categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.productCategory.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product category' });
    }
});

app.delete('/api/product-categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.productCategory.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product category' });
    }
});

// --- Operating Expenses ---
app.get('/api/operating-expenses', async (req, res) => {
    try {
        const expenses = await prisma.operatingExpense.findMany();
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch operating expenses' });
    }
});

app.post('/api/operating-expenses', async (req, res) => {
    try {
        const expense = await prisma.operatingExpense.create({
            data: req.body
        });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create operating expense' });
    }
});

app.put('/api/operating-expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await prisma.operatingExpense.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update operating expense' });
    }
});

app.delete('/api/operating-expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.operatingExpense.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete operating expense' });
    }
});

// --- Dashboard ---
app.get('/api/dashboard/sales', async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year) {
            return res.status(400).json({ error: 'Year is required' });
        }

        const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
        const endDate = month
            ? new Date(Number(year), Number(month), 0, 23, 59, 59)
            : new Date(Number(year), 11, 31, 23, 59, 59);

        const projects = await prisma.project.findMany({
            where: {
                // Use completionDate or createdAt as the basis. User said "completion date (or billing date)"
                // Let's use completionDate if available, otherwise createdAt
                OR: [
                    { completionDate: { gte: startDate, lte: endDate } },
                    {
                        completionDate: null,
                        createdAt: { gte: startDate, lte: endDate }
                    }
                ]
            },
            include: {
                details: {
                    include: {
                        product: true
                    }
                }
            }
        });

        // Initialize categories
        const summary = {
            totalSales: 0,
            totalCost: 0,
            totalProfit: 0,
            categories: {
                newCar: { sales: 0, cost: 0, profit: 0, label: '新車販売' },
                usedCar: { sales: 0, cost: 0, profit: 0, label: '中古車販売' },
                rental: { sales: 0, cost: 0, profit: 0, label: 'レンタル' },
                repair: { sales: 0, cost: 0, profit: 0, label: '修理' },
                parts: { sales: 0, cost: 0, profit: 0, label: '部品・他' }
            }
        };

        projects.forEach(project => {
            project.details.forEach(detail => {
                const qty = Number(detail.quantity);
                const price = Number(detail.unitPrice);
                const cost = Number(detail.unitCost) || 0;

                const lineSales = qty * price;
                const lineCost = qty * cost;
                const lineProfit = lineSales - lineCost;

                summary.totalSales += lineSales;
                summary.totalCost += lineCost;
                summary.totalProfit += lineProfit;

                // Categorization Logic
                let categoryKey: keyof typeof summary.categories = 'parts';

                if (['labor', 'travel', 'outsourcing'].includes(detail.lineType)) {
                    categoryKey = 'repair';
                } else if (detail.product) {
                    const pCode = detail.product.code.toUpperCase();
                    const pCat = detail.product.category || '';

                    if (pCode.startsWith('M-') || pCat.includes('新車')) {
                        categoryKey = 'newCar';
                    } else if (pCode.startsWith('U-') || pCat.includes('中古')) {
                        categoryKey = 'usedCar';
                    } else if (pCode.startsWith('R-') || pCat.includes('レンタル')) {
                        categoryKey = 'rental';
                    } else if (pCode.startsWith('S-') || pCat.includes('修理')) {
                        categoryKey = 'repair';
                    }
                }

                summary.categories[categoryKey].sales += lineSales;
                summary.categories[categoryKey].cost += lineCost;
                summary.categories[categoryKey].profit += lineProfit;
            });
        });

        res.json(summary);

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

app.get('/api/dashboard/details', async (req, res) => {
    try {
        const { year, month, category } = req.query;

        if (!year || !category) {
            return res.status(400).json({ error: 'Year and category are required' });
        }

        const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
        const endDate = month
            ? new Date(Number(year), Number(month), 0, 23, 59, 59)
            : new Date(Number(year), 11, 31, 23, 59, 59);

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { completionDate: { gte: startDate, lte: endDate } },
                    {
                        completionDate: null,
                        createdAt: { gte: startDate, lte: endDate }
                    }
                ]
            },
            include: {
                customer: true,
                customerMachine: true,
                details: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const result = projects.map(project => {
            let categorySales = 0;
            let categoryCost = 0;
            let categoryProfit = 0;

            project.details.forEach(detail => {
                const qty = Number(detail.quantity);
                const price = Number(detail.unitPrice);
                const cost = Number(detail.unitCost) || 0;

                const lineSales = qty * price;
                const lineCost = qty * cost;
                const lineProfit = lineSales - lineCost;

                let categoryKey = 'parts';

                if (['labor', 'travel', 'outsourcing'].includes(detail.lineType)) {
                    categoryKey = 'repair';
                } else if (detail.product) {
                    const pCode = detail.product.code.toUpperCase();
                    const pCat = detail.product.category || '';

                    if (pCode.startsWith('M-') || pCat.includes('新車')) {
                        categoryKey = 'newCar';
                    } else if (pCode.startsWith('U-') || pCat.includes('中古')) {
                        categoryKey = 'usedCar';
                    } else if (pCode.startsWith('R-') || pCat.includes('レンタル')) {
                        categoryKey = 'rental';
                    } else if (pCode.startsWith('S-') || pCat.includes('修理')) {
                        categoryKey = 'repair';
                    }
                }

                if (categoryKey === category) {
                    categorySales += lineSales;
                    categoryCost += lineCost;
                    categoryProfit += lineProfit;
                }
            });

            return {
                ...project,
                categorySales,
                categoryCost,
                categoryProfit
            };
        }).filter(p => p.categorySales > 0 || p.categoryCost > 0); // Include if there's any activity in this category

        res.json(result);

    } catch (error) {
        console.error('Dashboard Details Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard details' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
