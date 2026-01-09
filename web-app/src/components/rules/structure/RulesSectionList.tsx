import { Plus, ChevronDown, Trash2, ArrowUp } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableRulesSection } from '../SortableRulesSection';
import { EditableText } from '../EditableText';
import { Section } from '../../../types/rules';

interface RulesSectionListProps {
    sections: Section[];
    editMode: boolean;
    canEdit: boolean;
    activeSection: number | null;
    toggleSection: (id: number) => void;
    updateSection: (id: number, key: keyof Section, val: any) => void;
    addSection: () => void;
    removeSection: (id: number) => void;
    onDragEnd: (event: DragEndEvent) => void;
    setSectionRef: (id: number, el: HTMLDivElement | null) => void;
    scrollToIndex: () => void;
}

export function RulesSectionList({
    sections, editMode, canEdit,
    activeSection, toggleSection, updateSection,
    addSection, removeSection, onDragEnd,
    setSectionRef, scrollToIndex
}: RulesSectionListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
        >
            <SortableContext
                items={sections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
                disabled={!editMode || !canEdit}
            >
                <div className="space-y-4">
                    {editMode && canEdit && (
                        <button
                            onClick={addSection}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-pl-teal/10 to-emerald-500/10 hover:from-pl-teal/20 hover:to-emerald-500/20 rounded-2xl text-pl-teal border border-pl-teal/20 hover:border-pl-teal/40 transition-all font-semibold"
                        >
                            <Plus size={20} />
                            Aggiungi Sezione
                        </button>
                    )}

                    {sections.map((section) => (
                        <SortableRulesSection
                            key={section.id}
                            id={section.id}
                            editMode={editMode && canEdit}
                        >
                            <div
                                ref={el => setSectionRef(section.id, el)}
                                className={`bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl rounded-2xl border transition-all duration-300 overflow-hidden ${activeSection === section.id
                                    ? 'border-white/20 shadow-lg shadow-black/20'
                                    : 'border-white/10 hover:border-white/15'
                                    }`}
                            >
                                <div
                                    className="flex items-center justify-between p-5 md:p-6 cursor-pointer hover:bg-white/[0.02] transition-all group"
                                    onClick={() => toggleSection(section.id)}
                                >
                                    {editMode && canEdit ? (
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
                                    {editMode && canEdit && (
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
                                        <button
                                            onClick={scrollToIndex}
                                            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-pl-teal/10 hover:bg-pl-teal/20 rounded-xl text-pl-teal border border-pl-teal/20 transition-all mx-auto lg:hidden font-medium"
                                        >
                                            <ArrowUp size={16} />
                                            Torna all'Indice
                                        </button>
                                    </div>
                                )}
                            </div>
                        </SortableRulesSection>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
