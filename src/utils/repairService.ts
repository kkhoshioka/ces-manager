import type { Repair, NewRepair } from '../types/repair';

const STORAGE_KEY = 'ces_repairs';

export const RepairService = {
    getAll: (): Repair[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    getById: (id: string): Repair | undefined => {
        const repairs = RepairService.getAll();
        return repairs.find(r => r.id === id);
    },

    add: (repair: NewRepair): Repair => {
        const repairs = RepairService.getAll();
        const newRepair: Repair = {
            ...repair,
            id: crypto.randomUUID(),
            status: 'received',
            receivedDate: new Date().toISOString(),
        };

        repairs.push(newRepair);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(repairs));
        return newRepair;
    },

    update: (id: string, updates: Partial<Repair>): Repair | undefined => {
        const repairs = RepairService.getAll();
        const index = repairs.findIndex(r => r.id === id);

        if (index === -1) return undefined;

        const updatedRepair = { ...repairs[index], ...updates };
        repairs[index] = updatedRepair;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(repairs));
        return updatedRepair;
    },

    // Helper for search
    search: (query: string): Repair[] => {
        const repairs = RepairService.getAll();
        const lowerQuery = query.toLowerCase();
        return repairs.filter(r =>
            r.customerName.toLowerCase().includes(lowerQuery) ||
            r.machineModel.toLowerCase().includes(lowerQuery) ||
            r.serialNumber.toLowerCase().includes(lowerQuery)
        );
    }
};
