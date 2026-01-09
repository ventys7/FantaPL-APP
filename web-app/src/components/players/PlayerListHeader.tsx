import { ChevronUp, ChevronDown } from 'lucide-react';

type SortKey = 'position' | 'quotation' | 'purchase_price' | null;
type SortDirection = 'asc' | 'desc';

interface PlayerListHeaderProps {
    sortKey: SortKey;
    sortDirection: SortDirection;
    onSort: (key: SortKey) => void;
}

export function PlayerListHeader({ sortKey, sortDirection, onSort }: PlayerListHeaderProps) {
    return (
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 text-gray-400 text-sm font-medium uppercase tracking-wider">
            <div className="col-span-4">Giocatore</div>
            <div
                className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white transition"
                onClick={() => onSort('position')}
            >
                Ruolo
                {sortKey === 'position' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                )}
            </div>
            <div
                className="col-span-2 text-center flex items-center justify-center gap-1 cursor-pointer hover:text-white transition"
                onClick={() => onSort('quotation')}
            >
                Quot.
                {sortKey === 'quotation' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                )}
            </div>
            <div
                className="col-span-2 text-center flex items-center justify-center gap-1 cursor-pointer hover:text-white transition"
                onClick={() => onSort('purchase_price')}
            >
                Prezzo
                {sortKey === 'purchase_price' && (
                    sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                )}
            </div>
            <div className="col-span-2">Proprietario</div>
        </div>
    );
}
