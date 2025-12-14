
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserRole = 'admin' | 'staff' | null;

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Init Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (currentUser: User) => {
        try {
            const { data, error } = await supabase
                .from('Profile')
                .select('role')
                .eq('id', currentUser.id)
                .single();

            if (error || !data) {
                console.warn('Profile not found, creating default profile...');
                // Auto-create profile
                const { error: insertError } = await supabase
                    .from('Profile')
                    .insert([
                        {
                            id: currentUser.id,
                            email: currentUser.email,
                            role: 'staff' // Default role
                        }
                    ]);

                if (insertError) {
                    console.error('Failed to create profile:', insertError);
                    setRole('staff'); // Fallback
                } else {
                    setRole('staff');
                }
            } else {
                setRole(data.role as UserRole);
            }
        } catch (err) {
            console.error(err);
            setRole('staff');
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        role,
        loading,
        isAdmin: role === 'admin',
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
