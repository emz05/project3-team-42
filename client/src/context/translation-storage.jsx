/*
- Stores selected language globally
- Ensure that selected language applies to following pages as user navigates
 */

import { createContext, useContext, useState, useMemo } from 'react';

const TranslationContext = createContext(null);

// wraps frontend content that translation should be applied to
export function TranslationWrapper({ children }) {
    const [language, setLanguage] = useState('en');
    const value = useMemo(() => ({ language, setLanguage }), [language]);
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
