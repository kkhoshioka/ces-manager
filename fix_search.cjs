const fs = require('fs');
let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

// 1. Update the search logic
const searchRegex = /const data = await RepairService\.getAll\(\{ customerId: customer\.id, limit: 100, search: searchText \|\| undefined \}\);/;
const searchReplacement = `let fetchOptions: any = { limit: 20, search: searchText || undefined };
            // If no search text, default to current customer's projects to be helpful, or if they want 20 latest overall we can omit customerId.
            // Since the user asked for "latest 20", let's just fetch latest 20 overall if search is empty, or maybe they just meant "limit to 20". Let's show all latest 20 globally to fulfill "search by customer name" easily.
            const data = await RepairService.getAll({ limit: 20, search: searchText || undefined });`;

code = code.replace(searchRegex, searchReplacement);

// 2. Update the display list to show the customer name and update placeholder
const listRegex = /<div style=\{\{ fontWeight: 'bold', marginBottom: '0\.25rem' \}\}>\r?\n\s*\{p\.machineModel\} \{p\.serialNumber \? `\(S\/N: \$\{p\.serialNumber\}\)` : ''\}\r?\n\s*<\/div>/g;
const listReplacement = `<div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#0f172a' }}>
                                                    <span style={{ color: '#0369a1', marginRight: '0.5rem' }}>[{p.customer?.name || '顧客未設定'}]</span>
                                                    {p.machineModel} {p.serialNumber ? \`(S/N: \${p.serialNumber})\` : ''}
                                                </div>`;

code = code.replace(listRegex, listReplacement);

const placeholderRegex = /placeholder="機種、シリアル、備考などで検索\.\.\."/;
const placeholderReplacement = `placeholder="顧客名、機種、シリアル、備考などで検索..."`;

code = code.replace(placeholderRegex, placeholderReplacement);

fs.writeFileSync('src/pages/Repairs.tsx', code);
console.log("Repairs.tsx updated for search");
