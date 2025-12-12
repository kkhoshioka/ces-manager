import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

async function dumpDatabase() {
    console.log('Starting database dump...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dump_${timestamp}.sql`;
    const outputPath = path.join(process.cwd(), filename);

    let sql = '-- Database Dump\n';
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    // 1. Customers
    const customers = await prisma.customer.findMany();
    sql += '-- Customers\n';
    for (const c of customers) {
        sql += `INSERT INTO Customer (id, code, name, address, phone, email, createdAt, updatedAt) VALUES (${c.id}, '${c.code}', '${c.name}', ${c.address ? `'${c.address}'` : 'NULL'}, ${c.phone ? `'${c.phone}'` : 'NULL'}, ${c.email ? `'${c.email}'` : 'NULL'}, '${c.createdAt.toISOString()}', '${c.updatedAt.toISOString()}');\n`;
    }
    sql += '\n';

    // 2. Products
    const products = await prisma.product.findMany();
    sql += '-- Products\n';
    for (const p of products) {
        sql += `INSERT INTO Product (id, code, name, category, standardPrice, standardCost, stockQuantity, createdAt, updatedAt) VALUES (${p.id}, '${p.code}', '${p.name}', ${p.category ? `'${p.category}'` : 'NULL'}, ${p.standardPrice}, ${p.standardCost}, ${p.stockQuantity}, '${p.createdAt.toISOString()}', '${p.updatedAt.toISOString()}');\n`;
    }
    sql += '\n';

    // 3. CustomerMachines
    const machines = await prisma.customerMachine.findMany();
    sql += '-- CustomerMachines\n';
    for (const m of machines) {
        sql += `INSERT INTO CustomerMachine (id, customerId, machineModel, serialNumber, purchaseDate, notes, createdAt, updatedAt) VALUES (${m.id}, ${m.customerId}, '${m.machineModel}', '${m.serialNumber}', ${m.purchaseDate ? `'${m.purchaseDate.toISOString()}'` : 'NULL'}, ${m.notes ? `'${m.notes}'` : 'NULL'}, '${m.createdAt.toISOString()}', '${m.updatedAt.toISOString()}');\n`;
    }
    sql += '\n';

    // 4. Projects
    const projects = await prisma.project.findMany();
    sql += '-- Projects\n';
    for (const p of projects) {
        sql += `INSERT INTO Project (id, customerId, customerMachineId, machineModel, serialNumber, orderDate, completionDate, status, totalAmount, notes, createdAt, updatedAt) VALUES (${p.id}, ${p.customerId}, ${p.customerMachineId ?? 'NULL'}, ${p.machineModel ? `'${p.machineModel}'` : 'NULL'}, ${p.serialNumber ? `'${p.serialNumber}'` : 'NULL'}, ${p.orderDate ? `'${p.orderDate.toISOString()}'` : 'NULL'}, ${p.completionDate ? `'${p.completionDate.toISOString()}'` : 'NULL'}, '${p.status}', ${p.totalAmount}, ${p.notes ? `'${p.notes}'` : 'NULL'}, '${p.createdAt.toISOString()}', '${p.updatedAt.toISOString()}');\n`;
    }
    sql += '\n';

    // 5. ProjectDetails
    const details = await prisma.projectDetail.findMany();
    sql += '-- ProjectDetails\n';
    for (const d of details) {
        sql += `INSERT INTO ProjectDetail (id, projectId, productId, lineType, description, quantity, unitCost, unitPrice, amountCost, amountSales, outsourcingCost, createdAt, updatedAt) VALUES (${d.id}, ${d.projectId}, ${d.productId ?? 'NULL'}, '${d.lineType}', '${d.description}', ${d.quantity}, ${d.unitCost}, ${d.unitPrice}, ${d.amountCost}, ${d.amountSales}, ${d.outsourcingCost}, '${d.createdAt.toISOString()}', '${d.updatedAt.toISOString()}');\n`;
    }
    sql += '\n';

    // 6. ProjectPhotos
    const photos = await prisma.projectPhoto.findMany();
    sql += '-- ProjectPhotos\n';
    for (const p of photos) {
        sql += `INSERT INTO ProjectPhoto (id, projectId, filePath, fileName, description, uploadedAt) VALUES (${p.id}, ${p.projectId}, '${p.filePath}', '${p.fileName}', ${p.description ? `'${p.description}'` : 'NULL'}, '${p.uploadedAt.toISOString()}');\n`;
    }
    sql += '\n';

    fs.writeFileSync(outputPath, sql);
    console.log(`Database dump saved to ${filename}`);
}

dumpDatabase()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
