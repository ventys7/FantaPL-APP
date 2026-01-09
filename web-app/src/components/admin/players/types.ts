import { Player } from '../../../hooks/usePlayers';

export interface Manager {
    name: string;
    id: string;
}

export interface PlayerEditForm {
    position?: string;
    quotation?: string | number;
    purchase_price?: string | number;
    owner?: string;
}

export interface RealTeam {
    $id: string;
    name: string;
    short_name?: string;
    logo_url?: string;
    goalkeeper_owner?: string | null;
    goalkeeper_quotation?: number;
    goalkeeper_purchase_price?: number;
}
