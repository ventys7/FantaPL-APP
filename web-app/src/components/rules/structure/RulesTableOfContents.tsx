import { BookText } from 'lucide-react';
import { Section } from '../../../types/rules';

interface RulesTableOfContentsProps {
    cenniTitle: string;
    sections: Section[];
    activeSection: number | null;
    scrollToSection: (id: number) => void;
}

export function RulesTableOfContents({
    cenniTitle, sections, activeSection, scrollToSection
}: RulesTableOfContentsProps) {
    return (
        <div className="w-full lg:w-72 lg:sticky lg:top-8 order-1 space-y-5">
            <div className="group bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
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
                        {cenniTitle}
                    </button>
                    {sections.map((section) => (
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
    );
}
