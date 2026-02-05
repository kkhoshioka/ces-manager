import type { Repair, NewRepair, ProjectPhoto } from '../types/repair';
export declare const RepairService: {
    getAll: (options?: {
        limit?: number;
        search?: string;
    }) => Promise<Repair[]>;
    getById: (id: number) => Promise<Repair | undefined>;
    add: (repair: NewRepair) => Promise<Repair>;
    update: (id: number, updates: Partial<Repair>) => Promise<Repair>;
    search: (query: string) => Promise<Repair[]>;
    uploadPhotos: (id: number, formData: FormData) => Promise<ProjectPhoto[]>;
    deletePhoto: (photoId: number) => Promise<void>;
    delete: (id: number) => Promise<void>;
};
