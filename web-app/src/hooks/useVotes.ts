import { useState } from 'react';
import { PlayerPerformance } from '../services/votingService';

export const useVotes = () => {
    const [performances, setPerformances] = useState<Record<string, PlayerPerformance>>({});

    const handleValueChange = (playerId: string, field: keyof PlayerPerformance, value: any) => {
        setPerformances(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [field]: value,
                // Ensure defaults
                player_id: playerId,
                minutes_played: prev[playerId]?.minutes_played ?? 90,
            }
        }));
    };

    const increment = (playerId: string, field: keyof PlayerPerformance) => {
        const current = (performances[playerId] as any)?.[field] || 0;
        handleValueChange(playerId, field, current + 1);
    };

    const decrement = (playerId: string, field: keyof PlayerPerformance) => {
        const current = (performances[playerId] as any)?.[field] || 0;
        if (current > 0) handleValueChange(playerId, field, current - 1);
    };

    const calculatePreviewScore = (p: PlayerPerformance) => {
        let score = p.vote_base || 0;
        if (!p.vote_base) return 0;

        score += ((p.goals_scored || 0) * 3);
        score += ((p.assists || 0) * 1);
        score -= ((p.yellow_cards || 0) * 0.5);
        score -= ((p.red_cards || 0) * 1);
        score += ((p.penalties_scored || 0) * 3);
        score -= ((p.penalties_missed || 0) * 3);
        score += ((p.penalties_saved || 0) * 3);
        score -= ((p.own_goals || 0) * 2);
        if (p.clean_sheet) score += 1; // Corrected bonus for clean sheet if needed, previously +2

        return score;
    };

    const getPerformance = (playerId: string): PlayerPerformance => {
        return performances[playerId] || {
            player_id: playerId,
            vote_base: 0,
            goals_scored: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
            penalties_scored: 0,
            penalties_missed: 0,
            penalties_saved: 0,
            own_goals: 0,
            clean_sheet: false,
            minutes_played: 90
        };
    };

    return {
        performances,
        handleValueChange,
        increment,
        decrement,
        calculatePreviewScore,
        getPerformance,
        setPerformances
    };
};
