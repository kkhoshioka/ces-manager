
import Database from 'better-sqlite3';

const db = new Database('dev.db');

try {
    console.log('--- Tables ---');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(tables);

    console.log('\n--- ProductCategory Columns ---');
    if (tables.some((t: any) => t.name === 'ProductCategory')) {
        const columns = db.prepare("PRAGMA table_info(ProductCategory)").all();
        console.log(columns);

        console.log('\n--- ProductCategory Rows ---');
        const rows = db.prepare("SELECT * FROM ProductCategory LIMIT 5").all();
        console.log(rows);
    } else {
        console.error('ProductCategory table NOT FOUND!');
    }

} catch (err) {
    console.error('DB Error:', err);
} finally {
    db.close();
}
