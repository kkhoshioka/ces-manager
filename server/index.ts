import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import 'dotenv/config';
import { generateInvoice, generateDeliveryNote } from './pdfService';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

// Init Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('PRISMA_CLIENT_ENGINE_TYPE:', process.env.PRISMA_CLIENT_ENGINE_TYPE);

// Use standard Prisma Client initialization with log (satisfies non-empty check)
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error']
});
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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


// --- Masters ---
// Categories now use: id, section, code, name
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.productCategory.findMany({
            // orderBy: [{ section: 'asc' }, { code: 'asc' }] // Temporarily removed due to schema sync issue
        });
        res.json(categories);
    } catch (error: any) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({
            error: 'Failed to fetch categories',
            details: error.message,
            stack: error.stack
        });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { section, code, name } = req.body;
        const category = await prisma.productCategory.create({
            data: { section, code, name }
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { section, code, name } = req.body;
        const category = await prisma.productCategory.update({
            where: { id: Number(id) },
            data: { section, code, name }
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category' });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.productCategory.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { categoryId, ...rest } = req.body;
        // Legacy category name sync is less critical but we keep it for now
        let categoryName = rest.category;
        if (categoryId) {
            const cat = await prisma.productCategory.findUnique({ where: { id: Number(categoryId) } });
            if (cat) categoryName = cat.name;
        }

        const product = await prisma.product.create({
            data: {
                ...rest,
                categoryId: categoryId ? Number(categoryId) : null,
                category: categoryName
            }
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryId, ...rest } = req.body;

        let categoryName = rest.category;
        if (categoryId) {
            const cat = await prisma.productCategory.findUnique({ where: { id: Number(categoryId) } });
            if (cat) categoryName = cat.name;
        }

        const product = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                ...rest,
                categoryId: categoryId ? Number(categoryId) : null,
                category: categoryName
            }
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                productCategory: true // flatten, no parent
            }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
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
        import('fs').then(fs => {
            // Basic logging to file (optional in cloud, but helpful for debug)
            // fs.appendFileSync('server_error.log', ...);
        });
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
        const project = await prisma.$transaction(async (tx: any) => {
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
                        quantity: Number(d.quantity) || 0,
                        unitPrice: Number(d.unitPrice) || 0,
                        unitCost: Number(d.unitCost) || 0,
                        amountCost: Number(d.amountCost) || 0,
                        amountSales: Number(d.amountSales) || 0,
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

app.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Photos are cascaded? Schema says yes: `onDelete: Cascade`
        // Details are cascaded? Schema says yes: `onDelete: Cascade`

        // However, we should also delete the physical photo files if possible.
        // Let's first fetch the photos to get their paths.
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            include: { photos: true }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Delete physical files from Supabase
        if (project.photos && project.photos.length > 0) {
            const fileNames = project.photos.map(photo => {
                const parts = photo.filePath.split('/');
                return parts[parts.length - 1];
            }).filter(Boolean);

            if (fileNames.length > 0) {
                const { error } = await supabase.storage
                    .from('uploads')
                    .remove(fileNames);

                if (error) console.error('Supabase batch delete error:', error);
            }
        }

        // Delete project (cascades to details and photo records)
        await prisma.project.delete({
            where: { id: Number(id) }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Photos
app.post('/api/projects/:id/photos', upload.array('photos', 10), async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const photos = await Promise.all(files.map(async (file) => {
            const fileExt = path.extname(file.originalname);
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;

            // Upload to Supabase
            const { data, error } = await supabase.storage
                .from('uploads')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype
                });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(fileName);

            return prisma.projectPhoto.create({
                data: {
                    projectId: Number(id),
                    fileName: file.originalname,
                    filePath: publicUrl,
                    description: ''
                }
            });
        }));

        res.json(photos);
    } catch (error: any) {
        console.error('Failed to upload photos:', error);
        res.status(500).json({ error: 'Failed to upload photos', details: error.message });
    }
});

app.delete('/api/photos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const photo = await prisma.projectPhoto.findUnique({ where: { id: Number(id) } });
        if (!photo) return res.status(404).json({ error: 'Photo not found' });

        // Delete from DB
        await prisma.projectPhoto.delete({ where: { id: Number(id) } });

        // Delete from Supabase (extract filename from URL)
        // URL format: .../uploads/filename.ext
        const urlParts = photo.filePath.split('/');
        const fileName = urlParts[urlParts.length - 1];

        if (fileName) {
            const { error } = await supabase.storage
                .from('uploads')
                .remove([fileName]);

            if (error) console.error('Supabase storage delete error:', error);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete photo:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
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
            include: {
                customer: true,
                category: true
            }
        });
        res.json(machines);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch machines' });
    }
});

