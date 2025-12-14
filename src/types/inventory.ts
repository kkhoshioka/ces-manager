export interface Part {
    id: number;
    code: string;
    name: string;
    category?: string | null;
    categoryId?: number | null;
    productCategory?: {
        id: number;
        name: string;
        section: string;
        code?: string | null;
    } | null;
    standardPrice: number;
    standardCost: number;
    stockQuantity: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProductCategory {
    id: number;
    section: string;
    name: string;
    code?: string | null;
    // children?: ProductCategory[]; // Removed hierarchical structure
}

export type NewPart = Omit<Part, 'id' | 'createdAt' | 'updatedAt'>;
