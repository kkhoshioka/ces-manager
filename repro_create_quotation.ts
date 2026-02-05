import axios from 'axios';

// const API_URL = 'http://localhost:3000/api';
// const API_URL = 'https://ces-manager.vercel.app/api';
const API_URL = 'https://ces-manager.onrender.com/api';

async function testQuotationCreation() {
    console.log(`Using API URL: ${API_URL}`);

    try {
        console.log('0. Checking Health...');
        const healthRes = await axios.get(`${API_URL}/health`);
        console.log('Health Check:', healthRes.data);
    } catch (e: any) {
        console.error('Health Check Failed:', e.message);
        if (e.response) console.error('Data:', JSON.stringify(e.response.data, null, 2));
        return;
    }

    try {
        console.log('1. Fetching projects to get ID...');
        const projectsRes = await axios.get(`${API_URL}/projects?limit=1`);
        if (projectsRes.data.length === 0) {
            console.log('No projects found.');
            return;
        }
        const projectId = projectsRes.data[0].id;
        console.log(`Target Project ID: ${projectId}`);

        console.log('2. Attempting to create new quotation (POST)...');
        // Simulate "Create New" - empty body or specific flags
        const res = await axios.post(`${API_URL}/projects/${projectId}/quotations`, { cloneFromProject: false });

        console.log('Success! Quotation created:', res.data);

    } catch (error: any) {
        console.error('Error occurred during creation:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testQuotationCreation();
