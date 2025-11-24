// client/src/hooks/usePageSpeech.jsx
import { useEffect } from "react";
import { useAccessibility } from "../context/AccessibilityContext.jsx";
import { speakText, stopSpeech } from "../utils/textToSpeech.js";

export default function usePageSpeech(text) {
  const { ttsEnabled, ttsSupported } = useAccessibility();

  useEffect(() => {
    if (!ttsSupported || !ttsEnabled) return;
    if (!text) return;

    // speak when page loads / deps change
    speakText(text);

    // stop when leaving the page or disabling TTS
    return () => {
      stopSpeech();
    };
  }, [text, ttsEnabled, ttsSupported]);
}
