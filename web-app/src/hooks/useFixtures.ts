import { useState, useCallback, useEffect, useMemo } from 'react';
import { functions } from '../lib/appwrite';
import { logger } from '../lib/logger';
import { ExecutionMethod } from 'appwrite';

const GET_PL_FIXTURES_FUNCTION_ID = '695a6d7100173e92ccfd';

export interface Fixture {
    id: string;
    gameweek: number;
    date: string;
    status: string;
    minute: string | null;
    home: {
        id: string;
        name: string;
        shortName: string;
        logo: string;
    };
    away: {
        id: string;
        name: string;
        shortName: string;
        logo: string;
    };
    homeScore: number | null;
    awayScore: number | null;
}

export function useFixtures() {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchFixtures = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const execution = await functions.createExecution(
                GET_PL_FIXTURES_FUNCTION_ID,
                JSON.stringify({}), // Get all fixtures
                false,
                '/',
                ExecutionMethod.POST
            );

            const response = JSON.parse(execution.responseBody);

            if (response.success && response.fixtures) {
                setFixtures(response.fixtures);
                setLastUpdate(new Date());
            }
        } catch (error) {
            logger.error('[useFixtures] Error fetching fixtures:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchFixtures();
    }, [fetchFixtures]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchFixtures(true); // Silent refresh
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchFixtures]);

    // Calculate active gameweek (first non-finished match)
    // Ref: Forces HMR update
    // Calculate active gameweek: switch at 00:00 of the day before the first match of the gameweek
    const activeGameweek = useMemo(() => {
        if (!fixtures.length) return 1;

        const now = new Date();
        const gameweeks = Array.from(new Set(fixtures.map(f => f.gameweek))).sort((a, b) => a - b);
        let currentGw = 1;

        for (const gw of gameweeks) {
            const gwFixtures = fixtures.filter(f => f.gameweek === gw);
            const firstMatchDate = new Date(Math.min(...gwFixtures.map(f => new Date(f.date).getTime())));

            // Activation time: Midnight (00:00) of the day BEFORE the first match
            const activationDate = new Date(firstMatchDate);
            activationDate.setDate(activationDate.getDate() - 1);
            activationDate.setHours(0, 0, 0, 0);

            if (now >= activationDate) {
                currentGw = gw;
            } else {
                // If we haven't reached this gameweek's activation time, break.
                // We stay on the previous one (currentGw).
                break;
            }
        }
        return currentGw;
    }, [fixtures]);

    return {
        fixtures,
        loading,
        refreshing,
        lastUpdate,
        activeGameweek,
        refresh: () => fetchFixtures(true)
    };
}
