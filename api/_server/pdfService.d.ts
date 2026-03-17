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
}
interface Customer {
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
