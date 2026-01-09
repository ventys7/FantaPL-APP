import { Trash2 } from 'lucide-react';
import { Player } from '../../../hooks/usePlayers';

interface AdminPlayerListProps {
    players: Player[];
    onEdit: (player: Player) => void;
    onDelete: (e: React.MouseEvent, player: Player) => void;
}

export const AdminPlayerList = ({ players, onEdit, onDelete }: AdminPlayerListProps) => {
    return (
        <>
            {/* Desktop Table Container */}
            <div className="hidden md:block bg-[#1e1e24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl max-w-6xl mx-auto">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-base">
                        <thead className="bg-black/40 text-gray-400 font-bold uppercase text-sm tracking-wider sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="px-6 py-4">Giocatore</th>
                                <th className="px-6 py-4 w-40">Ruolo</th>
                                <th className="px-6 py-4 w-32 text-center">Quotazione</th>
                                <th className="px-6 py-4 w-32 text-center">Prezzo</th>
                                <th className="px-6 py-4 w-56">Proprietario</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {players.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">
                                        Nessun giocatore trovato
                                    </td>
                                </tr>
                            ) : (
                                players.slice(0, 150).map(player => (
                                    <tr
                                        key={player.$id}
                                        onClick={() => onEdit(player)}
                                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                    >
                                        {/* NAME */}
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                {/* Optional: Add Image Avatar here if available */}
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold transition-colors text-base flex items-center gap-2 ${!player.is_active ? 'text-gray-500 italic decoration-slate-600' : 'text-white group-hover:text-pl-teal'}`}>
                                                        {player.name} {!player.is_active && '*'}
                                                        {!player.is_active && (
                                                            <button
                                                                onClick={(e) => onDelete(e, player)}
                                                                title="Elimina definitivamente"
                                                                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-1 rounded transition ml-2"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </span>
                                                    <span className={`text-xs uppercase tracking-wide font-medium ${!player.is_active ? 'text-gray-600' : 'text-gray-500'}`}>{player.team_short_name}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* ROLE */}
                                        <td className="px-6 py-3">
                                            <span className={`px-2.5 py-1 rounded-md text-xs uppercase font-bold tracking-widest border border-current opacity-80
                                                ${player.position === 'Portiere' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10' :
                                                    player.position === 'Difensore' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' :
                                                        player.position === 'Centrocampista' ? 'text-green-500 border-green-500/20 bg-green-500/10' :
                                                            'text-red-500 border-red-500/20 bg-red-500/10'}`}>
                                                {player.position}
                                            </span>
                                        </td>

                                        {/* QUOTATION */}
                                        <td className="px-6 py-3 text-center">
                                            <span className="text-gray-300 font-mono text-base">{player.quotation}</span>
                                        </td>

                                        {/* PRICE */}
                                        <td className="px-6 py-3 text-center">
                                            <span className={`font-mono text-base ${player.purchase_price > 0 ? 'text-pl-teal font-bold' : 'text-gray-600'}`}>
                                                {player.purchase_price || '-'}
                                            </span>
                                        </td>

                                        {/* OWNER */}
                                        <td className="px-6 py-3">
                                            {player.owner ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-pl-teal shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>
                                                    <span className="text-sm text-white font-medium">{player.owner}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-600 italic">Svincolato</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Mobile Cards Container */}
            <div className="md:hidden space-y-3 pb-20 w-full max-w-2xl mx-auto">
                {players.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-white/5 rounded-xl border border-white/5">
                        Nessun risultato
                    </div>
                ) : (
                    players.slice(0, 50).map(player => (
                        <div
                            key={player.$id}
                            onClick={() => onEdit(player)}
                            className="bg-[#1e1e24] border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer shadow-lg relative overflow-hidden"
                        >
                            {/* Role Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${player.position === 'Portiere' ? 'bg-yellow-500' :
                                player.position === 'Difensore' ? 'bg-blue-500' :
                                    player.position === 'Centrocampista' ? 'bg-green-500' :
                                        'bg-red-500'
                                }`} />

                            <div className="flex justify-between items-start pl-3">
                                <div className="flex-1 min-w-0 pr-2 text-left">
                                    <h3 className={`font-bold text-base flex items-center justify-start gap-2 ${!player.is_active ? 'text-gray-500 italic' : 'text-white'}`}>
                                        <span className="truncate">{player.name}</span>
                                        {!player.is_active && '*'}
                                        {!player.is_active && (
                                            <button
                                                onClick={(e) => onDelete(e, player)}
                                                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-1 rounded-full transition flex-shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </h3>
                                    <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mt-0.5 mb-1 truncate">
                                        {player.team_short_name || player.team_name || '-'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Prezzo</div>
                                    <div className={`font-mono font-bold ${player.purchase_price > 0 ? 'text-pl-teal' : 'text-gray-600'}`}>
                                        {player.purchase_price || '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between pl-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Quotazione</span>
                                    <span className="text-sm text-white font-mono">{player.quotation}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Proprietario</span>
                                    {player.owner ? (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-pl-teal shadow-[0_0_6px_rgba(56,189,248,0.5)]"></div>
                                            <span className="text-xs text-white font-medium">{player.owner}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-600 italic mt-0.5">Svincolato</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {players.length > 50 && (
                    <div className="py-3 text-center text-xs text-gray-600">
                        Mostrati primi 50. Usa i filtri.
                    </div>
                )}
            </div>
        </>
    );
};
