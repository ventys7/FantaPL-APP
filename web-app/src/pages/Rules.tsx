import { useState, useEffect, useRef } from 'react';
import { Edit3, Save, X, ChevronDown, ArrowUp, Plus, Trash2, BookText, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRules } from '../hooks/useRules';
import { EditableText, SortableRulesSection } from '../components/rules';
import { TextFormattingToolbar } from '../components/TextFormattingToolbar';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function Rules() {
    const { user, hasRole } = useAuth();
    const {
        loading, saving, cenniPrincipali, sections, undoHistory,
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

    const topRef = useRef<HTMLDivElement>(null);
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
        const mainElement = document.querySelector('main');
        if (mainElement) {
            // Use immediate scroll for reliability
            mainElement.scrollTop = 0;
        }

        // Close section after scroll completes
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
            // Scroll to section after opening
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

                {/* Header */}
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
                                {editMode && hasRole('admin') ? (
                                    <input
                                        type="text"
                                        value={cenniPrincipali.subtitle || 'PianginaCUP • Stagione 2025/26'}
                                        onChange={(e) => setCenniPrincipali(prev => ({ ...prev, subtitle: e.target.value }))}
                                        className="text-gray-400 text-sm md:text-base mt-1 font-medium tracking-wide bg-transparent border-b border-pl-pink/30 focus:outline-none focus:border-pl-pink w-full"
                                    />
                                ) : (
                                    <p className="text-gray-400 text-sm md:text-base mt-1 font-medium tracking-wide">
                                        {cenniPrincipali.subtitle || 'PianginaCUP • Stagione 2025/26'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {hasRole('admin') && (
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

                {/* Floating Save/Cancel Bar - Enhanced */}
                {editMode && hasRole('admin') && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 px-6 py-4 z-50 flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-xl text-white border border-green-500/30 transition-all disabled:opacity-50 font-semibold"
                        >
                            <Save size={18} />
                            {saving ? 'Salvataggio...' : 'Salva'}
                        </button>
                        <button
                            onClick={() => { setEditMode(false); clearUndoHistory(); loadRules(); }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all font-semibold"
                        >
                            <X size={18} />
                            Annulla
                        </button>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Sidebar - Index (Sticky) */}
                    <div className="w-full lg:w-72 lg:sticky lg:top-8 order-1 space-y-5">
                        {/* Index Card */}
                        <div ref={indexRef} className="group bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2.5">
                                <div className="p-2 bg-pl-teal/20 rounded-lg">
                                    <BookText size={18} className="text-pl-teal" />
                                </div>
                                Indice
                            </h2>
                            <nav className="flex flex-col gap-1.5">
                                <button
                                    onClick={() => scrollToSection(-1)}
                                    className={`text-left text-sm font-medium px-3.5 py-2.5 rounded-xl transition-all duration-200 ${activeSection === -1
                                        ? 'bg-pl-teal/20 text-pl-teal border border-pl-teal/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {cenniPrincipali.title || '1. Cenni Principali'}
                                </button>
                                {sections.map((section, idx) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`text-left text-sm font-medium px-3.5 py-2.5 rounded-xl transition-all duration-200 ${activeSection === section.id
                                            ? 'bg-pl-teal/20 text-pl-teal border border-pl-teal/30'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Right Content - Sections */}
                    <div className="flex-1 order-2 space-y-6">

                        {/* Section 1: Cenni Principali - Featured */}
                        <div
                            ref={el => sectionRefs.current[-1] = el}
                            className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/10 overflow-hidden"
                        >
                            {/* Decorative accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pl-pink via-pl-purple to-pl-teal" />

                            <div className="text-center mb-8">
                                {editMode && hasRole('admin') ? (
                                    <input
                                        type="text"
                                        value={cenniPrincipali.title || '1. Cenni Principali e Avvertenze'}
                                        onChange={(e) => setCenniPrincipali(prev => ({ ...prev, title: e.target.value }))}
                                        className="text-2xl md:text-3xl font-bold text-pl-teal bg-transparent border-b-2 border-pl-pink/30 focus:outline-none focus:border-pl-pink text-center w-full pb-2"
                                    />
                                ) : (
                                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pl-teal to-emerald-400 bg-clip-text text-transparent">
                                        {cenniPrincipali.title || '1. Cenni Principali e Avvertenze'}
                                    </h2>
                                )}
                            </div>
                            <div className="text-gray-300 leading-relaxed space-y-4 text-[15px]">
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
                                            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-pl-teal/10 to-emerald-500/10 hover:from-pl-teal/20 hover:to-emerald-500/20 rounded-2xl text-pl-teal border border-pl-teal/20 hover:border-pl-teal/40 transition-all font-semibold"
                                        >
                                            <Plus size={20} />
                                            Aggiungi Sezione
                                        </button>
                                    )}

                                    {sections.map((section, idx) => (
                                        <SortableRulesSection
                                            key={section.id}
                                            id={section.id}
                                            editMode={editMode && hasRole('admin')}
                                        >
                                            <div
                                                ref={el => sectionRefs.current[section.id] = el}
                                                className={`bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl rounded-2xl border transition-all duration-300 overflow-hidden ${activeSection === section.id
                                                    ? 'border-white/20 shadow-lg shadow-black/20'
                                                    : 'border-white/10 hover:border-white/15'
                                                    }`}
                                            >
                                                <div
                                                    className="flex items-center justify-between p-5 md:p-6 cursor-pointer hover:bg-white/[0.02] transition-all group"
                                                    onClick={() => toggleSection(section.id)}
                                                >
                                                    {editMode && hasRole('admin') ? (
                                                        <input
                                                            type="text"
                                                            value={section.title}
                                                            onChange={e => updateSection(section.id, 'title', e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                            className="flex-1 text-lg md:text-xl font-bold text-white bg-transparent border-b-2 border-pl-pink/30 focus:outline-none focus:border-pl-pink text-center pb-1"
                                                        />
                                                    ) : (
                                                        <h3 className="flex-1 text-lg md:text-xl font-bold text-white text-center group-hover:text-gray-100 transition-colors">
                                                            {section.title}
                                                        </h3>
                                                    )}
                                                    <div className={`p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-all ml-4 ${activeSection === section.id ? 'bg-pl-teal/20' : ''}`}>
                                                        <ChevronDown
                                                            size={20}
                                                            className={`text-gray-400 transition-all duration-300 ${activeSection === section.id ? 'rotate-180 text-pl-teal' : 'group-hover:text-white'}`}
                                                        />
                                                    </div>
                                                    {editMode && hasRole('admin') && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                                                            className="ml-3 p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                {activeSection === section.id && (
                                                    <div className="px-5 md:px-6 pb-6 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="text-gray-300 leading-relaxed space-y-3 text-[15px]">
                                                            <EditableText
                                                                value={section.content}
                                                                onChange={(val: string) => updateSection(section.id, 'content', val)}
                                                                editMode={editMode}
                                                                multiline={true}
                                                                dataField={`section-${section.id}`}
                                                            />
                                                        </div>
                                                        {activeSection === section.id && (
                                                            <button
                                                                onClick={scrollToIndex}
                                                                className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-pl-teal/10 hover:bg-pl-teal/20 rounded-xl text-pl-teal border border-pl-teal/20 transition-all mx-auto lg:hidden font-medium"
                                                            >
                                                                <ArrowUp size={16} />
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

                        {/* Bottom spacer */}
                        <div className="h-8" />
                    </div>



                    {/* Text Formatting Toolbar */}
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
