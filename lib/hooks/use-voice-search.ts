"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type VoiceSearchState = {
  supported: boolean;
  listening: boolean;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
};

/**
 * Browser Web Speech API voice search (Chrome / Edge best; Safari limited).
 * Requires localhost or HTTPS for microphone access.
 */
export function useVoiceSearch(options: {
  lang?: string;
  onFinal: (transcript: string) => void;
}): VoiceSearchState {
  const { lang = "en-IN", onFinal } = options;
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice search is not supported in this browser. Try Chrome.");
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Voice search needs HTTPS (or localhost). Open the site securely and try again.");
      return;
    }

    setError(null);
    setInterim("");

    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }

    const beginRecognition = () => {
      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interimText = "";
        let finalText = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript?.trim() ?? "";
          if (!text) continue;
          if (result.isFinal) finalText = text;
          else interimText = text;
        }
        if (interimText) setInterim(interimText);
        if (finalText) {
          setInterim("");
          onFinalRef.current(finalText);
        }
      };

      recognition.onerror = (event) => {
        const code = event.error || "unknown";
        if (code === "aborted" || code === "no-speech") {
          setError(null);
        } else if (code === "not-allowed") {
          setError(
            "Microphone blocked. Click the lock/info icon in the address bar → Site settings → allow Microphone, then try again.",
          );
        } else {
          setError("Could not hear that. Tap the mic and try again.");
        }
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setListening(true);
      } catch {
        setError("Could not start voice search. Try again.");
        setListening(false);
      }
    };

    // Explicit getUserMedia prompt is clearer than SpeechRecognition alone
    // when permission was never asked or was previously denied.
    const mediaDevices = navigator.mediaDevices;
    if (mediaDevices?.getUserMedia) {
      void mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
          beginRecognition();
        })
        .catch((err: unknown) => {
          const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
          if (name === "NotAllowedError" || name === "PermissionDeniedError") {
            setError(
              "Microphone blocked. Click the lock/info icon in the address bar → Site settings → allow Microphone, then try again.",
            );
          } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
            setError("No microphone found. Connect a mic and try again.");
          } else {
            setError("Could not access the microphone. Check browser permissions and try again.");
          }
          setListening(false);
        });
      return;
    }

    beginRecognition();
  }, [lang]);

  return { supported, listening, interim, error, start, stop };
}
