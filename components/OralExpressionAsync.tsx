import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { geminiService, decodeAudio, decodeAudioData } from '../services/gemini';
import { TEFTask, SavedResult } from '../types';
import { evaluationJobService } from '../services/evaluationJobService';
import { LoadingResult } from './LoadingResult';

type AsyncStatus = 'idle' | 'recording' | 'transcribing' | 'generating' | 'playing';

interface Turn {
  role: 'user' | 'examiner';
  text: string;
}

interface Props {
  scenario: {
    officialTasks: { partA: TEFTask; partB: TEFTask };
    mode: 'partA' | 'partB' | 'full';
    title: string;
  };
  onFinish: (result: SavedResult) => void;
  onSessionStart?: (examType: 'full' | 'partA' | 'partB') => Promise<{ canStart: boolean; sessionId?: string; reason?: string }>;
  mode: 'partA' | 'partB' | 'full';
  onSwitchMode: () => void;
}

const MAX_USER_TURNS = 12;
const MAX_RECORDING_SECONDS = 90;

/** Collapse hallucinated filler repetitions (e.g. "hmm hmm hmm hmm" → "hmm"). */
function cleanHallucinations(text: string): string {
  return text
    .replace(/\b(\w{1,6})\b(\s+\1){3,}/gi, '$1') // 4+ repeats of any short word → 1
    .replace(/([.…,!?])\1{3,}/g, '$1')             // repeated punctuation
    .trim();
}

