import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function verifyUpdateDecimalFail() {
    console.log('Starting Decimal Failure Verification...');

    // 1. Setup
    const customerRes = await axios.post(`${API_URL}/customers`, {
        code: `C${Date.now()}_Dec`,
        name: 'DecimalFail Customer'
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

    // Test: Update with totalAmount = null (simulating NaN)
    try {
        await axios.put(`${API_URL}/projects/${projectId}`, {
            type: 'repair',
            customerId: customerId,
            machineModel: '',
            serialNumber: '',
            totalAmount: null, // This should fail
            details: []
        });
        console.log('Test Top-level Null: PASS (Unexpected)');
    } catch (e: any) {
        console.log('Test Top-level Null: EXPECTED FAIL', e.response?.data || e.message);
    }

    // Test: Update with detail unitPrice = null (simulating NaN) -> amountSales = null
    // schema for ProjectDetail: unitPrice Decimal @default(0). Not nullable.
    try {
        await axios.put(`${API_URL}/projects/${projectId}`, {
            type: 'repair',
            customerId: customerId,
            totalAmount: 0,
            details: [{
                lineType: 'part',
                description: 'NaN Price',
                quantity: 1,
                unitPrice: null, // simulating NaN -> null
                unitCost: 0,
                amountCost: 0,
                amountSales: 0
            }]
        });
        console.log('Test Detail Null Price: PASS (Unexpected)');
    } catch (e: any) {
        console.log('Test Detail Null Price: EXPECTED FAIL', e.response?.data || e.message);
    }
}

verifyUpdateDecimalFail();
