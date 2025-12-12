import type { Customer, NewCustomer, CustomerMachine, NewCustomerMachine } from '../types/customer';

const API_BASE_URL = 'http://localhost:3000/api';

export const customerService = {
    async getAllCustomers(): Promise<Customer[]> {
        const response = await fetch(`${API_BASE_URL}/customers`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        return response.json();
    },

    async createCustomer(customer: NewCustomer): Promise<Customer> {
        const response = await fetch(`${API_BASE_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer),
        });
        if (!response.ok) throw new Error('Failed to create customer');
        return response.json();
    },

    async getAllMachines(): Promise<CustomerMachine[]> {
        const response = await fetch(`${API_BASE_URL}/machines`);
        if (!response.ok) throw new Error('Failed to fetch machines');
        return response.json();
    },

    async createMachine(machine: NewCustomerMachine): Promise<CustomerMachine> {
        const response = await fetch(`${API_BASE_URL}/machines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(machine),
        });
        if (!response.ok) throw new Error('Failed to create machine');
        return response.json();
    }
};
