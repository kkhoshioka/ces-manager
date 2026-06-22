const fs = require('fs');
let code = fs.readFileSync('src/pages/machines/MachineRegistry.tsx', 'utf8');

// 1. Add imports
const importRegex = /import MachineForm from '\.\/MachineForm';/;
const importReplacement = `import MachineForm from './MachineForm';
import MachinePrintModal from './MachinePrintModal';
import PrintableMachineList from './PrintableMachineList';
import { Printer } from 'lucide-react';`;
code = code.replace(importRegex, importReplacement);

// 2. Add state
const stateRegex = /const \[isLoading, setIsLoading\] = useState\(true\);/;
const stateReplacement = `const [isLoading, setIsLoading] = useState(true);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [printData, setPrintData] = useState<CustomerMachine[]>([]);
    const [printTitle, setPrintTitle] = useState('');`;
code = code.replace(stateRegex, stateReplacement);

// 3. Add print execution function
const funcRegex = /const handleSave = \(\) => \{/;
const funcReplacement = `const handlePrintExecute = (machinesToPrint: CustomerMachine[], title: string) => {
        setPrintData(machinesToPrint);
        setPrintTitle(title);
        setIsPrintModalOpen(false);
        setIsPrinting(true);
        
        // Allow React to render the printable component, then print
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 300);
    };

    const handleSave = () => {`;
code = code.replace(funcRegex, funcReplacement);

// 4. Add Print button next to Add button
const headerRegex = /<Button icon=\{<Plus size=\{18\} \/>\} onClick=\{handleAdd\}>\r?\n\s*新規登録\r?\n\s*<\/Button>/;
const headerReplacement = `<div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button icon={<Printer size={18} />} onClick={() => setIsPrintModalOpen(true)} variant="outline">
                        印刷
                    </Button>
                    <Button icon={<Plus size={18} />} onClick={handleAdd}>
                        新規登録
                    </Button>
                </div>`;
code = code.replace(headerRegex, headerReplacement);

// 5. Add Modals and Printable component at the bottom
const bottomRegex = /\{isFormOpen && \(\r?\n\s*<MachineForm\r?\n\s*isOpen=\{isFormOpen\}\r?\n\s*onClose=\{\(\) => setIsFormOpen\(false\)\}\r?\n\s*onSave=\{handleSave\}\r?\n\s*machine=\{editingMachine\}\r?\n\s*\/>\r?\n\s*\)\}\r?\n\s*<\/div>/;
const bottomReplacement = `{isFormOpen && (
                <MachineForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                    machine={editingMachine}
                />
            )}

            <MachinePrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                currentFilteredMachines={sortedFilteredMachines}
                allMachines={machines}
                onPrintExecute={handlePrintExecute}
            />

            {isPrinting && (
                <PrintableMachineList 
                    machines={printData} 
                    printTitle={printTitle} 
                />
            )}
        </div>`;
code = code.replace(bottomRegex, bottomReplacement);

fs.writeFileSync('src/pages/machines/MachineRegistry.tsx', code);
console.log("MachineRegistry updated");
