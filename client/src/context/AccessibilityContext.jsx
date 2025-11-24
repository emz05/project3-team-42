// client/src/context/AccessibilityContext.jsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { isSpeechSupported } from '../utils/textToSpeech.js';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  // start disabled by default
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // we expose support information so UI can disable the toggle if needed
  const ttsSupported = isSpeechSupported();

  const value = useMemo(
    () => ({
      ttsEnabled,
      setTtsEnabled,
      ttsSupported,
    }),
    [ttsEnabled, ttsSupported],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return ctx;
}
