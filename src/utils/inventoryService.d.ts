import type { Part, NewPart } from '../types/inventory';
export declare const InventoryService: {
    getAll: () => Promise<Part[]>;
    getCategories: () => Promise<import("../types/inventory").ProductCategory[]>;
    getById: (id: number) => Promise<Part | undefined>;
    add: (part: NewPart) => Promise<Part>;
    update: (id: number, updates: Partial<Part>) => Promise<Part>;
    delete: (id: number) => Promise<boolean>;
    search: (query: string) => Promise<Part[]>;
};
