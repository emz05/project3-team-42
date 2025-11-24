// client/src/hooks/usePageSpeech.jsx
import { useEffect } from "react";
import { useAccessibility } from "../context/AccessibilityContext.jsx";
import { speakText, stopSpeech } from "../utils/textToSpeech.js";
import { useTranslation } from "../context/translation-storage.jsx";

export default function usePageSpeech(text) {
  const { ttsEnabled, ttsSupported } = useAccessibility();
  const { language, translate } = useTranslation();

  useEffect(() => {
    if (!ttsSupported || !ttsEnabled) return;
    if (!text) return;

    let cancelled = false;

    (async () => {
      try {
        // If language is English, don’t bother translating.
        let spokenText = text;

        if (language && language !== "en") {
          spokenText = await translate(text);
        }

        if (!cancelled && spokenText) {
          speakText(spokenText, { lang: language || "en" });
        }
      } catch (e) {
        console.error("Error during TTS translation:", e);
        if (!cancelled) {
          // Fall back to original English text
          speakText(text, { lang: language || "en" });
        }
      }
    })();

    // Cleanup: stop speech when leaving page or disabling TTS
    return () => {
      cancelled = true;
      stopSpeech();
    };
  }, [text, ttsEnabled, ttsSupported, language, translate]);
}
