import { ROLE_COLORS, ROLE_ABBR } from '../../constants/players';
import { Player } from '../../hooks/usePlayers';

interface PlayerMobileCardProps {
    player: Player;
}

export function PlayerMobileCard({ player }: PlayerMobileCardProps) {
    return (
        <div className="p-4 hover:bg-white/5 transition">
            <div className="flex items-start gap-3">
                {/* Player Image */}
                <img
                    src={player.image_url}
                    alt={player.name}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-pl-purple to-pl-pink object-cover flex-shrink-0"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=3d195b&color=fff`;
                    }}
                />

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS[player.position] || ROLE_COLORS['Unknown']}`}>
                            {ROLE_ABBR[player.position] || '?'}
                        </span>
                        <span className={`font-semibold truncate ${player.is_active ? 'text-white' : 'text-gray-500 italic decoration-slate-600'}`}>
                            {player.name} {!player.is_active && '*'}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{player.team_short_name}</div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500">Quot:</span>
                            <span className="font-bold text-white">{player.quotation || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500">Acq:</span>
                            <span className="font-medium text-pl-teal">{player.purchase_price || '—'}</span>
                        </div>
                        {player.owner && (
                            <div className="text-gray-400 truncate">
                                👤 {player.owner}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
