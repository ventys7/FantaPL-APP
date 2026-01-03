import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../lib/logger';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-pl-dark text-white p-6 text-center">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pl-teal to-pl-pink mb-4">
                        Oops! Qualcosa è andato storto.
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-md">
                        Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
                    </p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="bg-black/50 p-4 rounded text-left text-xs mb-6 overflow-auto max-w-2xl text-red-300 border border-red-500/20">
                            {this.state.error.toString()}
                        </pre>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-pl-teal text-pl-dark font-bold py-3 px-8 rounded-full hover:bg-pl-teal/90 transition-transform hover:scale-105"
                    >
                        Ricarica Pagina
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
