
import React, { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { geminiService, decodeAudio, decodeAudioData, createPcmBlob } from '../services/gemini';
import { TEFTask, SavedResult } from '../types';
// Removed combineAudioChunks and mergeAudioTracks - now using MediaRecorder for real-time recording
import { persistenceService } from '../services/persistence';
import { evaluationJobService } from '../services/evaluationJobService';
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
  onSessionStart?: (examType: 'full' | 'partA' | 'partB') => Promise<{ canStart: boolean; sessionId?: string; reason?: string }>;
  mode: 'partA' | 'partB' | 'full';
}

export const OralExpressionLive: React.FC<Props> = ({ scenario, onFinish, onSessionStart, mode }) => {
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
  const usageCountedRef = useRef(false);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isLiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  
  const transcriptA = useRef('');
  const transcriptB = useRef('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasAutoFinishedRef = useRef(false);
  const hasSent60ControlRef = useRef(false);
  
  // Real-time MediaRecorder for conversation recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedChunksPartARef = useRef<Blob[]>([]); // Store Part A audio chunks separately for full exam mode

  // Helper function to stop MediaRecorder and wait for final chunks
  const stopMediaRecorderAndWait = async (): Promise<void> => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        const stopPromise = new Promise<void>((resolve) => {
          if (mediaRecorderRef.current) {
            const originalHandler = mediaRecorderRef.current.onstop;
            mediaRecorderRef.current.onstop = () => {
              if (originalHandler) {
                originalHandler.call(mediaRecorderRef.current);
              }
              console.log('🛑 MediaRecorder stopped, chunks:', recordedChunksRef.current.length);
              resolve();
            };
            mediaRecorderRef.current.stop();
          } else {
            resolve();
          }
        });
        
        await Promise.race([
          stopPromise,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
        
        // Additional wait to ensure all chunks are available
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.error('Error stopping MediaRecorder:', e);
      }
    }
  };

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
    // Stop MediaRecorder if it's running (don't wait - just stop it)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.debug("MediaRecorder already stopped", e);
      }
    }
    // Reset MediaRecorder and audio destination refs so a fresh one can be created
    mediaRecorderRef.current = null;
    audioDestinationRef.current = null;
    recordingStreamRef.current = null;
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
    // Reset timing ref for audio scheduling
    nextStartTimeRef.current = 0;
    if (isMountedRef.current) {
      setIsModelSpeaking(false);
      setIsUserSpeaking(false);
      // Reset timer when stopping
      setTimeLeft(0);
    }
  };

  // Play voice instructions before starting the session
  const playInstructionsAndStartSession = async () => {
    if (status === 'connecting' || status === 'active') {
      console.log('⚠️ playInstructionsAndStartSession called but session already active/connecting, returning');
      return;
    }
    if (!isMountedRef.current) return;

    // Set status to connecting while we play instructions
    setStatus('connecting');

    try {
      // Load pre-recorded instructions audio from public directory
      const audioPath = currentPart === 'A' 
        ? '/instructions_part_a.wav'
        : '/instructions_part_b.wav';

      console.log(`🎤 Playing instructions for Part ${currentPart} from ${audioPath}...`);
      
      // Use HTML5 Audio API for simpler playback of static files
      const audio = new Audio(audioPath);
      
      // Wait for audio to finish playing
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          console.log('✅ Instructions audio finished');
          resolve();
        };
        audio.onerror = (error) => {
          console.warn('⚠️ Failed to play instructions audio, proceeding without instructions:', error);
          resolve(); // Still proceed even if audio fails
        };
        audio.play().catch((error) => {
          console.warn('⚠️ Failed to play instructions audio, proceeding without instructions:', error);
          resolve(); // Still proceed even if audio fails
        });
      });

      // Small delay after instructions finish
      await new Promise(resolve => setTimeout(resolve, 300));

      // Now start the actual session (status is already 'connecting')
      await startSession();
    } catch (error) {
      console.error('❌ Error playing instructions:', error);
      // If instructions fail, proceed with starting the session anyway
      await startSession();
    }
  };

  const startSession = async () => {
    if (status === 'active') {
      console.log('⚠️ startSession called but session already active, returning');
      return;
    }
    if (!isMountedRef.current) return;
    
    console.log(`🎙️ Starting session for Part ${currentPart}, task: ${currentTask.id}`);
    
    // Count usage when user clicks the mic button (before starting session)
    if (onSessionStart && !usageCountedRef.current) {
      usageCountedRef.current = true;
      const examType = mode === 'full' ? 'full' : mode === 'partA' ? 'partA' : 'partB';
      const result = await onSessionStart(examType);
      
      if (!result.canStart) {
        console.error('Failed to count usage:', result.reason);
        // If usage counting fails, don't start the session
        setStatus('idle'); // Reset status if we can't start
        alert(result.reason || 'Impossible de démarrer l\'examen. Veuillez réessayer.');
        return;
      }
      
      // Store sessionId if provided
      if (result.sessionId) {
        sessionStorage.setItem(`exam_session_${mode}`, result.sessionId);
      }
    }
    
    isLiveRef.current = true;
    if (isMountedRef.current) {
      // Only set status if not already connecting (from instructions)
      if (status !== 'connecting') {
        setStatus('connecting');
      }
      // Initialize timer with current task's time limit
      setTimeLeft(currentTask.time_limit_sec);
      hasAutoFinishedRef.current = false; // Reset auto-finish flag when starting a new session
      hasSent60ControlRef.current = false;
      // Clear recorded chunks when starting Part A or when not in full mode
      // For Part B in full mode, we preserve Part A chunks (already saved to recordedChunksPartARef)
      if (currentPart === 'A' || scenario.mode !== 'full') {
        recordedChunksRef.current = [];
      }
    }
    
    let stream: MediaStream | null = null;
    
    try {
      // Initialize audio contexts (create fresh ones for new session)
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      // Reset timing for audio scheduling
      nextStartTimeRef.current = 0;
      
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
      }, 10000); // 10 second timeout - can be adjusted via LIVE_API_CONFIG.connectionTimeout
      
      const sessionPromise = geminiService.connectLive({
        onopen: () => {
          clearTimeout(connectionTimeout);
          if (!isMountedRef.current || !isLiveRef.current) {
            stopSession();
            return;
          }
          
          setStatus('active');
          
          // Usage will be counted when user clicks the mic button (in startSession)
          
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
            
            // Always clear chunks when starting a new recording session
            // For Part B in full mode, Part A chunks are already saved to recordedChunksPartARef
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
                const errorType = event.error;
                // Network errors are common and non-critical - Gemini Live API provides transcription
                if (errorType === 'network') {
                  console.debug('⚠️ Web Speech API network error (non-critical - Gemini provides transcription):', errorType);
                  // Don't restart on network errors - they're usually persistent
                  return;
                }
                
                // Other errors might be recoverable
                console.warn('Speech recognition error:', errorType);
                
                // For non-network errors, we can try to restart
                if (errorType !== 'no-speech' && errorType !== 'aborted' && isLiveRef.current && isMountedRef.current) {
                  // Wait a bit before retrying
                  setTimeout(() => {
                    if (isLiveRef.current && isMountedRef.current && recognitionRef.current) {
                      try {
                        recognitionRef.current.start();
                      } catch (e) {
                        console.debug('Failed to restart recognition after error:', e);
                      }
                    }
                  }, 1000);
                }
              };
              
              recognition.onend = () => {
                // Only restart recognition if session is still active and it wasn't stopped due to an error
                if (isLiveRef.current && isMountedRef.current && recognitionRef.current) {
                  // Small delay before restarting to avoid rapid restarts
                  setTimeout(() => {
                    if (isLiveRef.current && isMountedRef.current && recognitionRef.current) {
                      try {
                        recognitionRef.current.start();
                      } catch (e) {
                        console.debug('Recognition already started or error:', e);
                      }
                    }
                  }, 500);
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
      }, currentTask, currentPart, undefined, {
        // Optional: Configure response timeouts
        // responseTimeout: 30000, // 30 seconds - uncomment to customize
        // turnDetectionTimeout: 800, // 800ms - uncomment to customize (default from LIVE_API_CONFIG)
      });

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
      // Stop Part A's MediaRecorder and save its chunks before transitioning to Part B
      console.log('🔄 Transitioning from Part A to Part B...');
      await stopMediaRecorderAndWait();
      
      // Save Part A's chunks to recordedChunksPartARef
      recordedChunksPartARef.current = [...recordedChunksRef.current];
      console.log('💾 Part A audio chunks saved:', recordedChunksPartARef.current.length, 'chunks');
      
      // Now stop the session (this will close WebSocket, audio contexts, etc.)
      stopSession();
      
      // Small delay to ensure cleanup completes before starting Part B
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set Part B as current (this updates currentTask which is used in startSession)
      setCurrentPart('B');
      setTranscription('');
      setStatus('idle');
      // Reset timer for Part B
      setTimeLeft(scenario.officialTasks.partB.time_limit_sec);
      hasAutoFinishedRef.current = false; // Reset auto-finish flag for Part B
      console.log('✅ Ready for Part B - user can click mic to start');
      // Part A chunks are now saved in recordedChunksPartARef, Part B will start fresh
    } else {
      // Stop session immediately
      stopSession();
      
      // Create placeholder result with loading flag and immediately redirect
      const placeholderResult: SavedResult = {
        _id: `temp-${Date.now()}`,
        userId: user?.id || 'guest',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mode: scenario.mode,
        title: scenario.title,
        score: 0,
        clbLevel: 'CLB 0',
        cecrLevel: 'A1',
        feedback: '',
        strengths: [],
        weaknesses: [],
        grammarNotes: '',
        vocabularyNotes: '',
        isLoading: true,
        taskPartA: scenario.officialTasks.partA,
        taskPartB: scenario.officialTasks.partB,
      };
      
      // Immediately redirect to result page with loading state
      onFinish(placeholderResult);
      
      // Now continue with evaluation in the background
      setStatus('evaluating');
      
      try {
        const fullPrompt = `Section A: ${scenario.officialTasks.partA.prompt}\nSection B: ${scenario.officialTasks.partB.prompt}`;
        
        // Stop MediaRecorder and process the real-time recording
        let recordingId: string | undefined;
        let audioTranscript: string | null = null; // Transcript from saved audio (examiner + candidate)
        let fluencyAnalysis: any | null = null; // Optional fluency metrics derived from audio
        let wavBlob: Blob | null = null;
        
        // Stop the MediaRecorder if it's still recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            // Wait for MediaRecorder to finish processing
            const stopPromise = new Promise<void>((resolve) => {
              if (mediaRecorderRef.current) {
                // Store original handler if it exists
                const originalHandler = mediaRecorderRef.current.onstop;
                
                // Set new handler that calls both original and our resolve
                mediaRecorderRef.current.onstop = () => {
                  if (originalHandler) {
                    originalHandler.call(mediaRecorderRef.current);
                  }
                  console.log('🛑 MediaRecorder stopped, chunks:', recordedChunksRef.current.length);
                  resolve();
                };
                
                mediaRecorderRef.current.stop();
              } else {
                resolve();
              }
            });
            
            // Wait for stop event or timeout after 2 seconds
            await Promise.race([
              stopPromise,
              new Promise(resolve => setTimeout(resolve, 2000))
            ]);
          } catch (e) {
            console.error('Error stopping MediaRecorder:', e);
          }
        }
        
        // Additional wait to ensure all chunks are available
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // For full mode, combine Part A and Part B chunks; otherwise just use current chunks
        const chunksToProcess = scenario.mode === 'full' 
          ? [...recordedChunksPartARef.current, ...recordedChunksRef.current]
          : recordedChunksRef.current;
        
        if (chunksToProcess.length > 0) {
          try {
            console.log('🎙️ Processing real-time audio recording...', {
              mode: scenario.mode,
              partAChunks: scenario.mode === 'full' ? recordedChunksPartARef.current.length : 0,
              partBChunks: recordedChunksRef.current.length,
              totalChunks: chunksToProcess.length,
              totalSize: chunksToProcess.reduce((sum, chunk) => sum + chunk.size, 0)
            });
            
            // Combine all recorded chunks into a single blob
            const recordedBlob = new Blob(chunksToProcess, { 
              type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
            });
            
            // Use the blob directly
            wavBlob = recordedBlob;
            
            // Upload recording to GridFS (for playback/debug)
            recordingId = await persistenceService.uploadRecording(wavBlob, user?.id || 'guest', getToken) || undefined;
            console.log('📦 Audio recording uploaded:', recordingId || 'failed');

            // Transcribe the saved audio for grading (cleaner, less fragmented text)
            try {
              console.log('🎤 Transcribing saved audio for evaluation...');
              const { transcript, fluency_analysis } = await geminiService.transcribeAudio(wavBlob);
              audioTranscript = transcript || null;
              fluencyAnalysis = fluency_analysis || null;
              if (audioTranscript) {
                console.log(
                  '✅ Audio transcription completed:',
                  audioTranscript.substring(0, 120) + (audioTranscript.length > 120 ? '...' : '')
                );
              } else {
                console.warn('⚠️ Transcription JSON returned empty transcript.');
              }
            } catch (transcribeError) {
              console.error('❌ Error transcribing saved audio:', transcribeError);
              audioTranscript = null; // Fallback to live transcripts below
              fluencyAnalysis = null;
            }
          } catch (error) {
            console.error('❌ Error processing audio recording:', error);
            audioTranscript = null;
          }
        } else {
          // No audio recorded, we'll rely entirely on live transcripts
          console.warn('⚠️ No audio chunks recorded, using live transcripts only');
          audioTranscript = null;
        }
        
        // Build the text we send for evaluation.
        // Primary source: clean transcription from saved audio (examiner + candidate),
        // Fallback: live candidate-only transcripts (per section).
        let fullUserTranscript: string;
        if (audioTranscript) {
          // Primary path: use clean diarized candidate transcript from saved audio.
          // The prompt for transcribeAudio already tells Gemini that Speaker 1 (first voice)
          // is the candidate and should be the only one in the output.
          fullUserTranscript = audioTranscript.trim();
        } else {
          // Fallback: only candidate live transcripts available
          if (scenario.mode === 'partA') {
            fullUserTranscript = transcriptA.current.trim() || '(aucune transcription)';
          } else if (scenario.mode === 'partB') {
            fullUserTranscript = transcriptB.current.trim() || '(aucune transcription)';
          } else {
            fullUserTranscript = [
              transcriptA.current.trim(),
              transcriptB.current.trim()
            ].filter(Boolean).join('\n\n').trim() || '(aucune transcription)';
          }
        }
        
        // Log what we're sending for debugging
        console.log('📝 Using transcript for evaluation:', {
          source: audioTranscript ? 'saved audio transcription + candidate-only transcript' : 'candidate-only live transcript',
          length: fullUserTranscript.length,
          preview: fullUserTranscript.substring(0, 200) + (fullUserTranscript.length > 200 ? '...' : '')
        });
        
        // Estimate question count for EO1 (rough heuristic: count question marks and question words)
        const questionCount = (fullUserTranscript.match(/\?/g) || []).length + 
          (fullUserTranscript.match(/\b(combien|comment|où|quand|qui|quoi|pourquoi|quel|quelle|quels|quelles)\b/gi) || []).length;
        
        // Submit evaluation job to queue (non-blocking)
        const eo2RemainingSeconds =
          (scenario.mode === 'partB' || scenario.mode === 'full') && currentPart === 'B'
            ? timeLeft
            : undefined;

        const { jobId } = await evaluationJobService.submitJob(
          'OralExpression',
          fullPrompt,
          fullUserTranscript,
          scenario.officialTasks.partA.id,
          scenario.officialTasks.partA.time_limit_sec + (scenario.officialTasks.partB?.time_limit_sec || 0),
          questionCount > 0 ? questionCount : undefined,
          recordingId,
          scenario.mode,
          scenario.title,
          scenario.officialTasks.partA,
          scenario.officialTasks.partB,
          eo2RemainingSeconds,
          fluencyAnalysis ?? undefined,
          getToken
        );
        
        console.log('📋 Evaluation job submitted:', jobId);
        
        // Clear recorded chunks after upload
        recordedChunksRef.current = [];
        recordedChunksPartARef.current = [];
        
        // Create placeholder result with jobId for loading state
        const placeholderResult: SavedResult = {
          _id: `job-${jobId}`,
          userId: user?.id || 'guest',
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mode: scenario.mode,
          title: scenario.title,
          score: 0,
          clbLevel: 'CLB 0',
          cecrLevel: 'A1',
          feedback: '',
          strengths: [],
          weaknesses: [],
          grammarNotes: '',
          vocabularyNotes: '',
          isLoading: true,
          taskPartA: scenario.officialTasks.partA,
          taskPartB: scenario.officialTasks.partB,
        };
        
        // Show loading state immediately
        onFinish(placeholderResult);
        
        // Poll for job completion in background
        try {
          const savedResult = await evaluationJobService.pollJobStatus(
            jobId,
            getToken,
            (progress) => {
              console.log(`📊 Job ${jobId} progress: ${progress}%`);
            }
          );
          
          console.log('✅ Evaluation job completed:', savedResult._id);
          
          // Update with complete result
          onFinish(savedResult);
        } catch (pollError: any) {
          console.error('❌ Job polling error:', pollError);
          // Update result with error state
          const errorResult: SavedResult = {
            ...placeholderResult,
            isLoading: false,
            feedback: `Erreur: ${pollError.message || 'Échec de l\'évaluation'}`,
          };
          onFinish(errorResult);
        }
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
        
        // Update result with error state (still show result page but with error)
        const errorResult: SavedResult = {
          _id: `error-${Date.now()}`,
          userId: user?.id || 'guest',
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mode: scenario.mode,
          title: scenario.title,
          score: 0,
          clbLevel: 'CLB 0',
          cecrLevel: 'A1',
          feedback: `Erreur: ${errorMessage}`,
          strengths: [],
          weaknesses: ['Une erreur est survenue lors de l\'évaluation. Veuillez réessayer.'],
          grammarNotes: '',
          vocabularyNotes: '',
          isLoading: false,
          taskPartA: scenario.officialTasks.partA,
          taskPartB: scenario.officialTasks.partB,
        };
        onFinish(errorResult);
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

  // EO2 time awareness for examiner: single internal signal when about 60 seconds remain.
  useEffect(() => {
    if (status !== 'active' || currentPart !== 'B' || !sessionRef.current) return;
    if (timeLeft <= 60 && timeLeft > 0 && !hasSent60ControlRef.current && !isUserSpeaking && !isModelSpeaking) {
      hasSent60ControlRef.current = true;
      try {
        sessionRef.current.sendRealtimeInput({
          text:
            "NOTE INTERNE POUR L'EXAMINATEUR (ne pas dire au candidat): il reste environ une minute à l'épreuve EO2. " +
            "Prépare une conclusion naturelle: soit tu te montres vraiment convaincu(e) par les arguments du candidat, " +
            "soit tu dis que tu vas réfléchir et que tu lui donneras ta réponse plus tard. Ne fais qu'un seul de ces choix.",
        });
      } catch (e) {
        console.debug('Failed to send 60s internal EO2 control message', e);
      }
    }
  }, [status, currentPart, timeLeft, isUserSpeaking, isModelSpeaking]);

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
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {scenario.mode !== 'partB' && (
            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${currentPart === 'A' ? 'bg-indigo-400 dark:bg-indigo-500 border-indigo-400 dark:border-indigo-500 text-white dark:text-white shadow-lg' : 'bg-indigo-100/70 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>Partie A</div>
          )}
          {scenario.mode !== 'partA' && (
            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${currentPart === 'B' ? 'bg-indigo-400 dark:bg-indigo-500 border-indigo-400 dark:border-indigo-500 text-white dark:text-white shadow-lg' : 'bg-indigo-100/70 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>Partie B</div>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {status === 'active' && timeLeft > 0 && (
            <div className={`px-4 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-xl text-base md:text-base font-black tabular-nums transition-all ${
              timeLeft <= 60 
                ? 'bg-rose-300 dark:bg-rose-500 text-white dark:text-white shadow-lg shadow-rose-300/30 dark:shadow-rose-500/30 animate-pulse' 
                : timeLeft <= 120
                ? 'bg-amber-300 dark:bg-amber-500 text-white dark:text-white shadow-lg shadow-amber-300/30 dark:shadow-amber-500/30'
                : 'bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white shadow-lg shadow-indigo-400/30 dark:shadow-indigo-500/30'
            }`}>
              {formatTime(timeLeft)}
            </div>
          )}
          {status === 'active' && <div className="text-[9px] md:text-[10px] font-black text-rose-300 dark:text-rose-400 flex items-center gap-1"><span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-300 dark:bg-rose-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> LIVE</div>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl md:rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-[400px] md:h-[480px] transition-colors">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 md:px-6 py-3 md:py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
            <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Document #{currentTask.id}</span>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowImageFull(true);
              }} 
              className="text-slate-600 dark:text-slate-400 hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>🔍</span> <span className="hidden sm:inline">Agrandir</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-indigo-100/70 dark:bg-slate-800/50 relative group scrollbar-hide">
            <img 
              src={getImagePath(currentTask.image)} 
              alt="Task Document" 
              className="w-full h-auto rounded-xl md:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 mx-auto transition-transform hover:scale-[1.01]"
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
            <div className="mt-4 md:mt-5 p-4 md:p-4 bg-indigo-100/70 dark:bg-slate-700/50 backdrop-blur rounded-xl md:rounded-xl border border-slate-200 dark:border-slate-600 text-[10px] md:text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic shadow-sm">
               <strong className="text-slate-900 dark:text-slate-100 not-italic block mb-1">Consigne :</strong> {currentTask.prompt}
            </div>
          </div>
        </div>

        <div 
          ref={micSectionRef}
          className="bg-indigo-400 rounded-2xl md:rounded-2xl p-4 md:p-8 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 md:gap-0 md:space-y-8 relative overflow-hidden shadow-2xl transition-colors"
        >
          <div className={`absolute inset-0 opacity-10 pointer-events-none transition-all duration-1000 ${isModelSpeaking ? 'bg-indigo-300' : (isUserSpeaking ? 'bg-emerald-300' : 'bg-transparent')}`} />
          
          <div className="relative group flex-shrink-0">
            <div className={`absolute inset-0 rounded-full blur-[60px] transition-all duration-700 ${isModelSpeaking ? 'bg-indigo-300/40 scale-150' : (isUserSpeaking ? 'bg-emerald-300/40 scale-125' : 'bg-indigo-100/70/5 scale-100')}`} />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (status === 'active') {
                  handleNextOrFinish();
                } else {
                  playInstructionsAndStartSession();
                }
              }}
              disabled={status === 'connecting' || status === 'evaluating'}
              className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 ring-6 md:ring-12 relative z-10 cursor-pointer ${
                status === 'active' 
                  ? 'bg-rose-300 dark:bg-rose-500 hover:bg-rose-400 dark:hover:bg-rose-600 ring-rose-300/20 dark:ring-rose-500/20 active:scale-90' 
                  : 'bg-indigo-100/70 dark:bg-slate-700/50 hover:bg-indigo-100 dark:hover:bg-slate-700 ring-white/10 dark:ring-white/5 text-slate-900 dark:text-slate-100 hover:scale-105 active:scale-95'
              } ${status === 'connecting' || status === 'evaluating' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {status === 'connecting' ? <div className="animate-spin w-7 h-7 md:w-9 md:h-9 border-[3px] border-indigo-300 dark:border-indigo-400 border-t-transparent rounded-full" /> : 
               status === 'evaluating' ? <span className="text-xl md:text-2xl animate-bounce">⚖️</span> :
               <>
                <span className="text-3xl md:text-4xl mb-0.5 md:mb-1.5">{status === 'active' ? '⏹' : '🎙'}</span>
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">{status === 'active' ? (scenario.mode === 'full' && currentPart === 'A' ? 'Suite' : 'Terminer') : 'Start'}</span>
               </>}
            </button>
          </div>

          <div className="text-left md:text-center space-y-1.5 md:space-y-2 z-10 flex-1 md:flex-none">
            <h4 className="text-white font-black text-base md:text-xl tracking-tight">
              {status === 'active' ? (isModelSpeaking ? 'L\'examinateur répond...' : 'À vous de parler') : 'Prêt pour l\'épreuve ?'}
            </h4>
            <p className="text-indigo-100 text-[8px] md:text-[10px] uppercase font-black tracking-[0.4em]">TEF AI Master Simulator</p>
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
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowImageFull(false);
              }} 
              className="absolute top-4 right-4 bg-indigo-100/70/10 hover:bg-indigo-100/70/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-lg cursor-pointer z-50"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
