import { X, Archive } from 'lucide-react';
import { ArchivedRules, Section } from '../../types/rules';

interface ArchiveModalProps {
    archive: ArchivedRules;
    onClose: () => void;
}

export function ArchiveModal({ archive, onClose }: ArchiveModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-[#18181b] to-[#0f0f12] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-6 border-b border-white/10 flex items-center justify-between overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5" />
                    <div className="relative flex items-center gap-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl">
                            <Archive className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-white">Stagione {archive.season}</h3>
                            <p className="text-gray-400 text-sm mt-0.5">
                                Archiviato il {new Date(archive.archived_at).toLocaleDateString('it-IT')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="mb-8 bg-white/[0.03] rounded-2xl p-6 border border-white/5">
                        <h4 className="text-lg font-bold bg-gradient-to-r from-pl-teal to-emerald-400 bg-clip-text text-transparent mb-4">
                            1. Cenni Principali
                        </h4>
                        <div
                            className="text-gray-300 leading-relaxed text-[15px]"
                            dangerouslySetInnerHTML={{ __html: archive.cenni_main_text?.replace(/\n/g, '<br/>') || '' }}
                        />
                    </div>

                    {archive.sections_json && (
                        <div className="space-y-4">
                            {JSON.parse(archive.sections_json).map((section: Section) => (
                                <div key={section.id} className="bg-white/[0.03] rounded-2xl p-6 border border-white/5">
                                    <h4 className="text-lg font-bold text-white mb-3">{section.title}</h4>
                                    <div
                                        className="text-gray-300 leading-relaxed text-[15px]"
                                        dangerouslySetInnerHTML={{ __html: section.content?.replace(/\n/g, '<br/>') || '' }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
