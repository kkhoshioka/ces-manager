import type { Customer, NewCustomer, CustomerMachine, NewCustomerMachine } from '../types/customer';
export declare const customerService: {
    getAllCustomers(): Promise<Customer[]>;
    createCustomer(customer: NewCustomer): Promise<Customer>;
    getAllMachines(): Promise<CustomerMachine[]>;
    createMachine(machine: NewCustomerMachine): Promise<CustomerMachine>;
    updateMachine(id: number, machine: Partial<NewCustomerMachine> & {
        customerId: number;
    }): Promise<CustomerMachine>;
};
