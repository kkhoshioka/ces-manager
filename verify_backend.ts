

const API_BASE = 'http://localhost:3000/api';

async function verifyBackend() {
    try {
        console.log('--- Verifying Backend ---');

        // 1. Create Customer
        console.log('1. Creating Customer...');
        const customerRes = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: `TEST_${Date.now()}`,
                name: 'Test Customer Node'
            })
        });

        if (!customerRes.ok) {
            console.error('Failed to create customer:', await customerRes.text());
            return;
        }
        const customer = await customerRes.json();
        console.log('Customer created:', customer);

        // 2. Create Project with Details
        console.log('2. Creating Project with Details...');
        const projectRes = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: customer.id,
                machineModel: 'PC200-8',
                serialNumber: '99999',
                status: 'received',
                notes: 'Test Project via Node',
                details: [
                    {
                        lineType: 'labor',
                        description: 'Inspection',
                        quantity: 1.5,
                        unitPrice: 8000,
                        unitCost: 0
                    },
                    {
                        lineType: 'part',
                        description: 'O-Ring',
                        quantity: 2,
                        unitPrice: 500,
                        unitCost: 100
                    }
                ]
            })
        });

        if (!projectRes.ok) {
            console.error('Failed to create project:', await projectRes.text());
            return;
        }
        const project = await projectRes.json();
        console.log('Project created:', project);

        // 3. Verify Details were saved
        console.log('3. Verifying Details...');
        const getProjectRes = await fetch(`${API_BASE}/projects/${project.id}`);
        const fetchedProject = await getProjectRes.json();

        if (fetchedProject.details && fetchedProject.details.length === 2) {
            console.log('SUCCESS: Project details verified.');
        } else {
            console.error('FAILURE: Project details missing or incorrect.', fetchedProject.details);
        }

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifyBackend();

export { };
