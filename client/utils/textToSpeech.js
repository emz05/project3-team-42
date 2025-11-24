

// Simple feature check
export function isSpeechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

// Speak the given text using the browser's default voice
export function speakText(text, options = {}) {
  if (!isSpeechSupported()) return;
  if (!text || typeof text !== 'string') return;

  const synth = window.speechSynthesis;

  // stop anything currently speaking
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  if (options.lang) utterance.lang = options.lang;
  if (options.rate) utterance.rate = options.rate;
  if (options.pitch) utterance.pitch = options.pitch;

  synth.speak(utterance);
}

// Stop any ongoing speech
export function stopSpeech() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
