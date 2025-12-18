import type { Repair, NewRepair, ProjectPhoto } from '../types/repair';
import { API_BASE_URL } from '../config';

export const RepairService = {
    getAll: async (): Promise<Repair[]> => {
        const response = await fetch(`${API_BASE_URL}/projects`);
        if (!response.ok) throw new Error('Failed to fetch repairs');
        return response.json();
    },

    getById: async (id: number): Promise<Repair | undefined> => {
        const response = await fetch(`${API_BASE_URL}/projects/${id}`);
        if (response.status === 404) return undefined;
        if (!response.ok) throw new Error('Failed to fetch repair');
        return response.json();
    },

    add: async (repair: NewRepair): Promise<Repair> => {
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(repair),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.details || error.error || 'Failed to add repair');
        }
        return response.json();
    },

    update: async (id: number, updates: Partial<Repair>): Promise<Repair> => {
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.details || error.error || 'Failed to update repair');
        }
        return response.json();
    },

    search: async (query: string): Promise<Repair[]> => {
        const allRepairs = await RepairService.getAll();
        if (!query) return allRepairs;

        const lowerQuery = query.toLowerCase();
        return allRepairs.filter(repair =>
            repair.customer?.name.toLowerCase().includes(lowerQuery) ||
            repair.machineModel?.toLowerCase().includes(lowerQuery) ||
            repair.serialNumber?.toLowerCase().includes(lowerQuery)
        );
    },

    uploadPhotos: async (id: number, formData: FormData): Promise<ProjectPhoto[]> => {
        const response = await fetch(`${API_BASE_URL}/projects/${id}/photos`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload photos');
        return response.json();
    },

    deletePhoto: async (photoId: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/photos/${photoId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete photo');
    },

    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete project');
    }
};
