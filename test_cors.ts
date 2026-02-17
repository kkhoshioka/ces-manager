
import axios from 'axios';

async function testCors() {
    const url = 'https://ces-manager.onrender.com/api/health';
    const origin = 'https://ces-manager.vercel.app';

    console.log(`Testing CORS for URL: ${url}`);
    console.log(`Sending Origin: ${origin}`);

    try {
        const response = await axios.get(url, {
            headers: {
                'Origin': origin
            }
        });

        console.log('Response Status:', response.status);
        console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
        console.log('Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);

        if (response.headers['access-control-allow-origin'] === '*' || response.headers['access-control-allow-origin'] === origin) {
            console.log('✅ CORS Configured Correctly');
        } else {
            console.error('❌ CORS Misconfigured');
        }

    } catch (error: any) {
        console.error('Request Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testCors();
