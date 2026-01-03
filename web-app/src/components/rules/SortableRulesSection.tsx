import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableRulesSectionProps {
    id: number;
    children: React.ReactNode;
    editMode: boolean;
}

export function SortableRulesSection({ id, children, editMode }: SortableRulesSectionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative">
            {editMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute left-[-40px] top-6 p-2 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white transition-colors touch-none"
                    title="Trascina per riordinare"
                >
                    <GripVertical size={24} />
                </div>
            )}
            {children}
        </div>
    );
}
