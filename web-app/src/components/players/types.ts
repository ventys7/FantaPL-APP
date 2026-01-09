import { Player } from '../../hooks/usePlayers';

export interface BlockItem {
    isBlock: true;
    id: string;
    team_id: string;
    team_name: string;
    team_short_name: string;
    position: 'Portiere';
    quotation: number;
    purchase_price: number;
    owner: string | null;
    players: Player[];
}

export type PlayerListItem = Player | BlockItem;

export function isBlockItem(item: PlayerListItem): item is BlockItem {
    return (item as BlockItem).isBlock === true;
}
