import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Shield, Loader2 } from 'lucide-react';
import { RealTeam, Manager } from './types';
import { Player } from '../../../hooks/usePlayers';

interface AdminBlockModalProps {
    isOpen: boolean;
    realTeams: RealTeam[];
    managers: Manager[];
    onClose: () => void;
    onSaveBlock: (teamId: string, ownerId: string | null, quotation: number, purchasePrice: number) => Promise<void>;
    onUpdateTeamLocal: (teamId: string, updates: Partial<RealTeam>) => void;
    getGKsByTeam: (teamId: string) => Player[];
}

export const AdminBlockModal = ({
    isOpen,
    realTeams,
    managers,
    onClose,
    onSaveBlock,
    onUpdateTeamLocal,
    getGKsByTeam
}: AdminBlockModalProps) => {
    const [openTeamId, setOpenTeamId] = useState<string | null>(null);

    if (!isOpen) return null;

    // Sorting teams alphabetically by short_name
    const sortedTeams = [...realTeams].sort((a, b) => (a.short_name || '').localeCompare(b.short_name || ''));

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Shield className="text-pl-teal" size={20} />
                            Blocchi Portieri
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">Assegna l'intero reparto portieri a un manager.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-4 md:p-6 overflow-y-auto space-y-4 max-h-[70vh]">
                    {sortedTeams.map(team => {
                        const isOpen = openTeamId === team.$id;
                        const teamGKs = getGKsByTeam(team.$id);

                        return (
                            <div key={team.$id} className="bg-[#1e1e24] border border-white/5 rounded-xl overflow-hidden shadow-lg transition-all hover:border-white/10">
                                {/* Header Row (Always Visible) */}
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition"
                                    onClick={() => setOpenTeamId(isOpen ? null : team.$id)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* PROPER TEAM LOGO or Fallback */}
                                        <div className="w-10 h-10 flex-shrink-0">
                                            {team.logo_url ? (
                                                <img
                                                    src={team.logo_url}
                                                    alt={team.short_name}
                                                    className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center font-bold text-gray-500 text-xs shadow-inner">
                                                    {team.short_name ? team.short_name.substring(0, 3) : team.name.substring(0, 3)}
                                                </div>
                                            )}
                                        </div>

                                        {/* SHORT NAME ONLY */}
                                        <div>
                                            <h3 className="text-white font-bold text-lg tracking-wide">{team.short_name || team.name}</h3>
                                            <div className="text-xs text-gray-400 mt-0.5 font-medium">
                                                {teamGKs.length} Portieri
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-white/10' : ''}`}>
                                        <ChevronDown size={20} className="text-gray-400" />
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isOpen && (
                                    <div className="p-4 border-t border-white/5 bg-black/20 space-y-6 animate-in slide-in-from-top-2 duration-200">

                                        {/* Management Controls */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                            {/* Owner Select */}
                                            <div className="md:col-span-6 space-y-1.5">
                                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Proprietario Blocco</label>
                                                <select
                                                    value={team.goalkeeper_owner || ''}
                                                    onChange={(e) => onSaveBlock(team.$id, e.target.value || null, team.goalkeeper_quotation || 0, team.goalkeeper_purchase_price || 0)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-pl-teal outline-none transition"
                                                >
                                                    <option value="">-- Svincolato --</option>
                                                    {managers.map(m => (
                                                        <option key={m.id} value={m.name}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Quotation */}
                                            <div className="md:col-span-3 space-y-1.5">
                                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Quot. Totale</label>
                                                <input
                                                    type="number"
                                                    value={team.goalkeeper_quotation || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                        onUpdateTeamLocal(team.$id, { goalkeeper_quotation: val });
                                                    }}
                                                    onBlur={(e) => onSaveBlock(team.$id, team.goalkeeper_owner || null, parseInt(e.target.value) || 0, team.goalkeeper_purchase_price || 0)}
                                                    onClick={e => e.stopPropagation()}
                                                    placeholder="0"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-pl-teal outline-none font-mono text-center"
                                                />
                                            </div>

                                            {/* Price */}
                                            <div className="md:col-span-3 space-y-1.5">
                                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Prezzo Asta</label>
                                                <input
                                                    type="number"
                                                    value={team.goalkeeper_purchase_price || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                        onUpdateTeamLocal(team.$id, { goalkeeper_purchase_price: val });
                                                    }}
                                                    onBlur={(e) => onSaveBlock(team.$id, team.goalkeeper_owner || null, team.goalkeeper_quotation || 0, parseInt(e.target.value) || 0)}
                                                    onClick={e => e.stopPropagation()}
                                                    placeholder="0"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-pl-teal font-bold focus:border-pl-teal outline-none font-mono text-center"
                                                />
                                            </div>
                                        </div>

                                        {/* GK List */}
                                        <div>
                                            <h4 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-2 flex items-center gap-2">
                                                <Shield size={10} />
                                                Portieri Inclusi
                                            </h4>
                                            <div className="space-y-2">
                                                {teamGKs.map(p => (
                                                    <div key={p.$id} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_4px_currentColor]`}></div>
                                                            <span className={`text-sm ${!p.is_active ? 'text-gray-500 italic line-through' : 'text-gray-300'}`}>{p.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {teamGKs.length === 0 && <div className="text-xs text-gray-600 italic">Nessun portiere trovato.</div>}
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>, document.body
    );
};
