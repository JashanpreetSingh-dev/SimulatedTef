import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { geminiService, decodeAudio, decodeAudioData, createPcmBlob, LIVE_API_CONFIG } from '../../services/gemini';

interface Props {
  systemPrompt: string;
  keywords: string[];
  sessionId: string;
  onComplete: (transcript: string, durationSeconds: number) => void;
}

type TranscriptLine = {
  speaker: 'user' | 'ai';
  text: string;
};

export const WarmupSession: React.FC<Props> = ({
  systemPrompt,
  keywords,
  sessionId,
  onComplete,
}) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const sessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const isLiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const micWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const userLinesRef = useRef<TranscriptLine[]>([]);
  const aiLinesRef = useRef<TranscriptLine[]>([]);
  const userSilenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSent60sNoteRef = useRef(false);

  const stopSession = () => {
    isLiveRef.current = false;
    const session = sessionRef.current;
    sessionRef.current = null;

    if (session) {
      try { session.close(); } catch { /* ignore */ }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (micWorkletNodeRef.current) {
      try {
        micWorkletNodeRef.current.disconnect();
        micWorkletNodeRef.current.port.onmessage = null;
      } catch { /* ignore */ }
      micWorkletNodeRef.current = null;
    }

    if (micSourceNodeRef.current) {
      try { micSourceNodeRef.current.disconnect(); } catch { /* ignore */ }
      micSourceNodeRef.current = null;
    }

    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      try { inputAudioCtxRef.current.close(); } catch { /* ignore */ }
    }

    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      try { outputAudioCtxRef.current.close(); } catch { /* ignore */ }
    }

    sourcesRef.current.forEach((s) => { try { s.stop(); } catch { /* ignore */ } });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (userSilenceTimeoutRef.current) {
      clearTimeout(userSilenceTimeoutRef.current);
      userSilenceTimeoutRef.current = null;
    }

    if (isMountedRef.current) {
      setIsUserSpeaking(false);
    }
  };

  const startSession = async () => {
    if (status === 'active' || status === 'connecting') return;
    if (!isMountedRef.current) return;

    isLiveRef.current = true;
    setStatus('connecting');
    setTimeLeft(5 * 60);
    hasSent60sNoteRef.current = false;
    userLinesRef.current = [];
    aiLinesRef.current = [];

    let stream: MediaStream | null = null;

    try {
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch (err) {
        console.error('Microphone access error:', err);
        if (isMountedRef.current) setStatus('idle');
        stopSession();
        return;
      }

      if (!isLiveRef.current || !isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const connectionTimeout = setTimeout(() => {
        if (isLiveRef.current && !sessionRef.current) {
          console.error('Warmup connection timeout');
          if (isMountedRef.current) setStatus('idle');
          stopSession();
          if (stream) stream.getTracks().forEach((t) => t.stop());
        }
      }, LIVE_API_CONFIG.connectionTimeout || 10000);

      const sessionPromise = geminiService.connectLiveWithPrompt(
        {
          onopen: async () => {
            clearTimeout(connectionTimeout);
            if (!isMountedRef.current || !isLiveRef.current) {
              stopSession();
              return;
            }

            setStatus('active');

            if (!stream || !inputAudioCtxRef.current || !outputAudioCtxRef.current) {
              console.error('Missing stream or audio context in warmup onopen');
              stopSession();
              if (isMountedRef.current) setStatus('idle');
              return;
            }

            try {
              const liveMicSource = inputAudioCtxRef.current.createMediaStreamSource(stream);
              const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/';
              const workletUrl = new URL(`${base}mic-processor.js`, window.location.href).href;
              await inputAudioCtxRef.current.audioWorklet.addModule(workletUrl);
              const workletNode = new AudioWorkletNode(
                inputAudioCtxRef.current,
                'mic-processor',
                { numberOfInputs: 1, numberOfOutputs: 1 },
              );
              micSourceNodeRef.current = liveMicSource;
              micWorkletNodeRef.current = workletNode;

              workletNode.port.onmessage = (e: MessageEvent<{ samples: Float32Array }>) => {
                if (!isLiveRef.current || !sessionRef.current) return;
                const inputData = e.data.samples;
                if (!inputData || inputData.length === 0) return;

                const volume = inputData.reduce((acc, val) => acc + Math.abs(val), 0) / inputData.length;

                if (isMountedRef.current) {
                  setIsUserSpeaking(volume > 0.01);
                }

                const pcmBlob = createPcmBlob(inputData, inputAudioCtxRef.current!.sampleRate);
                sessionPromise
                  .then((session) => {
                    if (!isLiveRef.current || !session) return;
                    try { session.sendRealtimeInput({ audio: pcmBlob }); }
                    catch (err) { console.debug('Failed to send audio frame', err); }
                  })
                  .catch((err) => { console.debug('Session promise error in warmup audio', err); });
              };

              liveMicSource.connect(workletNode);
              workletNode.connect(inputAudioCtxRef.current.destination);
            } catch (audioError) {
              console.error('Error setting up warmup audio:', audioError);
              stopSession();
              if (isMountedRef.current) setStatus('idle');
            }
          },
          onmessage: async (message: any) => {
            if (!isMountedRef.current) return;

            // Play AI audio
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
              const audioData = decodeAudio(base64);
              const buffer = await decodeAudioData(audioData, outputAudioCtxRef.current!, 24000, 1);

              const source = outputAudioCtxRef.current!.createBufferSource();
              source.buffer = buffer;
              const gainNode = outputAudioCtxRef.current!.createGain();
              gainNode.gain.value = 0.9;
              source.connect(gainNode);
              gainNode.connect(outputAudioCtxRef.current!.destination);

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current!.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;

              sourcesRef.current.add(source);
              source.onended = () => { sourcesRef.current.delete(source); };
            }

            // Collect user speech for transcript (not displayed)
            if (message.serverContent?.inputTranscription?.text) {
              const userText = message.serverContent.inputTranscription.text;
              if (userText && userText.trim()) {
                userLinesRef.current.push({ speaker: 'user', text: userText.trim() });
              }
            }

            // Collect AI speech for transcript (not displayed)
            if (message.serverContent?.outputTranscription?.text) {
              const modelText = message.serverContent.outputTranscription.text;
              if (modelText && modelText.trim()) {
                aiLinesRef.current.push({ speaker: 'ai', text: modelText.trim() });
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach((s) => { try { s.stop(); } catch { /* ignore */ } });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Warmup WebSocket error:', e);
            stopSession();
            if (isMountedRef.current) setStatus('idle');
          },
          onclose: () => {
            stopSession();
            if (isMountedRef.current) setStatus('idle');
          },
        },
        systemPrompt,
        {
          responseTimeout: LIVE_API_CONFIG.responseWaitTime,
          turnDetectionTimeout: LIVE_API_CONFIG.turnDetectionTimeout,
        },
      );

      clearTimeout(connectionTimeout);
      sessionRef.current = await sessionPromise;

      if (!isLiveRef.current || !isMountedRef.current) {
        stopSession();
        if (stream) stream.getTracks().forEach((t) => t.stop());
      }
    } catch (err) {
      console.error('Failed to start warmup session:', err);
      stopSession();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (isMountedRef.current) setStatus('idle');
    }
  };

  const finishSession = () => {
    const durationSeconds = 5 * 60 - timeLeft;
    const allLines = [
      ...userLinesRef.current.map((l) => `User: ${l.text}`),
      ...aiLinesRef.current.map((l) => `AI: ${l.text}`),
    ];
    const transcript = allLines.join('\n');

    stopSession();
    setStatus('idle');
    onComplete(transcript, durationSeconds > 0 ? durationSeconds : 0);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopSession();
    };
  }, []);

  useEffect(() => {
    if (status === 'active' && timeLeft > 0) {
      const timer = setInterval(() => {
        if (isMountedRef.current) {
          setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, timeLeft]);

  useEffect(() => {
    if (status === 'active' && timeLeft === 60 && !hasSent60sNoteRef.current) {
      hasSent60sNoteRef.current = true;
      if (sessionRef.current) {
        try {
          sessionRef.current.sendRealtimeInput({
            text: "[Note interne: Il reste une minute, commence à conclure doucement.]",
          });
        } catch (e) {
          console.debug('Failed to send 60s internal note for warmup', e);
        }
      }
    }

    if (status === 'active' && timeLeft === 0) {
      setTimeout(() => { finishSession(); }, 100);
    }
  }, [status, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Keyword chips */}
      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => (
          <span
            key={k}
            className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
          >
            {k}
          </span>
        ))}
      </div>

      {/* Mic indicator + timer */}
      <div className="flex flex-col items-center gap-6 py-8">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            status === 'active'
              ? isUserSpeaking
                ? 'bg-amber-400 ring-8 ring-amber-300/50 scale-110'
                : 'bg-amber-300 ring-4 ring-amber-200/50'
              : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          <span className="text-3xl">
            {status === 'connecting' ? '⏳' : status === 'active' ? '🎙' : '🎙'}
          </span>
        </div>

        {status === 'active' && (
          <div
            className={`text-2xl font-black tabular-nums ${
              timeLeft <= 60 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Start / Stop button */}
      <button
        onClick={() => {
          if (status === 'active') {
            finishSession();
          } else if (status === 'idle') {
            startSession();
          }
        }}
        disabled={status === 'connecting'}
        className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 ${
          status === 'connecting'
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : status === 'active'
            ? 'bg-rose-400 hover:bg-rose-500 text-white shadow-lg shadow-rose-400/30'
            : 'bg-emerald-400 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-400/30'
        }`}
      >
        {status === 'connecting' ? (
          <span>{t('warmup.connecting')}</span>
        ) : status === 'active' ? (
          <>
            <span>⏹</span>
            <span>{t('warmup.stop')}</span>
          </>
        ) : (
          <>
            <span>🎙</span>
            <span>{t('warmup.start')}</span>
          </>
        )}
      </button>
    </div>
  );
};