app.post('/api/machines', async (req, res) => {
    try {
        const { customerId, productCategoryId, ...data } = req.body;
        const machine = await prisma.customerMachine.create({
            data: {
                ...data, // machineModel, serialNumber, purchaseDate, notes
                customer: { connect: { id: Number(customerId) } },
                ...(productCategoryId ? { category: { connect: { id: Number(productCategoryId) } } } : {})
            },
            include: { customer: true, category: true }
        });
        res.json(machine);
    } catch (error: any) {
        console.error("Create machine error:", error);
        res.status(500).json({ error: 'Failed to create machine', details: error.message, meta: error.meta });
    }
});

app.put('/api/machines/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customerId, productCategoryId, ...data } = req.body;
        const machine = await prisma.customerMachine.update({
            where: { id: Number(id) },
            data: {
                ...data,
                customer: { connect: { id: Number(customerId) } },
                ...(productCategoryId !== undefined ? {
                    category: productCategoryId ? { connect: { id: Number(productCategoryId) } } : { disconnect: true }
                } : {})
            },
            include: { customer: true, category: true }
        });
        res.json(machine);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update machine' });
    }
});

app.get('/api/machines/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const history = await prisma.project.findMany({
            where: { customerMachineId: Number(id) },
            include: {
                details: true,
                photos: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch machine history' });
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
                        product: {
                            include: { productCategory: true } // Need section
                        },
                        category: true // Include ad-hoc category for dynamic grouping
                    }
                }
            }
        });

        // Initialize categories dynamically based on existing Sections in DB + fallback
        const summary = {
            totalSales: 0,
            totalCost: 0,
            totalProfit: 0,
            categories: {} as Record<string, { sales: number; cost: number; profit: number; label: string }>
        };

        // Pre-fill categories from DB? No, just build as we go, but sorting might be desired.
        // Let's just accumulate.

        projects.forEach((project: any) => {
            project.details.forEach((detail: any) => {
                const qty = Number(detail.quantity);
                const price = Number(detail.unitPrice);
                const cost = Number(detail.unitCost) || 0;

                const lineSales = qty * price;
                const lineCost = qty * cost;
                const lineProfit = lineSales - lineCost;

                summary.totalSales += lineSales;
                summary.totalCost += lineCost;
                summary.totalProfit += lineProfit;

                // Dynamic Logic
                let label = '未分類';

                if (['labor', 'travel', 'outsourcing'].includes(detail.lineType)) {
                    label = '修理'; // Services go to Repair by default
                } else if (detail.category) {
                    label = detail.category.section || '未分類';
                } else if (detail.product && detail.product.productCategory) {
                    label = detail.product.productCategory.section || '未分類';
                } else {
                    // Part without link? Or Other?
                    label = '部品・他';
                }

                if (!summary.categories[label]) {
                    summary.categories[label] = { sales: 0, cost: 0, profit: 0, label };
                }

                summary.categories[label].sales += lineSales;
                summary.categories[label].cost += lineCost;
                summary.categories[label].profit += lineProfit;
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
                        product: {
                            include: { productCategory: true }
                        },
                        category: true, // Include ad-hoc category

                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const result = projects.map((project: any) => {
            let categorySales = 0;
            let categoryCost = 0;
            let categoryProfit = 0;

            project.details.forEach((detail: any) => {
                const qty = Number(detail.quantity);
                const price = Number(detail.unitPrice);
                const cost = Number(detail.unitCost) || 0;

                const lineSales = qty * price;
                const lineCost = qty * cost;
                const lineProfit = lineSales - lineCost;

                // Match Logic
                let label = '未分類';

                if (['labor', 'travel', 'outsourcing'].includes(detail.lineType)) {
                    label = '修理';
                } else if (detail.category) {
                    label = detail.category.section || '未分類';
                } else if (detail.product && detail.product.productCategory) {
                    label = detail.product.productCategory.section || '未分類';
                } else {
                    label = '部品・他';
                }

                if (label === category) {
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
        }).filter((p: any) => p.categorySales > 0 || p.categoryCost > 0);


        res.json(result);

    } catch (error) {
        console.error('Dashboard Details Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard details' });
    }
});

// ==============================================
// Supplier Endpoints
// ==============================================

// Get all suppliers
app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

// Create supplier
app.post('/api/suppliers', async (req, res) => {
    try {
        const { name, code, contactPerson, email, phone, address } = req.body;
        const supplier = await prisma.supplier.create({
            data: { name, code, contactPerson, email, phone, address }
        });
        res.json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// Update supplier
app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, contactPerson, email, phone, address } = req.body;
        const supplier = await prisma.supplier.update({
            where: { id: Number(id) },
            data: { name, code, contactPerson, email, phone, address }
        });
        res.json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});

// Delete supplier
app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.supplier.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
});



// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});