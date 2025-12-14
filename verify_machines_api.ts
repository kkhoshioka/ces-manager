
// using native fetch

const API_BASE = 'http://localhost:3000/api';

async function verifyMachinesApi() {
    console.log('--- Verifying Machine Registry API ---');

    try {
        // 1. Create a Customer (Prerequisite)
        console.log('\n[1] Creating Prerequisite Customer...');
        const customerRes = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: `VERIFY_CUST_${Date.now()}`,
                name: 'Verify Machine Customer'
            })
        });
        if (!customerRes.ok) throw new Error(`Failed to create customer: ${await customerRes.text()}`);
        const customer = await customerRes.json();
        console.log(' -> Customer Created:', customer.id, customer.name);

        // 2. Create a Category (Prerequisite)
        console.log('\n[2] Creating Prerequisite Category...');
        const catRes = await fetch(`${API_BASE}/product-categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section: 'Rental',
                code: `CAT_${Date.now()}`,
                name: 'Excavator'
            })
        });
        if (!catRes.ok) throw new Error(`Failed to create category: ${await catRes.text()}`);
        const category = await catRes.json();
        console.log(' -> Category Created:', category.id, category.name);

        // 3. Create a Machine
        console.log('\n[3] Creating Machine...');
        const serialNo = `SN-${Date.now()}`;
        const machineRes = await fetch(`${API_BASE}/machines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: customer.id,
                productCategoryId: category.id,
                machineModel: 'PC200-11',
                serialNumber: serialNo,
                purchaseDate: new Date().toISOString(),
                notes: 'Initial Verification Machine'
            })
        });
        if (!machineRes.ok) throw new Error(`Failed to create machine: ${await machineRes.text()}`);
        const machine = await machineRes.json();
        console.log(' -> Machine Created:', machine.id, machine.machineModel, machine.serialNumber);

        // 4. Update the Machine
        console.log('\n[4] Updating Machine...');
        const updateRes = await fetch(`${API_BASE}/machines/${machine.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // keep other fields
                customerId: customer.id,
                // update notes
                notes: 'Updated Verification Note'
            })
        });
        if (!updateRes.ok) throw new Error(`Failed to update machine: ${await updateRes.text()}`);
        const updatedMachine = await updateRes.json();
        if (updatedMachine.notes === 'Updated Verification Note') {
            console.log(' -> Machine Updated Successfully. Notes:', updatedMachine.notes);
        } else {
            console.error(' -> Top Update Failed. Notes:', updatedMachine.notes);
        }

        // 5. Create a Linked Project (to test history)
        console.log('\n[5] Creating Linked Project (Repair Record)...');
        const projectRes = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: customer.id,
                customerMachineId: machine.id, // THE LINK
                status: 'completed',
                notes: 'Repair History Test',
                details: []
            })
        });
        if (!projectRes.ok) throw new Error(`Failed to create project: ${await projectRes.text()}`);
        const project = await projectRes.json();
        console.log(' -> Project Created:', project.id);

        // 6. Fetch Machine History
        console.log('\n[6] Fetching Machine History...');
        const historyRes = await fetch(`${API_BASE}/machines/${machine.id}/history`);
        if (!historyRes.ok) throw new Error(`Failed to fetch history: ${await historyRes.text()}`);
        const history = await historyRes.json();
        console.log(' -> History Count:', history.length);

        const found = history.find((h: any) => h.id === project.id);
        if (found) {
            console.log(' -> SUCCESS: Project found in machine history.');
        } else {
            console.error(' -> FAILURE: Project not found in machine history.');
        }

    } catch (error) {
        console.error('!!! Verification Step Failed !!!', error);
        process.exit(1);
    }
}

verifyMachinesApi();
