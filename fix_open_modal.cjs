const fs = require('fs');
let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

const regex = /const openPastProjectsModal = async \(\) => \{\r?\n\s*if \(\!formState\.customerName\) \{\r?\n\s*alert\('顧客を選択してください'\);\r?\n\s*return;\r?\n\s*\}\r?\n\s*setIsPastProjectsModalOpen\(true\);\r?\n\s*setIsPastProjectsLoading\(true\);\r?\n\s*setPastProjectsSearchText\(''\);\r?\n\s*try \{\r?\n\s*const customer = customers\.find\(c => c\.name === formState\.customerName\);\r?\n\s*if \(\!customer\) throw new Error\('Customer not found'\);\r?\n\s*const data = await RepairService\.getAll\(\{ customerId: customer\.id, limit: 100 \}\);\r?\n\s*setPastProjects\(data\.filter\(p => p\.id !== selectedProjectId\)\);\r?\n\s*\} catch \(error\) \{\r?\n\s*console\.error\('Failed to load past projects', error\);\r?\n\s*alert\('過去の案件の読み込みに失敗しました'\);\r?\n\s*\} finally \{\r?\n\s*setIsPastProjectsLoading\(false\);\r?\n\s*\}\r?\n\s*\};/;

const replacement = `const openPastProjectsModal = async () => {
        setIsPastProjectsModalOpen(true);
        setPastProjectsSearchText('');
        searchPastProjects('');
    };`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/pages/Repairs.tsx', code);
console.log("Fixed openPastProjectsModal");
