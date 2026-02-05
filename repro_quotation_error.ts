import axios from 'axios';

const BASE_URL = 'http://localhost:5173/api'; // Or whatever port the server is running on (likely 5173 for vite proxy or 3000 for backend)
// Looking at package.json, server runs on tsx server/index.ts, likely port 3000.
// Vite runs on 5173.

const API_URL = 'http://localhost:3000/api';

async function testQuotationHistory() {
    try {
        // 1. Get a project ID
        console.log('Fetching projects...');
        const projectsRes = await axios.get(`${API_URL}/projects?limit=1`);
        const projects = projectsRes.data;

        if (projects.length === 0) {
            console.log('No projects found to test.');
            return;
        }

        const projectId = projects[0].id;
        console.log(`Testing Quotation History for Project ID: ${projectId}`);

        // 2. Fetch Quotations for this project
        const quotationsRes = await axios.get(`${API_URL}/projects/${projectId}/quotations`);
        console.log('Quotations fetched successfully:', quotationsRes.data);

    } catch (error: any) {
        console.error('Error occurred:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testQuotationHistory();
