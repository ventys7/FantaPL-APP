import { useState, useEffect, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { databases, DB_ID, COLL_TRADE_PROPOSALS, COLL_FANTASY_TEAMS, COLL_PLAYERS, COLL_TEAMS } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import { logger } from '../lib/logger';
import { TradeProposal, CreateTradePayload, TradeStatus } from '../types/trade';

interface UseTrades {
    receivedProposals: TradeProposal[];
    sentProposals: TradeProposal[];
    tradeHistory: TradeProposal[];
    leagueHistory: TradeProposal[];
    loading: boolean;
    error: string | null;
    createProposal: (payload: CreateTradePayload) => Promise<void>;
    acceptProposal: (proposalId: string) => Promise<void>;
    rejectProposal: (proposalId: string) => Promise<void>;
    cancelProposal: (proposalId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useTrades = (): UseTrades => {
    const { user } = useAuth();
    const [receivedProposals, setReceivedProposals] = useState<TradeProposal[]>([]);
    const [sentProposals, setSentProposals] = useState<TradeProposal[]>([]);
    const [tradeHistory, setTradeHistory] = useState<TradeProposal[]>([]);
    const [leagueHistory, setLeagueHistory] = useState<TradeProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProposals = useCallback(async () => {
        if (!user?.$id) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch user's team ID first
            const teamsResponse = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [
                Query.limit(100)
            ]);
            const myTeam = teamsResponse.documents.find((t: any) => t.manager_name === user.name);
            if (!myTeam) {
                setLoading(false);
                return;
            }
            const myTeamId = myTeam.$id;

            // Fetch received proposals (pending only)
            const receivedResponse = await databases.listDocuments(DB_ID, COLL_TRADE_PROPOSALS, [
                Query.equal('receiver_team_id', myTeamId),
                Query.equal('status', 'pending'),
                Query.orderDesc('$createdAt')
            ]);

            // Fetch sent proposals (pending only)
            const sentResponse = await databases.listDocuments(DB_ID, COLL_TRADE_PROPOSALS, [
                Query.equal('proposer_team_id', myTeamId),
                Query.equal('status', 'pending'),
                Query.orderDesc('$createdAt')
            ]);

            // Fetch trade history (accepted trades involving this user)
            const historyResponse = await databases.listDocuments(DB_ID, COLL_TRADE_PROPOSALS, [
                Query.equal('status', 'accepted'),
                Query.orderDesc('completed_at'),
                Query.limit(50)
            ]);

            // Filter history to only include trades involving this user's team
            const userHistory = historyResponse.documents.filter(
                (doc: any) => doc.proposer_team_id === myTeamId || doc.receiver_team_id === myTeamId
            );

            setReceivedProposals(receivedResponse.documents as TradeProposal[]);
            setSentProposals(sentResponse.documents as TradeProposal[]);
            setTradeHistory(userHistory as TradeProposal[]);
            setLeagueHistory(historyResponse.documents as TradeProposal[]);

        } catch (err: any) {
            logger.error('[useTrades] Error fetching proposals:', err);
            setError(err.message || 'Errore nel caricamento proposte');
        } finally {
            setLoading(false);
        }
    }, [user?.$id]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    const createProposal = async (payload: CreateTradePayload) => {
        try {
            await databases.createDocument(DB_ID, COLL_TRADE_PROPOSALS, ID.unique(), {
                ...payload,
                status: 'pending' as TradeStatus
            });
            await fetchProposals();
        } catch (err: any) {
            logger.error('[useTrades] Error creating proposal:', err);
            throw new Error(err.message || 'Errore nella creazione proposta');
        }
    };

    const executeTradeTransfer = async (proposal: TradeProposal) => {
        // Transfer players: Update owner field on each player
        // Proposer's players go to receiver
        for (const playerId of proposal.proposer_players) {
            await databases.updateDocument(DB_ID, COLL_PLAYERS, playerId, {
                owner: await getManagerNameFromTeamId(proposal.receiver_team_id)
            });
        }

        // Receiver's players go to proposer
        for (const playerId of proposal.receiver_players) {
            await databases.updateDocument(DB_ID, COLL_PLAYERS, playerId, {
                owner: await getManagerNameFromTeamId(proposal.proposer_team_id)
            });
        }

        // Transfer GK blocks: Update goalkeeper_owner field on real_teams AND owner on individual GKs
        for (const blockId of proposal.proposer_gk_blocks) {
            const newOwner = await getManagerNameFromTeamId(proposal.receiver_team_id);

            // Update the block
            await databases.updateDocument(DB_ID, COLL_TEAMS, blockId, {
                goalkeeper_owner: newOwner
            });

            // Update individual GKs in this block
            const gksInBlock = await databases.listDocuments(DB_ID, COLL_PLAYERS, [
                Query.equal('team_id', blockId),
                Query.equal('position', 'Portiere')
            ]);
            for (const gk of gksInBlock.documents) {
                await databases.updateDocument(DB_ID, COLL_PLAYERS, gk.$id, {
                    owner: newOwner
                });
            }
        }

        for (const blockId of proposal.receiver_gk_blocks) {
            const newOwner = await getManagerNameFromTeamId(proposal.proposer_team_id);

            // Update the block
            await databases.updateDocument(DB_ID, COLL_TEAMS, blockId, {
                goalkeeper_owner: newOwner
            });

            // Update individual GKs in this block
            const gksInBlock = await databases.listDocuments(DB_ID, COLL_PLAYERS, [
                Query.equal('team_id', blockId),
                Query.equal('position', 'Portiere')
            ]);
            for (const gk of gksInBlock.documents) {
                await databases.updateDocument(DB_ID, COLL_PLAYERS, gk.$id, {
                    owner: newOwner
                });
            }
        }

        // Transfer credits
        if (proposal.credits_offered !== 0) {
            // Get current credits
            const proposerTeam = await databases.getDocument(DB_ID, COLL_FANTASY_TEAMS, proposal.proposer_team_id);
            const receiverTeam = await databases.getDocument(DB_ID, COLL_FANTASY_TEAMS, proposal.receiver_team_id);

            const proposerCredits = (proposerTeam.credits_remaining || 0) - proposal.credits_offered;
            const receiverCredits = (receiverTeam.credits_remaining || 0) + proposal.credits_offered;

            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, proposal.proposer_team_id, {
                credits_remaining: proposerCredits
            });

            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, proposal.receiver_team_id, {
                credits_remaining: receiverCredits
            });
        }
    };

    const getManagerNameFromTeamId = async (teamId: string): Promise<string> => {
        const team = await databases.getDocument(DB_ID, COLL_FANTASY_TEAMS, teamId);
        return team.manager_name;
    };

    const acceptProposal = async (proposalId: string) => {
        try {
            // Get the proposal
            const proposal = await databases.getDocument(DB_ID, COLL_TRADE_PROPOSALS, proposalId) as TradeProposal;

            // Execute the trade
            await executeTradeTransfer(proposal);

            // Update proposal status
            await databases.updateDocument(DB_ID, COLL_TRADE_PROPOSALS, proposalId, {
                status: 'accepted' as TradeStatus,
                completed_at: new Date().toISOString()
            });

            await fetchProposals();
        } catch (err: any) {
            logger.error('[useTrades] Error accepting proposal:', err);
            throw new Error(err.message || 'Errore nell\'accettazione proposta');
        }
    };

    const rejectProposal = async (proposalId: string) => {
        try {
            await databases.updateDocument(DB_ID, COLL_TRADE_PROPOSALS, proposalId, {
                status: 'rejected' as TradeStatus,
                completed_at: new Date().toISOString()
            });
            await fetchProposals();
        } catch (err: any) {
            logger.error('[useTrades] Error rejecting proposal:', err);
            throw new Error(err.message || 'Errore nel rifiuto proposta');
        }
    };

    const cancelProposal = async (proposalId: string) => {
        try {
            await databases.updateDocument(DB_ID, COLL_TRADE_PROPOSALS, proposalId, {
                status: 'cancelled' as TradeStatus,
                completed_at: new Date().toISOString()
            });
            await fetchProposals();
        } catch (err: any) {
            logger.error('[useTrades] Error cancelling proposal:', err);
            throw new Error(err.message || 'Errore nella cancellazione proposta');
        }
    };

    return {
        receivedProposals,
        sentProposals,
        tradeHistory,
        leagueHistory,
        loading,
        error,
        createProposal,
        acceptProposal,
        rejectProposal,
        cancelProposal,
        refresh: fetchProposals
    };
};
