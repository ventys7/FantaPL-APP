import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, DB_ID, COLL_FANTASY_TEAMS } from '../lib/appwrite';
import { User, UserRole } from '../types/shared';
import { AppwriteException, Query } from 'appwrite';
import { logger } from '../lib/logger';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const fetchUserProfile = async (authUser: any): Promise<User> => {
        try {
            // Fetch the user's profile from the fantasy_teams collection
            const response = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [
                Query.equal('user_id', authUser.$id)
            ]);

            if (response.documents.length > 0) {
                const doc = response.documents[0];
                return {
                    ...authUser,
                    prefs: {
                        ...authUser.prefs,
                        role: doc.role as UserRole,
                        teamId: doc.$id,
                        avatar: doc.logo_url, // Assuming logo_url exists or will exist
                        force_pass_reset: doc.force_pass_reset,
                        hidden: doc.hidden
                    }
                } as User;
            }
        } catch (error) {
            logger.error('Error fetching user profile:', error);
        }

        // Fallback if no profile found
        return authUser as unknown as User;
    };

    const checkSession = async () => {
        try {
            const sessionUser = await account.get();
            const fullUser = await fetchUserProfile(sessionUser);

            // SECURITY CHECK: If account is disabled (hidden), force logout
            if (fullUser.prefs?.hidden) {
                logger.warn('Account disabled, forcing logout');
                await logout();
                throw new Error('Account disabilitato');
            }

            setUser(fullUser);
        } catch (error) {
            logger.info('No active session or account disabled');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const email = username.includes('@') ? username : `${username.toLowerCase().replace(/\s+/g, '')}@fantapl.app`;

            await account.createEmailPasswordSession(email, password);
            const sessionUser = await account.get();
            const fullUser = await fetchUserProfile(sessionUser);

            // SECURITY CHECK: If account is disabled
            if (fullUser.prefs?.hidden) {
                await logout();
                return { success: false, error: 'Account disabilitato dal gestore' };
            }

            setUser(fullUser);
            return { success: true };
        } catch (error) {
            logger.error('Login failed:', error);
            const appwriteError = error as AppwriteException;
            return {
                success: false,
                error: appwriteError.message || 'Credenziali non valide'
            };
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
    };

    const hasRole = (role: UserRole): boolean => {
        if (!user || !user.prefs?.role) return false;

        const userRole = user.prefs.role;

        // Admin has access to everything
        if (userRole === 'admin') return true;

        // Helper has access to helper and user stuff
        if (role === 'helper') return userRole === 'helper';

        // User role check
        if (role === 'user') return true; // Everyone is at least user

        return false;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
