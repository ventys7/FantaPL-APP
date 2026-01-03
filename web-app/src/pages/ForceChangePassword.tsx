import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account, databases, DB_ID, COLL_FANTASY_TEAMS } from '../lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle } from 'lucide-react';

export function ForceChangePassword() {
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Le password non coincidono');
            return;
        }

        if (password.length < 8) {
            setError('La password deve essere di almeno 8 caratteri');
            return;
        }

        setLoading(true);

        try {
            // If old password is required by security policy (likely "Invalid credentials" cause)
            // We should have asked for it. 
            // For now, let's assume we need to handle it.
            // ERROR "Invalid credentials" usually implies re-authentication failure internal to updatePassword check.

            // NOTE: Appwrite Client SDK updatePassword(new, old). 
            // If we don't pass old, it might fail if session is considered sensitive.
            // Let's TRY passing just new. If fails, we probably need 'old'. 
            // Better UX: Ask for Old Password?
            // User complained "Invalid credentials".

            await account.updatePassword(password, oldPassword);

            // 1. Update Appwrite Prefs (Good practice, though we rely on DB)
            const user = await account.get();
            await account.updatePrefs({ ...user.prefs, force_pass_reset: false });

            // 2. CRITICAL: Update the Database Document where AuthContext actually reads the flag
            // We need to find the document first.
            // Since we are logged in, we can query by user_id
            const docs = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [
                Query.equal('user_id', user.$id)
            ]);

            if (docs.documents.length > 0) {
                await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, docs.documents[0].$id, {
                    force_pass_reset: false
                });
            }

            alert('Password aggiornata con successo! Effettua nuovamente l\'accesso.');
            await logout();
            navigate('/login');
        } catch (error: any) {
            console.error('Password update failed:', error);
            setError(error.message || 'Errore durante l\'aggiornamento della password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-pl-dark px-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                    <Lock className="w-16 h-16 text-pl-teal mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Cambio Password</h1>
                    <p className="text-gray-300">È richiesto un cambio password per sicurezza.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                            Vecchia Password (Attuale)
                        </label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pl-teal"
                            placeholder="La password che hai appena usato"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                            Nuova Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pl-teal"
                            placeholder="Minimo 8 caratteri"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                            Conferma Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pl-teal"
                            placeholder="Ripeti la password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 text-red-200 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-pl-teal to-pl-green text-pl-dark font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
                    </button>

                    <div className="text-center text-xs text-gray-500 mt-4">
                        Non puoi ignorare questo passaggio.
                    </div>
                </form>
            </div>
        </div>
    );
}
