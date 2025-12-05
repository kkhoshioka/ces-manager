export interface Part {
    id: string;
    partNumber: string;
    name: string;
    description?: string;
    stock: number;
    price: number;
    location?: string;
    minStockLevel?: number;
}

export type NewPart = Omit<Part, 'id'>;
