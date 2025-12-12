import type { Customer, CustomerMachine } from './customer';

export type RepairStatus = 'received' | 'diagnosing' | 'in_progress' | 'completed' | 'delivered';

export interface ProjectDetail {
    id: number;
    projectId: number;
    productId?: number | null;
    lineType: 'labor' | 'part' | 'outsourcing' | 'other' | 'travel';
    description: string;
    supplier?: string | null;
    remarks?: string | null;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    amountCost: number;
    amountSales: number;
    outsourcingCost: number;
}

export interface Repair {
    id: number;
    customerId: number;
    customerMachineId?: number | null;

    // Snapshot fields
    machineModel?: string | null;
    serialNumber?: string | null;

    orderDate?: string | null;
    completionDate?: string | null;
    status: RepairStatus;
    totalAmount: number;
    notes?: string | null;

    createdAt: string;
    updatedAt: string;

    customer?: Customer;
    customerMachine?: CustomerMachine;
    details?: ProjectDetail[];
}

export type NewRepair = {
    customerId: number;
    customerMachineId?: number;
    machineModel?: string;
    serialNumber?: string;
    issueDescription?: string; // Mapped to notes or description in details? Let's use notes for now or create a detail.
    notes?: string;
    status?: RepairStatus;
    details?: Omit<ProjectDetail, 'id' | 'projectId' | 'amountCost' | 'amountSales' | 'outsourcingCost'>[];
};
