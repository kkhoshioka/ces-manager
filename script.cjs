const fs = require('fs');
const path = 'api/_server/pdfService.ts';
let code = fs.readFileSync(path, 'utf8');

// Add closingDate
const customerRegex = /interface Customer \{[\s\S]*?name: string;\s*\}/;
if (customerRegex.test(code)) {
    code = code.replace(customerRegex, `interface Customer {\n    code?: string;\n    name: string;\n    closingDate?: string | null;\n}`);
}

// Replace formatHelper
const formatHelperSearch = `const formatDate = (date: Date | string | null) => {`;
if (code.includes(formatHelperSearch) && !code.includes('getInvoiceDateString')) {
    const getInvoiceDateHelper = `const getInvoiceDateString = (completionDate: Date | string | null | undefined, closingDayStr?: string | null) => {
    let baseDate = new Date();
    if (completionDate) {
        baseDate = new Date(completionDate);
    }
    
    if (!closingDayStr) {
        return \`令和 \${baseDate.getFullYear() - 2018} 年 \${baseDate.getMonth() + 1} 月 \${baseDate.getDate()} 日\`;
    }
    
    const closingDay = parseInt(closingDayStr, 10);
    if (isNaN(closingDay)) {
        return \`令和 \${baseDate.getFullYear() - 2018} 年 \${baseDate.getMonth() + 1} 月 \${baseDate.getDate()} 日\`;
    }
    
    let targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), closingDay);
    if (closingDay === 99) {
        targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0); // End of month
    }
    
    return \`令和 \${targetDate.getFullYear() - 2018} 年 \${targetDate.getMonth() + 1} 月 \${targetDate.getDate()} 日\`;
};

const formatDate = (date: Date | string | null) => {`;
    code = code.replace(formatHelperSearch, getInvoiceDateHelper);
}

// Replace Invoice Date
const invoiceDateRegex = /\{ text: \`令和 \$\{now.getFullYear\(\) - 2018\} 年 \$\{now.getMonth\(\) \+ 1\} 月 \$\{now.getDate\(\)\} 日\`,\s*width: 100,\s*alignment: 'right',\s*fontSize: 10 \}/;
if (invoiceDateRegex.test(code)) {
    code = code.replace(invoiceDateRegex, `{ text: getInvoiceDateString(project.completionDate, project.customer?.closingDate), width: 100, alignment: 'right', fontSize: 10 }`);
}

fs.writeFileSync(path, code, 'utf8');
console.log('Update complete');
