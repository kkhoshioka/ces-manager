import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import 'dotenv/config';
import { generateInvoice, generateDeliveryNote } from './pdfService';
import systemSettingsRouter from './routes/systemSettings';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

// Init Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

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

app.use(cors({
    origin: '*', // Allow Vercel or any frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve uploads

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// System Settings
app.use('/api/system-settings', systemSettingsRouter);

// --- Customers ---
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { customerMachines: true }
        });
        res.json(customers);
    } catch {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const customer = await prisma.customer.create({
            data: req.body
        });
        res.json(customer);
    } catch {
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
    } catch {
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
    } catch {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});


// --- Machines ---
app.get('/api/machines', async (req, res) => {
    try {
        const machines = await prisma.customerMachine.findMany({
            include: { customer: true, category: true }
        });
        res.json(machines);
    } catch (error) {
        console.error('Failed to fetch machines:', error);
        res.status(500).json({ error: 'Failed to fetch machines' });
    }
});

app.post('/api/machines', async (req, res) => {
    try {
        const { customerId, productCategoryId, ...data } = req.body;
        const machine = await prisma.customerMachine.create({
            data: {
                ...data,
                customerId: Number(customerId),
                productCategoryId: productCategoryId ? Number(productCategoryId) : null
            },
            include: { customer: true, category: true }
        });
        res.json(machine);
    } catch (error) {
        console.error('Failed to create machine:', error);
        res.status(500).json({
            error: 'Failed to create machine',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

app.get('/api/machines/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const machine = await prisma.customerMachine.findUnique({
            where: { id: Number(id) },
            include: { customer: true, category: true }
        });
        if (!machine) return res.status(404).json({ error: 'Machine not found' });
        res.json(machine);
    } catch (error) {
        console.error('Failed to fetch machine:', error);
        res.status(500).json({ error: 'Failed to fetch machine' });
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
                customerId: Number(customerId),
                productCategoryId: productCategoryId ? Number(productCategoryId) : null
            },
            include: { customer: true, category: true }
        });
        res.json(machine);
    } catch (error) {
        console.error('Failed to update machine:', error);
        res.status(500).json({ error: 'Failed to update machine' });
    }
});

app.delete('/api/machines/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.customerMachine.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete machine:', error);
        res.status(500).json({ error: 'Failed to delete machine' });
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
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({
            error: 'Failed to fetch categories',
            details: error instanceof Error ? error.message : 'Unknown error'
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
    } catch {
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
    } catch {
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
    } catch {
        res.status(500).json({ error: 'Failed to delete product category' });
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
    } catch {
        res.status(500).json({ error: 'Failed to create part' });
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
    } catch {
        res.status(500).json({ error: 'Failed to update part' });
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
    } catch {
        res.status(500).json({ error: 'Failed to fetch parts' });
    }
});



app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete part' });
    }
});

