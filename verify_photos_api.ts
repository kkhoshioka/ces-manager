
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = 'http://localhost:3000/api';

async function verifyPhotos() {
    console.log('Starting Photo Verification...');

    // 1. Create a dummy customer
    console.log('Creating dummy customer...');
    const customerRes = await axios.post(`${API_URL}/customers`, {
        code: `C${Date.now()}`,
        name: 'Photo Verify Customer'
    });
    const customerId = customerRes.data.id;
    console.log(`Created Customer ID: ${customerId}`);

    // 2. Create a dummy project
    console.log('Creating dummy project...');
    const projectRes = await axios.post(`${API_URL}/projects`, {
        customerId: customerId,
        type: 'repair',
        notes: 'Photo Verify Project'
    });
    const project = projectRes.data;
    console.log(`Created Project ID: ${project.id}`);

    // 2. Create a dummy image file
    const dummyImagePath = path.join(__dirname, 'dummy_test_image.txt');
    fs.writeFileSync(dummyImagePath, 'This is a test image content');

    // 3. Upload Photo
    console.log('Uploading photo...');
    const form = new FormData();
    form.append('photos', fs.createReadStream(dummyImagePath), 'test_image.txt');

    const uploadRes = await axios.post(`${API_URL}/projects/${project.id}/photos`, form, {
        headers: {
            ...form.getHeaders()
        }
    });

    if (uploadRes.status === 200 && uploadRes.data.length > 0) {
        console.log('Upload successful:', uploadRes.data);
    } else {
        console.error('Upload failed');
        process.exit(1);
    }

    const photoId = uploadRes.data[0].id;
    const photoPath = uploadRes.data[0].filePath;

    // 4. Verify Photo Record Exists in Project
    console.log('Verifying project photos...');
    const projectCheck = await axios.get(`${API_URL}/projects/${project.id}`);
    const hasPhoto = projectCheck.data.photos.some((p: any) => p.id === photoId);

    if (hasPhoto) {
        console.log('Photo found in project');
    } else {
        console.error('Photo NOT found in project');
        process.exit(1);
    }

    // 5. Verify File Accessibility (Static Serve)
    // Note: URL might need port adjustment
    const fileUrl = `http://localhost:3000${photoPath}`;
    console.log(`Checking file access at: ${fileUrl}`);
    try {
        const fileRes = await axios.get(fileUrl);
        if (fileRes.status === 200) {
            console.log('File is accessible');
        }
    } catch (e) {
        console.error('File access failed');
        // Is server running static serve correctly?
    }

    // 6. Delete Photo
    console.log(`Deleting photo ID: ${photoId}`);
    await axios.delete(`${API_URL}/photos/${photoId}`);

    // 7. Verify Deletion
    const projectCheck2 = await axios.get(`${API_URL}/projects/${project.id}`);
    const hasPhoto2 = projectCheck2.data.photos.some((p: any) => p.id === photoId);

    if (!hasPhoto2) {
        console.log('Photo correctly removed from project');
    } else {
        console.error('Photo STILL in project');
        process.exit(1);
    }

    // Cleanup Project (optional)

    // Cleanup Dummy File
    fs.unlinkSync(dummyImagePath);

    console.log('Verification Complete!');
}

verifyPhotos().catch(err => {
    console.error('Verification Error:', err.message);
    if (err.response) {
        console.log(err.response.data);
    }
});
