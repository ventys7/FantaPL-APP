import { useState } from 'react';
import { functions } from '../lib/appwrite';
import { RefreshCw, CheckCircle, XCircle, Activity, Terminal, Database, Server, Shield, Users, Trash2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logger } from '../lib/logger';

export function AdminSystem() {
    const { hasRole } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [log, setLog] = useState<{ type: 'success' | 'error' | 'info'; message: string }[]>([]);

    // Function IDs
    const PL_FUNCTION_ID = '69592373002208d6dd31'; // fetch_pl_data
    const PLAYERS_FUNCTION_ID = '695afdb40034ed9a82d7'; // sync_players
    const RESET_SQUADS_FUNCTION_ID = 'reset_squads'; // TODO: Update with actual ID

    const executeFunction = async (funcId: string, action: string, season?: number) => {
        setLoading(action);
        addLog('info', `Executing ${action}...`);

        try {
            const execution = await functions.createExecution(
                funcId,
                JSON.stringify({ action, season }),
                true // Async = true
            );

            addLog('info', `Avviato: ${execution.$id}. Status: ${execution.status}`);

            if (execution.status === 'completed') {
                const response = execution.responseBody ? JSON.parse(execution.responseBody) : {};
                if (response.success) {
                    addLog('success', `${action} Completed: ${response.processed || response.teamsProcessed || 0} items.`);
                } else {
                    addLog('error', `${action} Failed: ${response.error}`);
                }
            } else {
                addLog('success', `${action} Inserito in coda (background).`);
            }

        } catch (error: any) {
            logger.error('Function execution failed:', error);
            addLog('error', `Errore: ${error.message}`);
        } finally {
            setLoading(null);
        }
    };

    const addLog = (type: 'success' | 'error' | 'info', message: string) => {
        setLog(prev => [{ type, message }, ...prev]);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">

            {/* Header Section */}
            <div className="flex flex-col items-center text-center gap-2 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-3">
                    <Server className="text-pl-teal w-8 h-8" />
                    Sistema
                </h1>
                <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">Gestione sincronizzazione dati e integrazioni.</p>
            </div>

            {/* Control Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* TEAMS CARD - BLUE Theme */}
                <div className="relative group overflow-hidden bg-gradient-to-b from-[#1e1e24] to-[#121214] border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-300 shadow-xl lg:hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                            <Shield size={24} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">Squadre</h3>
                        <p className="text-sm text-gray-400 mb-6 h-12 leading-relaxed">
                            Sincronizza i dati ufficiali delle squadre Premier League (nomi, stemma, stadio).
                        </p>

                        <button
                            onClick={() => executeFunction(PL_FUNCTION_ID, 'SYNC_TEAMS', 2025)}
                            disabled={!!loading}
                            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading === 'SYNC_TEAMS' ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            Sync Dati 2025/26
                        </button>
                    </div>
                </div>

                {/* PLAYERS CARD - TEAL Theme */}
                <div className="relative group overflow-hidden bg-gradient-to-b from-[#1e1e24] to-[#121214] border border-white/5 rounded-3xl p-6 hover:border-pl-teal/30 transition-all duration-300 shadow-xl lg:hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-32 bg-pl-teal/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-pl-teal/10 transition-colors" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-pl-teal/10 flex items-center justify-center mb-4 border border-pl-teal/20 text-pl-teal group-hover:scale-110 transition-transform duration-300">
                            <Users size={24} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors">Giocatori</h3>
                        <p className="text-sm text-gray-400 mb-6 h-12 leading-relaxed">
                            Sincronizza il database giocatori da FotMob mantenendo i dati del Fantacalcio.
                        </p>

                        <button
                            onClick={() => executeFunction(PLAYERS_FUNCTION_ID, 'SYNC_PLAYERS')}
                            disabled={!!loading}
                            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-pl-teal to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-pl-dark shadow-lg shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading === 'SYNC_PLAYERS' ? <RefreshCw className="animate-spin" size={18} /> : <Database size={18} />}
                            Sync Listone
                        </button>
                    </div>
                </div>



            </div>

            {/* Terminal Logs */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0d0d0f] border border-white/10 shadow-2xl">
                <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <Terminal size={16} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">System Output</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        <button onClick={() => setLog([])} className="text-[10px] font-medium text-gray-500 hover:text-white transition px-2 py-0.5 rounded bg-white/5 uppercase">Clear</button>
                    </div>
                </div>

                <div className="p-4 h-72 overflow-y-auto font-mono text-xs md:text-sm space-y-1.5 custom-scrollbar bg-black/50">
                    {log.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 select-none">
                            <Terminal size={40} className="mb-3 opacity-20" />
                            <p className="bg-white/5 px-3 py-1 rounded text-xs ">In attesa di comandi...</p>
                        </div>
                    )}
                    {log.map((entry, i) => (
                        <div key={i} className={`flex items-start gap-3 p-2 rounded ${entry.type === 'success' ? 'text-emerald-400 bg-emerald-500/5 border-l-2 border-emerald-500/50' :
                            entry.type === 'error' ? 'text-red-400 bg-red-500/5 border-l-2 border-red-500/50' :
                                'text-blue-300 bg-blue-500/5 border-l-2 border-blue-500/50'
                            } animate-in fade-in slide-in-from-left-2 duration-300`}>
                            <span className="mt-0.5 opacity-70 shrink-0">
                                {entry.type === 'success' ? <CheckCircle size={14} /> :
                                    entry.type === 'error' ? <XCircle size={14} /> :
                                        <Activity size={14} />}
                            </span>
                            <span className="break-all leading-relaxed">{entry.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
