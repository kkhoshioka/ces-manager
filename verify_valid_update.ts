
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function verifyValidUpdate() {
    try {
        console.log('Fetching projects to find a target...');
        const projectsRes = await axios.get(`${API_BASE_URL}/projects?include=details`);
        const projects = projectsRes.data;

        if (projects.length === 0) {
            console.log('No projects found to update.');
            return;
        }

        const target = projects[0];
        console.log(`Targeting project ID: ${target.id}`);

        // Fetch categories to get a valid ID
        const catsRes = await axios.get(`${API_BASE_URL}/categories`);
        const categories = catsRes.data;
        const validCategoryId = categories.length > 0 ? categories[0].id : null;

        console.log(`Using valid category ID: ${validCategoryId}`);

        // Construct valid payload
        const payload = {
            type: target.type,
            customerId: target.customerId,
            customerMachineId: target.customerMachineId,
            machineModel: target.machineModel || '',
            serialNumber: target.serialNumber || '',
            notes: target.notes || '',
            status: target.status || 'received',
            totalAmount: target.totalAmount,
            details: [
                {
                    lineType: 'part',
                    description: 'Test Valid Update',
                    supplier: 'Test Supplier',
                    supplierId: null,
                    remarks: 'Valid Remark',
                    quantity: 1,
                    unitPrice: 1000,
                    unitCost: 500,
                    productCategoryId: validCategoryId, // Valid ID
                    amountCost: 500,
                    amountSales: 1000
                }
            ]
        };

        console.log('Sending PUT request with valid payload...');

        const res = await axios.put(`${API_BASE_URL}/projects/${target.id}`, payload);
        console.log('Update successful:', res.data);

        // Verify the update actually saved
        const updatedProject = res.data;
        // Depending on backend, details might be returned or not. If not, fetch again.
        // My code returns `project` from transaction.
        // And the transaction returns `updatedProject` which is just the project model check server/index.ts
        // Wait, server/index.ts returns `updatedProject` which is the result of `tx.project.update`. 
        // `tx.project.update` by default DOES NOT include relations unless specified.
        // So I might need to fetch again to verify details.

        const verifyRes = await axios.get(`${API_BASE_URL}/projects/${target.id}`);
        const verifyData = verifyRes.data;
        const detail = verifyData.details.find((d: any) => d.description === 'Test Valid Update');

        if (detail) {
            console.log('VERIFIED: Valid update saved correctly.');
        } else {
            console.error('FAILURE: Valid update not found in details.');
            process.exit(1);
        }

    } catch (error: any) {
        console.error('Update failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
        process.exit(1);
    }
}

verifyValidUpdate();
