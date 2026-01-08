import { AppwriteDocument } from './shared';

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface TradeProposal extends AppwriteDocument {
    proposer_user_id: string;
    receiver_user_id: string;
    proposer_team_id: string;
    receiver_team_id: string;
    proposer_players: string[];      // Array of player $id
    receiver_players: string[];      // Array of player $id
    proposer_gk_blocks: string[];    // Array of real_team $id (GK blocks)
    receiver_gk_blocks: string[];    // Array of real_team $id (GK blocks)
    credits_offered: number;         // + = proposer gives, - = proposer receives
    status: TradeStatus;
    completed_at?: string;           // ISO date when accepted/rejected/cancelled
}

// Helper type for trade creation (without Appwrite document fields)
export interface CreateTradePayload {
    proposer_user_id: string;
    receiver_user_id: string;
    proposer_team_id: string;
    receiver_team_id: string;
    proposer_players: string[];
    receiver_players: string[];
    proposer_gk_blocks: string[];
    receiver_gk_blocks: string[];
    credits_offered: number;
}
