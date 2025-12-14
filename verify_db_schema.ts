import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('prisma/dev.db');
const db = new Database(dbPath);

console.log('--- Checking Project Table Schema ---');
try {
    const tableInfo = db.prepare("PRAGMA table_info(Project)").all();
    console.log(tableInfo);

    const hasStatus = tableInfo.some((col: any) => col.name === 'status');
    if (hasStatus) {
        console.log('✅ "status" column EXISTS.');
    } else {
        console.error('❌ "status" column is MISSING!');
    }
} catch (error) {
    console.error('Failed to check schema:', error);
}
