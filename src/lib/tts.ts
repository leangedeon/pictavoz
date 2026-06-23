let voicesLoaded = false;
let speakChain: Promise<void> = Promise.resolve();

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

function getVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = loadVoices();
  const langPrefix = locale.startsWith("en") ? "en" : "es";
  return (
    voices.find((v) => v.lang.startsWith(langPrefix) && v.localService) ??
    voices.find((v) => v.lang.startsWith(langPrefix)) ??
    voices[0]
  );
}

export function preloadVoices(): void {
  if (typeof window === "undefined" || voicesLoaded) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
  };
  voicesLoaded = true;
}

function isBenignTtsError(error: SpeechSynthesisErrorCode | string): boolean {
  return (
    error === "interrupted" ||
    error === "canceled" ||
    error === "audio-busy"
  );
}

function speakOnce(text: string, locale = "es"): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale.startsWith("en") ? "en-US" : "es-ES";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voice = getVoice(locale);
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      if (!isBenignTtsError(event.error)) {
        console.warn("TTS error:", event.error, text);
      }
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function speak(text: string, locale = "es"): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  speakChain = speakChain
    .then(async () => {
      window.speechSynthesis.cancel();
      await new Promise((r) => setTimeout(r, 50));
      await speakOnce(text, locale);
    })
    .catch(() => undefined);

  return speakChain;
}

export async function speakSequence(
  texts: string[],
  locale = "es"
): Promise<void> {
  for (const text of texts) {
    await speak(text, locale);
    await new Promise((r) => setTimeout(r, 200));
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
