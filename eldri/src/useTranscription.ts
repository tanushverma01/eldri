import { useState, useEffect, useRef, useCallback } from 'react';

// Extend window object for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useTranscription(isActive: boolean) {
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTranscriptState = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this environment.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interimText = '';
      let newFinalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          newFinalText += text + ' ';
        } else {
          interimText += text;
        }
      }

      // Accumulate final results properly
      if (newFinalText) {
        finalTranscriptRef.current += newFinalText;
      }

      // Show accumulated final + current interim
      const fullTranscript = (finalTranscriptRef.current + interimText).trim();
      setTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      // Don't restart on fatal errors
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        return;
      }
    };

    recognition.onend = () => {
      if (isActive && recognitionRef.current === recognition) {
        // Restart with a small backoff to prevent rapid restart loops
        restartTimeoutRef.current = setTimeout(() => {
          if (isActive && recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch (err) {
              console.warn('Speech recognition auto-restart failed:', err);
            }
          }
        }, 250);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition initial start failed:', err);
    }
    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      try {
        recognition.stop();
      } catch {
        // ignore if already stopped
      }
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [isActive]);

  return { transcript, setTranscript: clearTranscriptState };
}