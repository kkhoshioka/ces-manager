export interface Part {
    id: number;
    code: string;
    partNumber?: string;
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
    unit?: string | null;
    alertEnabled?: boolean;
    alertThreshold?: number;
    createdAt: string;
    updatedAt: string;
}
export interface ProductCategory {
    id: number;
    section: string;
    name: string;
    code?: string | null;
}
export type NewPart = Omit<Part, 'id' | 'createdAt' | 'updatedAt'>;
