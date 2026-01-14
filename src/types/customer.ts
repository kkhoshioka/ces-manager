export interface Customer {
    id: number;
    code: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    type?: string | null;
    fax?: string | null;
    invoiceRegistrationNumber?: string | null;
    invoiceMailingAddress?: string | null;
    paymentTerms?: string | null;
    contactPerson?: string | null;
    createdAt: string;
    updatedAt: string;
    customerMachines?: CustomerMachine[];
}

export interface CustomerMachine {
    id: number;
    customerId: number;
    machineModel: string;
    serialNumber: string;
    hourMeter?: string | null;
    manufacturingDate?: string | null; // YYYY-MM
    deliveryDate?: string | null;
    lastInspectionDate?: string | null;
    nextInspectionDate?: string | null;
    notes?: string | null;
    productCategoryId?: number | null;
    category?: {
        id: number;
        section: string;
        code?: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
    customer?: Customer;
}

export type NewCustomer = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'customerMachines'>;
export type NewCustomerMachine = Omit<CustomerMachine, 'id' | 'createdAt' | 'updatedAt' | 'customer'>;
