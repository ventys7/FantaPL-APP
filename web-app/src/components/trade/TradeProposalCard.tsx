import { Check, X, Clock, ArrowLeftRight, Coins } from 'lucide-react';
import { TradeProposal } from '../../types/trade';

interface TradeProposalCardProps {
    proposal: TradeProposal;
    type: 'received' | 'sent' | 'history';
    proposerName: string;
    receiverName: string;
    proposerPlayerNames: string[];
    receiverPlayerNames: string[];
    proposerBlockNames: string[];
    receiverBlockNames: string[];
    onAccept?: () => void;
    onReject?: () => void;
    onCancel?: () => void;
    loading?: boolean;
}

export const TradeProposalCard = ({
    proposal,
    type,
    proposerName,
    receiverName,
    proposerPlayerNames,
    receiverPlayerNames,
    proposerBlockNames,
    receiverBlockNames,
    onAccept,
    onReject,
    onCancel,
    loading = false
}: TradeProposalCardProps) => {

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalProposerItems = proposerPlayerNames.length + proposerBlockNames.length;
    const totalReceiverItems = receiverPlayerNames.length + receiverBlockNames.length;

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition">
            {/* Header */}
            <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ArrowLeftRight size={16} className="text-pl-teal" />
                    <span className="text-sm font-medium text-white">
                        {type === 'received' ? `Da ${proposerName}` :
                            type === 'sent' ? `A ${receiverName}` :
                                `${proposerName} ↔ ${receiverName}`}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    {formatDate(proposal.$createdAt)}
                </div>
            </div>

            {/* Trade Details */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: What proposer offers */}
                <div>
                    <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                        {type === 'received' ? 'Ricevi' : 'Offre'}
                    </div>
                    <div className="space-y-1">
                        {proposerPlayerNames.map((name, i) => (
                            <div key={i} className="text-sm text-white bg-white/5 px-2 py-1 rounded">
                                {name}
                            </div>
                        ))}
                        {proposerBlockNames.map((name, i) => (
                            <div key={`block-${i}`} className="text-sm text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded flex items-center gap-1">
                                🧤 Blocco {name}
                            </div>
                        ))}
                        {totalProposerItems === 0 && (
                            <div className="text-sm text-gray-500 italic">Nessun giocatore</div>
                        )}
                    </div>
                </div>

                {/* Right: What proposer wants */}
                <div>
                    <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                        {type === 'received' ? 'Dai' : 'Richiede'}
                    </div>
                    <div className="space-y-1">
                        {receiverPlayerNames.map((name, i) => (
                            <div key={i} className="text-sm text-white bg-white/5 px-2 py-1 rounded">
                                {name}
                            </div>
                        ))}
                        {receiverBlockNames.map((name, i) => (
                            <div key={`block-${i}`} className="text-sm text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded flex items-center gap-1">
                                🧤 Blocco {name}
                            </div>
                        ))}
                        {totalReceiverItems === 0 && (
                            <div className="text-sm text-gray-500 italic">Nessun giocatore</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Credits */}
            {proposal.credits_offered !== 0 && (
                <div className="px-4 pb-3">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${proposal.credits_offered > 0
                        ? (type === 'received' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')
                        : (type === 'received' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400')
                        }`}>
                        <Coins size={14} />
                        {type === 'received'
                            ? (proposal.credits_offered > 0 ? `+${proposal.credits_offered} crediti` : `${proposal.credits_offered} crediti`)
                            : (proposal.credits_offered > 0 ? `-${proposal.credits_offered} crediti` : `+${Math.abs(proposal.credits_offered)} crediti`)
                        }
                    </div>
                </div>
            )}

            {/* Actions */}
            {type !== 'history' && (
                <div className="px-4 py-3 bg-black/20 border-t border-white/5 flex gap-2 justify-end">
                    {type === 'received' && (
                        <>
                            <button
                                onClick={onReject}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm font-medium disabled:opacity-50"
                            >
                                <X size={14} />
                                Rifiuta
                            </button>
                            <button
                                onClick={onAccept}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition text-sm font-medium disabled:opacity-50"
                            >
                                <Check size={14} />
                                Accetta
                            </button>
                        </>
                    )}
                    {type === 'sent' && (
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition text-sm font-medium disabled:opacity-50"
                        >
                            <X size={14} />
                            Annulla
                        </button>
                    )}
                </div>
            )}

            {/* History status badge */}
            {type === 'history' && (
                <div className="px-4 py-2 bg-green-500/10 border-t border-green-500/20 text-center">
                    <span className="text-xs font-bold text-green-400 uppercase">
                        ✓ Completato il {formatDate(proposal.completed_at || proposal.$updatedAt)}
                    </span>
                </div>
            )}
        </div>
    );
};
