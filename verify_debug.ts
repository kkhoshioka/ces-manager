import axios from 'axios';

const API_URL = 'http://localhost:3000/api/projects';

async function testProjectLifecycle() {
    try {
        console.log('1. Creating a test project...');
        const createRes = await axios.post(API_URL, {
            customerId: 1, // Assuming customer 1 exists (from seeds)
            machineModel: 'Test Machine',
            serialNumber: 'TEST-123',
            status: 'received',
            type: 'repair',
            details: []
        });

        const projectId = createRes.data.id;
        console.log('   Success! Project ID:', projectId);

        console.log('2. Updating the test project (Status change)...');
        await axios.put(`${API_URL}/${projectId}`, {
            customerId: 1,
            machineModel: 'Test Machine Updated',
            status: 'in_progress',
            type: 'repair',
            details: []
        });
        console.log('   Success! Project Updated.');

        console.log('3. Deleting the test project...');
        await axios.delete(`${API_URL}/${projectId}`);
        console.log('   Success! Project Deleted.');

    } catch (error: any) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

testProjectLifecycle();
