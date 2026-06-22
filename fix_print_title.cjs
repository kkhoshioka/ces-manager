const fs = require('fs');
let code = fs.readFileSync('src/pages/machines/MachineRegistry.tsx', 'utf8');

const regex = /\/\/\s*Allow React to render the printable component, then print\s*setTimeout\(\(\) => \{\s*const originalTitle = document\.title;\s*const now = new Date\(\);\s*const yyyy = now\.getFullYear\(\);\s*const MM = String\(now\.getMonth\(\) \+ 1\)\.padStart\(2, '0'\);\s*const dd = String\(now\.getDate\(\)\)\.padStart\(2, '0'\);\s*const HH = String\(now\.getHours\(\)\)\.padStart\(2, '0'\);\s*const mm = String\(now\.getMinutes\(\)\)\.padStart\(2, '0'\);\s*document\.title = `機材台帳_\$\{yyyy\}\$\{MM\}\$\{dd\}_\$\{HH\}\$\{mm\}`;\s*window\.print\(\);\s*document\.title = originalTitle;\s*setIsPrinting\(false\);\s*\}, 300\);/m;

const replacement = `// Allow React to render the printable component, then print
        const originalTitle = document.title;
        const now = new Date();
        const yyyy = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        document.title = \`機材台帳_\${yyyy}\${MM}\${dd}_\${HH}\${mm}\`;

        setTimeout(() => {
            window.print();
            
            // Revert after printing dialog closes
            setTimeout(() => {
                document.title = originalTitle;
                setIsPrinting(false);
            }, 500);
        }, 500);`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/machines/MachineRegistry.tsx', code);
    console.log("Print timing fixed.");
} else {
    console.log("Could not find code to replace.");
}
