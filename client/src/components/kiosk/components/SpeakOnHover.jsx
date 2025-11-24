// client/src/components/kiosk/components/SpeakOnHover.jsx
import React, { useCallback } from "react";
import { useAccessibility } from "../../../context/AccessibilityContext.jsx";
import { speakText, stopSpeech } from "../../../utils/textToSpeech.js";
import { useTranslation } from "../../../context/translation-storage.jsx";

// Wrap any element with speech on hover/focus/touch
export default function SpeakOnHover({ text, children }) {
  const { ttsEnabled, ttsSupported } = useAccessibility();
  const { language, translate } = useTranslation();

  const triggerSpeak = useCallback(async () => {
    if (!ttsSupported || !ttsEnabled) return;
    if (!text) return;

    try {
      let spokenText = text;

      if (language && language !== "en") {
        spokenText = await translate(text);
      }

      if (spokenText) {
        speakText(spokenText, { lang: language || "en" });
      }
    } catch (e) {
      console.error("Error during hover TTS translation:", e);
      // Fallback to original text if translation fails
      speakText(text, { lang: language || "en" });
    }
  }, [ttsEnabled, ttsSupported, text, language, translate]);

  const stopSpeakHandler = useCallback(() => {
    if (!ttsSupported) return;
    stopSpeech();
  }, [ttsSupported]);

  return (
    <div
      onMouseEnter={triggerSpeak}
      onFocus={triggerSpeak}
      onMouseLeave={stopSpeakHandler}
      onBlur={stopSpeakHandler}
      onTouchStart={triggerSpeak}
      onTouchEnd={stopSpeakHandler}
      style={{ display: "inline-block", width: "100%" }}
    >
      {children}
    </div>
  );
}
