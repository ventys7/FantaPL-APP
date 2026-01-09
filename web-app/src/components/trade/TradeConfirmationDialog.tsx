import { Loader2, Send } from 'lucide-react';

interface TradeConfirmationDialogProps {
    isOpen: boolean;
    loading: boolean;
    mySelectedPlayers: any[];
    mySelectedBlocks: any[];
    opponentSelectedPlayers: any[];
    opponentSelectedBlocks: any[];
    creditsOffered: number;
    onClose: () => void;
    onConfirm: () => void;
}

export const TradeConfirmationDialog = ({
    isOpen,
    loading,
    mySelectedPlayers,
    mySelectedBlocks,
    opponentSelectedPlayers,
    opponentSelectedBlocks,
    creditsOffered,
    onClose,
    onConfirm
}: TradeConfirmationDialogProps) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-10 animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-white/20 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Conferma Proposta</h3>

                {/* Offer section */}
                <div className="mb-3">
                    <div className="text-xs uppercase font-bold text-red-400 mb-2">Offri</div>
                    <div className="space-y-1 text-sm">
                        {mySelectedPlayers.map(p => (
                            <div key={p.$id} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.position === 'Difensore' ? 'bg-blue-500/30 text-blue-400' : p.position === 'Centrocampista' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'}`}>
                                    {p.position === 'Difensore' ? 'D' : p.position === 'Centrocampista' ? 'C' : 'A'}
                                </span>
                                <span className="text-white">{p.name}</span>
                            </div>
                        ))}
                        {mySelectedBlocks.map(team => (
                            <div key={team.$id} className="flex items-center gap-2 bg-yellow-500/10 px-2 py-1 rounded text-yellow-400">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/30">P</span>
                                Blocco {team?.short_name || 'Squadra'}
                            </div>
                        ))}
                        {creditsOffered > 0 && (
                            <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded text-green-400">
                                💰 +{creditsOffered} crediti
                            </div>
                        )}
                        {mySelectedPlayers.length === 0 && mySelectedBlocks.length === 0 && creditsOffered <= 0 && (
                            <span className="text-gray-500 italic text-xs">Nessun giocatore o credito offerto</span>
                        )}
                    </div>
                </div>

                {/* Request section */}
                <div className="mb-4">
                    <div className="text-xs uppercase font-bold text-green-400 mb-2">Richiedi</div>
                    <div className="space-y-1 text-sm">
                        {opponentSelectedPlayers.map(p => (
                            <div key={p.$id} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.position === 'Difensore' ? 'bg-blue-500/30 text-blue-400' : p.position === 'Centrocampista' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'}`}>
                                    {p.position === 'Difensore' ? 'D' : p.position === 'Centrocampista' ? 'C' : 'A'}
                                </span>
                                <span className="text-white">{p.name}</span>
                            </div>
                        ))}
                        {opponentSelectedBlocks.map(team => (
                            <div key={team.$id} className="flex items-center gap-2 bg-yellow-500/10 px-2 py-1 rounded text-yellow-400">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/30">P</span>
                                Blocco {team?.short_name || 'Squadra'}
                            </div>
                        ))}
                        {creditsOffered < 0 && (
                            <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded text-green-400">
                                💰 +{Math.abs(creditsOffered)} crediti
                            </div>
                        )}
                        {opponentSelectedPlayers.length === 0 && opponentSelectedBlocks.length === 0 && creditsOffered >= 0 && (
                            <span className="text-gray-500 italic text-xs">Nessun giocatore o credito richiesto</span>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition text-sm font-medium"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pl-teal text-pl-dark font-bold hover:bg-pl-teal/90 transition disabled:opacity-50 text-sm shadow-lg shadow-pl-teal/20"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Conferma Scambio
                    </button>
                </div>
            </div>
        </div>
    );
};
