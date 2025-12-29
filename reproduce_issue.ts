
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function reproduceIssue() {
    try {
        console.log('Fetching projects to find a target...');
        const projectsRes = await axios.get(`${API_BASE_URL}/projects`);
        const projects = projectsRes.data;

        if (projects.length === 0) {
            console.log('No projects found to update.');
            return;
        }

        const target = projects[0];
        console.log(`Targeting project ID: ${target.id}`);

        // Construct payload similar to Repairs.tsx
        const payload = {
            type: target.type,
            customerId: target.customerId,
            customerMachineId: target.customerMachineId,
            machineModel: target.machineModel,
            serialNumber: target.serialNumber,
            notes: target.notes,
            status: target.status,
            totalAmount: target.totalAmount, // Assuming simple update
            details: [
                {
                    lineType: 'part',
                    description: 'Test Invalid Update',
                    supplier: 'Test Supplier',
                    supplierId: null,
                    remarks: '',
                    quantity: 1,
                    unitPrice: 1000,
                    unitCost: 500,
                    productCategoryId: 999999, // Intentional FK violation
                    amountCost: 500,
                    amountSales: 1000
                }
            ]
        };

        console.log('Sending PUT request with payload:', JSON.stringify(payload, null, 2));

        const res = await axios.put(`${API_BASE_URL}/projects/${target.id}`, payload);
        console.log('Update successful:', res.data);

    } catch (error: any) {
        console.error('Update failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
            console.error('Stack:', error.stack);
        }
    }
}

reproduceIssue();
