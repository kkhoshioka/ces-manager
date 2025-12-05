export type RepairStatus = 'received' | 'diagnosing' | 'in_progress' | 'completed' | 'delivered';

export interface Repair {
    id: string;
    customerName: string;
    machineModel: string;
    serialNumber: string;
    issueDescription: string;
    status: RepairStatus;
    receivedDate: string;
    completedDate?: string;
    notes?: string;
}

export type NewRepair = Omit<Repair, 'id' | 'receivedDate' | 'status'>;
