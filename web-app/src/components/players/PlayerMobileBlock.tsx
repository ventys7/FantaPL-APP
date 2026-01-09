import { Shield, ChevronDown } from 'lucide-react';
import { ROLE_COLORS } from '../../constants/players';
import { BlockItem } from './types';

interface PlayerMobileBlockProps {
    item: BlockItem;
    isExpanded: boolean;
    onToggle: () => void;
}

export function PlayerMobileBlock({ item, isExpanded, onToggle }: PlayerMobileBlockProps) {
    const fotmobId = item.team_id.replace('team_', '');
    const teamLogoUrl = `https://images.fotmob.com/image_resources/logo/teamlogo/${fotmobId}.png`;

    return (
        <div className="group">
            <div
                className="p-4 hover:bg-white/5 transition"
                onClick={onToggle}
            >
                <div className="flex items-start gap-3">
                    {/* Team Logo (Replaces Player Image) */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={teamLogoUrl}
                            alt={item.team_short_name}
                            className="w-12 h-12 object-contain drop-shadow-md"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=?';
                            }}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-pl-dark rounded-full p-0.5">
                            <Shield size={12} className="text-yellow-500" />
                        </div>
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS['Portiere']}`}>
                                P
                            </span>
                            <span className="font-semibold text-white truncate flex items-center gap-1">
                                Blocco {item.team_short_name}
                                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">Portieri</div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <span className="text-gray-500">Quot:</span>
                                <span className="font-bold text-white">{item.quotation || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-gray-500">Acq:</span>
                                <span className="font-medium text-pl-teal">{item.purchase_price || '—'}</span>
                            </div>
                            {item.owner && (
                                <div className="text-gray-400 truncate">
                                    👤 {item.owner}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* EXPANDED PLAYERS MOBILE */}
            {isExpanded && (
                <div className="bg-black/20 border-t border-white/5 px-4 py-2 space-y-2">
                    {item.players.map((p) => (
                        <div key={p.$id} className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-3">
                                <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-pl-purple to-pl-pink object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=3d195b&color=fff`;
                                    }}
                                />
                                <span className="text-gray-300 text-sm font-medium">{p.name}</span>
                            </div>
                            {p.purchase_price ? (
                                <span className="text-xs font-medium text-pl-teal">{p.purchase_price} cr</span>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
