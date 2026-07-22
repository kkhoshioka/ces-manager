const fs = require('fs');
const path = 'src/pages/dashboard/SupplierMonthlyReport.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /const handleItemChange = \(index: number, field: string, value: any\) => \{[\s\S]*?setPurchaseForm\(\{ \.\.\.purchaseForm, items: newItems \}\);\s*\};/;

const replace = `const handleItemChange = (index: number, field: string, value: any) => {
        setPurchaseForm(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            if (field === 'department') {
                newItems[index].productCategoryId = null;
                newItems[index].type = '';
            }
            if (field === 'projectId') {
                newItems[index].productId = '';
            }
            if (field === 'productId') {
                newItems[index].projectId = '';
            }
            return { ...prev, items: newItems };
        });
    };`;

if (regex.test(code)) {
    code = code.replace(regex, replace);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Update complete');
} else {
    console.log('Pattern not found!');
}
