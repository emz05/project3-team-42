// client/src/components/kiosk/components/TextToSpeechToggle.jsx
import React from 'react';
import { useAccessibility } from '../../../context/AccessibilityContext.jsx';
import TranslatedText from "../../common/TranslateText.jsx";

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
      className={`bg-white rounded-full px-6 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center gap-2 transition-shadow text-sm font-semibold text-gray-800
        ${ttsEnabled ? 'ring-2 ring-indigo-500/60' : ''}
        ${ttsSupported ? 'hover:shadow-lg cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
    >
      <span aria-hidden="true">
        {ttsEnabled ? '􀊦' : '􀊦'}
      </span>
      <span><TranslatedText text={label} /></span>
    </button>
  );
};

export default TextToSpeechToggle;