// --- Projects (Repairs) ---
app.get('/api/projects', async (req, res) => {
    try {
        const { limit, search } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (search) {
            const searchStr = String(search);
            // Search across Customer Name, Machine Model, Serial Number
            where.OR = [
                { customer: { name: { contains: searchStr } } }, // SQLite contains is case-insensitive usually, or lowercase match
                { machineModel: { contains: searchStr } },
                { serialNumber: { contains: searchStr } }
            ];
            // If search is numeric, maybe search ID?
            if (!isNaN(Number(searchStr))) {
                where.OR.push({ id: Number(searchStr) });
            }
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                customer: true,
                // customerMachine: true, // Removed for performance
                // details: true          // Removed for performance
            },
            take: limit ? Number(limit) : undefined,
            orderBy: { createdAt: 'desc' }
        });
        res.json(projects);
    } catch {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { customerId, customerMachineId, details, hourMeter, ...data } = req.body;
        const project = await prisma.project.create({
            data: {
                ...data,
                hourMeter,
                customer: { connect: { id: Number(customerId) } },
                ...(customerMachineId && { customerMachine: { connect: { id: Number(customerMachineId) } } }),
                ...(details && { details: { create: details } })
            }
        });

        // Auto-update Link Machine Hour Meter
        if (customerMachineId && hourMeter) {
            await prisma.customerMachine.update({
                where: { id: Number(customerMachineId) },
                data: { hourMeter: String(hourMeter) }
            }).catch(e => console.error('Failed to auto-update machine hour meter', e));
        }

        res.json(project);
    } catch (error) {
        console.error('Failed to create project', error);
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
    } catch {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    console.log(`[DEBUG] Update Project Start: ID=${req.params.id}`);
    try {
        const { id } = req.params;
        const { customerId, customerMachineId, details, ...data } = req.body;

        // Validation: Check for Foreign Keys availability
        if (details && Array.isArray(details)) {
            const categoryIds = details
                .map((d: any) => d.productCategoryId)
                .filter((id: any) => id != null)
                .map((id: any) => Number(id))
                .filter((id: number) => !isNaN(id));

            if (categoryIds.length > 0) {
                const validCategories = await prisma.productCategory.findMany({
                    where: { id: { in: categoryIds } },
                    select: { id: true }
                });
                const validIds = new Set(validCategories.map(c => c.id));
                const invalidIds = categoryIds.filter(id => !validIds.has(id));

                if (invalidIds.length > 0) {
                    return res.status(400).json({
                        error: 'Validation Failed',
                        details: `Invalid Product Category IDs: ${invalidIds.join(', ')}`
                    });
                }
            }
        }

        // Transaction to ensure atomicity
        const project = await prisma.$transaction(async (tx) => {
            // 1. Update main project fields
            // Ensure numeric IDs are valid
            const cid = Number(customerId);
            const cmid = customerMachineId ? Number(customerMachineId) : null;

            if (isNaN(cid)) throw new Error("Invalid Customer ID");
            if (customerMachineId && isNaN(cmid!)) throw new Error("Invalid Customer Machine ID");

            const updatedProject = await tx.project.update({
                where: { id: Number(id) },
                data: {
                    ...data,
                    customer: { connect: { id: cid } },
                    ...(cmid ? { customerMachine: { connect: { id: cmid } } } : { customerMachine: { disconnect: true } })
                }
            });
            console.log('[DEBUG] Main project fields updated');

            // Auto-update Link Machine Hour Meter
            if (cmid && data.hourMeter) {
                await tx.customerMachine.update({
                    where: { id: cmid },
                    data: { hourMeter: String(data.hourMeter) }
                });
                console.log('[DEBUG] Machine hour meter updated');
            }

            // 2. Update details (Delete all existing and recreate)
            if (details) {
                console.log(`[DEBUG] Updating details: count=${details.length}`);
                await tx.projectDetail.deleteMany({
                    where: { projectId: Number(id) }
                });
                console.log('[DEBUG] Old details deleted');

                const newDetailsData = details.map((detail: any) => {
                    const safeDetail = {
                        lineType: detail.lineType || 'part',
                        description: detail.description || '',
                        supplier: detail.supplier || '',
                        supplierId: detail.supplierId ? Number(detail.supplierId) : null,
                        remarks: detail.remarks || '',
                        quantity: Number(detail.quantity) || 0,
                        unitCost: Number(detail.unitCost) || 0,
                        unitPrice: Number(detail.unitPrice) || 0,
                        amountCost: (Number(detail.quantity) || 0) * (Number(detail.unitCost) || 0),
                        amountSales: (Number(detail.quantity) || 0) * (Number(detail.unitPrice) || 0),
                        productId: detail.productId ? Number(detail.productId) : null,
                        productCategoryId: detail.productCategoryId ? Number(detail.productCategoryId) : null,
                        projectId: Number(id)
                    };
                    return safeDetail;
                });

                console.log('[DEBUG] Details mapped. Creating...');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await tx.projectDetail.createMany({
                    data: newDetailsData as any
                });
                console.log('[DEBUG] Details created');
            }

            return updatedProject;
        });

        res.json(project);
    } catch (error) {
        console.error('[DEBUG] ERROR:', error);
        res.status(500).json({
            error: 'Failed to update project',
            details: error instanceof Error ? error.message : String(error)
        });
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
                const { error } = await supabaseAdmin.storage
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
            const { error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype
                });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
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
    } catch (error) {
        console.error('Failed to upload photos:', error);
        res.status(500).json({ error: 'Failed to upload photos', details: error instanceof Error ? error.message : 'Unknown error' });
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

        // Helper to convert Decimal to number for PDF generation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toNum = (d: any) => ({
            ...d,
            quantity: Number(d.quantity),
            unitPrice: Number(d.unitPrice),
            unitCost: Number(d.unitCost)
        });

        const projectForPdf = {
            ...project,
            details: project.details.map(toNum),
            machineModel: project.customerMachine?.machineModel || '',
            serialNumber: project.customerMachine?.serialNumber || '',
            notes: project.notes || undefined
        };

        if (type === 'invoice') {
            const pdfDoc = generateInvoice(projectForPdf);
            const filename = `Invoice_${project.id}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            pdfDoc.pipe(res);
            pdfDoc.end();
        } else if (type === 'delivery') {
            const pdfDoc = generateDeliveryNote(projectForPdf);
            const filename = `Delivery_${project.id}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            pdfDoc.pipe(res);
            pdfDoc.end();
        } else {
            return res.status(400).json({ error: 'Invalid PDF type' });
        }

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// --- Customer Machines (History) ---
// Note: Basic CRUD is handled above in the main Machines block.


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
    } catch {
        res.status(500).json({ error: 'Failed to fetch machine categories' });
    }
});

