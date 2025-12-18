import { API_BASE_URL } from '../config';

export const supplierService = {
    async getAllSuppliers() {
        const response = await fetch(`${API_BASE_URL}/suppliers`);
        if (!response.ok) throw new Error('Failed to fetch suppliers');
        return response.json();
    },

    async createSupplier(name: string) {
        const response = await fetch(`${API_BASE_URL}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                code: `S${Date.now()}` // Auto-generate simple code
            }),
        });
        if (!response.ok) throw new Error('Failed to create supplier');
        return response.json();
    }
};
