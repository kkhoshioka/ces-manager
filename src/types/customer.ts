export interface Customer {
    id: number;
    code: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    createdAt: string;
    updatedAt: string;
    customerMachines?: CustomerMachine[];
}

export interface CustomerMachine {
    id: number;
    customerId: number;
    machineModel: string;
    serialNumber: string;
    purchaseDate?: string | null;
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
