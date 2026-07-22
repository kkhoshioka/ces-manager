const fs = require('fs');
const path = 'src/pages/Repairs.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /customerContactName: '',/g,
    "customerContactName: '',\n            internalMemo: '',"
);

code = code.replace(
    /customerContactName: project\.customerContactName \|\| '',/g,
    "customerContactName: project.customerContactName || '',\n            internalMemo: project.internalMemo || '',"
);

code = code.replace(
    /customerContactName: formState\.customerContactName,/g,
    "customerContactName: formState.customerContactName,\n                internalMemo: formState.internalMemo,"
);

fs.writeFileSync(path, code, 'utf8');
console.log('Done.');
