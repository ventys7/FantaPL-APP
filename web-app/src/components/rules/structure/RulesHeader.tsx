import { BookOpen, Edit3, Save, X } from 'lucide-react';

interface RulesHeaderProps {
    editMode: boolean;
    setEditMode: (mode: boolean) => void;
    canEdit: boolean;
    subtitle: string;
    onSubtitleChange: (val: string) => void;
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export function RulesHeader({
    editMode, setEditMode, canEdit,
    subtitle, onSubtitleChange,
    saving, onSave, onCancel
}: RulesHeaderProps) {
    return (
        <>
            <div className="relative mb-10 md:mb-14">
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-pl-pink to-pl-purple rounded-2xl blur-lg opacity-50" />
                            <div className="relative bg-gradient-to-br from-pl-pink to-pl-purple p-4 rounded-2xl">
                                <BookOpen className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent pb-1">
                                Regolamento
                            </h1>
                            {editMode && canEdit ? (
                                <input
                                    type="text"
                                    value={subtitle}
                                    onChange={(e) => onSubtitleChange(e.target.value)}
                                    className="text-gray-400 text-sm md:text-base mt-1 font-medium tracking-wide bg-transparent border-b border-pl-pink/30 focus:outline-none focus:border-pl-pink w-full"
                                />
                            ) : (
                                <p className="text-gray-400 text-sm md:text-base mt-1 font-medium tracking-wide">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {canEdit && (
                        <div className="flex gap-3">
                            {editMode ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-pl-pink/10 border border-pl-pink/30 rounded-xl">
                                    <div className="w-2 h-2 bg-pl-pink rounded-full animate-pulse" />
                                    <span className="text-pl-pink text-sm font-medium">Modifica Attiva</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pl-pink/20 to-pl-purple/20 hover:from-pl-pink/30 hover:to-pl-purple/30 rounded-xl text-white border border-pl-pink/30 hover:border-pl-pink/50 transition-all duration-300"
                                >
                                    <Edit3 size={18} className="group-hover:rotate-12 transition-transform" />
                                    <span className="font-semibold">Modifica</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Save/Cancel Bar */}
            {editMode && canEdit && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 px-6 py-4 z-[9999] flex gap-4">
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-xl text-white border border-green-500/30 transition-all disabled:opacity-50 font-semibold"
                    >
                        <Save size={18} />
                        {saving ? 'Salvataggio...' : 'Salva'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all font-semibold"
                    >
                        <X size={18} />
                        Annulla
                    </button>
                </div>
            )}
        </>
    );
}
