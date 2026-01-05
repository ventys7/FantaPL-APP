import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { logger } from './lib/logger';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar'; // Keep for now or remove if unused. Layout uses it.
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Fixtures } from './pages/Fixtures';
import { Players } from './pages/Players';
import { Login } from './pages/Login';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Lazy Loaded Components
const Rules = lazy(() => import('./pages/Rules').then(module => ({ default: module.Rules })));
const VoteEntry = lazy(() => import('./pages/VoteEntry').then(module => ({ default: module.VoteEntry })));
const ForceChangePassword = lazy(() => import('./pages/ForceChangePassword').then(module => ({ default: module.ForceChangePassword })));
const AdminLayout = lazy(() => import('./components/AdminLayout').then(module => ({ default: module.AdminLayout })));
const ParticipantManagement = lazy(() => import('./pages/ParticipantManagement').then(module => ({ default: module.ParticipantManagement })));


function AdminIndex() {
    const { hasRole } = useAuth();
    if (hasRole('admin')) return <Navigate to="participants" replace />;
    return <Navigate to="votes" replace />;
}

// Redirect Handler to restore path from 404.html
function RedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const path = params.get('p');
        const query = params.get('q');

        if (path) {
            // Decode path in case it was encoded
            const decodedPath = decodeURIComponent(path);
            logger.debug('[RedirectHandler] Restoring path:', decodedPath);

            // Reconstruct the full path
            const targetPath = decodedPath + (query ? `?${query}` : '');

            // Replace current entry to avoid back-button loops
            navigate(targetPath, { replace: true });
        }
    }, [location, navigate]);

    return null;
}

// Loading Spinner for Suspense
const LoadingSpinner = () => (
    <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pl-teal" />
    </div>
);

function App() {
    return (
        <AuthProvider>
            <Router basename="/FantaPL-APP/">
                <RedirectHandler />
                <ErrorBoundary>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route element={<Layout />}>
                                <Route path="/" element={<Home />} />
                                <Route path="/dashboard" element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                } />
                                <Route path="/fixtures" element={<Fixtures />} />
                                <Route path="/players" element={<Players />} />
                                <Route path="/rules" element={<Rules />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/change-password" element={
                                    <ProtectedRoute>
                                        <ForceChangePassword />
                                    </ProtectedRoute>
                                } />

                                {/* Admin Routes */}
                                <Route path="/admin" element={
                                    <ProtectedRoute requiredRole="helper">
                                        <AdminLayout />
                                    </ProtectedRoute>
                                }>
                                    <Route index element={<AdminIndex />} />
                                    <Route path="participants" element={
                                        <ProtectedRoute requiredRole="admin">
                                            <ParticipantManagement />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="votes" element={<VoteEntry />} />

                                </Route>
                            </Route>
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </Router>
        </AuthProvider>
    );
}

export default App;
