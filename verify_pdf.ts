import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000/api';

async function verifyPdf() {
    try {
        console.log('--- Verifying PDF Generation ---');

        // 1. Get a project
        const projectsRes = await fetch(`${API_BASE}/projects`);
        const projects = await projectsRes.json();

        if (projects.length === 0) {
            console.warn('No projects found. Please create a project first.');
            return;
        }

        const project = projects[0];
        console.log(`Testing with Project ID: ${project.id}`);

        // 2. Test Invoice PDF
        console.log('Downloading Invoice...');
        const invoiceRes = await fetch(`${API_BASE}/projects/${project.id}/pdf/invoice`);
        if (invoiceRes.ok && invoiceRes.headers.get('content-type') === 'application/pdf') {
            const buffer = await invoiceRes.arrayBuffer();
            fs.writeFileSync(`test_invoice_${project.id}.pdf`, Buffer.from(buffer));
            console.log('SUCCESS: Invoice PDF downloaded and saved.');
        } else {
            console.error('FAILURE: Invoice PDF download failed.', invoiceRes.status, invoiceRes.headers.get('content-type'));
        }

        // 3. Test Delivery Note PDF
        console.log('Downloading Delivery Note...');
        const deliveryRes = await fetch(`${API_BASE}/projects/${project.id}/pdf/delivery`);
        if (deliveryRes.ok && deliveryRes.headers.get('content-type') === 'application/pdf') {
            const buffer = await deliveryRes.arrayBuffer();
            fs.writeFileSync(`test_delivery_${project.id}.pdf`, Buffer.from(buffer));
            console.log('SUCCESS: Delivery Note PDF downloaded and saved.');
        } else {
            console.error('FAILURE: Delivery Note PDF download failed.', deliveryRes.status, deliveryRes.headers.get('content-type'));
        }

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifyPdf();
