
// using global fetch

async function main() {
    console.log('Testing/Verifying API with new fields...');

    // 1. Create a customer (if needed, or just use ID 1)
    let customerId = 1;
    try {
        const cRes = await fetch('http://localhost:3000/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'V_FIX_' + Date.now(), name: 'Verify Fix Customer' })
        });
        const cData = await cRes.json();
        if (cData.id) customerId = cData.id;
    } catch (e) {
        console.log('Using default customer ID 1');
    }

    // 2. Post Project with New Fields
    const payload = {
        customerId: customerId,
        machineModel: 'TEST-FIX',
        serialNumber: '99999',
        status: 'received',
        notes: 'Verification Note',
        details: [
            {
                lineType: 'part',
                description: 'Test Part',
                quantity: 1,
                unitCost: 100,
                unitPrice: 200,
                amountCost: 100,
                amountSales: 200,
                supplier: 'Test Supplier',
                remarks: 'Test Remark'
            }
        ]
    };

    const res = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        const data = await res.json();
        console.log('SUCCESS: Project Created', data.id);

        // Verify response contains new fields in details
        const detail = data.details[0];
        if (detail.supplier === 'Test Supplier' && detail.remarks === 'Test Remark') {
            console.log('VERIFIED: Fields saved correctly.');
        } else {
            console.error('FAILURE: Fields missing in response', detail);
            process.exit(1);
        }
    } else {
        const txt = await res.text();
        console.error('FAILURE: API Error', res.status, txt);
        process.exit(1);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
