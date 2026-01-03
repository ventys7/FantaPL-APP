import { useState } from 'react';
import { Archive, Clock } from 'lucide-react';
import { ArchivedRules } from '../../types/rules';
import { ArchiveModal } from './ArchiveModal';

interface ArchiveSectionProps {
    archives: ArchivedRules[];
}

export function ArchiveSection({ archives }: ArchiveSectionProps) {
    const [selectedArchive, setSelectedArchive] = useState<ArchivedRules | null>(null);

    return (
        <>
            <div className="mt-12 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                    <Archive className="w-8 h-8 text-amber-400" />
                    <h2 className="text-2xl font-bold text-white">📜 Archivio Storico</h2>
                </div>

                {archives.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Nessun regolamento archiviato ancora.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {archives.map(archive => (
                            <button
                                key={archive.$id}
                                onClick={() => setSelectedArchive(archive)}
                                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-amber-400/50 transition text-left"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={16} className="text-amber-400" />
                                    <span className="text-lg font-bold text-white">Stagione {archive.season}</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Archiviato il {new Date(archive.archived_at).toLocaleDateString('it-IT', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedArchive && (
                <ArchiveModal
                    archive={selectedArchive}
                    onClose={() => setSelectedArchive(null)}
                />
            )}
        </>
    );
}
