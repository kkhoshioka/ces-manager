import type { Customer, CustomerMachine } from './customer';

export type RepairStatus = 'received' | 'estimating' | 'diagnosing' | 'completed';

export interface ProjectDetail {
    id: number;
    projectId: number;
    productId?: number | null;
    lineType: 'labor' | 'part' | 'outsourcing' | 'other' | 'travel';
    description: string;
    supplier?: string | null;
    supplierId?: number | null;
    remarks?: string | null;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    amountCost: number;
    amountSales: number;
    outsourcingCost: number;
    outsourcingDetailType?: string | null;
    laborType?: string | null;
}

export interface ProjectPhoto {
    id: number;
    projectId: number;
    filePath: string;
    fileName: string;
    description?: string | null;
    uploadedAt: string;
}

export interface Repair {
    id: number;
    customerId: number;
    customerMachineId?: number | null;
    type?: 'repair' | 'sales' | 'inspection' | 'maintenance'; // Added project type

    // Snapshot fields
    machineModel?: string | null;
    serialNumber?: string | null;
    hourMeter?: string | null;

    orderDate?: string | null;
    completionDate?: string | null;
    status: RepairStatus;
    totalAmount: number;
    notes?: string | null;

    // Status flags
    isInvoiceIssued?: boolean;
    isDeliveryNoteIssued?: boolean;
    isPaymentReceived?: boolean;

    createdAt: string;
    updatedAt: string;

    customer?: Customer;
    customerMachine?: CustomerMachine;
    details?: ProjectDetail[];
    photos?: ProjectPhoto[];
}

export type NewRepair = {
    customerId: number;
    customerMachineId?: number;
    machineModel?: string;
    serialNumber?: string;
    hourMeter?: string;
    issueDescription?: string; // Mapped to notes or description in details? Let's use notes for now or create a detail.
    notes?: string;
    type?: 'repair' | 'sales';
    status?: RepairStatus;
    details?: Omit<ProjectDetail, 'id' | 'projectId' | 'amountCost' | 'amountSales' | 'outsourcingCost'>[];
};
