import { X } from 'lucide-react';
import { ArchivedRules, Section } from '../../types/rules';

interface ArchiveModalProps {
    archive: ArchivedRules;
    onClose: () => void;
}

export function ArchiveModal({ archive, onClose }: ArchiveModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-pl-dark border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Regolamento Stagione {archive.season}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Archiviato il {new Date(archive.archived_at).toLocaleDateString('it-IT')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="mb-8">
                        <h4 className="text-xl font-bold text-pl-teal mb-4">1. Cenni Principali</h4>
                        <div
                            className="text-gray-200 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: archive.cenni_main_text?.replace(/\n/g, '<br/>') || '' }}
                        />
                    </div>

                    {archive.sections_json && (
                        <div className="space-y-6">
                            {JSON.parse(archive.sections_json).map((section: Section) => (
                                <div key={section.id}>
                                    <h4 className="text-xl font-bold text-pl-teal mb-3">{section.title}</h4>
                                    <div
                                        className="text-gray-200 leading-relaxed"
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
