import { AppwriteException } from 'appwrite';

/**
 * Standardized application error interface
 */
export interface AppError {
    code: string;
    message: string;
    context?: Record<string, unknown>;
    originalError?: unknown;
}

/**
 * Common error codes used across the application
 */
export const ErrorCodes = {
    UNKNOWN: 'UNKNOWN',
    NETWORK: 'NETWORK_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION: 'VALIDATION_ERROR',
    RATE_LIMIT: 'RATE_LIMIT',
} as const;

/**
 * Converts various error types to a standardized AppError
 */
export function normalizeError(error: unknown, context?: Record<string, unknown>): AppError {
    // Handle Appwrite errors
    if (error instanceof AppwriteException) {
        return {
            code: String(error.code),
            message: error.message,
            context,
            originalError: error
        };
    }

    // Handle standard JS errors
    if (error instanceof Error) {
        let code: string = ErrorCodes.UNKNOWN;

        if (error.message.includes('Network') || error.message.includes('fetch')) {
            code = ErrorCodes.NETWORK;
        }

        return {
            code,
            message: error.message,
            context,
            originalError: error
        };
    }

    // Handle string errors
    if (typeof error === 'string') {
        return {
            code: ErrorCodes.UNKNOWN,
            message: error,
            context
        };
    }

    // Fallback
    return {
        code: ErrorCodes.UNKNOWN,
        message: 'An unexpected error occurred',
        context,
        originalError: error
    };
}

/**
 * Translates common error messages to Italian
 */
export function translateError(error: AppError): string {
    const message = error.message.toLowerCase();

    if (message.includes('invalid credentials') || message.includes('invalid email') || message.includes('invalid password')) {
        return 'Nome utente o password errati';
    }
    if (message.includes('rate limit')) {
        return 'Troppi tentativi. Riprova tra qualche minuto.';
    }
    if (message.includes('network') || message.includes('fetch failed')) {
        return 'Errore di connessione. Controlla la tua rete.';
    }
    if (message.includes('not found')) {
        return 'Risorsa non trovata.';
    }
    if (message.includes('unauthorized') || message.includes('permission')) {
        return 'Non hai i permessi per questa azione.';
    }

    return error.message;
}
