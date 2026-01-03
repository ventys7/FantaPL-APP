import { useAuth } from '../../context/AuthContext';
import { PrivacyText } from './PrivacyText';

interface EditableTextProps {
    value: string;
    onChange: (value: string) => void;
    editMode: boolean;
    multiline?: boolean;
    className?: string;
    textareaRef?: React.RefObject<HTMLTextAreaElement>;
    dataField?: string;
}

export function EditableText({
    value,
    onChange,
    editMode,
    multiline = false,
    className = '',
    textareaRef,
    dataField
}: EditableTextProps) {
    const { hasRole } = useAuth();

    if (editMode && hasRole('admin')) {
        if (multiline) {
            return (
                <textarea
                    ref={textareaRef}
                    data-field={dataField}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full bg-pl-dark/50 border border-pl-pink/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-pl-pink resize-y min-h-[200px] font-mono text-sm leading-relaxed ${className}`}
                />
            );
        }
        return (
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-pl-dark/50 border border-pl-pink/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pl-pink ${className}`}
            />
        );
    }

    return (
        <div className={`leading-relaxed ${className}`}>
            <PrivacyText>{value}</PrivacyText>
        </div>
    );
}
