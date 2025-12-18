export interface Supplier {
    id: number;
    code: string;
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    createdAt: string;
    updatedAt: string;
}
