import { useState, useRef } from 'react';
import { Shield, Edit2, Save, Upload, X } from 'lucide-react';

interface TeamCardProps {
    teamName: string;
    managerName: string;
    credits: number;
    logoUrl?: string; // Appwrite URL or placeholder
    onUpdate: (name: string, logo?: File) => Promise<void>;
}

export const TeamCard = ({ teamName, managerName, credits, logoUrl, onUpdate }: TeamCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(teamName);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(name, file || undefined);
            setIsEditing(false);
        } catch (error) {
            alert('Errore aggiornamento');
        } finally {
            setSaving(false);
        }
    };

    const displayLogo = previewUrl || logoUrl;

    return (
        <div className="md:col-span-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-pl-pink/20 via-transparent to-pl-blue/20 opacity-30" />

            {/* Logo Section */}
            <div className="relative z-10 group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-black/40 border-4 border-pl-teal/50 flex items-center justify-center overflow-hidden shadow-2xl relative">
                    {displayLogo ? (
                        <img src={displayLogo} alt="Team Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Shield size={64} className="text-gray-500" />
                    )}

                    {isEditing && (
                        <div
                            className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer hover:bg-black/70 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="text-white" size={24} />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="relative z-10 flex-1 text-center md:text-left space-y-4">
                {isEditing ? (
                    <div className="flex flex-col gap-2 max-w-sm mx-auto md:mx-0">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-3xl font-black bg-white/10 border border-white/30 rounded px-2 py-1 text-white focus:outline-none focus:border-pl-pink"
                        />
                        <div className="flex gap-2 justify-center md:justify-start">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-pl-green text-pl-dark px-4 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {saving ? 'Salvataggio...' : 'Salva'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20"
                            >
                                <X size={18} />
                                Annulla
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                                    {teamName}
                                </h1>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-white/10"
                                >
                                    <Edit2 size={20} />
                                </button>
                            </div>
                            <div className="text-pl-teal font-bold text-lg mt-1 flex items-center justify-center md:justify-start gap-2">
                                <span className="bg-pl-teal/10 px-3 py-1 rounded-full text-sm">Manager: {managerName}</span>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-3 bg-black/30 px-6 py-3 rounded-xl border border-white/5">
                            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Budget Residuo</span>
                            <span className="text-2xl font-mono font-bold text-pl-yellow">{credits} <span className="text-sm">cr</span></span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
