const fs = require('fs');
let code = fs.readFileSync('src/pages/machines/MachineRegistry.tsx', 'utf8');

const regex = /setTimeout\(\(\) => \{\r?\n\s*window\.print\(\);\r?\n\s*\/\/ Revert after printing dialog closes\r?\n\s*setTimeout\(\(\) => \{\r?\n\s*document\.title = originalTitle;\r?\n\s*setIsPrinting\(false\);\r?\n\s*\}, 500\);\r?\n\s*\}, 500\);/m;

const replacement = `const handleAfterPrint = () => {
            document.title = originalTitle;
            setIsPrinting(false);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);

        setTimeout(() => {
            window.print();
        }, 500);`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/machines/MachineRegistry.tsx', code);
    console.log("Replaced successfully with onafterprint.");
} else {
    console.log("Could not find regex to replace.");
}
