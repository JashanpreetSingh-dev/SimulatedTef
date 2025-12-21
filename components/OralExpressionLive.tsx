
import React, { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { geminiService, decodeAudio, decodeAudioData, createPcmBlob } from '../services/gemini';
import { EvaluationResult, TEFTask, SavedResult } from '../types';
// Removed combineAudioChunks and mergeAudioTracks - now using MediaRecorder for real-time recording
import { persistenceService } from '../services/persistence';
import { LoadingResult } from './LoadingResult';

// Type declaration for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface Props {
  scenario: {
    officialTasks: { partA: TEFTask; partB: TEFTask };
    mode: 'partA' | 'partB' | 'full';
    title: string;
  };
  onFinish: (result: SavedResult) => void;
}

export const OralExpressionLive: React.FC<Props> = ({ scenario, onFinish }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [currentPart, setCurrentPart] = useState<'A' | 'B'>(scenario.mode === 'partB' ? 'B' : 'A');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'evaluating'>('idle');
  const [transcription, setTranscription] = useState('');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [showImageFull, setShowImageFull] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [doesContentOverflow, setDoesContentOverflow] = useState(false);
  
  const currentTask: TEFTask = currentPart === 'A' ? scenario.officialTasks.partA : scenario.officialTasks.partB;
  const micSectionRef = useRef<HTMLDivElement>(null);

  const sessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isLiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  
  const transcriptA = useRef('');
  const transcriptB = useRef('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasAutoFinishedRef = useRef(false);
  
  // Real-time MediaRecorder for conversation recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const stopSession = () => {
    isLiveRef.current = false;
    const session = sessionRef.current;
    sessionRef.current = null; // Prevent double-close
    if (session) {
      try {
        session.close();
      } catch (e) {
        console.debug("Session already closed", e);
      }
    }
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.debug("Recognition already stopped", e);
      }
      recognitionRef.current = null;
    }
    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    // Note: Don't clear audio chunks here - we need them for upload after evaluation
    // Check AudioContext state before closing
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      try {
        inputAudioCtxRef.current.close();
      } catch (e) {
        console.debug("Input AudioContext already closed", e);
      }
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      try {
        outputAudioCtxRef.current.close();
      } catch (e) {
        console.debug("Output AudioContext already closed", e);
      }
    }
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    if (isMountedRef.current) {
      setIsModelSpeaking(false);
      setIsUserSpeaking(false);
      // Reset timer when stopping
      setTimeLeft(0);
    }
  };

  const startSession = async () => {
    if (status === 'connecting' || status === 'active') return;
    if (!isMountedRef.current) return;
    
    isLiveRef.current = true;
    if (isMountedRef.current) {
      setStatus('connecting');
      // Initialize timer with current task's time limit
      setTimeLeft(currentTask.time_limit_sec);
      hasAutoFinishedRef.current = false; // Reset auto-finish flag when starting a new session
      // Clear recorded chunks when starting a new session (only if not continuing Part B in full mode)
      if (currentPart === 'A' || scenario.mode !== 'full') {
        recordedChunksRef.current = [];
      }
    }
    
    let stream: MediaStream | null = null;
    
    try {
      // Initialize audio contexts
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Request microphone access
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream; // Store stream in ref so it can be stopped later
      } catch (mediaError: any) {
        console.error("Microphone access error:", {
          name: mediaError.name,
          message: mediaError.message,
          constraint: mediaError.constraint
        });
        if (isMountedRef.current) {
          setStatus('idle');
        }
        stopSession();
        return;
      }
      
      if (!isLiveRef.current || !isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      // Create connection with timeout handling
      const connectionTimeout = setTimeout(() => {
        if (isLiveRef.current && !sessionRef.current) {
          console.error("Connection timeout: WebSocket did not establish within expected time");
          if (isMountedRef.current) {
            setStatus('idle');
          }
          stopSession();
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
          }
        }
      }, 10000); // 10 second timeout
      
      const sessionPromise = geminiService.connectLive({
        onopen: () => {
          clearTimeout(connectionTimeout);
          if (!isMountedRef.current || !isLiveRef.current) {
            stopSession();
            return;
          }
          
          setStatus('active');
          
          if (!stream || !inputAudioCtxRef.current || !outputAudioCtxRef.current) {
            console.error("Missing stream or audio context in onopen");
            stopSession();
            if (isMountedRef.current) {
              setStatus('idle');
            }
            return;
          }
          
          try {
            // Set up real-time MediaRecorder for conversation recording
            // Create a destination node that will mix both microphone and model audio
            audioDestinationRef.current = inputAudioCtxRef.current.createMediaStreamDestination();
            recordingStreamRef.current = audioDestinationRef.current.stream;
            
            // Connect microphone input to the recording destination
            const micSource = inputAudioCtxRef.current.createMediaStreamSource(stream);
            micSource.connect(audioDestinationRef.current);
            
            // Initialize MediaRecorder to record the mixed stream
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
              ? 'audio/webm' 
              : MediaRecorder.isTypeSupported('audio/ogg') 
              ? 'audio/ogg' 
              : 'audio/wav';
            
            mediaRecorderRef.current = new MediaRecorder(recordingStreamRef.current, {
              mimeType: mimeType as any
            });
            
            recordedChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
              if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
              }
            };
            
            mediaRecorderRef.current.onstop = () => {
              console.log('🎙️ MediaRecorder stopped, chunks:', recordedChunksRef.current.length);
            };
            
            // Start recording
            mediaRecorderRef.current.start(1000); // Collect data every second
            console.log('✅ Real-time MediaRecorder started');
            
            // Set up Web Speech API for transcription (fallback since Gemini Live doesn't provide user transcriptions)
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
              const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
              const recognition = new SpeechRecognition();
              recognition.continuous = true;
              recognition.interimResults = true;
              recognition.lang = 'fr-FR';
              
              recognition.onresult = (event: any) => {
                if (!isLiveRef.current || !isMountedRef.current) return;
                
                let interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                  const transcript = event.results[i][0].transcript;
                  if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                  } else {
                    interimTranscript += transcript;
                  }
                }
                
                if (finalTranscript.trim()) {
                  console.log('🎤 Web Speech API transcription:', finalTranscript);
                  if (currentPart === 'A') {
                    transcriptA.current += ' ' + finalTranscript.trim();
                    console.log('📝 Part A transcript length:', transcriptA.current.length);
                  } else {
                    transcriptB.current += ' ' + finalTranscript.trim();
                    console.log('📝 Part B transcript length:', transcriptB.current.length);
                  }
                  if (isMountedRef.current) {
                    setTranscription(finalTranscript.trim());
                  }
                } else if (interimTranscript && isMountedRef.current) {
                  setTranscription(interimTranscript);
                }
              };
              
              recognition.onerror = (event: any) => {
                console.warn('Speech recognition error:', event.error);
              };
              
              recognition.onend = () => {
                // Restart recognition if session is still active
                if (isLiveRef.current && isMountedRef.current) {
                  try {
                    recognition.start();
                  } catch (e) {
                    console.debug('Recognition already started or error:', e);
                  }
                }
              };
              
              recognitionRef.current = recognition;
              recognition.start();
              console.log('✅ Web Speech API started for transcription');
            } else {
              console.warn('⚠️ Web Speech API not available - transcriptions will not be captured');
            }
            
            const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current.createScriptProcessor(2048, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isLiveRef.current || !sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Note: Microphone is already being recorded via MediaRecorder (connected to audioDestinationRef above)
              
              const volume = inputData.reduce((acc, val) => acc + Math.abs(val), 0) / inputData.length;
              if (isMountedRef.current) {
                setIsUserSpeaking(volume > 0.01);
              }

              const pcmBlob = createPcmBlob(inputData, inputAudioCtxRef.current!.sampleRate);
              // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`, do not add other condition checks.
              // Send as `audio` (not generic media) to match live API expectations; sending under media causes silent closes.
              sessionPromise.then(session => {
                if (!isLiveRef.current || !session) return;
                try {
                  session.sendRealtimeInput({ audio: pcmBlob });
                } catch (e) {
                  console.debug("Failed to send audio frame", e);
                }
              }).catch(err => {
                console.debug("Session promise error in audio processing", err);
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current.destination);
          } catch (audioError) {
            console.error("Error setting up audio processing:", audioError);
            stopSession();
            if (isMountedRef.current) {
              setStatus('idle');
            }
          }
        },
        onmessage: async (message: any) => {
          if (!isMountedRef.current) return;
          
          // Debug: Log message structure to understand transcription format
          if (message.clientContent || message.serverContent) {
            console.debug('📨 Message received:', {
              hasClientContent: !!message.clientContent,
              hasServerContent: !!message.serverContent,
              clientKeys: message.clientContent ? Object.keys(message.clientContent) : [],
              serverKeys: message.serverContent ? Object.keys(message.serverContent) : []
            });
          }
          
          if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            setIsModelSpeaking(true);
            const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
            const audioData = decodeAudio(base64);
            const buffer = await decodeAudioData(audioData, outputAudioCtxRef.current!, 24000, 1);
            
            const source = outputAudioCtxRef.current!.createBufferSource();
            source.buffer = buffer;
            
            // Add a gain node to prevent clipping and improve quality
            const gainNode = outputAudioCtxRef.current!.createGain();
            gainNode.gain.value = 0.9; // Slightly reduce volume to prevent clipping
            source.connect(gainNode);
            gainNode.connect(outputAudioCtxRef.current!.destination);
            
            // Also connect to recording destination to capture model audio in real-time
            // We need to decode model audio in the input context (where MediaRecorder is)
            if (audioDestinationRef.current && inputAudioCtxRef.current) {
              try {
                // Decode model audio in the input context at its sample rate (16kHz)
                // The decodeAudioData function will handle the resampling
                const recordingBuffer = await decodeAudioData(audioData, inputAudioCtxRef.current, inputAudioCtxRef.current.sampleRate, 1);
                const recordingSource = inputAudioCtxRef.current.createBufferSource();
                recordingSource.buffer = recordingBuffer;
                
                // Add gain node for recording too to prevent clipping
                const recordingGain = inputAudioCtxRef.current.createGain();
                recordingGain.gain.value = 0.9;
                recordingSource.connect(recordingGain);
                recordingGain.connect(audioDestinationRef.current);
                
                // Start the recording source to match playback timing
                const relativeTime = nextStartTimeRef.current - outputAudioCtxRef.current!.currentTime;
                const startTime = inputAudioCtxRef.current.currentTime + Math.max(0, relativeTime);
                recordingSource.start(startTime);
                
                // Clean up when done
                recordingSource.onended = () => {
                  try {
                    recordingSource.disconnect();
                  } catch (e) {
                    // Already disconnected
                  }
                };
              } catch (recordingError) {
                console.warn('Failed to add model audio to recording:', recordingError);
              }
            }
            
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current!.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            
            sourcesRef.current.add(source);
            source.onended = () => {
              sourcesRef.current.delete(source);
              if (sourcesRef.current.size === 0 && isMountedRef.current) {
                setIsModelSpeaking(false);
              }
            };
          }

          // Capture user's input transcription (what the candidate said)
          // According to Gemini docs: input transcription comes in serverContent.inputTranscription
          // (NOT clientContent - that was the bug!)
          if (message.serverContent?.inputTranscription?.text) {
            const userText = message.serverContent.inputTranscription.text;
            if (userText && userText.trim()) {
              console.log('🎤 Gemini input transcription captured:', userText.substring(0, 100) + (userText.length > 100 ? '...' : ''));
              if (currentPart === 'A') {
                transcriptA.current += ' ' + userText.trim();
                console.log('📝 Part A transcript length:', transcriptA.current.length);
              } else {
                transcriptB.current += ' ' + userText.trim();
                console.log('📝 Part B transcript length:', transcriptB.current.length);
              }
              // Update UI with latest user speech
              setTranscription(userText);
            }
          }
          
          // Also check for input transcription in other possible locations (fallback)
          // Sometimes it might come in different message structures
          if (!message.serverContent?.inputTranscription && message.serverContent?.inputAudioTranscription?.text) {
            const userText = message.serverContent.inputAudioTranscription.text;
            if (userText && userText.trim()) {
              console.log('🎤 Gemini inputAudioTranscription captured:', userText.substring(0, 100));
              if (currentPart === 'A') {
                transcriptA.current += ' ' + userText.trim();
              } else {
                transcriptB.current += ' ' + userText.trim();
              }
              setTranscription(userText);
            }
          }
          
          // Also capture model's output transcription for display (examiner speech)
          if (message.serverContent?.outputTranscription) {
            const modelText = message.serverContent.outputTranscription.text;
            // Don't accumulate model speech in transcripts - only show in UI
            setTranscription(prev => modelText);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            if (isMountedRef.current) {
              setIsModelSpeaking(false);
            }
          }
        },
        onerror: (e: any) => {
          const errorDetails = {
            error: e,
            code: e?.code,
            reason: e?.reason,
            message: e?.message,
            timestamp: new Date().toISOString()
          };
          console.error("WebSocket session error:", errorDetails);
          
          // Check for API key errors specifically
          const errorMessage = e?.reason || e?.message || String(e);
          if (errorMessage.includes('API key') || errorMessage.includes('api key') || errorMessage.includes('authentication')) {
            console.error('❌ API Key Error Detected!');
            console.error('Please check:');
            console.error('1. Your .env.local file exists in the project root');
            console.error('2. It contains: GEMINI_API_KEY=your_actual_key_here');
            console.error('3. You restarted the dev server after adding the key');
            console.error('4. The key has no extra quotes or whitespace');
            console.error('5. You copied the full key from https://aistudio.google.com/apikey');
          }
          
          stopSession();
          if (isMountedRef.current) {
            setStatus('idle');
          }
        },
        onclose: (event?: CloseEvent) => {
          const closeDetails = {
            code: event?.code,
            reason: event?.reason,
            wasClean: event?.wasClean,
            timestamp: new Date().toISOString()
          };
          console.log("WebSocket session closed:", closeDetails);
          
          // Check for API key errors (code 1007 with API key message)
          if (event?.code === 1007 && event?.reason?.includes('API key')) {
            console.error('❌ API Key Validation Failed!');
            console.error('Close code 1007 indicates invalid API key.');
            console.error('Troubleshooting steps:');
            console.error('1. Verify .env.local exists: Check if .env.local file is in project root');
            console.error('2. Check variable name: Must be GEMINI_API_KEY (not API_KEY)');
            console.error('3. Verify format: GEMINI_API_KEY=your_key_here (no quotes, no spaces around =)');
            console.error('4. Restart server: Stop and restart "npm run dev" after changing .env.local');
            console.error('5. Get new key: Visit https://aistudio.google.com/apikey if needed');
            console.error('6. Check key length: Should be a long string (typically 39+ characters)');
          }
          
          stopSession();
          if (isMountedRef.current) {
            setStatus('idle');
          }
        },
      }, currentTask, currentPart);

      clearTimeout(connectionTimeout);
      sessionRef.current = await sessionPromise;
      
      if (!isLiveRef.current || !isMountedRef.current) {
        stopSession();
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
      }
    } catch (err: any) {
      console.error("Failed to start session:", {
        error: err,
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
        timestamp: new Date().toISOString()
      });
      stopSession();
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (isMountedRef.current) {
        setStatus('idle');
      }
    }
  };

  const handleNextOrFinish = async () => {
    if (scenario.mode === 'full' && currentPart === 'A') {
      stopSession();
      setCurrentPart('B');
      setTranscription('');
      setStatus('idle');
      // Reset timer for Part B
      setTimeLeft(scenario.officialTasks.partB.time_limit_sec);
      hasAutoFinishedRef.current = false; // Reset auto-finish flag for Part B
      // Keep audio chunks from Part A - we'll merge everything at the end
    } else {
      // Allow termination at any time - stop session first, then evaluate
      setStatus('evaluating');
      stopSession();
      
      try {
        const fullPrompt = `Section A: ${scenario.officialTasks.partA.prompt}\nSection B: ${scenario.officialTasks.partB.prompt}`;
        
        // Stop MediaRecorder and process the real-time recording
        let recordingId: string | undefined;
        let transcript: string = '';
        let wavBlob: Blob | null = null;
        
        // Stop the MediaRecorder if it's still recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            mediaRecorderRef.current.stop();
            console.log('🛑 MediaRecorder stopped');
          } catch (e) {
            console.error('Error stopping MediaRecorder:', e);
          }
        }
        
        // Wait a moment for the last data to be available
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (recordedChunksRef.current.length > 0) {
          try {
            console.log('🎙️ Processing real-time audio recording...', {
              chunks: recordedChunksRef.current.length,
              totalSize: recordedChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
            });
            
            // Combine all recorded chunks into a single blob
            const recordedBlob = new Blob(recordedChunksRef.current, { 
              type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
            });
            
            // Use the blob directly - Gemini may support WebM, or we can convert if needed
            wavBlob = recordedBlob;
            
            // Upload recording to GridFS
            const token = await getToken();
            recordingId = await persistenceService.uploadRecording(wavBlob, user?.id || 'guest', token) || undefined;
            console.log('📦 Audio recording uploaded:', recordingId || 'failed');
            
            // Transcribe the recording using Gemini Audio API
            if (wavBlob) {
              try {
                console.log('🎤 Transcribing audio recording...');
                transcript = await geminiService.transcribeAudio(wavBlob);
                console.log('✅ Transcription completed:', transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''));
              } catch (transcribeError) {
                console.error('❌ Error transcribing audio:', transcribeError);
                // Fallback to live transcript if transcription fails
                transcript = `PARTIE A:\n${transcriptA.current.trim() || '(aucune transcription)'}\n\nPARTIE B:\n${transcriptB.current.trim() || '(aucune transcription)'}`;
              }
            }
          } catch (error) {
            console.error('❌ Error processing audio recording:', error);
            // Fallback to live transcript if processing fails
            transcript = `PARTIE A:\n${transcriptA.current.trim() || '(aucune transcription)'}\n\nPARTIE B:\n${transcriptB.current.trim() || '(aucune transcription)'}`;
          }
        } else {
          // No audio recorded, use live transcript as fallback
          console.warn('⚠️ No audio chunks recorded, using live transcript fallback');
          transcript = `PARTIE A:\n${transcriptA.current.trim() || '(aucune transcription)'}\n\nPARTIE B:\n${transcriptB.current.trim() || '(aucune transcription)'}`;
        }
        
        // Use transcribed text for evaluation (instead of live transcript)
        const fullUserTranscript = transcript || `PARTIE A:\n${transcriptA.current.trim() || '(aucune transcription)'}\n\nPARTIE B:\n${transcriptB.current.trim() || '(aucune transcription)'}`;
        
        // Log what we're sending for debugging
        console.log('📝 Using transcript for evaluation:', {
          source: transcript ? 'WAV transcription' : 'live transcript (fallback)',
          length: fullUserTranscript.length,
          preview: fullUserTranscript.substring(0, 200) + (fullUserTranscript.length > 200 ? '...' : '')
        });
        
        // Estimate question count for EO1 (rough heuristic: count question marks and question words)
        const questionCount = (fullUserTranscript.match(/\?/g) || []).length + 
          (fullUserTranscript.match(/\b(combien|comment|où|quand|qui|quoi|pourquoi|quel|quelle|quels|quelles)\b/gi) || []).length;
        
        // Evaluate using transcribed text
        const result = await geminiService.evaluateResponse(
          'OralExpression', 
          fullPrompt, 
          fullUserTranscript,
          scenario.officialTasks.partA.id,
          scenario.officialTasks.partA.time_limit_sec + (scenario.officialTasks.partB?.time_limit_sec || 0),
          questionCount > 0 ? questionCount : undefined
        );
        
        // Save result with recordingId, transcript, and task data - returns saved result with _id
        const token = await getToken();
        const savedResult = await persistenceService.saveResult(
          result,
          scenario.mode,
          scenario.title,
          user?.id || 'guest',
          recordingId,
          scenario.officialTasks.partA, // Include task data for Section A
          scenario.officialTasks.partB, // Include task data for Section B
          transcript || undefined, // Include transcript if available
          token // Clerk authentication token
        );
        
        // Clear recorded chunks after upload
        recordedChunksRef.current = [];
        
        onFinish(savedResult);
      } catch (err: any) {
        console.error('Evaluation error:', err);
        
        // Show user-friendly error message
        const errorMessage = err?.error?.message || err?.message || 'Une erreur est survenue lors de l\'évaluation';
        const isRateLimit = err?.error?.code === 429 || err?.status === 'RESOURCE_EXHAUSTED';
        
        if (isRateLimit) {
          alert(`Quota API dépassé. Veuillez réessayer dans quelques instants.\n\n${errorMessage}`);
        } else {
          alert(`Erreur d'évaluation: ${errorMessage}`);
        }
        
        // Reset to idle if evaluation fails so user can try again
        if (isMountedRef.current) {
          setStatus('idle');
        }
      }
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (status === 'active' && timeLeft > 0) {
      const timer = setInterval(() => {
        if (isMountedRef.current) {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              // Time's up - auto-finish the exam
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [status, timeLeft]);

  // Auto-finish when time runs out
  useEffect(() => {
    if (status === 'active' && timeLeft === 0 && !hasAutoFinishedRef.current) {
      hasAutoFinishedRef.current = true; // Prevent multiple calls
      console.log('⏰ Time is up! Auto-finishing exam...');
      // Use setTimeout to avoid calling handleNextOrFinish during render
      setTimeout(() => {
        handleNextOrFinish();
      }, 100);
    }
  }, [status, timeLeft]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopSession();
    };
  }, []);

  // Check if mic section overflows viewport and control page scrolling
  useEffect(() => {
    const checkContentOverflow = () => {
      if (!micSectionRef.current) return;
      
      const section = micSectionRef.current;
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if section bottom extends beyond viewport (only on mobile)
      const isMobile = window.innerWidth < 768; // md breakpoint
      const overflows = isMobile && rect.bottom > windowHeight;
      
      setDoesContentOverflow(overflows);
      
      // Control page scrolling: allow scroll only if content overflows
      if (isMobile) {
        if (overflows) {
          document.body.style.overflow = 'auto';
        } else {
          document.body.style.overflow = 'hidden';
        }
      } else {
        document.body.style.overflow = 'auto';
      }
    };

    // Check on mount and resize
    checkContentOverflow();
    window.addEventListener('resize', checkContentOverflow);
    
    // Also check after a short delay to account for layout changes
    const timeoutId = setTimeout(checkContentOverflow, 100);

    return () => {
      window.removeEventListener('resize', checkContentOverflow);
      clearTimeout(timeoutId);
      // Reset body overflow on unmount
      document.body.style.overflow = 'auto';
    };
  }, [status, currentPart]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * getImagePath: Resilient path resolution.
   * If path is "/folder/img.png", we try to treat it as "folder/img.png"
   * to ensure it resolves correctly in common dev/preview environments.
   */
  const getImagePath = (path: string) => {
    if (!path) return '';
    return path;
  };

  // Show loading screen during evaluation
  if (status === 'evaluating') {
    return <LoadingResult />;
  }

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {scenario.mode !== 'partB' && (
            <div className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-[1.25rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${currentPart === 'A' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>Partie A</div>
          )}
          {scenario.mode !== 'partA' && (
            <div className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-[1.25rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${currentPart === 'B' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>Partie B</div>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {status === 'active' && timeLeft > 0 && (
            <div className={`px-4 md:px-6 py-1.5 md:py-2.5 rounded-xl md:rounded-[1.25rem] text-base md:text-lg font-black tabular-nums transition-all ${
              timeLeft <= 60 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse' 
                : timeLeft <= 120
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            }`}>
              {formatTime(timeLeft)}
            </div>
          )}
          {status === 'active' && <div className="text-[9px] md:text-[10px] font-black text-rose-500 flex items-center gap-1"><span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> LIVE</div>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-[400px] md:h-[560px] transition-colors">
          <div className="bg-slate-900 dark:bg-slate-800 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-white/5">
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Document #{currentTask.id}</span>
            <button onClick={() => setShowImageFull(true)} className="text-white hover:text-indigo-400 transition-colors text-xs font-bold flex items-center gap-1">
              <span>🔍</span> <span className="hidden sm:inline">Agrandir</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 relative group scrollbar-hide">
            <img 
              src={getImagePath(currentTask.image)} 
              alt="Task Document" 
              className="w-full h-auto rounded-xl md:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mx-auto transition-transform hover:scale-[1.01]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.warn(`Initial path failed: ${target.src}. Trying fallback...`);
                
                // Fallback sequence logic
                if (!target.dataset.tried) {
                   target.dataset.tried = '1';
                   // If stripping slash failed, try adding it back (absolute)
                   if (!currentTask.image.startsWith('/')) {
                     target.src = '/' + currentTask.image;
                   } else {
                     // If stripping slash failed, try prefixing with ./
                     target.src = './' + currentTask.image.substring(1);
                   }
                   return;
                }
                
                if (target.dataset.tried === '1') {
                   target.dataset.tried = '2';
                   // Final attempt: completely literal path from data
                   target.src = currentTask.image;
                   return;
                }
                
                target.src = 'https://placehold.co/600x800/1e293b/ffffff?text=DOCUMENT+OFFICIEL\nMANQUANT';
              }}
            />
            <div className="mt-4 md:mt-8 p-4 md:p-6 bg-white dark:bg-slate-800/80 backdrop-blur rounded-xl md:rounded-[2rem] border border-slate-100 dark:border-slate-700 text-[10px] md:text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic shadow-sm">
               <strong className="text-slate-900 dark:text-white not-italic block mb-1">Consigne :</strong> {currentTask.prompt}
            </div>
          </div>
        </div>

        <div 
          ref={micSectionRef}
          className="bg-slate-900 dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-12 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 md:gap-0 md:space-y-12 relative overflow-hidden shadow-2xl transition-colors"
        >
          <div className={`absolute inset-0 opacity-10 pointer-events-none transition-all duration-1000 ${isModelSpeaking ? 'bg-indigo-500' : (isUserSpeaking ? 'bg-emerald-500' : 'bg-transparent')}`} />
          
          <div className="relative group flex-shrink-0">
            <div className={`absolute inset-0 rounded-full blur-[60px] transition-all duration-700 ${isModelSpeaking ? 'bg-indigo-500/40 scale-150' : (isUserSpeaking ? 'bg-emerald-500/40 scale-125' : 'bg-white/5 scale-100')}`} />
            <button
              onClick={status === 'active' ? handleNextOrFinish : startSession}
              disabled={status === 'connecting' || status === 'evaluating'}
              className={`w-28 h-28 md:w-44 md:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 ring-6 md:ring-[16px] relative z-10 ${
                status === 'active' 
                  ? 'bg-rose-500 hover:bg-rose-600 ring-rose-500/20 active:scale-90' 
                  : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 ring-white/10 text-slate-900 dark:text-white hover:scale-105 active:scale-95'
              }`}
            >
              {status === 'connecting' ? <div className="animate-spin w-7 h-7 md:w-10 md:h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full" /> : 
               status === 'evaluating' ? <span className="text-xl md:text-3xl animate-bounce">⚖️</span> :
               <>
                <span className="text-3xl md:text-5xl mb-0.5 md:mb-2">{status === 'active' ? '⏹' : '🎙'}</span>
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">{status === 'active' ? (scenario.mode === 'full' && currentPart === 'A' ? 'Suite' : 'Terminer') : 'Start'}</span>
               </>}
            </button>
          </div>

          <div className="text-left md:text-center space-y-1.5 md:space-y-3 z-10 flex-1 md:flex-none">
            <h4 className="text-white font-black text-base md:text-2xl tracking-tight">
              {status === 'active' ? (isModelSpeaking ? 'L\'examinateur répond...' : 'À vous de parler') : 'Prêt pour l\'épreuve ?'}
            </h4>
            <p className="text-slate-400 text-[8px] md:text-[10px] uppercase font-black tracking-[0.4em]">TEF AI Master Simulator</p>
          </div>
        </div>
      </div>

      {showImageFull && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 flex items-center justify-center p-6 md:p-12 backdrop-blur-md" onClick={() => setShowImageFull(false)}>
          <div className="max-w-4xl w-full h-full relative" onClick={e => e.stopPropagation()}>
            <img 
              src={getImagePath(currentTask.image)} 
              className="w-full h-full object-contain rounded-xl shadow-2xl" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/1200x1600/1e293b/ffffff?text=DOCUMENT+MANQUANT';
              }}
            />
            <button onClick={() => setShowImageFull(false)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-lg">
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
