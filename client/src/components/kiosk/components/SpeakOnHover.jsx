// client/src/components/kiosk/components/SpeakOnHover.jsx
import React, { useCallback } from "react";
import { useAccessibility } from "../../../context/AccessibilityContext.jsx";
import { speakText, stopSpeech } from "../../../utils/textToSpeech.js";

// Wrap any element with speech on hover/focus/touch
export default function SpeakOnHover({ text, children }) {
  const { ttsEnabled, ttsSupported } = useAccessibility();

  const triggerSpeak = useCallback(() => {
    if (!ttsSupported || !ttsEnabled) return;
    if (!text) return;
    speakText(text);
  }, [ttsEnabled, ttsSupported, text]);

  const stopSpeak = useCallback(() => {
    if (!ttsSupported) return;
    stopSpeech();
  }, [ttsSupported]);

  return (
    <div
      onMouseEnter={triggerSpeak}
      onFocus={triggerSpeak}
      onMouseLeave={stopSpeak}
      onBlur={stopSpeak}
      onTouchStart={triggerSpeak}
      onTouchEnd={stopSpeak}
      style={{ display: "inline-block", width: "100%" }}
    >
      {children}
    </div>
  );
}
