async function testPdf() {
    try {
        const res = await fetch('http://localhost:3000/api/machines/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                machines: [{ customer: { name: 'Test' }, machineModel: 'Model A', serialNumber: '123' }],
                title: 'Test'
            })
        });
        
        console.log('Status:', res.status);
        console.log('OK:', res.ok);
        if (!res.ok) {
            const text = await res.text();
            console.log('Body:', text);
        } else {
            console.log('Success, content-type:', res.headers.get('content-type'));
        }
    } catch(err) {
        console.error('Fetch error:', err);
    }
}

testPdf();
