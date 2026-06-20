import React from 'react';
import type { CustomerMachine } from '../../types/customer';
interface PrintableMachineListProps {
    machines: CustomerMachine[];
    printTitle: string;
}
declare const PrintableMachineList: React.FC<PrintableMachineListProps>;
export default PrintableMachineList;
