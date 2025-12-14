
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function reproduceIssue() {
    console.log('Starting Issue Reproduction...');

    try {
        // 1. Create a dummy customer
        const customerRes = await axios.post(`${API_URL}/customers`, {
            code: `C${Date.now()}`,
            name: 'Repro Customer'
        });
        const customerId = customerRes.data.id;
        console.log(`Created Customer ID: ${customerId}`);

        // 2. Create a dummy project
        const projectRes = await axios.post(`${API_URL}/projects`, {
            customerId: customerId,
            type: 'repair',
            notes: 'Original Note',
            details: [
                {
                    lineType: 'labor',
                    description: 'Initial Labor',
                    quantity: 1,
                    unitPrice: 1000,
                    unitCost: 500
                }
            ]
        });
        const project = projectRes.data;
        console.log(`Created Project ID: ${project.id}`);

        // 3. Attempt Update with Invalid Data (resembling JSON.stringify(NaN) -> null)
        console.log('Updating project with NULL values for Decimals...');

        const updatePayload = {
            type: 'repair',
            customerId: customerId,
            machineModel: 'Test Model',
            serialNumber: 'SN123',
            notes: 'Updated Note',
            totalAmount: 2000,
            details: [
                {
                    lineType: 'labor',
                    description: 'Updated Labor',
                    quantity: null, // INVALID for Prisma Decimal if not handled
                    unitPrice: 1000,
                    unitCost: null, // INVALID
                    amountCost: 1000,
                    amountSales: 2000,
                }
            ]
        };

        await axios.put(`${API_URL}/projects/${project.id}`, updatePayload);
        console.log('Update Successful (Unexpected if bug exists)');

    } catch (error: any) {
        console.error('Update Failed as Expected/Suspected:', error.response ? error.response.data : error.message);
        if (error.response?.data?.details) {
            console.error('Details:', error.response.data.details);
        }
    }
}

reproduceIssue();