// --- Product Categories ---
app.get('/api/product-categories', async (req, res) => {
    try {
        const categories = await prisma.productCategory.findMany();
        res.json(categories);
    } catch {
        res.status(500).json({ error: 'Failed to fetch product categories' });
    }
});

app.post('/api/product-categories', async (req, res) => {
    try {
        const category = await prisma.productCategory.create({
            data: req.body
        });
        res.json(category);
    } catch {
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
    } catch {
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
    } catch {
        res.status(500).json({ error: 'Failed to delete product category' });
    }
});

// --- User Management (Admin Only) ---
// Note: In a real app, you MUST verify the caller is an admin here.
// We will assume the frontend protects access, but for extra security we should verify the JWT.

app.get('/api/admin/users', async (req, res) => {
    try {
        // Fetch all profiles
        const profiles = await prisma.profile.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(profiles);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/admin/users', async (req, res) => {
    try {
        const { email, password, role, name } = req.body;

        // 1. Create Auth User
        const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto confirm
        });

        if (authError || !user) {
            console.error('Auth create error:', authError);
            return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
        }

        // 2. Create Profile (or update if trigger created it, but we don't have trigger)
        // We use upsert to be safe
        const profile = await prisma.profile.upsert({
            where: { id: user.id },
            update: {
                email,
                role: role || 'staff',
                name
            },
            create: {
                id: user.id,
                email,
                role: role || 'staff',
                name
            }
        });

        res.json(profile);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params; // Using UUID string

        // 1. Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Auth delete error:', authError);
            // Verify if user exists? If not found, proceed to delete profile.
        }

        // 2. Delete from Profile (Cascade should handle relations if we had them, but Profile is standalone mostly)
        // Actually Profile is linked to Auth User by ID conceptually.
        // Prisma delete
        await prisma.profile.deleteMany({ // deleteMany to avoid error if not found
            where: { id: id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// --- Operating Expenses ---
app.get('/api/operating-expenses', async (req, res) => {
    try {
        const expenses = await prisma.operatingExpense.findMany();
        res.json(expenses);
    } catch {
        res.status(500).json({ error: 'Failed to fetch operating expenses' });
    }
});

app.post('/api/operating-expenses', async (req, res) => {
    try {
        const expense = await prisma.operatingExpense.create({
            data: req.body
        });
        res.json(expense);
    } catch {
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
    } catch {
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
    } catch {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projects.forEach((project: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = projects.map((project: any) => {
            let categorySales = 0;
            let categoryCost = 0;
            let categoryProfit = 0;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Report: Supplier Monthly Costs
app.get('/api/dashboard/supplier-costs', async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year) {
            return res.status(400).json({ error: 'Year is required' });
        }

        const startYear = Number(year);
        const startMonth = month ? Number(month) : 1;

        const startDate = new Date(startYear, startMonth - 1, 1);
        const endDate = month
            ? new Date(startYear, startMonth, 0, 23, 59, 59)
            : new Date(startYear, 11, 31, 23, 59, 59);

        // 1. Fetch Projects
        const projects = await prisma.project.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            include: {
                details: {
                    include: { supplierObj: true }
                }
            }
        });

        // Aggregate
        const supplierStats: Record<string, { totalCost: number; count: number }> = {};

        projects.forEach(project => {
            project.details.forEach(detail => {
                const name = detail.supplierObj?.name || detail.supplier;

                if (name && Number(detail.unitCost) > 0) {
                    if (!supplierStats[name]) {
                        supplierStats[name] = { totalCost: 0, count: 0 };
                    }

                    const qty = Number(detail.quantity);
                    const cost = Number(detail.unitCost);

                    supplierStats[name].totalCost += (qty * cost);
                    supplierStats[name].count += 1;
                }
            });
        });

        const result = Object.entries(supplierStats)
            .map(([name, stats]) => ({
                name,
                totalCost: stats.totalCost,
                count: stats.count
            }))
            .sort((a, b) => b.totalCost - a.totalCost);

        res.json(result);

    } catch (error) {
        console.error('Supplier Report Error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier report' });
    }
});

// Update Project Detail Status (Invoice/Payment)
app.put('/api/project-details/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isInvoiceReceived, isPaid } = req.body;

        const detail = await prisma.projectDetail.update({
            where: { id: Number(id) },
            data: {
                isInvoiceReceived,
                isPaid
            }
        });

        res.json(detail);
    } catch (error) {
        console.error('Update Detail Status Error:', error);
        res.status(500).json({ error: 'Failed to update detail status' });
    }
});

// Report: Supplier Monthly Details (Drill-down)
app.get('/api/dashboard/supplier-details', async (req, res) => {
    try {
        const { year, month, supplier } = req.query;

        if (!year || !supplier) {
            return res.status(400).json({ error: 'Year and Supplier are required' });
        }

        const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
        const endDate = month
            ? new Date(Number(year), Number(month), 0, 23, 59, 59)
            : new Date(Number(year), 11, 31, 23, 59, 59);

        // Fetch project details directly or via projects
        // We need project info (Customer, Machine) as well.
        const projects = await prisma.project.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            include: {
                customer: true,
                customerMachine: true,
                details: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    include: { supplierObj: true } as any
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details: any[] = [];

        projects.forEach(project => {
            project.details.forEach(detail => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const name = (detail as any).supplierObj?.name || detail.supplier;
                if (name === supplier && Number(detail.unitCost) > 0) {
                    details.push({
                        id: detail.id,
                        date: project.createdAt, // Or completionDate? Using createdAt for consistency
                        customerName: project.customer?.name || '不明',
                        machineModel: project.machineModel || project.customerMachine?.machineModel || '-',
                        serialNumber: project.serialNumber || project.customerMachine?.serialNumber || '-',
                        description: detail.description,
                        quantity: Number(detail.quantity),
                        unitCost: Number(detail.unitCost),
                        amount: Number(detail.quantity) * Number(detail.unitCost),
                        isInvoiceReceived: detail.isInvoiceReceived,
                        isPaid: detail.isPaid
                    });
                }
            });
        });

        // Sort by date desc
        details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json(details);

    } catch (error) {
        console.error('Supplier Details Error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier details' });
    }
});



// ==============================================
// Sales & Deposit Management (Sales Management Dashboard)
// ==============================================

// Get Sales Management Report (Aggregated by Customer)
app.get('/api/dashboard/sales-management', async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year) {
            return res.status(400).json({ error: 'Year is required' });
        }

        const startYear = Number(year);
        const startMonth = month ? Number(month) : 1;

        const startDate = new Date(startYear, startMonth - 1, 1);
        const endDate = month
            ? new Date(startYear, startMonth, 0, 23, 59, 59)
            : new Date(startYear, 11, 31, 23, 59, 59);

        // Fetch Projects in period
        // For Sales Management, we care about "completed" projects usually? 
        // Or all active projects? 
        // If it's for Billing, usually it's based on completionDate or orderDate.
        // Let's use completionDate for consistency with Sales Dashboard if possible, 
        // OR createdAt if completionDate is null?
        // Requirement implies managing billing for "cases". 
        // Let's broaden to include projects created OR completed in this month to be safe,
        // or just stick to completionDate if that defines "Sales".
        // HOWEVER, "Invoice" might be issued before completion.
        // Let's use a wide net: Created OR Completed in this period.
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { completionDate: { gte: startDate, lte: endDate } },
                    { createdAt: { gte: startDate, lte: endDate } }
                ]
            },
            include: {
                customer: true,
                customerMachine: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group by Customer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customerStats: Record<string, any> = {};

        projects.forEach(project => {
            const custId = project.customerId;
            const custName = project.customer?.name || '不明'; // Fallback

            if (!customerStats[custId]) {
                customerStats[custId] = {
                    customerId: custId,
                    customerName: custName,
                    closingDate: project.customer?.closingDate, // Add closingDate
                    projects: [],
                    totalAmount: 0,
                    unbilledAmount: 0,
                    unpaidAmount: 0,
                    count: 0
                };
            }

            // Formatting for FE
            const p = {
                id: project.id,
                date: project.completionDate || project.createdAt,
                type: project.type,
                title: `${project.machineModel || project.customerMachine?.machineModel || ''} ${project.type === 'repair' ? '修理' : '販売'}`, // Simple title
                serialNumber: project.serialNumber || project.customerMachine?.serialNumber,
                amount: Number(project.totalAmount),
                status: project.status,
                isInvoiceIssued: project.isInvoiceIssued,
                isPaymentReceived: project.isPaymentReceived,
                paymentDate: project.paymentDate
            };

            customerStats[custId].projects.push(p);
            customerStats[custId].count++;
            customerStats[custId].totalAmount += p.amount;

            if (!p.isInvoiceIssued) customerStats[custId].unbilledAmount += p.amount;
            if (p.isInvoiceIssued && !p.isPaymentReceived) customerStats[custId].unpaidAmount += p.amount;
        });

        const result = Object.values(customerStats).sort((a, b) => b.totalAmount - a.totalAmount);
        res.json(result);

    } catch (error) {
        console.error('Sales Management Report Error:', error);
        res.status(500).json({ error: 'Failed to fetch sales management report' });
    }
});

// Update Project Status (Invoice/Payment)
app.put('/api/projects/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isInvoiceIssued, isPaymentReceived, paymentDate } = req.body;

        const updateData: any = {};
        if (isInvoiceIssued !== undefined) updateData.isInvoiceIssued = isInvoiceIssued;
        if (isPaymentReceived !== undefined) {
            updateData.isPaymentReceived = isPaymentReceived;
            // Auto-set payment date if paid and date not provided?
            if (isPaymentReceived && !paymentDate) {
                updateData.paymentDate = new Date();
            } else if (isPaymentReceived === false) {
                updateData.paymentDate = null;
            }
        }
        if (paymentDate !== undefined) updateData.paymentDate = paymentDate;

        const project = await prisma.project.update({
            where: { id: Number(id) },
            data: updateData
        });

        res.json(project);
    } catch (error) {
        console.error('Update Project Status Error:', error);
        res.status(500).json({ error: 'Failed to update project status' });
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