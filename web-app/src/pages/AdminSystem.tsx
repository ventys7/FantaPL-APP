import { useState } from 'react';
import { functions } from '../lib/appwrite';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { logger } from '../lib/logger';

export function AdminSystem() {
    const [loading, setLoading] = useState<string | null>(null);
    const [log, setLog] = useState<{ type: 'success' | 'error' | 'info'; message: string }[]>([]);

    const FUNCTION_ID = '69592373002208d6dd31'; // User provided ID

    const executeFunction = async (action: string, season?: number) => {
        setLoading(action);
        addLog('info', `Executing ${action}...`);

        try {
            const execution = await functions.createExecution(
                FUNCTION_ID,
                JSON.stringify({ action, season }),
                false // Async = false to wait for result
            );

            if (execution.status === 'completed') {
                const response = JSON.parse(execution.responseBody);
                if (response.success) {
                    addLog('success', `${action} Completed: ${response.processed} processed, ${response.errors} errors.`);
                    if (response.details && response.details.length > 0) {
                        response.details.forEach((det: string) => addLog('error', `Detail: ${det}`));
                    }
                } else {
                    addLog('error', `${action} Failed: ${response.error}`);
                }
            } else {
                addLog('error', `${action} Status: ${execution.status}`);
            }
        } catch (error: any) {
            logger.error('Function execution failed:', error);
            addLog('error', `Execution Error: ${error.message}`);
        } finally {
            setLoading(null);
        }
    };

    const addLog = (type: 'success' | 'error' | 'info', message: string) => {
        setLog(prev => [{ type, message }, ...prev]);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <RefreshCw className="text-pl-teal" />
                System Sync
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Sync Teams Card */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-2">Sync Teams</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Fetch team data (names, crests) from API.
                        <br />
                        <span className="text-yellow-400 text-xs">Fixes missing teams (Aston Villa, etc)</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => executeFunction('SYNC_TEAMS', 2025)}
                            disabled={!!loading}
                            className="bg-pl-teal hover:bg-pl-teal/80 text-pl-dark font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                        >
                            {loading === 'SYNC_TEAMS' && <RefreshCw className="animate-spin w-4 h-4" />}
                            Sync 2025/26
                        </button>
                    </div>
                </div>

                {/* Sync Fixtures Card */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-2">Sync Fixtures</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Fetch matches and live scores.
                        <br />
                        <span className="text-yellow-400 text-xs">Updates minutes and status</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => executeFunction('SYNC_FIXTURES')}
                            disabled={!!loading}
                            className="bg-pl-purple hover:bg-pl-purple/80 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                        >
                            {loading === 'SYNC_FIXTURES' && <RefreshCw className="animate-spin w-4 h-4" />}
                            Sync Fixtures
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Area */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2 sticky top-0 bg-black/40 backdrop-blur pb-2">Execution Logs</h3>
                {log.length === 0 && <p className="text-gray-600 italic">No logs yet.</p>}
                {log.map((entry, i) => (
                    <div key={i} className={`flex items-start gap-2 mb-2 ${entry.type === 'success' ? 'text-green-400' :
                        entry.type === 'error' ? 'text-red-400' : 'text-blue-300'
                        }`}>
                        {entry.type === 'success' ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> :
                            entry.type === 'error' ? <XCircle size={14} className="mt-0.5 shrink-0" /> :
                                <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                        <span>{entry.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
