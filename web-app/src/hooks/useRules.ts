import { useState, useEffect } from 'react';
import { databases, DB_ID, COLL_SETTINGS, COLL_ARCHIVE } from '../lib/appwrite';
import { Query } from 'appwrite';
import { Section, ArchivedRules, CenniPrincipali } from '../types/rules';
import { logger } from '../lib/logger';

// Default sections data
const DEFAULT_SECTIONS: Section[] = [
    { id: 2, title: '2. Ruoli Lega', key: 'ruoliLega', content: '' },
    { id: 3, title: '3. Modalità Asta, Composizione Rosa, Bonus & Malus', key: 'astaRosa', content: '' },
    { id: 4, title: '4. Formazione della Squadra', key: 'formazione', content: '' },
    { id: 5, title: '5. Svolgimento Giornata Campionato', key: 'giornata', content: '' },
    { id: 6, title: '6. Campionato con Girone e Playoff', key: 'campionato', content: '' },
    { id: 7, title: '7. Coppa (Coppa Italia e Supercoppa)', key: 'coppa', content: '' },
    { id: 8, title: '8. Champions/Europa League', key: 'champions', content: '' },
    { id: 9, title: '9. Mercato e Scambi', key: 'mercato', content: '' },
    { id: 10, title: '10. Premi', key: 'premi', content: '' },
    { id: 11, title: '11. Clausole e Punizioni', key: 'clausole', content: '' },
    { id: 12, title: '12. Conclusione', key: 'conclusione', content: '' },
    { id: 13, title: '13. Link Utili', key: 'link', content: '' }
];

const DEFAULT_CENNI: CenniPrincipali = {
    title: '1. Cenni Principali e Avvertenze',
    mainText: 'Il "PianginaCUP" è a titolo gratuito.',
    partecipanti: 'Partecipanti:\n1. Manager 1\n2. Manager 2'
};

export function useRules() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cenniPrincipali, setCenniPrincipali] = useState<CenniPrincipali>(DEFAULT_CENNI);
    const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
    const [archivedRules, setArchivedRules] = useState<ArchivedRules[]>([]);
    const [undoHistory, setUndoHistory] = useState<{ field: string, value: string }[]>([]);
    const [docId, setDocId] = useState<string | null>(null);

    const loadRules = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, COLL_SETTINGS);
            if (response.documents.length > 0) {
                const doc = response.documents[0];
                setDocId(doc.$id);

                if (doc.cenni_main_text) {
                    setCenniPrincipali({
                        mainText: doc.cenni_main_text,
                        partecipanti: doc.cenni_partecipanti || DEFAULT_CENNI.partecipanti
                    });
                }

                if (doc.sections_json) {
                    try {
                        const parsed = JSON.parse(doc.sections_json);
                        if (Array.isArray(parsed)) {
                            // Legacy: it's just the array
                            setSections(parsed);
                        } else if (parsed.sections) {
                            // New format: { mainTitle, sections }
                            setSections(parsed.sections);
                            if (parsed.mainTitle) {
                                setCenniPrincipali(prev => ({ ...prev, title: parsed.mainTitle }));
                            }
                        }
                    } catch (e) {
                        logger.error('Error parsing sections:', e);
                    }
                }
            }
        } catch (error) {
            logger.error('Error loading rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadArchive = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, COLL_ARCHIVE, [
                Query.orderDesc('archived_at')
            ]);
            setArchivedRules(response.documents as unknown as ArchivedRules[]);
        } catch (error) {
            logger.info('Archive collection may not exist yet:', error);
            setArchivedRules([]);
        }
    };

    const saveRules = async () => {
        if (!docId) return false;

        setSaving(true);
        try {
            // Check if we need to wrap sections with new title or just array
            const dataToSave = {
                mainTitle: cenniPrincipali.title,
                sections: sections
            };

            await databases.updateDocument(DB_ID, COLL_SETTINGS, docId, {
                cenni_main_text: cenniPrincipali.mainText,
                cenni_partecipanti: cenniPrincipali.partecipanti,
                sections_json: JSON.stringify(dataToSave)
            });
            return true;
        } catch (error) {
            logger.error('Error saving rules:', error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const updateSection = (id: number, field: keyof Section, value: string) => {
        setSections(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const addSection = () => {
        const newId = Math.max(...sections.map(s => s.id)) + 1;
        setSections(prev => [...prev, {
            id: newId,
            title: `${newId}. Nuova Sezione`,
            key: `section${newId}`,
            content: ''
        }]);
    };

    const removeSection = (id: number) => {
        if (confirm('Sei sicuro di voler eliminare questa sezione?')) {
            setSections(prev => prev.filter(s => s.id !== id));
        }
    };

    const addToUndoHistory = (field: string, value: string) => {
        setUndoHistory(prev => [...prev, { field, value }]);
    };

    const undo = () => {
        if (undoHistory.length === 0) return;

        const lastEntry = undoHistory[undoHistory.length - 1];
        setUndoHistory(prev => prev.slice(0, -1));

        if (lastEntry.field === 'mainText') {
            setCenniPrincipali(prev => ({ ...prev, mainText: lastEntry.value }));
        } else if (lastEntry.field === 'partecipanti') {
            setCenniPrincipali(prev => ({ ...prev, partecipanti: lastEntry.value }));
        } else if (lastEntry.field.startsWith('section-')) {
            const sectionId = parseInt(lastEntry.field.replace('section-', ''));
            setSections(prev => prev.map(s =>
                s.id === sectionId ? { ...s, content: lastEntry.value } : s
            ));
        }
    };

    const clearUndoHistory = () => {
        setUndoHistory([]);
    };

    useEffect(() => {
        loadRules();
        loadArchive();
    }, []);

    return {
        // State
        loading,
        saving,
        cenniPrincipali,
        sections,
        archivedRules,
        undoHistory,

        // Setters
        setCenniPrincipali,
        setSections,

        // Actions
        loadRules,
        saveRules,
        updateSection,
        addSection,
        removeSection,
        addToUndoHistory,
        undo,
        clearUndoHistory
    };
}
