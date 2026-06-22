import fs from 'fs';
import { parse } from 'csv-parse/sync';

const API_BASE = 'https://ces-manager.onrender.com/api';

async function importCustomers() {
    console.log('Fetching existing customers...');
    const res = await fetch(`${API_BASE}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    const existing = await res.json();
    const existingByCode = new Map(existing.map((c: any) => [c.code, c.id]));

    console.log('Importing Customers from 販売顧客リスト.csv...');
    const content = fs.readFileSync('販売顧客リスト.csv');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    let count = 0;
    for (const row of records) {
        const code = row['コード'];
        if (!code || code === 'コード') continue;

        const name = row['顧客名'] || '';
        const postalCode = row['〒'] || null;
        const address = row['住所'] || null;
        const phone = row['TEL'] || null;
        const fax = row['FAX'] || null;
        const email = row['E-mail'] || null;
        const paymentTerms = row['支払条件'] || null;

        const titleKey = Object.keys(row).find(k => k === ''); 
        const title = titleKey !== undefined ? row[titleKey] : '';
        const repNameOrContactName = row['代表者名(担当者）'] || null;
        const mobile = row['携帯'] || null;

        let representativeName = null;
        let representativePhone = null;
        const contactsToCreate = [];

        if (title === '担当者') {
            if (repNameOrContactName) {
                contactsToCreate.push({
                    name: repNameOrContactName,
                    position: '担当者',
                    mobile: mobile
                });
            }
        } else {
            representativeName = repNameOrContactName;
            if (mobile) {
                representativePhone = mobile;
            }
        }

        const dataObj = {
            code,
            name,
            postalCode,
            address,
            phone,
            fax,
            email,
            paymentTerms,
            representativeName,
            representativePhone,
            contacts: contactsToCreate
        };

        try {
            console.log(`Processing Customer ${code}`);
            const existingId = existingByCode.get(code);
            const method = existingId ? 'PUT' : 'POST';
            const url = existingId ? `${API_BASE}/customers/${existingId}` : `${API_BASE}/customers`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataObj)
            });

            if (!response.ok) {
                console.error(`Failed to save customer ${code}:`, await response.text());
            } else {
                count++;
            }
        } catch (err) {
            console.error(`Error importing customer ${code}:`, err);
        }
    }
    console.log(`Imported/Updated ${count} customers.`);
}

async function importSuppliers() {
    console.log('Fetching existing suppliers...');
    const res = await fetch(`${API_BASE}/suppliers`);
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    const existing = await res.json();
    const existingByCode = new Map(existing.map((s: any) => [s.code, s.id]));

    console.log('Importing Suppliers from 仕入先マスター（常用）.csv...');
    const content = fs.readFileSync('仕入先マスター（常用）.csv');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    let count = 0;
    for (const row of records) {
        const code = row['コード'];
        if (!code || code === 'コード') continue;

        let name = row['仕入先'] || '';
        const branch = row['営業所'] || '';
        if (branch) {
            name = name + ' ' + branch;
        }

        const postalCode = row['〒'] || null;
        const address = row['住所'] || null;
        const phone = row['TEL'] || null;
        const fax = row['FAX'] || null;
        const email = row['E-mail'] || null;
        const invoiceRegistrationNumber = row['インボイス'] || null;
        const paymentTerms = row['支払日'] || null;

        const titleKey = Object.keys(row).find(k => k === '');
        const title = titleKey !== undefined ? row[titleKey] : '';
        const repNameOrContactName = row['代表者名(担当者）'] || null;
        const mobile = row['携帯'] || null;

        let representativeName = null;
        let representativePhone = null;
        const contactsToCreate = [];

        if (title === '担当者') {
            if (repNameOrContactName) {
                contactsToCreate.push({
                    name: repNameOrContactName,
                    position: '担当者',
                    mobile: mobile
                });
            }
        } else {
            representativeName = repNameOrContactName;
            if (mobile) {
                representativePhone = mobile;
            }
        }

        const dataObj = {
            code,
            name,
            postalCode,
            address,
            phone,
            fax,
            email,
            invoiceRegistrationNumber,
            paymentTerms,
            representativeName,
            representativePhone,
            contacts: contactsToCreate
        };

        try {
            console.log(`Processing Supplier ${code}`);
            const existingId = existingByCode.get(code);
            const method = existingId ? 'PUT' : 'POST';
            const url = existingId ? `${API_BASE}/suppliers/${existingId}` : `${API_BASE}/suppliers`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataObj)
            });

            if (!response.ok) {
                console.error(`Failed to save supplier ${code}:`, await response.text());
            } else {
                count++;
            }
        } catch (err) {
            console.error(`Error importing supplier ${code}:`, err);
        }
    }
    console.log(`Imported/Updated ${count} suppliers.`);
}

async function main() {
    await importCustomers();
    await importSuppliers();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
