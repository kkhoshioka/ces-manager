const fs = require('fs');
let code = fs.readFileSync('src/pages/machines/MachineRegistry.tsx', 'utf8');

const regex1 = /const handleActualPrint = useReactToPrint\(\{\r?\n\s*contentRef: printComponentRef,\r?\n\s*documentTitle: printDocTitle,\r?\n\s*onAfterPrint: \(\) => setIsPrinting\(false\),\r?\n\s*\}\);/;

const replacement1 = `const handleActualPrint = useReactToPrint({
        contentRef: printComponentRef,
        // Omit documentTitle here to prevent react-to-print from resetting it too early
        onAfterPrint: () => {
            setIsPrinting(false);
            
            // Revert original document title on user interaction or after a long timeout
            const originalTitle = 'CES Manager';
            const restoreTitle = () => {
                document.title = originalTitle;
                window.removeEventListener('mousemove', restoreTitle);
                window.removeEventListener('focus', restoreTitle);
            };
            window.addEventListener('mousemove', restoreTitle);
            window.addEventListener('focus', restoreTitle);
            setTimeout(restoreTitle, 30000);
        },
    });`;

if (regex1.test(code)) {
    code = code.replace(regex1, replacement1);
} else {
    console.log("Regex 1 failed");
}

const regex2 = /setPrintDocTitle\(\`機材台帳_\$\{yyyy\}\$\{MM\}\$\{dd\}_\$\{HH\}\$\{mm\}\`\);/;

const replacement2 = `const newTitle = \`機材台帳_\${yyyy}\${MM}\${dd}_\${HH}\${mm}\`;
        setPrintDocTitle(newTitle);
        document.title = newTitle; // Force main document title manually`;

if (regex2.test(code)) {
    code = code.replace(regex2, replacement2);
} else {
    console.log("Regex 2 failed");
}

fs.writeFileSync('src/pages/machines/MachineRegistry.tsx', code);
console.log("Replaced for robust OS printing title.");
