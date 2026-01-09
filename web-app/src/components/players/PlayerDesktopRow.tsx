import { ROLE_COLORS, ROLE_ABBR } from '../../constants/players';
import { Player } from '../../hooks/usePlayers';

interface PlayerDesktopRowProps {
    player: Player;
}

export function PlayerDesktopRow({ player }: PlayerDesktopRowProps) {
    return (
        <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition group">
            {/* Player Name & Team */}
            <div className="col-span-4 flex items-center gap-3">
                <img
                    src={player.image_url}
                    alt={player.name}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-pl-purple to-pl-pink object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=3d195b&color=fff`;
                    }}
                />
                <div>
                    <div className={`font-semibold transition ${player.is_active ? 'text-white group-hover:text-pl-teal' : 'text-gray-500 italic decoration-slate-600'}`}>
                        {player.name} {!player.is_active && '*'}
                    </div>
                    <div className="text-sm text-gray-400">{player.team_short_name}</div>
                </div>
            </div>

            {/* Role Badge */}
            <div className="col-span-2 flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[player.position] || ROLE_COLORS['Unknown']}`}>
                    {ROLE_ABBR[player.position] || '?'}
                </span>
            </div>

            {/* Quotation */}
            <div className="col-span-2 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{player.quotation || '—'}</span>
            </div>

            {/* Purchase Price */}
            <div className="col-span-2 flex items-center justify-center">
                {player.purchase_price ? (
                    <span className="text-lg font-medium text-pl-teal">{player.purchase_price}</span>
                ) : (
                    <span className="text-gray-500">—</span>
                )}
            </div>

            {/* Owner */}
            <div className="col-span-2 flex items-center">
                <span className={`text-sm ${player.owner ? 'text-gray-300' : 'text-gray-500 italic'}`}>
                    {player.owner || 'Svincolato'}
                </span>
            </div>
        </div>
    );
}
