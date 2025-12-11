// client/src/context/AccessibilityContext.jsx
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { isSpeechSupported } from '../utils/textToSpeech.js';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  // start disabled by default
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [magnifierEnabled, setMagnifierEnabled] = useState(false);

  // we expose support information so UI can disable the toggle if needed
  const ttsSupported = isSpeechSupported();

  // Keyboard shortcut: Ctrl+M or Cmd+M to toggle magnifier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+M (Windows/Linux) or Cmd+M (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        setMagnifierEnabled(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const value = useMemo(
    () => ({
      ttsEnabled,
      setTtsEnabled,
      ttsSupported,
      magnifierEnabled,
      setMagnifierEnabled,
    }),
    [ttsEnabled, ttsSupported, magnifierEnabled],
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
