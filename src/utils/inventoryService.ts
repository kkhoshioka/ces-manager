import type { Part, NewPart } from '../types/inventory';

import { API_BASE_URL } from '../config';

export const InventoryService = {
    getAll: async (): Promise<Part[]> => {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch parts');
        return response.json();
    },

    getCategories: async (): Promise<import('../types/inventory').ProductCategory[]> => {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    },

    getPreviousMonthSnapshot: async (): Promise<Record<number, number>> => {
        const response = await fetch(`${API_BASE_URL}/inventory/previous-month`);
        if (!response.ok) throw new Error('Failed to fetch previous month snapshot');
        return response.json();
    },

    getById: async (id: number): Promise<Part | undefined> => {
        // We might need to implement GET /products/:id in backend if needed
        const parts = await InventoryService.getAll();
        return parts.find(p => p.id === id);
    },

    add: async (part: NewPart): Promise<Part> => {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(part),
        });
        if (!response.ok) throw new Error('Failed to add part');
        return response.json();
    },

    update: async (id: number, updates: Partial<Part>): Promise<Part> => {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update part');
        return response.json();
    },

    delete: async (id: number): Promise<boolean> => {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete part');
        return true;
    },

    search: async (query: string): Promise<Part[]> => {
        const allParts = await InventoryService.getAll();
        if (!query) return allParts;

        const lowerQuery = query.toLowerCase();
        return allParts.filter(part =>
            part.name.toLowerCase().includes(lowerQuery) ||
            part.code.toLowerCase().includes(lowerQuery) ||
            (part.partNumber && part.partNumber.toLowerCase().includes(lowerQuery))
        );
    },

    saveSnapshot: async (year: number, month: number): Promise<boolean> => {
        const response = await fetch(`${API_BASE_URL}/inventory/snapshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year, month }),
        });
        if (!response.ok) throw new Error('Failed to save snapshot');
        return true;
    },

    downloadSnapshotPdf: async (year: number, month: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/inventory/snapshot/${year}/${month}/pdf`);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to download PDF');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_snapshot_${year}_${month}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
