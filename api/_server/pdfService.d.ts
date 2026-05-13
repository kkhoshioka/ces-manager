interface ProjectDetail {
    id?: number;
    description: string;
    quantity: number | string;
    unitPrice: number | string;
    lineType?: string;
    date?: string | Date;
    travelType?: string;
    outsourcingDetailType?: string;
    laborType?: string;
    machineModel?: string | null;
    serialNumber?: string | null;
    rentalStartDate?: string | Date | null;
    rentalEndDate?: string | Date | null;
    rentalBillingType?: string | null;
    rentalBasicFee?: number | string;
    rentalCompensationDays?: number | string;
    rentalCompensationFee?: number | string;
}
interface Customer {
    code?: string;
    name: string;
}
interface Project {
    id: number | string;
    customer: Customer;
    machineModel: string;
    serialNumber: string;
    customerContactName?: string | null;
    details: ProjectDetail[];
    notes?: string;
    createdAt?: Date | string | null;
    completionDate?: Date | string | null;
}
export declare const generateInvoice: (project: Project) => PDFKit.PDFDocument;
export declare const generateDeliveryNote: (project: Project) => PDFKit.PDFDocument;
export declare const generateQuotation: (project: Project) => PDFKit.PDFDocument;
export {};
