
import axios from 'axios';
import { Buffer } from 'buffer';

const API_BASE_URL = 'http://localhost:3000/api';

async function verifyBOM() {
    try {
        const model = 'categories';

        console.log(`Fetching CSV for ${model} from ${API_BASE_URL}...`);
        const response = await axios.get(`${API_BASE_URL}/data/${model}/export`, {
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);

        // BOM for UTF-8 is 0xEF, 0xBB, 0xBF
        if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            console.log('✅ BOM detected!');
            console.log('First 3 bytes:', buffer.subarray(0, 3));
        } else {
            console.error('❌ BOM NOT detected.');
            console.log('First 3 bytes:', buffer.subarray(0, 3));
            process.exit(1);
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
        console.error('Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        if (error.code) console.error('Error Code:', error.code);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data status:', error.response.statusText);
        }
        process.exit(1);
    }
}

verifyBOM();
