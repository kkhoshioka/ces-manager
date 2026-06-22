const fs = require('fs');

let code = fs.readFileSync('src/pages/machines/MachineRegistry.tsx', 'utf8');

// 1. Remove react-to-print import
code = code.replace(/import \{ useReactToPrint \} from 'react-to-print';\r?\n/, '');

// 2. Remove PrintableMachineList import
code = code.replace(/import PrintableMachineList from '\.\/PrintableMachineList';\r?\n/, '');

// 3. Replace state variables and handleActualPrint
const stateRegex = /const \[isPrinting, setIsPrinting\] = useState\(false\);\s*const \[printData, setPrintData\] = useState<CustomerMachine\[\]>\(\[\]\);\s*const \[printTitle, setPrintTitle\] = useState\(''\);\s*const printComponentRef = useRef<HTMLDivElement>\(null\);\s*const \[printDocTitle, setPrintDocTitle\] = useState\('機材台帳'\);\s*const handleActualPrint = useReactToPrint\(\{[\s\S]*?\}\);/;

const newState = `const [isPdfLoading, setIsPdfLoading] = useState(false);`;

code = code.replace(stateRegex, newState);

// 4. Replace handlePrintExecute
const handlePrintExecuteRegex = /const handlePrintExecute = \(machinesToPrint: CustomerMachine\[\], title: string\) => \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?\}, 100\);\s*\};/;

const newHandlePrintExecute = `const handlePrintExecute = async (machinesToPrint: CustomerMachine[], title: string) => {
        setIsPrintModalOpen(false);
        setIsPdfLoading(true);
        try {
            const now = new Date();
            const yyyy = now.getFullYear();
            const MM = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const HH = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const filenameDate = \`\${yyyy}\${MM}\${dd}_\${HH}\${mm}\`;
            const filename = \`機材台帳_\${filenameDate}.pdf\`;

            const res = await fetch(\`\${API_BASE_URL}/machines/pdf\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ machines: machinesToPrint, title })
            });

            if (!res.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('PDFの生成に失敗しました。');
        } finally {
            setIsPdfLoading(false);
        }
    };`;

code = code.replace(handlePrintExecuteRegex, newHandlePrintExecute);

// 5. Remove hidden PrintableMachineList component
const hiddenPrintRegex = /<div style=\{\{ display: 'none' \}\}>\s*<PrintableMachineList[\s\S]*?<\/div>/;
code = code.replace(hiddenPrintRegex, '');

// 6. Update print button to show loading state if it doesn't
const printButtonRegex = /<Button\s*onClick=\{\(\) => setIsPrintModalOpen\(true\)\}\s*variant="secondary"\s*icon=\{<Printer size=\{18\} \/>\}\s*className="hidden sm:flex"\s*>/;
const newPrintButton = `<Button 
                        onClick={() => setIsPrintModalOpen(true)} 
                        variant="secondary" 
                        icon={<Printer size={18} />} 
                        className="hidden sm:flex"
                        disabled={isPdfLoading}
                    >`;
code = code.replace(printButtonRegex, newPrintButton);

// Also replace the content of the print button
const printTextRegex = /\{\s*isPrinting \? '印刷準備中\.\.\.' : '印刷'\s*\}/;
const newPrintText = `{isPdfLoading ? 'PDF作成中...' : '印刷'}`;
code = code.replace(printTextRegex, newPrintText);

fs.writeFileSync('src/pages/machines/MachineRegistry.tsx', code);
console.log("Refactored MachineRegistry.tsx to use backend PDF.");
