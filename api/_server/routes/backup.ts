import express from 'express';
import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import { stringify } from 'csv-stringify/sync';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const prisma = new PrismaClient();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Convert Prisma result objects to CSV string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toCsv = (data: any[]) => {
    if (!data || data.length === 0) return '';
    const cleanData = data.map((row) => {
        const cleanRow: any = {};
        for (const key in row) {
            const value = row[key];
            if (value instanceof Date) {
                cleanRow[key] = value.toISOString();
            } else if (typeof value === 'object' && value !== null && 'toNumber' in value) {
                cleanRow[key] = value.toString();
            } else if (typeof value === 'object' && value !== null) {
                cleanRow[key] = JSON.stringify(value);
            } else {
                cleanRow[key] = value;
            }
        }
        return cleanRow;
    });
    return stringify(cleanData, { header: true, bom: true });
};

router.get('/monthly', async (req, res) => {
    try {
        const year = parseInt(req.query.year as string);
        const month = parseInt(req.query.month as string);

        if (isNaN(year) || isNaN(month)) {
            return res.status(400).json({ error: 'Valid year and month are required' });
        }

        // Define month boundaries
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Fetch target projects
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { orderDate: { gte: startDate, lte: endDate } },
                    { createdAt: { gte: startDate, lte: endDate } }
                ]
            }
        });

        const projectIds = projects.map(p => p.id);

        // Fetch related data
        const [details, photos, quotations, purchases] = await Promise.all([
            prisma.projectDetail.findMany({ where: { projectId: { in: projectIds } } }),
            prisma.projectPhoto.findMany({ where: { projectId: { in: projectIds } } }),
            prisma.quotation.findMany({ where: { projectId: { in: projectIds } } }),
            prisma.purchase.findMany({ where: { projectId: { in: projectIds } } }),
        ]);

        const quotationIds = quotations.map(q => q.id);
        const quotationDetails = await prisma.quotationDetail.findMany({ where: { quotationId: { in: quotationIds } } });

        // Create Zip stream
        const archive = archiver('zip', { zlib: { level: 9 } });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="backup_${year}_${month}.zip"`);

        archive.pipe(res);

        archive.append(toCsv(projects), { name: 'projects.csv' });
        archive.append(toCsv(details), { name: 'project_details.csv' });
        archive.append(toCsv(photos), { name: 'project_photos.csv' });
        archive.append(toCsv(quotations), { name: 'quotations.csv' });
        archive.append(toCsv(quotationDetails), { name: 'quotation_details.csv' });
        archive.append(toCsv(purchases), { name: 'purchases.csv' });

        await archive.finalize();

    } catch (error) {
        console.error('Monthly Backup Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate backup' });
        }
    }
});

router.post('/auto', async (req, res) => {
    try {
        console.log('[Auto Backup] Starting process...');
        
        // Fetch all transaction data
        const [
            projects, details, photos,
            quotations, quotationDetails,
            purchases,
            monthlyExpenses, monthlyBillings, payments
        ] = await Promise.all([
            prisma.project.findMany(),
            prisma.projectDetail.findMany(),
            prisma.projectPhoto.findMany(),
            prisma.quotation.findMany(),
            prisma.quotationDetail.findMany(),
            prisma.purchase.findMany(),
            prisma.monthlyExpense.findMany(),
            prisma.monthlyBilling.findMany(),
            prisma.payment.findMany()
        ]);

        const archive = archiver('zip', { zlib: { level: 9 } });
        
        // Instead of piping to res, we collect it into a buffer to upload to Supabase
        const chunks: Buffer[] = [];
        archive.on('data', chunk => chunks.push(chunk));
        
        archive.append(toCsv(projects), { name: 'projects.csv' });
        archive.append(toCsv(details), { name: 'project_details.csv' });
        archive.append(toCsv(photos), { name: 'project_photos.csv' });
        archive.append(toCsv(quotations), { name: 'quotations.csv' });
        archive.append(toCsv(quotationDetails), { name: 'quotation_details.csv' });
        archive.append(toCsv(purchases), { name: 'purchases.csv' });
        archive.append(toCsv(monthlyExpenses), { name: 'monthly_expenses.csv' });
        archive.append(toCsv(monthlyBillings), { name: 'monthly_billings.csv' });
        archive.append(toCsv(payments), { name: 'payments.csv' });

        await new Promise((resolve, reject) => {
            archive.on('end', resolve);
            archive.on('error', reject);
            archive.finalize();
        });

        const zipBuffer = Buffer.concat(chunks);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_full_${timestamp}.zip`;

        console.log(`[Auto Backup] Generated zip: ${zipBuffer.length} bytes`);

        // Ensure bucket exists or just upload
        const { error: uploadError } = await supabase.storage
            .from('backups')
            .upload(filename, zipBuffer, {
                contentType: 'application/zip',
                upsert: true
            });

        if (uploadError) {
            throw uploadError;
        }

        console.log(`[Auto Backup] Uploaded ${filename} to Supabase`);

        // Rotation logic: list files, sort by date, keep last 7 days + 1st of every month
        const { data: files, error: listError } = await supabase.storage.from('backups').list();
        
        if (files && !listError) {
            const now = new Date();
            const filesToDelete = files.filter(f => {
                // Ignore non-backup files
                if (!f.name.startsWith('backup_full_')) return false;
                
                const fileDateStr = f.name.replace('backup_full_', '').replace('.zip', '').split('T')[0];
                const fileDate = new Date(fileDateStr);
                const diffTime = Math.abs(now.getTime() - fileDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                // Keep everything within 7 days
                if (diffDays <= 7) return false;
                
                // If older than 7 days, check if it's the 1st day of the month
                // If it is, keep it for 12 months (365 days)
                if (fileDate.getDate() === 1 && diffDays <= 365) {
                    return false; // Keep it
                }
                
                // Otherwise, delete
                return true;
            });

            if (filesToDelete.length > 0) {
                const pathsToDelete = filesToDelete.map(f => f.name);
                console.log(`[Auto Backup] Deleting old backups: ${pathsToDelete.join(', ')}`);
                await supabase.storage.from('backups').remove(pathsToDelete);
            }
        }

        res.json({ success: true, filename });

    } catch (error) {
        console.error('Auto Backup Error:', error);
        res.status(500).json({ error: 'Failed to process auto backup' });
    }
});

export default router;
