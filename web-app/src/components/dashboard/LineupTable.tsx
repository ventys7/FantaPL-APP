interface LineupPlayer {
    role: string;
    name: string;
    team: string;
    vote: number;
    bonus: number;
    status: 'played' | 'not-played' | 'live';
}

interface LineupTableProps {
    lineup: LineupPlayer[];
}

export const LineupTable = ({ lineup }: LineupTableProps) => {
    return (
        <div className="relative bg-gradient-to-br from-emerald-950/40 via-green-950/30 to-emerald-950/40 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
            {/* Pitch Effect */}
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_30px,rgba(255,255,255,0.1)_30px,rgba(255,255,255,0.1)_32px)]" />
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.1)_40px,rgba(255,255,255,0.1)_42px)]" />

            <div className="relative p-8">
                <h3 className="text-center text-white font-black text-lg mb-8 tracking-[0.3em] opacity-90 flex items-center justify-center gap-3">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-pl-teal to-transparent" />
                    STARTING XI
                    <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-pl-teal to-transparent" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lineup.map((player, i) => (
                        <div
                            key={i}
                            className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center justify-between hover:border-pl-teal hover:shadow-lg hover:shadow-pl-teal/30 transition-all duration-300 hover:scale-105"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs shadow-lg transition-transform group-hover:scale-110 ${player.role === 'GK' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                                    player.role === 'DEF' ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' :
                                        player.role === 'MID' ? 'bg-gradient-to-br from-green-500 to-green-700 text-white' :
                                            'bg-gradient-to-br from-red-500 to-red-700 text-white'
                                    }`}>
                                    {player.role}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-white group-hover:text-pl-teal transition-colors">
                                        {player.name}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">{player.team}</div>
                                </div>
                            </div>

                            <div className="text-right">
                                {player.status === 'not-played' ? (
                                    <span className="text-gray-500 text-xs font-bold bg-gray-500/20 px-2 py-1 rounded">DNP</span>
                                ) : (
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black bg-gradient-to-br from-white to-pl-teal bg-clip-text text-transparent">
                                            {(player.vote + player.bonus).toFixed(1)}
                                        </span>
                                        {player.bonus !== 0 && (
                                            <span className={`text-xs font-bold ${player.bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {player.bonus > 0 ? '+' : ''}{player.bonus}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
