import { Shield, ChevronDown } from 'lucide-react';
import { ROLE_COLORS } from '../../constants/players';
import { BlockItem } from './types';

interface PlayerDesktopBlockProps {
    item: BlockItem;
    isExpanded: boolean;
    onToggle: () => void;
}

export function PlayerDesktopBlock({ item, isExpanded, onToggle }: PlayerDesktopBlockProps) {
    const fotmobId = item.team_id.replace('team_', '');
    const teamLogoUrl = `https://images.fotmob.com/image_resources/logo/teamlogo/${fotmobId}.png`;

    return (
        <div className="group">
            <div
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition cursor-pointer"
                onClick={onToggle}
            >
                {/* Block Name */}
                <div className="col-span-4 flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={teamLogoUrl}
                            alt={item.team_short_name}
                            className="w-10 h-10 object-contain drop-shadow-md"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=?';
                            }}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-pl-dark rounded-full p-0.5">
                            <Shield size={12} className="text-yellow-500" />
                        </div>
                    </div>
                    <div>
                        <div className="font-semibold text-white group-hover:text-pl-teal transition flex items-center gap-2">
                            Blocco {item.team_short_name}
                            <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-sm text-gray-400">Portieri</div>
                    </div>
                </div>

                {/* Role Badge */}
                <div className="col-span-2 flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS['Portiere']}`}>
                        P
                    </span>
                </div>

                {/* Quotation */}
                <div className="col-span-2 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{item.quotation || '—'}</span>
                </div>

                {/* Purchase Price (Block Price) */}
                <div className="col-span-2 flex items-center justify-center">
                    {item.purchase_price ? (
                        <span className="text-lg font-medium text-pl-teal">{item.purchase_price}</span>
                    ) : (
                        <span className="text-gray-500">—</span>
                    )}
                </div>

                {/* Owner */}
                <div className="col-span-2 flex items-center">
                    <span className={`text-sm ${item.owner ? 'text-gray-300' : 'text-gray-500 italic'}`}>
                        {item.owner || 'Svincolato'}
                    </span>
                </div>
            </div>

            {/* EXPANDED PLAYERS DESKTOP */}
            {isExpanded && (
                <div className="bg-black/20 border-t border-white/5 divide-y divide-white/5">
                    {item.players.map((p) => (
                        <div key={p.$id} className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-white/5 transition opacity-80">
                            <div className="col-span-4 flex items-center gap-3 pl-12">
                                <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-pl-purple to-pl-pink object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=3d195b&color=fff`;
                                    }}
                                />
                                <span className="text-sm text-gray-400 font-medium">{p.name}</span>
                            </div>
                            <div className="col-span-2"></div>
                            <div className="col-span-2"></div>
                            {/* Purchase Price for Individual GK - Optional display */}
                            <div className="col-span-2 flex items-center justify-center">
                                {p.purchase_price ? (
                                    <span className="text-sm font-medium text-pl-teal">{p.purchase_price}</span>
                                ) : (
                                    <span className="text-xs text-gray-600">—</span>
                                )}
                            </div>
                            <div className="col-span-2"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
