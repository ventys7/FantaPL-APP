import React, { useEffect, useState } from 'react';
import { RulesService, AppRule } from '../services/rulesService';
import { Save, AlertCircle } from 'lucide-react';

export const AdminRules = () => {
    const [rules, setRules] = useState<AppRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            setLoading(true);
            const data = await RulesService.getAllRules();
            setRules(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key: string, newValue: any) => {
        try {
            setSuccessMsg('');
            setError('');
            // Optimistic update
            setRules(rules.map(r => r.key === key ? { ...r, value: newValue } : r));
            await RulesService.updateRule(key, newValue);
            setSuccessMsg(`Rule '${key}' updated!`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
            loadRules(); // Revert
        }
    };

    if (loading) return <div className="p-8 text-center text-pl-green animate-pulse">Loading Rules Engine...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Rules Configuration</h1>
                <p className="text-gray-400">Manage global scoring mechanics and app settings.</p>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6 flex items-center">
                    <AlertCircle className="mr-2" /> {error}
                </div>
            )}

            {successMsg && (
                <div className="bg-green-500/20 border border-green-500 text-green-200 p-4 rounded-lg mb-6 flex items-center">
                    <Save className="mr-2" /> {successMsg}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Scoring Rules Section */}
                <div className="bg-pl-card rounded-xl p-6 border border-gray-700 shadow-xl">
                    <h2 className="text-xl font-bold text-pl-green mb-4 border-b border-gray-700 pb-2">Scoring Multipliers</h2>
                    <div className="space-y-4">
                        {rules.filter(r => r.key.startsWith('scoring_')).map(rule => (
                            <div key={rule.key} className="flex items-center justify-between bg-pl-dark/50 p-3 rounded-lg">
                                <div>
                                    <div className="font-semibold text-gray-200 capitalize">
                                        {rule.key.replace('scoring_', '').replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-xs text-gray-500">{rule.description}</div>
                                </div>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={rule.value}
                                    onChange={(e) => handleUpdate(rule.key, parseFloat(e.target.value))}
                                    className="w-20 bg-pl-dark border border-gray-600 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-pl-green transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Mechanics Section */}
                <div className="bg-pl-card rounded-xl p-6 border border-gray-700 shadow-xl">
                    <h2 className="text-xl font-bold text-pl-blue mb-4 border-b border-gray-700 pb-2">Game Mechanics</h2>
                    <div className="space-y-4">
                        {rules.filter(r => !r.key.startsWith('scoring_')).map(rule => (
                            <div key={rule.key} className="flex items-center justify-between bg-pl-dark/50 p-3 rounded-lg">
                                <div>
                                    <div className="font-semibold text-gray-200 capitalize">
                                        {rule.key.replace('regulation_', '').replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-xs text-gray-500">{rule.description}</div>
                                </div>

                                {/* Boolean Toggle */}
                                <button
                                    onClick={() => handleUpdate(rule.key, String(rule.value) === 'true' ? 'false' : 'true')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${String(rule.value) === 'true' ? 'bg-pl-green' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${String(rule.value) === 'true' ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
