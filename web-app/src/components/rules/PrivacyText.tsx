import { useAuth } from '../../context/AuthContext';

interface PrivacyTextProps {
    children: string;
}

// Process blur tags in text - replaces content inside <blur></blur> with █
const processBlurTags = (text: string, shouldBlur: boolean): string => {
    if (!shouldBlur) return text;
    return text.replace(/<blur>(.*?)<\/blur>/gi, (_, content) => {
        return '█'.repeat(content.length);
    });
};

export function PrivacyText({ children }: PrivacyTextProps) {
    const { user } = useAuth();
    const shouldBlur = !user;

    const processedText = processBlurTags(children, shouldBlur);
    return <span dangerouslySetInnerHTML={{ __html: processedText.replace(/\n/g, '<br/>') }} />;
}
