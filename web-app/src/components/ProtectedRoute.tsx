import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/shared';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pl-dark">
                <div className="text-white text-xl">Caricamento...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Force Password Reset Check
    if (user.prefs?.force_pass_reset && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    if (requiredRole && requiredRole === 'admin' && user.prefs?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pl-dark px-4">
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-2">Accesso Negato</h2>
                    <p className="text-gray-300">Questa pagina richiede privilegi di amministratore.</p>
                </div>
            </div>
        );
    }

    if (requiredRole && requiredRole === 'helper' && user.prefs?.role !== 'helper' && user.prefs?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pl-dark px-4">
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-2">Accesso Negato</h2>
                    <p className="text-gray-300">Questa pagina richiede privilegi di helper o admin.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
