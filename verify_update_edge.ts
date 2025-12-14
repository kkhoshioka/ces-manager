import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function verifyUpdateEdgeCases() {
    console.log('Starting Update Edge Case Verification...');

    // 1. Setup
    const customerRes = await axios.post(`${API_URL}/customers`, {
        code: `C${Date.now()}`,
        name: 'EdgeCase Customer'
    });
    const customerId = customerRes.data.id;
    const projectRes = await axios.post(`${API_URL}/projects`, {
        customerId: customerId,
        type: 'repair',
        notes: 'Init',
        details: []
    });
    const projectId = projectRes.data.id;
    console.log(`Project ID: ${projectId}`);

    // Test 1: Update with empty details (Should succeed)
    try {
        await axios.put(`${API_URL}/projects/${projectId}`, {
            type: 'repair',
            customerId: customerId,
            machineModel: '',
            serialNumber: '',
            totalAmount: 0,
            details: []
        });
        console.log('Test 1 (Empty Details): PASS');
    } catch (e: any) {
        console.error('Test 1 (Empty Details): FAIL', e.response?.data || e.message);
    }

    // Test 2: Update with Valid detail but missing optional fields
    try {
        await axios.put(`${API_URL}/projects/${projectId}`, {
            type: 'repair',
            customerId: customerId,
            details: [{
                lineType: 'part',
                description: 'Part A',
                quantity: 1,
                unitPrice: 100,
                unitCost: 50,
                amountCost: 50,
                amountSales: 100
                // productCategoryId omitted
            }]
        });
        console.log('Test 2 (Missing Optional): PASS');
    } catch (e: any) {
        console.error('Test 2 (Missing Optional): FAIL', e.response?.data || e.message);
    }

    // Test 3: Update with productCategoryId = null
    try {
        await axios.put(`${API_URL}/projects/${projectId}`, {
            type: 'repair',
            customerId: customerId,
            details: [{
                lineType: 'part',
                description: 'Part B',
                quantity: 1,
                unitPrice: 100,
                unitCost: 50,
                amountCost: 50,
                amountSales: 100,
                productCategoryId: null
            }]
        });
        console.log('Test 3 (Null Category): PASS');
    } catch (e: any) {
        console.error('Test 3 (Null Category): FAIL', e.response?.data || e.message);
    }

    // Test 4: Update with productCategoryId = 0 (Invalid ID?)
    // Note: If 0 is referenced, it might fail foreign key.
    try {
        await axios.put(`${API_URL}/projects/${projectId}`, {
            type: 'repair',
            customerId: customerId,
            details: [{
                lineType: 'part',
                description: 'Part C',
                quantity: 1,
                unitPrice: 100,
                unitCost: 50,
                amountCost: 50,
                amountSales: 100,
                productCategoryId: 0
            }]
        });
        console.log('Test 4 (Category ID 0): PASS');
    } catch (e: any) {
        console.log('Test 4 (Category ID 0): EXPECTED FAIL (Foreign Key)', e.response?.data || e.message);
    }

}

verifyUpdateEdgeCases();
