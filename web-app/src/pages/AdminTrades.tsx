import { useState, useEffect } from 'react';
import { ArrowLeftRight, Trash2, Loader2, AlertCircle, History, RotateCcw } from 'lucide-react';
import { databases, DB_ID, COLL_TRADE_PROPOSALS, COLL_PLAYERS, COLL_TEAMS, COLL_FANTASY_TEAMS } from '../lib/appwrite';
import { Query } from 'appwrite';
import { TradeProposal } from '../types/trade';
import { logger } from '../lib/logger';

export const AdminTrades = () => {
    const [trades, setTrades] = useState<TradeProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmRevert, setConfirmRevert] = useState<string | null>(null); // Trade ID pending confirmation
    const [fantasyTeams, setFantasyTeams] = useState<Map<string, any>>(new Map());
    const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map());
    const [teamNames, setTeamNames] = useState<Map<string, string>>(new Map());

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all completed trades
            const tradesResponse = await databases.listDocuments(DB_ID, COLL_TRADE_PROPOSALS, [
                Query.equal('status', 'accepted'),
                Query.orderDesc('completed_at'),
                Query.limit(100)
            ]);

            // Fetch fantasy teams
            const teamsResponse = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [Query.limit(100)]);
            const teamsMap = new Map<string, any>();
            teamsResponse.documents.forEach((doc: any) => teamsMap.set(doc.$id, doc));
            setFantasyTeams(teamsMap);

            // Fetch players for name lookup
            const playersResponse = await databases.listDocuments(DB_ID, COLL_PLAYERS, [Query.limit(1000)]);
            const namesMap = new Map<string, string>();
            playersResponse.documents.forEach((p: any) => {
                namesMap.set(p.$id, p.name);
            });
            setPlayerNames(namesMap);

            // Fetch real_teams for block names
            const realTeamsResponse = await databases.listDocuments(DB_ID, COLL_TEAMS, [Query.limit(100)]);
            const teamNamesMap = new Map<string, string>();
            realTeamsResponse.documents.forEach((t: any) => {
                teamNamesMap.set(t.$id, t.short_name || t.name || 'Squadra');
            });
            setTeamNames(teamNamesMap);

            setTrades(tradesResponse.documents as TradeProposal[]);
        } catch (err: any) {
            logger.error('[AdminTrades] Error fetching:', err);
            setError(err.message || 'Errore nel caricamento');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getTeamName = (teamId: string) => {
        return fantasyTeams.get(teamId)?.manager_name || 'Sconosciuto';
    };

    const getPlayerNamesFromIds = (ids: string[]) => {
        return ids.map(id => playerNames.get(id) || 'Giocatore');
    };

    const getBlockNamesFromIds = (ids: string[]) => {
        return ids.map(id => teamNames.get(id) || 'Squadra');
    };

    const revertTrade = async (trade: TradeProposal) => {
        setActionLoading(trade.$id);
        try {
            // Revert player ownership
            // Proposer's players go back from receiver to proposer
            const proposerManagerName = fantasyTeams.get(trade.proposer_team_id)?.manager_name;
            const receiverManagerName = fantasyTeams.get(trade.receiver_team_id)?.manager_name;

            for (const playerId of trade.proposer_players) {
                await databases.updateDocument(DB_ID, COLL_PLAYERS, playerId, {
                    owner: proposerManagerName
                });
            }

            // Receiver's players go back from proposer to receiver
            for (const playerId of trade.receiver_players) {
                await databases.updateDocument(DB_ID, COLL_PLAYERS, playerId, {
                    owner: receiverManagerName
                });
            }

            // Revert GK blocks AND individual GKs
            for (const blockId of trade.proposer_gk_blocks) {
                // Update the block
                await databases.updateDocument(DB_ID, COLL_TEAMS, blockId, {
                    goalkeeper_owner: proposerManagerName
                });

                // Update individual GKs in this block
                const gksInBlock = await databases.listDocuments(DB_ID, COLL_PLAYERS, [
                    Query.equal('team_id', blockId),
                    Query.equal('position', 'Portiere')
                ]);
                for (const gk of gksInBlock.documents) {
                    await databases.updateDocument(DB_ID, COLL_PLAYERS, gk.$id, {
                        owner: proposerManagerName
                    });
                }
            }

            for (const blockId of trade.receiver_gk_blocks) {
                // Update the block
                await databases.updateDocument(DB_ID, COLL_TEAMS, blockId, {
                    goalkeeper_owner: receiverManagerName
                });

                // Update individual GKs in this block
                const gksInBlock = await databases.listDocuments(DB_ID, COLL_PLAYERS, [
                    Query.equal('team_id', blockId),
                    Query.equal('position', 'Portiere')
                ]);
                for (const gk of gksInBlock.documents) {
                    await databases.updateDocument(DB_ID, COLL_PLAYERS, gk.$id, {
                        owner: receiverManagerName
                    });
                }
            }

            // Revert credits
            if (trade.credits_offered !== 0) {
                const proposerTeam = await databases.getDocument(DB_ID, COLL_FANTASY_TEAMS, trade.proposer_team_id);
                const receiverTeam = await databases.getDocument(DB_ID, COLL_FANTASY_TEAMS, trade.receiver_team_id);

                // Reverse the credit transfer
                await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, trade.proposer_team_id, {
                    credits_remaining: (proposerTeam.credits_remaining || 0) + trade.credits_offered
                });

                await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, trade.receiver_team_id, {
                    credits_remaining: (receiverTeam.credits_remaining || 0) - trade.credits_offered
                });
            }

            // Delete the trade document
            await databases.deleteDocument(DB_ID, COLL_TRADE_PROPOSALS, trade.$id);

            // Refresh
            await fetchData();

        } catch (err: any) {
            logger.error('[AdminTrades] Error reverting:', err);
            setError(err.message || 'Errore nell\'annullamento');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-pl-teal" />
                <span className="text-gray-400">Caricamento scambi...</span>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <History className="text-orange-400" />
                        Storico Scambi
                    </h1>
                    <p className="text-gray-400 text-sm">{trades.length} scambi completati</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition"
                >
                    <RotateCcw size={16} />
                    Aggiorna
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {trades.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-500">
                    Nessuno scambio completato da visualizzare
                </div>
            ) : (
                <div className="space-y-4">
                    {trades.map(trade => (
                        <div key={trade.$id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition">
                            {/* Header */}
                            <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ArrowLeftRight size={16} className="text-green-400" />
                                    <span className="text-white font-medium">
                                        {getTeamName(trade.proposer_team_id)} ↔ {getTeamName(trade.receiver_team_id)}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {formatDate(trade.completed_at || trade.$updatedAt)}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                                        {getTeamName(trade.proposer_team_id)} ha dato
                                    </div>
                                    <div className="space-y-1">
                                        {getPlayerNamesFromIds(trade.proposer_players).map((name, i) => (
                                            <div key={i} className="text-sm text-white bg-white/5 px-2 py-1 rounded">{name}</div>
                                        ))}
                                        {getBlockNamesFromIds(trade.proposer_gk_blocks).map((name, i) => (
                                            <div key={`b-${i}`} className="text-sm text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">🧤 Blocco {name}</div>
                                        ))}
                                        {trade.credits_offered > 0 && (
                                            <div className="text-sm text-green-400 bg-green-500/10 px-2 py-1 rounded">💰 +{trade.credits_offered} crediti</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                                        {getTeamName(trade.receiver_team_id)} ha dato
                                    </div>
                                    <div className="space-y-1">
                                        {getPlayerNamesFromIds(trade.receiver_players).map((name, i) => (
                                            <div key={i} className="text-sm text-white bg-white/5 px-2 py-1 rounded">{name}</div>
                                        ))}
                                        {getBlockNamesFromIds(trade.receiver_gk_blocks).map((name, i) => (
                                            <div key={`b-${i}`} className="text-sm text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">🧤 Blocco {name}</div>
                                        ))}
                                        {trade.credits_offered < 0 && (
                                            <div className="text-sm text-green-400 bg-green-500/10 px-2 py-1 rounded">💰 +{Math.abs(trade.credits_offered)} crediti</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-4 py-3 bg-black/20 border-t border-white/5 flex justify-end gap-2">
                                {confirmRevert === trade.$id ? (
                                    <>
                                        <button
                                            onClick={() => setConfirmRevert(null)}
                                            className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 transition text-sm"
                                        >
                                            Annulla
                                        </button>
                                        <button
                                            onClick={() => {
                                                setConfirmRevert(null);
                                                revertTrade(trade);
                                            }}
                                            disabled={actionLoading === trade.$id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/30 text-red-300 hover:bg-red-500/40 transition text-sm font-bold disabled:opacity-50"
                                        >
                                            {actionLoading === trade.$id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                            Conferma Annullamento
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setConfirmRevert(trade.$id)}
                                        disabled={actionLoading === trade.$id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm font-medium disabled:opacity-50"
                                    >
                                        {actionLoading === trade.$id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                        Annulla Scambio
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
