import React from 'react';
import type { Session, User } from '@supabase/supabase-js';
type UserRole = 'admin' | 'staff' | null;
interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}
export declare const AuthProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useAuth: () => AuthContextType;
export {};
