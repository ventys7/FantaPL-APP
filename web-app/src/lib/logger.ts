const isDev = import.meta.env.DEV;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LoggerContext {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
}

function createLogMethod(level: LogLevel, prefix: string) {
    const levelTag = `[${level.toUpperCase()}]`;
    const consoleFn = level === 'debug' ? console.debug :
        level === 'warn' ? console.warn :
            level === 'error' ? console.error : console.log;

    return (...args: unknown[]) => {
        // Errors always visible (for production debugging)
        // Other levels only in development
        if (level === 'error' || isDev) {
            consoleFn(levelTag, prefix, ...args);
        }
    };
}

export const logger = {
    info: (...args: unknown[]) => {
        if (isDev) console.log('[INFO]', ...args);
    },
    warn: (...args: unknown[]) => {
        if (isDev) console.warn('[WARN]', ...args);
    },
    error: (...args: unknown[]) => {
        // Errors always visible for debugging
        console.error('[ERROR]', ...args);
    },
    debug: (...args: unknown[]) => {
        if (isDev) console.debug('[DEBUG]', ...args);
    },

    /**
     * Creates a logger with a specific context prefix.
     * Usage: const log = logger.withContext('useTrades');
     *        log.info('Creating proposal');
     */
    withContext: (context: string): LoggerContext => {
        const prefix = `[${context}]`;
        return {
            info: createLogMethod('info', prefix),
            warn: createLogMethod('warn', prefix),
            error: createLogMethod('error', prefix),
            debug: createLogMethod('debug', prefix)
        };
    }
};
