import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function verifyUpdate() {
    console.log('Starting Update Verification...');

    // 1. Create a dummy customer
    console.log('Creating dummy customer...');
    const customerRes = await axios.post(`${API_URL}/customers`, {
        code: `C${Date.now()}`,
        name: 'Update Verify Customer'
    });
    const customerId = customerRes.data.id;
    console.log(`Created Customer ID: ${customerId}`);

    // 2. Create a dummy project
    console.log('Creating dummy project...');
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

    // 3. Update the project
    console.log('Updating project...');
    try {
        const updatePayload = {
            type: 'repair',
            customerId: customerId,
            // customerMachineId: undefined, // Simulate no machine
            machineModel: 'Test Model',
            serialNumber: 'SN123',
            notes: 'Updated Note',
            totalAmount: 2000,
            details: [
                {
                    lineType: 'labor',
                    description: 'Updated Labor',
                    quantity: 2,
                    unitPrice: 1000,
                    unitCost: 500,
                    amountCost: 1000,
                    amountSales: 2000,
                    // productCategoryId: undefined // Simulate missing
                }
            ]
        };

        const updateRes = await axios.put(`${API_URL}/projects/${project.id}`, updatePayload);
        console.log('Update Successful:', updateRes.data);

    } catch (error: any) {
        console.error('Update Failed:', error.response ? error.response.data : error.message);
        if (error.response && error.response.data && error.response.data.details) {
            console.error('Details:', error.response.data.details);
        }
    }
}

verifyUpdate();
