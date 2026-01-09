import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
};

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-pl-teal`} />
            {text && <span className="text-gray-400 text-sm">{text}</span>}
        </div>
    );
}

interface FullPageLoaderProps {
    text?: string;
}

export function FullPageLoader({ text = 'Caricamento...' }: FullPageLoaderProps) {
    return (
        <div className="min-h-screen bg-pl-dark flex items-center justify-center">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}
