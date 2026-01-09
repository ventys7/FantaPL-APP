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
                    className={`w-full bg-[#0a0a0f]/80 border border-white/10 focus:border-pl-pink/50 rounded-xl p-5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-pl-pink/20 resize-y min-h-[250px] font-mono text-sm leading-relaxed placeholder:text-gray-600 transition-all ${className}`}
                    placeholder="Inserisci il contenuto qui..."
                />
            );
        }
        return (
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-[#0a0a0f]/80 border border-white/10 focus:border-pl-pink/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pl-pink/20 transition-all ${className}`}
            />
        );
    }

    return (
        <div className={`leading-relaxed ${className}`}>
            <PrivacyText>{value}</PrivacyText>
        </div>
    );
}
