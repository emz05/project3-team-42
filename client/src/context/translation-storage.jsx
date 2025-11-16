/*
- Stores selected language globally
- Ensure that selected language applies to following pages as user navigates
 */

import { createContext, useContext, useState, useMemo } from 'react';
import { translationAPI } from "../services/api.js";

const TranslationContext = createContext(null);

// wraps frontend content that translation should be applied to
export function TranslationWrapper({ children }) {
    const [language, setLanguage] = useState('en');

    async function translate(text){
        if(!text) { return '';}
        if(language === 'en'){ return text; }

        try{
            const response = await translationAPI.translate(text, language);
            if(response.data && response.data.translatedText){
                return response.data.translatedText;
            }
            return text;
        } catch(e){
            console.error('Error translating: ', e);
            return text;
        }
    }
    const value = useMemo(() => ({
        language,
        setLanguage,
        translate,
    }), [language]);

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const ctx = useContext(TranslationContext);
    if (!ctx) throw new Error('useTranslation must be used within area wrapped by TranslationWrapper');
    return ctx;
}
