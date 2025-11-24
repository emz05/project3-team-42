// client/src/components/kiosk/components/TextToSpeechToggle.jsx
import React from 'react';
import { useAccessibility } from '../../../context/AccessibilityContext.jsx';

const TextToSpeechToggle = () => {
  const { ttsEnabled, setTtsEnabled, ttsSupported } = useAccessibility();

  const handleChange = () => {
    if (!ttsSupported) return;
    setTtsEnabled(!ttsEnabled);
  };

  const label = !ttsSupported
    ? 'Text to Speech (not supported in this browser)'
    : 'Text to Speech';

  return (
    <button
      type="button"
      onClick={handleChange}
      disabled={!ttsSupported}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.6rem',
        borderRadius: '999px',
        border: '1px solid #ccc',
        backgroundColor: ttsEnabled ? '#e5f5ff' : '#f5f5f5',
        cursor: ttsSupported ? 'pointer' : 'not-allowed',
        fontSize: '0.9rem',
      }}
    >
      <span aria-hidden="true">
        {ttsEnabled ? '🔊' : '🔈'}
      </span>
      <span>{label}</span>
    </button>
  );
};

export default TextToSpeechToggle;
