import { RefreshCw, X } from 'lucide-react';

interface MatchHeaderProps {
    date: string;
    loading: boolean;
    onRefresh: () => void;
    onClose: () => void;
}

export function MatchHeader({ date, loading, onRefresh, onClose }: MatchHeaderProps) {
    return (
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-pl-pink">Match Center</span>
                    </h2>
                    <span className="text-xs text-gray-400">
                        {new Date(date).toLocaleString(undefined, {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className={`p-2 rounded-full hover:bg-white/10 transition ${loading ? 'animate-spin text-pl-teal' : 'text-gray-400'}`}
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                    <X className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
    );
}
