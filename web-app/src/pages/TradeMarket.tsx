import { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Inbox, Send, History, Loader2, AlertCircle, Globe, X } from 'lucide-react';
import { useTrades } from '../hooks/useTrades';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { TradeModal, TradeProposalCard } from '../components/trade';
import { databases, DB_ID, COLL_FANTASY_TEAMS, COLL_PLAYERS } from '../lib/appwrite';
import { Query } from 'appwrite';
import { TradeProposal } from '../types/trade';

export const TradeMarket = () => {
    const { user } = useAuth();
    const { receivedProposals, sentProposals, tradeHistory, leagueHistory, loading, error, createProposal, acceptProposal, rejectProposal, cancelProposal } = useTrades();
    const { players } = usePlayers();

    const [showModal, setShowModal] = useState(false);
    const [showLeagueHistory, setShowLeagueHistory] = useState(false);
    const [myTeamId, setMyTeamId] = useState<string>('');
    const [fantasyTeams, setFantasyTeams] = useState<Map<string, any>>(new Map());
    const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map());
    const [teamNames, setTeamNames] = useState<Map<string, string>>(new Map());
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch fantasy teams for name lookups
    useEffect(() => {
        const fetchData = async () => {
            try {
                const teamsResponse = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [Query.limit(100)]);
                const teamsMap = new Map<string, any>();
                teamsResponse.documents.forEach((doc: any) => {
                    teamsMap.set(doc.$id, doc);
                    // Also store by user ID if available
                    if (doc.user_id) teamsMap.set(doc.user_id, doc);
                });
                setFantasyTeams(teamsMap);

                // Find my team
                const myTeam = teamsResponse.documents.find((t: any) => t.manager_name === user?.name);
                if (myTeam) setMyTeamId(myTeam.$id);
            } catch (err) {
                console.error('Error fetching fantasy teams:', err);
            }
        };
        fetchData();
    }, [user?.name]);

    // Build player name map
    useEffect(() => {
        const namesMap = new Map<string, string>();
        players.forEach(p => namesMap.set(p.$id, p.name));
        setPlayerNames(namesMap);

        // Team names for GK blocks
        const teamNamesMap = new Map<string, string>();
        players.forEach(p => {
            if (!teamNamesMap.has(p.team_id)) {
                teamNamesMap.set(p.team_id, p.team_short_name);
            }
        });
        setTeamNames(teamNamesMap);
    }, [players]);

    const getTeamName = (teamId: string) => {
        return fantasyTeams.get(teamId)?.manager_name || 'Sconosciuto';
    };

    const getPlayerNamesFromProposal = (playerIds: string[]) => {
        return playerIds.map(id => playerNames.get(id) || 'Giocatore sconosciuto');
    };

    const getBlockNamesFromProposal = (blockIds: string[]) => {
        return blockIds.map(id => teamNames.get(id) || 'Squadra');
    };

    const handleAccept = async (proposalId: string) => {
        setActionLoading(proposalId);
        try {
            await acceptProposal(proposalId);
        } catch (err) {
            console.error('Error accepting:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (proposalId: string) => {
        setActionLoading(proposalId);
        try {
            await rejectProposal(proposalId);
        } catch (err) {
            console.error('Error rejecting:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (proposalId: string) => {
        setActionLoading(proposalId);
        try {
            await cancelProposal(proposalId);
        } catch (err) {
            console.error('Error cancelling:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateProposal = async (payload: any) => {
        await createProposal(payload);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-pl-teal" />
                <span className="text-gray-400">Caricamento mercato scambi...</span>
            </div>
        );
    }

    return (
        <div className="w-full px-4 md:px-12 lg:px-24 xl:px-32 container mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 mt-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ArrowLeftRight className="text-pl-teal" />
                        Mercato Scambi
                    </h1>
                    <p className="text-gray-400 mt-1">Proponi e gestisci scambi con altri partecipanti</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-pl-teal text-pl-dark font-bold hover:bg-pl-teal/90 transition flex-1 md:flex-none"
                    >
                        <Plus size={20} />
                        Nuovo Scambio
                    </button>
                    <button
                        onClick={() => setShowLeagueHistory(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition flex-none"
                    >
                        <Globe size={20} className="text-blue-400" />
                        <span className="hidden md:inline">Storico Lega</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Received Proposals */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Inbox size={20} className="text-green-400" />
                    Proposte Ricevute
                    {receivedProposals.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                            {receivedProposals.length}
                        </span>
                    )}
                </h2>

                {receivedProposals.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-500">
                        Nessuna proposta ricevuta
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {receivedProposals.map(proposal => (
                            <TradeProposalCard
                                key={proposal.$id}
                                proposal={proposal}
                                type="received"
                                proposerName={getTeamName(proposal.proposer_team_id)}
                                receiverName={getTeamName(proposal.receiver_team_id)}
                                proposerPlayerNames={getPlayerNamesFromProposal(proposal.proposer_players)}
                                receiverPlayerNames={getPlayerNamesFromProposal(proposal.receiver_players)}
                                proposerBlockNames={getBlockNamesFromProposal(proposal.proposer_gk_blocks)}
                                receiverBlockNames={getBlockNamesFromProposal(proposal.receiver_gk_blocks)}
                                onAccept={() => handleAccept(proposal.$id)}
                                onReject={() => handleReject(proposal.$id)}
                                loading={actionLoading === proposal.$id}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Sent Proposals */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Send size={20} className="text-blue-400" />
                    Proposte Inviate
                    {sentProposals.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                            {sentProposals.length}
                        </span>
                    )}
                </h2>

                {sentProposals.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-500">
                        Nessuna proposta inviata
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {sentProposals.map(proposal => (
                            <TradeProposalCard
                                key={proposal.$id}
                                proposal={proposal}
                                type="sent"
                                proposerName={getTeamName(proposal.proposer_team_id)}
                                receiverName={getTeamName(proposal.receiver_team_id)}
                                proposerPlayerNames={getPlayerNamesFromProposal(proposal.proposer_players)}
                                receiverPlayerNames={getPlayerNamesFromProposal(proposal.receiver_players)}
                                proposerBlockNames={getBlockNamesFromProposal(proposal.proposer_gk_blocks)}
                                receiverBlockNames={getBlockNamesFromProposal(proposal.receiver_gk_blocks)}
                                onCancel={() => handleCancel(proposal.$id)}
                                loading={actionLoading === proposal.$id}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Trade History */}
            <section>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <History size={20} className="text-gray-400" />
                    Storico Scambi
                </h2>

                {tradeHistory.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-500">
                        Nessuno scambio completato
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {tradeHistory.map(proposal => (
                            <TradeProposalCard
                                key={proposal.$id}
                                proposal={proposal}
                                type="history"
                                proposerName={getTeamName(proposal.proposer_team_id)}
                                receiverName={getTeamName(proposal.receiver_team_id)}
                                proposerPlayerNames={getPlayerNamesFromProposal(proposal.proposer_players)}
                                receiverPlayerNames={getPlayerNamesFromProposal(proposal.receiver_players)}
                                proposerBlockNames={getBlockNamesFromProposal(proposal.proposer_gk_blocks)}
                                receiverBlockNames={getBlockNamesFromProposal(proposal.receiver_gk_blocks)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Trade Modal */}
            <TradeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleCreateProposal}
                myTeamId={myTeamId}
                myUserId={user?.$id || ''}
            />

            {/* League History Modal */}
            {showLeagueHistory && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setShowLeagueHistory(false)} />
                    <div className="relative bg-[#18181b] w-full max-w-4xl h-[80vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Globe className="text-blue-400" />
                                Storico Scambi Lega
                            </h2>
                            <button
                                onClick={() => setShowLeagueHistory(false)}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-[#18181b]">
                            {leagueHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-500 italic">
                                    <History size={32} className="mb-2 opacity-50" />
                                    Nessuno scambio concluso nella lega
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {leagueHistory.map(proposal => (
                                        <TradeProposalCard
                                            key={proposal.$id}
                                            proposal={proposal}
                                            type="history"
                                            proposerName={getTeamName(proposal.proposer_team_id)}
                                            receiverName={getTeamName(proposal.receiver_team_id)}
                                            proposerPlayerNames={getPlayerNamesFromProposal(proposal.proposer_players)}
                                            receiverPlayerNames={getPlayerNamesFromProposal(proposal.receiver_players)}
                                            proposerBlockNames={getBlockNamesFromProposal(proposal.proposer_gk_blocks)}
                                            receiverBlockNames={getBlockNamesFromProposal(proposal.receiver_gk_blocks)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
