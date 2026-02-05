import type { Customer, CustomerMachine } from './customer';
export type RepairStatus = 'received' | 'diagnosing' | 'in_progress' | 'completed' | 'delivered';
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
    type?: 'repair' | 'sales' | 'inspection' | 'maintenance';
    machineModel?: string | null;
    serialNumber?: string | null;
    hourMeter?: string | null;
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
    photos?: ProjectPhoto[];
}
export type NewRepair = {
    customerId: number;
    customerMachineId?: number;
    machineModel?: string;
    serialNumber?: string;
    hourMeter?: string;
    issueDescription?: string;
    notes?: string;
    type?: 'repair' | 'sales';
    status?: RepairStatus;
    details?: Omit<ProjectDetail, 'id' | 'projectId' | 'amountCost' | 'amountSales' | 'outsourcingCost'>[];
};
