/*
- Creates dropdown component for user to select preferred language
- Should be applied to all pages
 */
import { useTranslation } from '../../context/translation-storage.jsx';

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'zh', label: '中文 (简体)' },
    // add more later on
];

export default function LanguageDropdown({ className }) {
    const { language, setLanguage } = useTranslation();

    return (
        <select className={className} value={language} onChange={(event) => setLanguage(event.target.value)}>
            {LANGUAGES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
            ))}
        </select>
    );
}