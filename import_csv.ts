process.env.DATABASE_URL = "postgresql://postgres.mohzqkdysvnuvgfqfgwy:PN%24%3Fg%21s2cP5W96d@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function importCustomers() {
    console.log('Importing Customers from 販売顧客リスト.csv...');
    if (!fs.existsSync('販売顧客リスト.csv')) {
        console.log('File not found: 販売顧客リスト.csv');
        return;
    }

    const content = fs.readFileSync('販売顧客リスト.csv');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    let count = 0;
    for (const row of records) {
        const code = row['コード'];
        if (!code || code === 'コード') continue; // Skip empty codes or headers if parsed wrong

        const name = row['顧客名'] || '';
        const postalCode = row['〒'] || null;
        const address = row['住所'] || null;
        const phone = row['TEL'] || null;
        const fax = row['FAX'] || null;
        const email = row['E-mail'] || null;
        const paymentTerms = row['支払条件'] || null;

        // Keys in the CSV might have weird characters, we find the column that holds "代表者" or "担当者"
        // Let's iterate object keys to find the exact key name for the column before '代表者名(担当者）'
        // In the parsed object, empty headers usually get assigned empty string '' as key.
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
            // "代表者" or empty
            representativeName = repNameOrContactName;
            if (mobile) {
                representativePhone = mobile;
            }
        }

        const dataObj = {
            name,
            postalCode,
            address,
            phone,
            fax,
            email,
            paymentTerms,
            representativeName,
            representativePhone
        };

        try {
            await prisma.customer.upsert({
                where: { code },
                create: {
                    code,
                    ...dataObj,
                    contacts: contactsToCreate.length > 0 ? { create: contactsToCreate } : undefined
                },
                update: {
                    ...dataObj,
                    // For upsert update, we want to clear old contacts and insert new, or just keep what's in CSV.
                    // The user said "CSVが正" (CSV is the source of truth), so we should delete old contacts and recreate.
                    contacts: {
                        deleteMany: {},
                        create: contactsToCreate
                    }
                }
            });
            count++;
        } catch (err) {
            console.error(`Error importing customer ${code}:`, err);
        }
    }
    console.log(`Imported ${count} customers.`);
}

async function importSuppliers() {
    console.log('Importing Suppliers from 仕入先マスター（常用）.csv...');
    if (!fs.existsSync('仕入先マスター（常用）.csv')) {
        console.log('File not found: 仕入先マスター（常用）.csv');
        return;
    }

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
        const paymentTerms = row['支払日'] || null; // mapped to paymentTerms as discussed

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
            name,
            postalCode,
            address,
            phone,
            fax,
            email,
            invoiceRegistrationNumber,
            paymentTerms,
            representativeName,
            representativePhone
        };

        try {
            await prisma.supplier.upsert({
                where: { code },
                create: {
                    code,
                    ...dataObj,
                    contacts: contactsToCreate.length > 0 ? { create: contactsToCreate } : undefined
                },
                update: {
                    ...dataObj,
                    contacts: {
                        deleteMany: {},
                        create: contactsToCreate
                    }
                }
            });
            count++;
        } catch (err) {
            console.error(`Error importing supplier ${code}:`, err);
        }
    }
    console.log(`Imported ${count} suppliers.`);
}

async function main() {
    await importCustomers();
    await importSuppliers();
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
