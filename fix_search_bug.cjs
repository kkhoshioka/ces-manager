const fs = require('fs');
let code = fs.readFileSync('src/pages/Repairs.tsx', 'utf8');

const regex = /const searchPastProjects = async \(searchText: string = pastProjectsSearchText\) => \{\r?\n\s*if \(\!formState\.customerName\) return;\r?\n\s*setIsPastProjectsLoading\(true\);\r?\n\s*try \{\r?\n\s*const customer = customers\.find\(c => c\.name === formState\.customerName\);\r?\n\s*if \(\!customer\) throw new Error\('Customer not found'\);/;

const replacement = `const searchPastProjects = async (searchText: string = pastProjectsSearchText) => {
        setIsPastProjectsLoading(true);
        try {`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/Repairs.tsx', code);
    console.log("Bug fixed successfully");
} else {
    console.log("Could not find the target code to replace.");
}
