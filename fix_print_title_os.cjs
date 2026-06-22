const fs = require('fs');
let code = fs.readFileSync('src/pages/machines/MachineRegistry.tsx', 'utf8');

const regex = /const handleAfterPrint = \(\) => \{\r?\n\s*document\.title = originalTitle;\r?\n\s*setIsPrinting\(false\);\r?\n\s*window\.removeEventListener\('afterprint', handleAfterPrint\);\r?\n\s*\};/;

const replacement = `const handleAfterPrint = () => {
            setIsPrinting(false);
            
            // Revert title on user interaction or timeout to avoid breaking OS Save As dialog
            const restoreTitle = () => {
                document.title = originalTitle;
                window.removeEventListener('mousemove', restoreTitle);
                window.removeEventListener('focus', restoreTitle);
            };
            window.addEventListener('mousemove', restoreTitle);
            window.addEventListener('focus', restoreTitle);
            setTimeout(restoreTitle, 10000);

            window.removeEventListener('afterprint', handleAfterPrint);
        };`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/machines/MachineRegistry.tsx', code);
    console.log("Replaced handleAfterPrint to fix OS save dialog empty title bug.");
} else {
    console.log("Could not find regex to replace.");
}
