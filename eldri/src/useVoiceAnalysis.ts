import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranscription } from './useTranscription';

export function useVoiceAnalysis() {
  const [isListening, setIsListening] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const { transcript, setTranscript: clearTranscriptFn } = useTranscription(isListening);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    // Prevent double-start
    if (isListening) return;

    setIsListening(true);
    clearTranscriptFn();
    setDuration(0);

    // Start duration counter
    durationIntervalRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    // Try setting up Web Audio API to capture voice levels for UI feedback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute weighted average — emphasize voice frequency range (300-3000 Hz)
        let sum = 0;
        let count = 0;
        const startBin = Math.floor(300 / (audioCtx.sampleRate / analyser.fftSize));
        const endBin = Math.min(bufferLength, Math.ceil(3000 / (audioCtx.sampleRate / analyser.fftSize)));

        for (let i = startBin; i < endBin; i++) {
          sum += dataArray[i];
          count++;
        }

        const average = count > 0 ? sum / count : 0;
        setVoiceLevel(Math.min(100, Math.round((average / 128) * 100)));

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('Microphone audio level stream initialization failed:', err);
    }
  }, [isListening, clearTranscriptFn]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setVoiceLevel(0);
    cleanup();
  }, [cleanup]);

  const clearTranscript = useCallback(() => {
    clearTranscriptFn();
  }, [clearTranscriptFn]);

  const resetVoice = useCallback(() => {
    stopListening();
    setDuration(0);
    clearTranscriptFn();
  }, [stopListening, clearTranscriptFn]);

  // Auto clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    transcript,
    isListening,
    voiceLevel,
    duration,
    startListening,
    stopListening,
    clearTranscript,
    resetVoice,
  };
}
