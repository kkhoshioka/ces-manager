const fs = require('fs');
const path = 'src/pages/dashboard/SupplierMonthlyReport.tsx';
let data = fs.readFileSync(path, 'utf8');

// Replace state initializations
data = data.replace(/category: '仕入販売'/g, "category: '発注部品・商品'");
// Replace select option value and label
data = data.replace(/<option value="仕入販売">仕入販売<\/option>/g, '<option value="発注部品・商品">発注部品・商品</option>');

fs.writeFileSync(path, data, 'utf8');
console.log('Update complete');
