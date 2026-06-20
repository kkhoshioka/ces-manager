import React from 'react';
import type { CustomerMachine } from '../../types/customer';
interface MachinePrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilteredMachines: CustomerMachine[];
    allMachines: CustomerMachine[];
    onPrintExecute: (machinesToPrint: CustomerMachine[], printTitle: string) => void;
}
declare const MachinePrintModal: React.FC<MachinePrintModalProps>;
export default MachinePrintModal;