export const OralExpressionAsync: React.FC<Props> = ({
  scenario,
  onFinish,
  onSessionStart,
  onSwitchMode,
}) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const task = scenario.officialTasks.partB;

  const [asyncStatus, setAsyncStatus] = useState<AsyncStatus>('idle');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [userTurnCount, setUserTurnCount] = useState(0);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(MAX_RECORDING_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const userTurnCountRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stopRecordingRef = useRef<() => Promise<void>>(async () => {});

  // Keep refs in sync
  useEffect(() => { turnsRef.current = turns; }, [turns]);
  useEffect(() => { userTurnCountRef.current = userTurnCount; }, [userTurnCount]);

  // Auto-scroll conversation log
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns, asyncStatus]);

  const finishSession = useCallback(async (finalTurns?: Turn[]) => {
    const allTurns = finalTurns ?? turnsRef.current;
    if (allTurns.filter(t => t.role === 'user').length === 0) return;

    setIsEvaluating(true);

    const transcript = allTurns
      .map(t => `${t.role === 'user' ? 'User' : 'Examiner'}: ${t.text}`)
      .join('\n');

    const placeholderResult: SavedResult = {
      _id: `async-${Date.now()}`,
      userId: user?.id || 'guest',
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resultType: 'practice',
      mode: 'partB',
      module: 'oralExpression',
      title: scenario.title,
      evaluation: {
        score: 0, clbLevel: 'CLB 0', cecrLevel: 'A1',
        feedback: '', strengths: [], weaknesses: [],
        grammarNotes: '', vocabularyNotes: '',
      },
      moduleData: { type: 'oralExpression' },
      taskReferences: {},
      isLoading: true,
      taskPartA: scenario.officialTasks.partA,
      taskPartB: scenario.officialTasks.partB,
    };

    onFinish(placeholderResult);

    try {
      const { jobId } = await evaluationJobService.submitJob(
        'OralExpression',
        `Section B: ${task.prompt}`,
        transcript,
        task.id,
        task.time_limit_sec || 480,
        undefined,
        undefined,
        'partB',
        scenario.title,
        scenario.officialTasks.partA,
        scenario.officialTasks.partB,
        undefined,
        undefined,
        getToken,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      const savedResult = await evaluationJobService.pollJobStatus(jobId, getToken);
      onFinish(savedResult);
    } catch (err) {
      console.error('[OralExpressionAsync] Evaluation error:', err);
    }
  }, [user, scenario, task, getToken, onFinish]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    setAsyncStatus('transcribing');

    // Collect final chunk and wait for recorder to stop
    const blob = await new Promise<Blob>(resolve => {
      const chunks = [...recordedChunksRef.current];
      recorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      }, { once: true });
      recorder.addEventListener('stop', () => {
        resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      }, { once: true });
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    recordedChunksRef.current = [];

    try {
      const { transcript: rawTx } = await geminiService.transcribeAudio(blob);
      // Extract only the User lines from the diarized transcript
      const userLines = rawTx.split('\n').filter(l => /^User:/i.test(l));
      const rawUserText = userLines.length > 0
        ? userLines.map(l => l.replace(/^User:\s*/i, '')).join(' ').trim()
        : rawTx.trim();
      const userText = cleanHallucinations(rawUserText);

      if (!userText) {
        setError('Transcription vide — réenregistrez votre argument.');
        setAsyncStatus('idle');
        return;
      }

      const newUserTurn: Turn = { role: 'user', text: userText };
      const updatedTurns = [...turnsRef.current, newUserTurn];
      setTurns(updatedTurns);
      turnsRef.current = updatedTurns;
      const newCount = userTurnCountRef.current + 1;
      setUserTurnCount(newCount);
      userTurnCountRef.current = newCount;

      setAsyncStatus('generating');
      const { text: examinerText, audioBase64, audioMimeType } = await geminiService.generateEO2Response(updatedTurns, task);

      const newExaminerTurn: Turn = { role: 'examiner', text: examinerText };
      const finalTurns = [...updatedTurns, newExaminerTurn];
      setTurns(finalTurns);
      turnsRef.current = finalTurns;

      if (audioBase64) {
        setAsyncStatus('playing');
        try {
          const ctx = new AudioContext();
          const bytes = decodeAudio(audioBase64);
          const buffer = await decodeAudioData(bytes, ctx, ctx.sampleRate, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          await new Promise<void>(resolve => {
            source.onended = () => { ctx.close().catch(() => {}); resolve(); };
            source.start();
          });
        } catch (playErr) {
          console.warn('[OralExpressionAsync] Audio playback failed:', playErr);
        }
      }

      if (newCount >= MAX_USER_TURNS) {
        await finishSession(finalTurns);
        return;
      }

      setAsyncStatus('idle');
    } catch (err: any) {
      console.error('[OralExpressionAsync] Turn error:', err);
      setError('Erreur de traitement. Veuillez réessayer.');
      setAsyncStatus('idle');
    }
  }, [task, finishSession]);

  // Keep stopRecordingRef current so the countdown effect can call it without stale closure
  useEffect(() => { stopRecordingRef.current = stopRecording; }, [stopRecording]);

  // 90s countdown — auto-stop when it hits zero
  useEffect(() => {
    if (asyncStatus !== 'recording') return;
    if (recordingTimeLeft <= 0) {
      stopRecordingRef.current();
      return;
    }
    const timer = setTimeout(() => setRecordingTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [asyncStatus, recordingTimeLeft]);

  const startRecording = async () => {
    if (!sessionStarted && onSessionStart) {
      const { canStart } = await onSessionStart('partB');
      if (!canStart) return;
    }
    setSessionStarted(true);
    setError(null);
    setRecordingTimeLeft(MAX_RECORDING_SECONDS);
    recordedChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.start(500);
      setAsyncStatus('recording');
    } catch {
      setError('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (isEvaluating) return <LoadingResult />;

  const isProcessing = asyncStatus === 'transcribing' || asyncStatus === 'generating' || asyncStatus === 'playing';

  return (
    <div className="space-y-3 md:space-y-4 pb-8 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 items-center">
          <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-indigo-400 dark:bg-indigo-500 border border-indigo-400 dark:border-indigo-500 text-white shadow-lg">
            Partie B
          </div>
          {sessionStarted && (
            <div className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              Tour {userTurnCount} / {MAX_USER_TURNS}
            </div>
          )}
        </div>
        <button
          onClick={onSwitchMode}
          disabled={isProcessing || asyncStatus === 'recording'}
          className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-400 dark:hover:border-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Mode live
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left: Task document */}
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl md:rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-[400px] md:h-[480px] transition-colors">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 md:px-6 py-3 flex items-center border-b border-slate-200 dark:border-slate-700">
            <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
              Document #{task.id}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-hide">
            <img
              src={task.image}
              alt="Task Document"
              className="w-full h-auto rounded-xl md:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 mx-auto"
            />
            <div className="mt-4 p-4 bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-[10px] md:text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic shadow-sm">
              <strong className="text-slate-900 dark:text-slate-100 not-italic block mb-1">Consigne :</strong>
              {task.prompt}
            </div>
          </div>
        </div>

        {/* Right: Conversation + controls */}
        <div className="flex flex-col gap-3 min-w-0">
          {/* Conversation log */}
          <div
            ref={scrollRef}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto p-3 space-y-2 h-[240px] md:h-[300px] scrollbar-hide"
          >
            {turns.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-xs font-medium mt-10">
                Cliquez sur Enregistrer pour présenter votre premier argument.
              </p>
            ) : (
              turns.map((turn, i) => (
                <div key={i} className={`flex gap-2 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      turn.role === 'user'
                        ? 'bg-indigo-400 dark:bg-indigo-500 text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-bl-sm'
                    }`}
                  >
                    <div className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">
                      {turn.role === 'user' ? 'Vous' : 'Ami(e)'}
                    </div>
                    {turn.text}
                  </div>
                </div>
              ))
            )}
            {asyncStatus === 'transcribing' && (
              <div className="flex justify-end">
                <div className="bg-indigo-200 dark:bg-indigo-900/40 px-3 py-2 rounded-2xl rounded-br-sm text-xs text-indigo-600 dark:text-indigo-300 animate-pulse">
                  Transcription…
                </div>
              </div>
            )}
            {asyncStatus === 'generating' && (
              <div className="flex justify-start">
                <div className="bg-slate-200 dark:bg-slate-700 px-3 py-2 rounded-2xl rounded-bl-sm text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                  L'ami(e) réfléchit…
                </div>
              </div>
            )}
            {asyncStatus === 'playing' && (
              <div className="flex justify-start">
                <div className="bg-slate-200 dark:bg-slate-700 px-3 py-2 rounded-2xl rounded-bl-sm text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                  L'ami(e) répond…
                </div>
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="bg-indigo-400 dark:bg-indigo-500 rounded-2xl md:rounded-2xl p-4 md:p-6 flex flex-col items-center gap-4 relative overflow-hidden shadow-2xl transition-colors">
            {error && (
              <div className="w-full text-center text-[10px] font-bold text-rose-200 bg-rose-500/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            {asyncStatus === 'idle' && (
              <div className="flex items-center gap-4">
                <button
                  onClick={startRecording}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/20 hover:bg-white/30 text-white flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 ring-8 ring-white/10 cursor-pointer"
                >
                  <span className="text-3xl md:text-4xl">🎙</span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
                    {sessionStarted ? 'Enregistrer' : 'Commencer'}
                  </span>
                </button>
                {userTurnCount >= 2 && (
                  <button
                    onClick={() => finishSession()}
                    className="px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                  >
                    Terminer
                  </button>
                )}
              </div>
            )}

            {asyncStatus === 'recording' && (
              <div className="flex flex-col items-center gap-3">
                <div className="text-white font-black text-2xl tabular-nums">
                  {formatTime(recordingTimeLeft)}
                </div>
                <button
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ring-8 ring-rose-300/30 cursor-pointer"
                >
                  <span className="text-3xl">⏹</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">Arrêter</span>
                </button>
                <p className="text-indigo-100 text-[10px] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-pulse" />
                  Enregistrement en cours
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold">
                  {asyncStatus === 'transcribing'
                    ? 'Transcription…'
                    : asyncStatus === 'generating'
                    ? "L'ami(e) réfléchit…"
                    : "L'ami(e) répond…"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
