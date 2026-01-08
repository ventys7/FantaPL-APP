import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeftRight, Coins, AlertCircle, Send, Loader2 } from 'lucide-react';
import { SelectableTeamCard } from './SelectableTeamCard';
import { usePlayers } from '../../hooks/usePlayers';
import { useAuth } from '../../context/AuthContext';
import { databases, DB_ID, COLL_FANTASY_TEAMS } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { CreateTradePayload } from '../../types/trade';

interface FantasyTeam {
    $id: string;
    team_name: string;
    manager_name: string;
    credits_remaining: number;
    user_id: string;
}

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateTradePayload) => Promise<void>;
    myTeamId: string;
    myUserId: string;
}

export const TradeModal = ({ isOpen, onClose, onSubmit, myTeamId, myUserId }: TradeModalProps) => {
    const { players, realTeams } = usePlayers();
    const { user } = useAuth();

    const [fantasyTeams, setFantasyTeams] = useState<FantasyTeam[]>([]);
    const [selectedOpponent, setSelectedOpponent] = useState<string>('');
    const [mySelectedPlayers, setMySelectedPlayers] = useState<Set<string>>(new Set());
    const [mySelectedBlocks, setMySelectedBlocks] = useState<Set<string>>(new Set());
    const [opponentSelectedPlayers, setOpponentSelectedPlayers] = useState<Set<string>>(new Set());
    const [opponentSelectedBlocks, setOpponentSelectedBlocks] = useState<Set<string>>(new Set());
    const [creditsAmount, setCreditsAmount] = useState<number>(0);
    const [creditsMode, setCreditsMode] = useState<'offer' | 'request'>('offer'); // 'offer' = I give, 'request' = I receive
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'my-team' | 'opponent-team'>('my-team'); // Mobile only

    // Fetch all fantasy teams
    const [allTeams, setAllTeams] = useState<FantasyTeam[]>([]);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [
                    Query.limit(100)
                ]);
                // Store all teams (excluding g_admin only)
                const teams = (response.documents as unknown as FantasyTeam[]).filter(
                    (t) => (t as any).role !== 'g_admin'
                );
                setAllTeams(teams);
                // For dropdown, also exclude my team
                setFantasyTeams(teams.filter(t => t.$id !== myTeamId));
            } catch (err) {
                console.error('Error fetching teams:', err);
            }
        };
        if (isOpen) fetchTeams();
    }, [isOpen, myTeamId]);

    // Get my players
    const myPlayers = useMemo(() => {
        const myTeam = allTeams.find(t => t.$id === myTeamId) ||
            { manager_name: user?.name || '' };
        return players.filter(p => p.owner === (myTeam as any).manager_name || p.owner === user?.name);
    }, [players, myTeamId, allTeams, user]);

    // Get my credits
    const myCredits = useMemo(() => {
        const myTeam = allTeams.find(t => t.$id === myTeamId);
        return myTeam?.credits_remaining || 0;
    }, [allTeams, myTeamId]);

    // Get opponent data
    const opponentTeam = useMemo(() => {
        return fantasyTeams.find(t => t.$id === selectedOpponent);
    }, [fantasyTeams, selectedOpponent]);

    const opponentPlayers = useMemo(() => {
        if (!opponentTeam) return [];
        return players.filter(p => p.owner === opponentTeam.manager_name);
    }, [players, opponentTeam]);

    // Count selected items by role
    const getSelectedByRole = (selectedIds: Set<string>, playerList: any[]) => {
        const counts = { D: 0, C: 0, A: 0 };
        selectedIds.forEach(id => {
            const player = playerList.find(p => p.$id === id);
            if (player) {
                if (player.position === 'Difensore') counts.D++;
                else if (player.position === 'Centrocampista') counts.C++;
                else if (player.position === 'Attaccante') counts.A++;
            }
        });
        return counts;
    };

    const myRoleCounts = getSelectedByRole(mySelectedPlayers, myPlayers);
    const opponentRoleCounts = getSelectedByRole(opponentSelectedPlayers, opponentPlayers);

    const myTotalSelected = mySelectedPlayers.size + mySelectedBlocks.size;
    const opponentTotalSelected = opponentSelectedPlayers.size + opponentSelectedBlocks.size;

    // Role-for-role validation
    const isRoleBalanced =
        myRoleCounts.D === opponentRoleCounts.D &&
        myRoleCounts.C === opponentRoleCounts.C &&
        myRoleCounts.A === opponentRoleCounts.A &&
        mySelectedBlocks.size === opponentSelectedBlocks.size;

    const hasSomethingSelected =
        mySelectedPlayers.size > 0 || mySelectedBlocks.size > 0 ||
        opponentSelectedPlayers.size > 0 || opponentSelectedBlocks.size > 0;

    const isBalanced = isRoleBalanced && hasSomethingSelected &&
        (mySelectedPlayers.size + mySelectedBlocks.size > 0) &&
        (opponentSelectedPlayers.size + opponentSelectedBlocks.size > 0);

    // Calculate actual credits offered (+ = I give, - = I receive)
    const creditsOffered = creditsMode === 'offer' ? creditsAmount : -creditsAmount;

    // Validate credits
    const creditsValid = creditsMode === 'offer'
        ? creditsAmount <= myCredits
        : creditsAmount <= (opponentTeam?.credits_remaining || 0);

    const handleToggleMyPlayer = (playerId: string) => {
        const newSet = new Set(mySelectedPlayers);
        if (newSet.has(playerId)) newSet.delete(playerId);
        else newSet.add(playerId);
        setMySelectedPlayers(newSet);
    };

    const handleToggleMyBlock = (blockId: string, _gkIds: string[]) => {
        const newBlocks = new Set(mySelectedBlocks);
        if (newBlocks.has(blockId)) {
            newBlocks.delete(blockId);
        } else {
            newBlocks.add(blockId);
        }
        setMySelectedBlocks(newBlocks);
    };

    const handleToggleOpponentPlayer = (playerId: string) => {
        const newSet = new Set(opponentSelectedPlayers);
        if (newSet.has(playerId)) newSet.delete(playerId);
        else newSet.add(playerId);
        setOpponentSelectedPlayers(newSet);
    };

    const handleToggleOpponentBlock = (blockId: string, _gkIds: string[]) => {
        const newBlocks = new Set(opponentSelectedBlocks);
        if (newBlocks.has(blockId)) {
            newBlocks.delete(blockId);
        } else {
            newBlocks.add(blockId);
        }
        setOpponentSelectedBlocks(newBlocks);
    };

    const handleSubmit = async () => {
        if (!opponentTeam) return;

        const payload: CreateTradePayload = {
            proposer_user_id: myUserId,
            receiver_user_id: '', // Will need to find user ID from team
            proposer_team_id: myTeamId,
            receiver_team_id: selectedOpponent,
            proposer_players: Array.from(mySelectedPlayers).filter(
                id => !Array.from(mySelectedBlocks).some(blockId =>
                    players.find(p => p.$id === id)?.team_id === blockId
                )
            ),
            receiver_players: Array.from(opponentSelectedPlayers).filter(
                id => !Array.from(opponentSelectedBlocks).some(blockId =>
                    players.find(p => p.$id === id)?.team_id === blockId
                )
            ),
            proposer_gk_blocks: Array.from(mySelectedBlocks),
            receiver_gk_blocks: Array.from(opponentSelectedBlocks),
            credits_offered: creditsOffered
        };

        try {
            setLoading(true);
            setError(null);
            await onSubmit(payload);
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Errore nell\'invio proposta');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedOpponent('');
        setMySelectedPlayers(new Set());
        setMySelectedBlocks(new Set());
        setOpponentSelectedPlayers(new Set());
        setOpponentSelectedBlocks(new Set());
        setCreditsAmount(0);
        setCreditsMode('offer');
        setShowConfirmation(false);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-6xl h-[80vh] md:h-auto md:max-h-[90vh] bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <ArrowLeftRight className="text-pl-teal" size={20} />
                        <h2 className="text-xl font-bold text-white">Nuovo Scambio</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Mobile Tabs */}
                    <div className="flex md:hidden border-b border-white/10 shrink-0">
                        <button
                            onClick={() => setActiveTab('my-team')}
                            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${activeTab === 'my-team' ? 'border-pl-teal text-white bg-white/5' : 'border-transparent text-gray-500'}`}
                        >
                            La Mia Rosa {myTotalSelected > 0 && <span className="ml-1 text-pl-teal">({myTotalSelected})</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('opponent-team')}
                            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${activeTab === 'opponent-team' ? 'border-pl-teal text-white bg-white/5' : 'border-transparent text-gray-500'}`}
                        >
                            Altro Partecipante {opponentTotalSelected > 0 && <span className="ml-1 text-pl-teal">({opponentTotalSelected})</span>}
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
                        {/* Left: My Team */}
                        <div className={`flex-1 flex-col border-r border-white/10 overflow-hidden ${activeTab === 'my-team' ? 'flex' : 'hidden md:flex'}`}>
                            <div className="px-4 py-3 bg-pl-teal/10 border-b border-white/5 flex-shrink-0 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white">La Mia Rosa</h3>
                                    <p className="text-xs text-gray-400">Seleziona i giocatori da offrire</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 rounded-lg">
                                    <Coins size={14} className="text-pl-teal" />
                                    <span className="text-sm font-mono font-bold text-pl-teal">{myCredits}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <SelectableTeamCard
                                    players={myPlayers}
                                    realTeams={realTeams}
                                    ownerName={user?.name || ''}
                                    selectedPlayers={mySelectedPlayers}
                                    selectedBlocks={mySelectedBlocks}
                                    onTogglePlayer={handleToggleMyPlayer}
                                    onToggleBlock={handleToggleMyBlock}
                                />
                            </div>
                        </div>

                        {/* Right: Opponent Team */}
                        <div className={`flex-1 flex-col overflow-hidden ${activeTab === 'opponent-team' ? 'flex' : 'hidden md:flex'}`}>
                            <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex-shrink-0 flex items-center justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-1">
                                        <svg className="w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        <select
                                            value={selectedOpponent}
                                            onChange={e => {
                                                setSelectedOpponent(e.target.value);
                                                setOpponentSelectedPlayers(new Set());
                                                setOpponentSelectedBlocks(new Set());
                                            }}
                                            className="bg-transparent text-white text-base font-bold focus:outline-none cursor-pointer appearance-none"
                                        >
                                            <option value="">Seleziona partecipante...</option>
                                            {fantasyTeams.filter(t => t.$id !== myTeamId && t.manager_name !== user?.name && t.user_id !== myUserId).map(team => (
                                                <option key={team.$id} value={team.$id}>
                                                    {team.manager_name} - {team.team_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-400">Seleziona i giocatori da richiedere</p>
                                </div>
                                {opponentTeam && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 rounded-lg">
                                        <Coins size={14} className="text-pl-teal" />
                                        <span className="text-sm font-mono font-bold text-pl-teal">{opponentTeam.credits_remaining}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {selectedOpponent ? (
                                    <SelectableTeamCard
                                        players={opponentPlayers}
                                        realTeams={realTeams}
                                        ownerName={opponentTeam?.manager_name || ''}
                                        selectedPlayers={opponentSelectedPlayers}
                                        selectedBlocks={opponentSelectedBlocks}
                                        onTogglePlayer={handleToggleOpponentPlayer}
                                        onToggleBlock={handleToggleOpponentBlock}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        Seleziona un partecipante per vedere la sua rosa
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20 flex-shrink-0">
                    {/* Credits input */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Coins size={16} className="text-pl-teal" />
                            <span className="text-sm text-gray-400">Crediti:</span>

                            {/* Toggle Offri/Richiedi */}
                            <div className="flex rounded-lg overflow-hidden border border-white/20">
                                <button
                                    onClick={() => setCreditsMode('offer')}
                                    className={`px-3 py-1.5 text-xs font-bold transition ${creditsMode === 'offer' ? 'bg-red-500/30 text-red-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                >
                                    Offri
                                </button>
                                <button
                                    onClick={() => setCreditsMode('request')}
                                    className={`px-3 py-1.5 text-xs font-bold transition ${creditsMode === 'request' ? 'bg-green-500/30 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                >
                                    Richiedi
                                </button>
                            </div>

                            <input
                                type="number"
                                min="0"
                                value={creditsAmount === 0 ? '' : creditsAmount}
                                onChange={e => setCreditsAmount(e.target.value === '' ? 0 : Math.abs(parseInt(e.target.value)) || 0)}
                                className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm text-center focus:border-pl-teal outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Validation messages */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            {hasSomethingSelected && !isRoleBalanced && (
                                <div className="flex items-center gap-1.5 text-yellow-400 text-sm flex-wrap">
                                    <AlertCircle size={14} className="flex-shrink-0" />
                                    <span>
                                        Ruoli non bilanciati:
                                        {myRoleCounts.D !== opponentRoleCounts.D && ` D(${myRoleCounts.D}↔${opponentRoleCounts.D})`}
                                        {myRoleCounts.C !== opponentRoleCounts.C && ` C(${myRoleCounts.C}↔${opponentRoleCounts.C})`}
                                        {myRoleCounts.A !== opponentRoleCounts.A && ` A(${myRoleCounts.A}↔${opponentRoleCounts.A})`}
                                        {mySelectedBlocks.size !== opponentSelectedBlocks.size && ` P(${mySelectedBlocks.size}↔${opponentSelectedBlocks.size})`}
                                    </span>
                                </div>
                            )}
                            {!creditsValid && (
                                <div className="flex items-center gap-1.5 text-red-400 text-sm">
                                    <AlertCircle size={14} />
                                    Crediti insufficienti
                                </div>
                            )}
                            {error && (
                                <div className="flex items-center gap-1.5 text-red-400 text-sm">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowConfirmation(true)}
                            disabled={!isBalanced || !creditsValid || !selectedOpponent || loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pl-teal text-pl-dark font-bold hover:bg-pl-teal/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                            Invia Proposta
                        </button>
                    </div>
                </div>

                {/* Confirmation Dialog */}
                {showConfirmation && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-10">
                        <div className="bg-[#18181b] border border-white/20 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                            <h3 className="text-lg font-bold text-white mb-4">Conferma Proposta</h3>

                            {/* Offer section */}
                            <div className="mb-3">
                                <div className="text-xs uppercase font-bold text-red-400 mb-2">Offri</div>
                                <div className="space-y-1 text-sm">
                                    {Array.from(mySelectedPlayers).map(id => {
                                        const p = myPlayers.find(pl => pl.$id === id);
                                        return p ? (
                                            <div key={id} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.position === 'Difensore' ? 'bg-blue-500/30 text-blue-400' : p.position === 'Centrocampista' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'}`}>
                                                    {p.position === 'Difensore' ? 'D' : p.position === 'Centrocampista' ? 'C' : 'A'}
                                                </span>
                                                <span className="text-white">{p.name}</span>
                                            </div>
                                        ) : null;
                                    })}
                                    {Array.from(mySelectedBlocks).map(blockId => {
                                        const team = realTeams.find(t => t.$id === blockId);
                                        return (
                                            <div key={blockId} className="flex items-center gap-2 bg-yellow-500/10 px-2 py-1 rounded text-yellow-400">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/30">P</span>
                                                Blocco {team?.short_name || 'Squadra'}
                                            </div>
                                        );
                                    })}
                                    {creditsOffered > 0 && (
                                        <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded text-green-400">
                                            💰 +{creditsOffered} crediti
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Request section */}
                            <div className="mb-4">
                                <div className="text-xs uppercase font-bold text-green-400 mb-2">Richiedi</div>
                                <div className="space-y-1 text-sm">
                                    {Array.from(opponentSelectedPlayers).map(id => {
                                        const p = opponentPlayers.find(pl => pl.$id === id);
                                        return p ? (
                                            <div key={id} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.position === 'Difensore' ? 'bg-blue-500/30 text-blue-400' : p.position === 'Centrocampista' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'}`}>
                                                    {p.position === 'Difensore' ? 'D' : p.position === 'Centrocampista' ? 'C' : 'A'}
                                                </span>
                                                <span className="text-white">{p.name}</span>
                                            </div>
                                        ) : null;
                                    })}
                                    {Array.from(opponentSelectedBlocks).map(blockId => {
                                        const team = realTeams.find(t => t.$id === blockId);
                                        return (
                                            <div key={blockId} className="flex items-center gap-2 bg-yellow-500/10 px-2 py-1 rounded text-yellow-400">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/30">P</span>
                                                Blocco {team?.short_name || 'Squadra'}
                                            </div>
                                        );
                                    })}
                                    {creditsOffered < 0 && (
                                        <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded text-green-400">
                                            💰 +{Math.abs(creditsOffered)} crediti
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pl-teal text-pl-dark font-bold hover:bg-pl-teal/90 transition disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Conferma
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >,
        document.body
    );
};
