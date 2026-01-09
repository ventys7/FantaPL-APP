import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRules } from '../hooks/useRules';
import { TextFormattingToolbar } from '../components/TextFormattingToolbar';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { RulesHeader, RulesTableOfContents, CenniPrincipaliSection, RulesSectionList } from '../components/rules/structure';

export function Rules() {
    const { hasRole } = useAuth();
    const {
        loading, saving, cenniPrincipali, sections, undoHistory,
        setCenniPrincipali, setSections,
        loadRules, saveRules, updateSection, addSection, removeSection,
        addToUndoHistory, undo, clearUndoHistory
    } = useRules();

    const [editMode, setEditMode] = useState(false);
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [, setOpenedFromIndex] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [activeTextarea, setActiveTextarea] = useState<HTMLTextAreaElement | null>(null);
    const [savedSelection, setSavedSelection] = useState<{ start: number, end: number } | null>(null);

    const topRef = useRef<HTMLDivElement>(null);
    const indexRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    // --- Drag and Drop Logic (Array Move) ---
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            setSections((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // --- Text Selection & Formatting Logic ---
    useEffect(() => {
        if (!editMode || !hasRole('admin')) {
            setShowToolbar(false);
            return;
        }

        const handleSelection = (e: Event) => {
            const target = e.target as HTMLTextAreaElement;
            if (target.tagName === 'TEXTAREA' && target.selectionStart !== target.selectionEnd) {
                setActiveTextarea(target);
                setSavedSelection({ start: target.selectionStart, end: target.selectionEnd });
                setShowToolbar(true);
            } else {
                setTimeout(() => {
                    if (target.tagName === 'TEXTAREA' && target.selectionStart === target.selectionEnd) {
                        setShowToolbar(false);
                        setSavedSelection(null);
                    }
                }, 100);
            }
        };

        document.addEventListener('selectionchange', handleSelection as any);
        document.addEventListener('mouseup', handleSelection);

        return () => {
            document.removeEventListener('selectionchange', handleSelection as any);
            document.removeEventListener('mouseup', handleSelection);
        };
    }, [editMode, hasRole]);

    const handleFormat = (tag: string, value?: string) => {
        if (!activeTextarea || !savedSelection) return;

        const { start, end } = savedSelection;
        const selectedText = activeTextarea.value.substring(start, end);
        if (!selectedText) return;

        let formattedText = '';
        switch (tag) {
            case 'strong': formattedText = `<strong>${selectedText}</strong>`; break;
            case 'em': formattedText = `<em>${selectedText}</em>`; break;
            case 'u': formattedText = `<u>${selectedText}</u>`; break;
            case 'font-size-increase': formattedText = `<span style="font-size: 1.2em;">${selectedText}</span>`; break;
            case 'font-size-decrease': formattedText = `<span style="font-size: 0.9em;">${selectedText}</span>`; break;
            case 'color': formattedText = `<span style="color: ${value};">${selectedText}</span>`; break;
            case 'align-left': formattedText = `<div style="text-align: left;">${selectedText}</div>`; break;
            case 'align-center': formattedText = `<div style="text-align: center;">${selectedText}</div>`; break;
            case 'align-right': formattedText = `<div style="text-align: right;">${selectedText}</div>`; break;
            case 'align-justify': formattedText = `<div style="text-align: justify;">${selectedText}</div>`; break;
            default: return;
        }

        const newValue = activeTextarea.value.substring(0, start) + formattedText + activeTextarea.value.substring(end);
        const textareaName = activeTextarea.getAttribute('data-field');

        if (textareaName) {
            addToUndoHistory(textareaName, activeTextarea.value);
        }

        if (textareaName === 'mainText') {
            setCenniPrincipali(prev => ({ ...prev, mainText: newValue }));
        } else if (textareaName === 'partecipanti') {
            setCenniPrincipali(prev => ({ ...prev, partecipanti: newValue }));
        } else if (textareaName?.startsWith('section-')) {
            const sectionId = parseInt(textareaName.replace('section-', ''));
            setSections(prev => prev.map(s => s.id === sectionId ? { ...s, content: newValue } : s));
        }

        setTimeout(() => {
            if (activeTextarea) {
                activeTextarea.focus();
                activeTextarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
            }
        }, 50);
    };

    const handleUndo = () => {
        undo();
        setShowToolbar(true);
    };

    const handleSave = async () => {
        const success = await saveRules();
        if (success) {
            alert('Regolamento salvato con successo!');
            setEditMode(false);
            clearUndoHistory();
        } else {
            alert('Errore durante il salvataggio.');
        }
    };

    // --- Navigation Logic ---
    const scrollToSection = (sectionId: number) => {
        setActiveSection(sectionId);
        setOpenedFromIndex(true);
        setTimeout(() => {
            sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const scrollToIndex = () => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTop = 0;
        }
        setTimeout(() => {
            setActiveSection(null);
            setOpenedFromIndex(false);
        }, 100);
    };

    const toggleSection = (sectionId: number) => {
        if (activeSection === sectionId) {
            setActiveSection(null);
            setOpenedFromIndex(false);
        } else {
            setActiveSection(sectionId);
            setOpenedFromIndex(false);
            setTimeout(() => {
                sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-pl-dark flex items-center justify-center">
                <div className="text-white text-xl">Caricamento regolamento...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pl-dark py-8 md:py-12">
            <div ref={topRef} className="max-w-6xl mx-auto px-4">

                <RulesHeader
                    editMode={editMode}
                    setEditMode={setEditMode}
                    canEdit={hasRole('admin')}
                    subtitle={cenniPrincipali.subtitle || 'PianginaCUP • Stagione 2025/26'}
                    onSubtitleChange={(val) => setCenniPrincipali(prev => ({ ...prev, subtitle: val }))}
                    saving={saving}
                    onSave={handleSave}
                    onCancel={() => { setEditMode(false); clearUndoHistory(); loadRules(); }}
                />

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <RulesTableOfContents
                        cenniTitle={cenniPrincipali.title || '1. Cenni Principali'}
                        sections={sections}
                        activeSection={activeSection}
                        scrollToSection={scrollToSection}
                    />

                    <div className="flex-1 order-2 space-y-6">
                        <CenniPrincipaliSection
                            title={cenniPrincipali.title || '1. Cenni Principali e Avvertenze'}
                            mainText={cenniPrincipali.mainText}
                            editMode={editMode}
                            canEdit={hasRole('admin')}
                            setTitle={(val) => setCenniPrincipali(prev => ({ ...prev, title: val }))}
                            setMainText={(val) => setCenniPrincipali(prev => ({ ...prev, mainText: val }))}
                            setRef={(el) => sectionRefs.current[-1] = el}
                        />

                        <RulesSectionList
                            sections={sections}
                            editMode={editMode}
                            canEdit={hasRole('admin')}
                            activeSection={activeSection}
                            toggleSection={toggleSection}
                            updateSection={updateSection}
                            addSection={addSection}
                            removeSection={removeSection}
                            onDragEnd={handleDragEnd}
                            setSectionRef={(id, el) => sectionRefs.current[id] = el}
                            scrollToIndex={scrollToIndex}
                        />

                        <div className="h-8" />
                    </div>

                    {editMode && hasRole('admin') && (
                        <TextFormattingToolbar
                            visible={showToolbar}
                            onFormat={handleFormat}
                            onUndo={handleUndo}
                            canUndo={undoHistory.length > 0}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

