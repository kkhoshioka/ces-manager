import type { Part, NewPart } from '../types/inventory';

const STORAGE_KEY = 'ces_inventory';

export const InventoryService = {
    getAll: (): Part[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    getById: (id: string): Part | undefined => {
        const parts = InventoryService.getAll();
        return parts.find(p => p.id === id);
    },

    add: (part: NewPart): Part => {
        const parts = InventoryService.getAll();
        const newPart: Part = {
            ...part,
            id: crypto.randomUUID(),
        };

        parts.push(newPart);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
        return newPart;
    },

    update: (id: string, updates: Partial<Part>): Part | undefined => {
        const parts = InventoryService.getAll();
        const index = parts.findIndex(p => p.id === id);

        if (index === -1) return undefined;

        const updatedPart = { ...parts[index], ...updates };
        parts[index] = updatedPart;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
        return updatedPart;
    },

    delete: (id: string): boolean => {
        const parts = InventoryService.getAll();
        const filteredParts = parts.filter(p => p.id !== id);

        if (parts.length === filteredParts.length) return false;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredParts));
        return true;
    },

    search: (query: string): Part[] => {
        const parts = InventoryService.getAll();
        const lowerQuery = query.toLowerCase();
        return parts.filter(p =>
            p.partNumber.toLowerCase().includes(lowerQuery) ||
            p.name.toLowerCase().includes(lowerQuery)
        );
    }
};
