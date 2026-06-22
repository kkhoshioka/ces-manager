const fs = require('fs');
let code = fs.readFileSync('src/pages/machines/MachineRegistry.tsx', 'utf8');

const importRegex = /import PrintableMachineList from '\.\/PrintableMachineList';/;
const importReplacement = `import PrintableMachineList from './PrintableMachineList';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';`;
code = code.replace(importRegex, importReplacement);

const refRegex = /const \[printTitle, setPrintTitle\] = useState\(''\);/;
const refReplacement = `const [printTitle, setPrintTitle] = useState('');
    const printComponentRef = useRef<HTMLDivElement>(null);
    const [printDocTitle, setPrintDocTitle] = useState('機材台帳');

    const handleActualPrint = useReactToPrint({
        content: () => printComponentRef.current,
        documentTitle: printDocTitle,
        onAfterPrint: () => setIsPrinting(false),
    });`;
code = code.replace(refRegex, refReplacement);

const handleRegex = /const handlePrintExecute = \([\s\S]*?setIsPrinting\(false\);\r?\n\s*window\.removeEventListener\('afterprint', handleAfterPrint\);\r?\n\s*\};\r?\n\s*window\.addEventListener\('mousemove', restoreTitle\);\r?\n\s*window\.addEventListener\('focus', restoreTitle\);\r?\n\s*setTimeout\(restoreTitle, 10000\);\r?\n\s*window\.removeEventListener\('afterprint', handleAfterPrint\);\r?\n\s*\};\r?\n\s*window\.addEventListener\('afterprint', handleAfterPrint\);\r?\n\s*setTimeout\(\(\) => \{\r?\n\s*window\.print\(\);\r?\n\s*\}, 500\);\r?\n\s*\};/;

const simplifiedRegex = /const handlePrintExecute = \([\s\S]*?\}, 500\);\r?\n\s*\};/;

const newHandlePrint = `const handlePrintExecute = (machinesToPrint: CustomerMachine[], title: string) => {
        setPrintData(machinesToPrint);
        setPrintTitle(title);
        setIsPrintModalOpen(false);
        setIsPrinting(true);
        
        const now = new Date();
        const yyyy = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setPrintDocTitle(\`機材台帳_\${yyyy}\${MM}\${dd}_\${HH}\${mm}\`);

        setTimeout(() => {
            handleActualPrint();
        }, 100);
    };`;

code = code.replace(simplifiedRegex, newHandlePrint);

const renderRegex = /\{isPrinting && \(\r?\n\s*<PrintableMachineList \r?\n\s*machines=\{printData\} \r?\n\s*printTitle=\{printTitle\} \r?\n\s*\/>\r?\n\s*\)\}/;
const renderReplacement = `<div style={{ display: 'none' }}>
                <PrintableMachineList 
                    ref={printComponentRef}
                    machines={printData} 
                    printTitle={printTitle} 
                />
            </div>`;
code = code.replace(renderRegex, renderReplacement);

fs.writeFileSync('src/pages/machines/MachineRegistry.tsx', code);
console.log("Updated MachineRegistry with react-to-print");
