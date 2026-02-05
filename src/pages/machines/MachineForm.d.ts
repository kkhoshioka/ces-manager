import React from 'react';
import type { CustomerMachine } from '../../types/customer';
interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    machine?: CustomerMachine;
}
declare const MachineForm: React.FC<Props>;
export default MachineForm;
