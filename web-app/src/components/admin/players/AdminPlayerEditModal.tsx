import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Pen, Save, Shield, Loader2 } from 'lucide-react';
import { Player } from '../../../hooks/usePlayers';
import { ROLES } from '../../../constants/players';
import { Manager, PlayerEditForm } from './types';

interface AdminPlayerEditModalProps {
    isOpen: boolean;
    player: Player | null;
    managers: Manager[];
    onClose: () => void;
    onSave: (player: Player, data: PlayerEditForm) => Promise<void>;
}

export const AdminPlayerEditModal = ({ isOpen, player, managers, onClose, onSave }: AdminPlayerEditModalProps) => {
    const [form, setForm] = useState<PlayerEditForm>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (player) {
            setForm({
                position: player.position,
                quotation: player.quotation || 0,
                purchase_price: player.purchase_price || 0,
                owner: player.owner || ''
            });
        }
    }, [player]);

    const handleSave = async () => {
        if (!player) return;
        setSaving(true);
        try {
            await onSave(player, form);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !player) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative w-full max-w-lg mx-4 bg-[#18181b] rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pl-teal/50 to-transparent"></div>

                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Pen size={18} className="text-pl-teal" />
                            Modifica Giocatore
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">{player.name} ({player.team_short_name})</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition p-2 hover:bg-white/10 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">

                    {/* Role Select */}
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Ruolo Fanta</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {ROLES.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setForm({ ...form, position: role })}
                                    className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase transition border ${form.position === role
                                        ? role === 'Portiere' ? 'bg-yellow-500 text-black border-yellow-500' :
                                            role === 'Difensore' ? 'bg-blue-500 text-white border-blue-500' :
                                                role === 'Centrocampista' ? 'bg-green-500 text-white border-green-500' :
                                                    'bg-red-500 text-white border-red-500'
                                        : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quotation */}
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Quotazione</label>
                            <input
                                type="number"
                                value={form.quotation}
                                onChange={e => setForm({ ...form, quotation: e.target.value })}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pl-teal outline-none transition font-mono"
                            />
                        </div>
                        {/* Price */}
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Prezzo Acquisto</label>
                            <input
                                type="number"
                                value={form.purchase_price}
                                onChange={e => setForm({ ...form, purchase_price: e.target.value })}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pl-teal outline-none transition font-mono"
                            />
                        </div>
                    </div>

                    {/* Owner */}
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase font-bold text-gray-500 tracking-wider flex justify-between">
                            Proprietario
                            {form.position === 'Portiere' && <span className="text-pl-teal text-[10px] items-center flex gap-1"><Shield size={10} /> Gestito da Blocco Squadra</span>}
                        </label>
                        <select
                            value={form.owner || ''}
                            onChange={e => setForm({ ...form, owner: e.target.value })}
                            disabled={form.position === 'Portiere'}
                            className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pl-teal outline-none transition ${form.position === 'Portiere' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <option value="">-- Svincolato --</option>
                            {managers.map(m => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-pl-dark bg-pl-teal hover:bg-pl-teal/90 transition shadow-lg shadow-pl-teal/20 flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salva Modifiche
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};
