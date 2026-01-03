import { useState, useEffect, useRef } from 'react';
import { BookOpen, Edit3, Save, X, ChevronDown, ArrowUp, Plus, Trash2, Archive, Clock } from 'lucide-react';
import { ArchivedRules } from '../types/rules';
import { useAuth } from '../context/AuthContext';
import { useRules } from '../hooks/useRules';
import { ArchiveModal } from '../components/rules/ArchiveModal';
import { EditableText, SortableRulesSection } from '../components/rules';
import { TextFormattingToolbar } from '../components/TextFormattingToolbar';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function Rules() {
    const { user, hasRole } = useAuth();
    const {
        loading, saving, cenniPrincipali, sections, archivedRules, undoHistory,
        setCenniPrincipali, setSections,
        loadRules, saveRules, updateSection, addSection, removeSection,
        addToUndoHistory, undo, clearUndoHistory
    } = useRules();

    const [editMode, setEditMode] = useState(false);
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [openedFromIndex, setOpenedFromIndex] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [activeTextarea, setActiveTextarea] = useState<HTMLTextAreaElement | null>(null);
    const [savedSelection, setSavedSelection] = useState<{ start: number, end: number } | null>(null);
    const [selectedArchive, setSelectedArchive] = useState<ArchivedRules | null>(null);

    const indexRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    // Drag and Drop Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    // Text selection detection for formatting toolbar
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

    const scrollToSection = (sectionId: number) => {
        setActiveSection(sectionId);
        setOpenedFromIndex(true);
        setTimeout(() => {
            sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const scrollToIndex = () => {
        setActiveSection(null);
        setTimeout(() => {
            indexRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const toggleSection = (sectionId: number) => {
        if (activeSection === sectionId) {
            setActiveSection(null);
            setOpenedFromIndex(false);
        } else {
            setActiveSection(sectionId);
            setOpenedFromIndex(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pl-dark via-pl-dark to-pl-purple flex items-center justify-center">
                <div className="text-white text-xl">Caricamento regolamento...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pl-dark via-pl-dark to-pl-purple py-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-10 h-10 text-pl-pink" />
                        <div>
                            <h1 className="text-4xl font-black text-white">Regolamento PianginaCUP</h1>
                            <p className="text-gray-400 text-sm mt-1">Stagione 2025/26</p>
                        </div>
                    </div>

                    {hasRole('admin') && (
                        <div className="flex gap-2">
                            {editMode ? (
                                <span className="text-pl-pink text-sm">✏️ Modalità Modifica Attiva</span>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-pl-pink/20 hover:bg-pl-pink/30 rounded-lg text-white border border-pl-pink/50 transition"
                                >
                                    <Edit3 size={18} />
                                    Modifica
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Floating Save/Cancel Bar */}
                {editMode && hasRole('admin') && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-pl-dark/95 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl px-6 py-3 z-50 flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-white border border-green-500/50 transition disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                        <button
                            onClick={() => { setEditMode(false); clearUndoHistory(); loadRules(); }}
                            className="flex items-center gap-2 px-5 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white border border-red-500/50 transition"
                        >
                            <X size={18} />
                            Annulla
                        </button>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left Sidebar - Index (Sticky on Desktop) */}
                    <div className="w-full md:w-1/4 md:sticky md:top-8 order-1">
                        <div ref={indexRef} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                            <h2 className="text-xl font-bold text-pl-teal mb-4 flex items-center gap-2">
                                📑 Indice
                            </h2>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => scrollToSection(-1)} // -1 for Cenni Principali
                                    className="text-left text-gray-300 hover:text-white font-medium px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
                                >
                                    {cenniPrincipali.title || '1. Cenni Principali e Avvertenze'}
                                </button>
                                {sections.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className="text-left text-gray-300 hover:text-white font-medium px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Archive Dropdown (Below Index) */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mt-4">
                            <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                                <Archive size={24} />
                                Archivio
                            </h2>
                            {archivedRules.length === 0 ? (
                                <p className="text-gray-400 text-sm italic">Nessun archivio.</p>
                            ) : (
                                <div className="space-y-2">
                                    {archivedRules.map(archive => (
                                        <button
                                            key={archive.$id}
                                            onClick={() => setSelectedArchive(archive)}
                                            className="w-full text-left text-gray-300 hover:text-white font-medium px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm flex items-center gap-2"
                                        >
                                            <Clock size={14} className="text-amber-400" />
                                            <span>Stagione {archive.season}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Content - Sections */}
                    <div className="w-full md:w-3/4 order-2 space-y-8">

                        {/* Section 1: Cenni Principali */}
                        <div ref={el => sectionRefs.current[-1] = el} className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                            <div className="text-center mb-8">
                                {editMode && hasRole('admin') ? (
                                    <input
                                        type="text"
                                        value={cenniPrincipali.title || '1. Cenni Principali e Avvertenze'}
                                        onChange={(e) => setCenniPrincipali(prev => ({ ...prev, title: e.target.value }))}
                                        className="text-3xl font-bold text-pl-teal bg-transparent border-b border-pl-pink/30 focus:outline-none focus:border-pl-pink text-center w-full"
                                    />
                                ) : (
                                    <h2 className="text-3xl font-bold text-pl-teal">{cenniPrincipali.title || '1. Cenni Principali e Avvertenze'}</h2>
                                )}
                            </div>
                            <div className="text-gray-200 leading-relaxed space-y-4">
                                <EditableText
                                    value={cenniPrincipali.mainText}
                                    onChange={(val: string) => setCenniPrincipali(prev => ({ ...prev, mainText: val }))}
                                    editMode={editMode}
                                    multiline={true}
                                    dataField="mainText"
                                />
                            </div>
                        </div>

                        {/* Other Sections with Drag and Drop */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={sections.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                                disabled={!editMode || !hasRole('admin')}
                            >
                                <div className="space-y-4">
                                    {editMode && hasRole('admin') && (
                                        <button
                                            onClick={addSection}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-pl-teal/20 hover:bg-pl-teal/30 rounded-xl text-white border border-pl-teal/50 transition"
                                        >
                                            <Plus size={20} />
                                            Aggiungi Sezione
                                        </button>
                                    )}

                                    {sections.map(section => (
                                        <SortableRulesSection
                                            key={section.id}
                                            id={section.id}
                                            editMode={editMode && hasRole('admin')}
                                        >
                                            <div
                                                ref={el => sectionRefs.current[section.id] = el}
                                                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
                                            >
                                                <div
                                                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition"
                                                    onClick={() => toggleSection(section.id)}
                                                >
                                                    {editMode && hasRole('admin') ? (
                                                        <input
                                                            type="text"
                                                            value={section.title}
                                                            onChange={e => updateSection(section.id, 'title', e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                            className="flex-1 text-xl font-bold text-white bg-transparent border-b border-pl-pink/30 focus:outline-none focus:border-pl-pink text-center"
                                                        />
                                                    ) : (
                                                        <h3 className="flex-1 text-xl font-bold text-white text-center">{section.title}</h3>
                                                    )}
                                                    <ChevronDown
                                                        size={24}
                                                        className={`text-gray-400 transition-transform ml-4 ${activeSection === section.id ? 'rotate-180' : ''}`}
                                                    />
                                                    {editMode && hasRole('admin') && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                                                            className="ml-2 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 border border-red-500/50 transition"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>

                                                {activeSection === section.id && (
                                                    <div className="p-6 pt-0 border-t border-white/10">
                                                        <div className="text-gray-200 leading-relaxed space-y-3">
                                                            <EditableText
                                                                value={section.content}
                                                                onChange={(val: string) => updateSection(section.id, 'content', val)}
                                                                editMode={editMode}
                                                                multiline={true}
                                                                dataField={`section-${section.id}`}
                                                            />
                                                        </div>
                                                        {openedFromIndex && activeSection === section.id && (
                                                            <button
                                                                onClick={scrollToIndex}
                                                                className="mt-6 flex items-center gap-2 px-4 py-2 bg-pl-teal/20 hover:bg-pl-teal/30 rounded-lg text-white border border-pl-teal/50 transition mx-auto md:hidden"
                                                            >
                                                                <ArrowUp size={18} />
                                                                Torna all'Indice
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </SortableRulesSection>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <div className="mt-8 text-center text-gray-500 text-sm italic">
                            <p>⚠️ SOLTANTO i membri del Comitato Decisionale possono modificare questo documento.</p>
                        </div>


                    </div>



                    {/* Archive Modal */}
                    {selectedArchive && (
                        <ArchiveModal
                            archive={selectedArchive}
                            onClose={() => setSelectedArchive(null)}
                        />
                    )}

                    {/* Text Formatting Toolbar - Fixed Position (Global) */}
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
