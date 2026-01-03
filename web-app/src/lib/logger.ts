const isDev = import.meta.env.DEV;

export const logger = {
    info: (...args: any[]) => {
        if (isDev) {
            console.log('[INFO]', ...args);
        }
    },
    warn: (...args: any[]) => {
        if (isDev) {
            console.warn('[WARN]', ...args);
        }
    },
    error: (...args: any[]) => {
        // Errors usually should still be visible in production for debugging via browser console if needed, 
        // OR we might want to suppress them too. 
        // Typically, we keep errors or send them to a service (Sentry). 
        // For now, we'll log them always or strictly in Dev? 
        // User asked for "debuggable", so removing errors in prod might hide issues.
        // Let's keep errors in prod but tagged.
        console.error('[ERROR]', ...args);
    },
    debug: (...args: any[]) => {
        if (isDev) {
            console.debug('[DEBUG]', ...args);
        }
    }
};
