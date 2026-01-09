import { EditableText } from '../EditableText';

interface CenniPrincipaliSectionProps {
    title: string;
    mainText: string;
    editMode: boolean;
    canEdit: boolean;
    setTitle: (val: string) => void;
    setMainText: (val: string) => void;
    setRef: (el: HTMLDivElement | null) => void;
}

export function CenniPrincipaliSection({
    title, mainText, editMode, canEdit,
    setTitle, setMainText, setRef
}: CenniPrincipaliSectionProps) {
    return (
        <div
            ref={setRef}
            className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/10 overflow-hidden"
        >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pl-pink via-pl-purple to-pl-teal" />

            <div className="text-center mb-8">
                {editMode && canEdit ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-2xl md:text-3xl font-bold text-pl-teal bg-transparent border-b-2 border-pl-pink/30 focus:outline-none focus:border-pl-pink text-center w-full pb-2"
                    />
                ) : (
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pl-teal to-emerald-400 bg-clip-text text-transparent">
                        {title}
                    </h2>
                )}
            </div>
            <div className="text-gray-300 leading-relaxed space-y-4 text-[15px]">
                <EditableText
                    value={mainText}
                    onChange={setMainText}
                    editMode={editMode}
                    multiline={true}
                    dataField="mainText"
                />
            </div>
        </div>
    );
}
