export interface Part {
    id: number;
    code: string;
    name: string;
    category?: string | null;
    standardPrice: number;
    standardCost: number;
    stockQuantity: number;
    createdAt: string;
    updatedAt: string;
}

export type NewPart = Omit<Part, 'id' | 'createdAt' | 'updatedAt'>;
