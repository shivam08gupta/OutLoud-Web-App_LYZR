'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, Video, Mic, MicOff, StopCircle, HelpCircle, Loader2, Disc, AlertCircle, VideoOff } from 'lucide-react'
import { AuthProvider, ProtectedRoute, useAuth } from 'lyzr-architect-pg/client'
import { Toaster } from 'sonner'
import { trackEvent, identifyUser } from '@/lib/analytics'
import { createDefaultTranscriptionProvider, type TranscriptionProvider } from '@/lib/transcription'

const SCENARIO_TYPE = 'behavioural_interview'

// Small static per-role question banks. Keyed by the role id chosen on the
// onboarding screen ("pm" | "swe" | "data" | "marketing" | "other").
const QUESTION_BANKS: Record<string, { prompt: string; guidance: string }[]> = {
  pm: [
    {
      prompt: 'How would you prioritize features for a product roadmap with limited engineering resources?',
      guidance: "Walk through the framework you'd use to weigh impact, effort, and stakeholder needs, then land on a clear call.",
    },
    {
      prompt: 'Walk me through a time you used metrics to make a product decision.',
      guidance: 'Describe the metric you tracked, what it told you, and the decision or trade-off it drove.',
    },
    {
      prompt: 'Tell me about a time you had to align conflicting stakeholders to ship a project.',
      guidance: 'Focus on how you surfaced the disagreement, the execution plan you agreed on, and the outcome.',
    },
  ],
  swe: [
    {
      prompt: 'Walk me through how you would approach debugging a critical production issue.',
      guidance: "Describe how you'd narrow down the root cause under pressure, not just the eventual fix.",
    },
    {
      prompt: 'Describe how you would design a system to handle a sudden spike in traffic.',
      guidance: 'Talk through the key components and trade-offs, at a level a non-specialist teammate could follow.',
    },
    {
      prompt: 'Tell me about a time you disagreed with a teammate on a technical approach and how you resolved it.',
      guidance: 'Focus on how the disagreement was worked through and what the collaboration looked like afterward.',
    },
  ],
  data: [
    {
      prompt: 'Walk me through how you would analyze a sudden drop in a key metric using data.',
      guidance: "Describe how you'd query and slice the data to isolate the cause, not just the final finding.",
    },
    {
      prompt: 'Describe a time you designed or analyzed an experiment (A/B test). What did you learn?',
      guidance: 'Cover the hypothesis, how you measured success, and what the result changed.',
    },
    {
      prompt: 'Tell me about a time you had to explain a complex data finding to a non-technical stakeholder.',
      guidance: 'Focus on how you translated the insight into something actionable for your audience.',
    },
  ],
  marketing: [
    {
      prompt: 'Walk me through how you would plan a go-to-market strategy for a new product launch.',
      guidance: "Cover positioning, channels, and how you'd sequence the launch.",
    },
    {
      prompt: 'Describe a time you had to reposition a product or campaign to reach a new audience.',
      guidance: 'Focus on the acquisition or positioning insight that drove the change.',
    },
    {
      prompt: 'Tell me about a campaign you ran and how you measured its success.',
      guidance: 'Be specific about the metrics you used and what they told you about performance.',
    },
  ],
  other: [
    {
      prompt: 'Tell me about a time when you disagreed with a stakeholder.',
      guidance: "Take a moment to think. There's no need to rush. Focus on outlining the situation, your specific action, and the constructive outcome.",
    },
    {
      prompt: 'Describe a project where you had to learn something new under a tight deadline.',
      guidance: 'Walk through how you prioritised learning, the resources you used, and how it affected the outcome.',
    },
    {
      prompt: 'Tell me about a time you received difficult feedback. How did you respond?',
      guidance: 'Focus on what you changed afterwards, not just how the feedback felt.',
    },
  ],
}

// `MediaRecorder.isTypeSupported()` reports true for mime types the recorder
// then refuses to start with, so the only reliable capability test is actually
// calling `start()`. Walk the candidates and keep the first recorder that
// starts, falling back to letting the browser choose its own container.
function startAudioRecorder(
  audioStream: MediaStream,
  onData: (e: BlobEvent) => void
): MediaRecorder | null {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates: (string | undefined)[] = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    undefined,
  ]
  for (const mimeType of candidates) {
    try {
      const recorder = mimeType
        ? new MediaRecorder(audioStream, { mimeType })
        : new MediaRecorder(audioStream)
      recorder.ondataavailable = onData
      recorder.start()
      return recorder
    } catch (err) {
      console.error(
        `[practice] MediaRecorder failed to start (mimeType=${mimeType ?? 'browser default'}):`,
        err
      )
    }
  }
  return null
}

function getQuestionBank() {
  const role = typeof window !== 'undefined' ? localStorage.getItem('outloud_role') : null
  return (role && QUESTION_BANKS[role]) || QUESTION_BANKS.other
}

function CameraSurface({
  videoRef,
  className,
  mediaError,
  micOnly,
  activeMode,
  onRetry,
  onContinueAudioOnly,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  className: string
  mediaError: string | null
  micOnly: boolean
  activeMode: 'av' | 'audio'
  onRetry: () => void
  onContinueAudioOnly: () => void
}) {
  if (mediaError) {
    return (
      <div className={`${className} flex flex-col items-center justify-center gap-3 p-4 text-center bg-muted`}>
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground max-w-xs">{mediaError}</p>
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <button onClick={onRetry} className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            Try Again
          </button>
          {activeMode === 'av' && (
            <button onClick={onContinueAudioOnly} className="text-sm font-medium bg-card border border-border text-primary px-4 py-2 rounded-lg hover:bg-muted transition-colors">
              Continue with Microphone Only
            </button>
          )}
        </div>
      </div>
    )
  }
  if (micOnly) {
    return (
      <div className={`${className} flex flex-col items-center justify-center gap-3 p-4 text-center bg-muted`}>
        <VideoOff className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Camera unavailable &mdash; microphone only</p>
      </div>
    )
  }
  // Cast avoids a RefObject<T|null> vs LegacyRef<T> mismatch across React type versions.
  return <video ref={videoRef as React.Ref<HTMLVideoElement>} autoPlay muted playsInline className={`${className} object-cover`} />
}

function PracticeContent() {
  const router = useRouter()
  const params = useSearchParams()
  const QUESTIONS = getQuestionBank()
  const TOTAL_QUESTIONS = QUESTIONS.length
  const currentQuestion = Math.min(Math.max(parseInt(params.get('q') ?? '1', 10) || 1, 1), TOTAL_QUESTIONS)
  const requestedMode: 'av' | 'audio' = params.get('media') === 'audio' ? 'audio' : 'av'
  const question = QUESTIONS[currentQuestion - 1]
  const { user } = useAuth()
  const userId = user?.id

  const [activeMode, setActiveMode] = useState<'av' | 'audio'>(requestedMode)
  const [retryToken, setRetryToken] = useState(0)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [micOnly, setMicOnly] = useState(requestedMode === 'audio')

  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingLabel, setSubmittingLabel] = useState('Processing your response...')
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [sttError, setSttError] = useState<string | null>(null)
  const [emptyTranscriptError, setEmptyTranscriptError] = useState(false);

  const [providerReady, setProviderReady] = useState(false)
  const providerRef = useRef<TranscriptionProvider | null>(null)
  const speechSupported = providerReady ? !!providerRef.current?.isSupported() : true

  useEffect(() => {
    providerRef.current = createDefaultTranscriptionProvider()
    setProviderReady(true)
  }, [])

  useEffect(() => {
    identifyUser(userId)
    trackEvent('practice_started', {
      scenario_type: SCENARIO_TYPE,
      question_number: currentQuestion,
      user_id: userId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion])

  const streamRef = useRef<MediaStream | null>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)
  const desktopVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const isRecordingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setMediaError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("This browser doesn't support camera or microphone access. Please try a modern browser like Chrome.")
      return
    }

    const constraints: MediaStreamConstraints = activeMode === 'audio' ? { audio: true } : { video: true, audio: true }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        setMicOnly(activeMode === 'audio' || stream.getVideoTracks().length === 0)
        ;[mobileVideoRef, desktopVideoRef].forEach((ref) => {
          if (ref.current) ref.current.srcObject = stream
        })
        trackEvent('permissions_granted', {
          scenario_type: SCENARIO_TYPE,
          question_number: currentQuestion,
          user_id: userId,
        })
      })
      .catch((err) => {
        if (cancelled) return
        const name = err?.name
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setMediaError(
            activeMode === 'av'
              ? 'Camera and microphone access was denied. You can try again or continue with microphone only.'
              : 'Microphone access was denied. Please allow microphone access to continue.'
          )
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setMediaError("We couldn't find a camera or microphone on this device.")
        } else {
          setMediaError("We couldn't access your camera or microphone. Please try again.")
        }
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [activeMode, retryToken, currentQuestion])

  useEffect(() => {
    return () => {
      isRecordingRef.current = false
      try {
        providerRef.current?.stop()
      } catch {
        // ignore
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const retry = () => {
    setMediaError(null)
    setRetryToken((t) => t + 1)
  }

  const continueAudioOnly = () => {
    setMediaError(null)
    setActiveMode('audio')
    setRetryToken((t) => t + 1)
  }

  const handleStart = () => {
    setSeconds(0)
    setEmptyTranscriptError(false)
    setSttError(null)
    setTranscript('')
    isRecordingRef.current = true
    setIsRecording(true)
    trackEvent('recording_started', {
      scenario_type: SCENARIO_TYPE,
      question_number: currentQuestion,
      user_id: userId,
    })

    // Cosmetic live transcript, via the provider seam.
    const provider = providerRef.current
    if (provider?.isSupported() && streamRef.current) {
      provider.onPartial((text) => setTranscript(text))
      provider.onError((e) => {
        if (e.fatal) setSttError(e.message)
      })
      provider.start(streamRef.current)
    }

    // Retain the recorded blob (donor discards it) so the authoritative
    // transcript comes from the uploaded audio, not just Web Speech.
    recordedChunksRef.current = []
    if (streamRef.current) {
      // Record the audio tracks on their own. MediaRecorder accepts an
      // audio-only mimeType over an audio+video stream in the constructor and
      // then throws NotSupportedError from start(), which silently killed
      // recording in camera mode -- /api/transcribe was never called and the
      // app degraded to the cosmetic Web Speech layer, which is unreliable on
      // Android. Dropping the video track also keeps the upload audio-sized
      // rather than shipping video frames to Gemini.
      const audioTracks = streamRef.current.getAudioTracks()
      if (audioTracks.length === 0) {
        console.error('[practice] media stream has no audio track; cannot record a response')
        setSttError("We couldn't access your microphone. Check your browser's microphone permission and try again.")
        mediaRecorderRef.current = null
      } else {
        const recorder = startAudioRecorder(new MediaStream(audioTracks), (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data)
        })
        mediaRecorderRef.current = recorder
        if (!recorder) {
          setSttError("We couldn't start recording on this device, so your answer can't be transcribed. Please try again.")
        }
      }
    }
  }

  const handleStop = async () => {
    isRecordingRef.current = false
    setIsRecording(false)
    setIsSubmitting(true)
    setSubmittingLabel('Processing your response...')
    const responseDurationSeconds = seconds

    const provider = providerRef.current
    const cosmeticResult = provider ? await provider.stop().catch(() => null) : null

    const recorder = mediaRecorderRef.current
    let blob: Blob | null = null
    if (recorder && recorder.state !== 'inactive') {
      blob = await new Promise<Blob | null>((resolve) => {
        recorder.onstop = () => {
          resolve(recordedChunksRef.current.length ? new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' }) : null)
        }
        try {
          recorder.stop()
        } catch {
          resolve(null)
        }
      })
    } else if (recordedChunksRef.current.length) {
      blob = new Blob(recordedChunksRef.current, { type: recorder?.mimeType || 'audio/webm' })
    }

    sessionStorage.setItem(`outloud_question_${currentQuestion}`, question.prompt)

    let authoritativeText = ''
    let transcriptionUnsupported = false

    if (blob && blob.size > 0) {
      setSubmittingLabel('Transcribing your response...')
      try {
        const formData = new FormData()
        formData.append('audio', blob, `answer-${currentQuestion}.webm`)
        formData.append('question_number', String(currentQuestion))
        const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
        const data = await res.json().catch(() => ({}))
        if (data?.error === 'not_configured') {
          console.warn('[practice] /api/transcribe is not configured (GEMINI_API_KEY unset); falling back to Web Speech')
          transcriptionUnsupported = true
        } else if (typeof data?.text === 'string') {
          authoritativeText = data.text.trim()
          if (!authoritativeText) {
            console.warn('[practice] /api/transcribe returned an empty transcript -- the recorded audio was likely silent')
          }
        } else {
          console.error('[practice] /api/transcribe returned an unexpected payload:', res.status, data)
          transcriptionUnsupported = true
        }
      } catch (err) {
        console.error('[practice] /api/transcribe request failed:', err)
        transcriptionUnsupported = true
      }
    } else {
      // No audio to send. Either the recorder never started (a real bug -- see
      // startAudioRecorder) or it produced no chunks; both previously collapsed
      // into the same silent "STT unsupported" path as a missing API key.
      console.error(
        '[practice] no audio blob to transcribe',
        mediaRecorderRef.current ? '(recorder started but captured no data)' : '(recorder failed to start)'
      )
      transcriptionUnsupported = true
    }

    setIsSubmitting(false)

    // Fall back to the cosmetic Web Speech salvage only if the authoritative
    // audio transcription produced nothing (upload failure), per plan 6.c.
    const finalText = authoritativeText || cosmeticResult?.text?.trim() || ''

    if (!speechSupported && transcriptionUnsupported && !finalText) {
      sessionStorage.setItem(`outloud_transcript_${currentQuestion}`, '')
      sessionStorage.setItem(`outloud_transcript_unsupported_${currentQuestion}`, '1')
      trackEvent('response_submitted', {
        scenario_type: SCENARIO_TYPE,
        question_number: currentQuestion,
        user_id: userId,
        response_duration_seconds: responseDurationSeconds,
      })
      router.push(`/feedback?q=${currentQuestion}`)
      return
    }

    if (!finalText) {
      if (transcriptionUnsupported) {
        sessionStorage.setItem(`outloud_transcript_${currentQuestion}`, '')
        sessionStorage.setItem(`outloud_transcript_unsupported_${currentQuestion}`, '1')
        trackEvent('response_submitted', {
          scenario_type: SCENARIO_TYPE,
          question_number: currentQuestion,
          user_id: userId,
          response_duration_seconds: responseDurationSeconds,
        })
        router.push(`/feedback?q=${currentQuestion}`)
        return
      }
      setEmptyTranscriptError(true)
      return
    }

    sessionStorage.removeItem(`outloud_transcript_unsupported_${currentQuestion}`)
    sessionStorage.setItem(`outloud_transcript_${currentQuestion}`, finalText)
    trackEvent('response_submitted', {
      scenario_type: SCENARIO_TYPE,
      question_number: currentQuestion,
      user_id: userId,
      response_duration_seconds: responseDurationSeconds,
    })
    router.push(`/feedback?q=${currentQuestion}`)
  }

  const WaveformBars = () => (
    <div className="flex items-end h-8 gap-[2px] px-2">
      {[12, 24, 16, 32, 20, 28, 14].map((h, i) => (
        <div key={i} className="w-1 bg-secondary rounded-full animate-pulse" style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )

  return (
    <div className="bg-primary text-primary-foreground min-h-screen flex flex-col antialiased">
      <header className="hidden md:flex w-full h-16 justify-between items-center px-8 max-w-6xl mx-auto shrink-0 border-b border-primary-foreground/20">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-1">
          <X className="w-5 h-5" />
          <span className="text-sm font-medium">Exit Practice</span>
        </button>
        <div className="text-lg font-bold tracking-tight">OutLoud</div>
        <div className="w-[100px]" />
      </header>

      <header className="md:hidden w-full px-4 py-3 flex justify-between items-center bg-card border-b border-border shrink-0">
        <button onClick={() => router.push('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold text-primary">Behavioural Interview</h1>
          <p className="text-xs text-muted-foreground mt-1">Question {currentQuestion} of {TOTAL_QUESTIONS}</p>
        </div>
        <div className="w-10 h-10" />
      </header>

      {!speechSupported && (
        <div className="w-full bg-destructive/15 text-destructive-foreground px-4 md:px-8 py-2 flex items-center gap-2 justify-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-xs">
            Speech-to-text isn&apos;t available in this browser. Your response will still record, but no transcript will be captured. Try Chrome for the full experience.
          </p>
        </div>
      )}

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8 flex flex-col md:flex-row gap-6 overflow-hidden relative">
        <div className="md:hidden w-full aspect-[3/4] max-h-[353px] bg-card rounded-2xl border border-border overflow-hidden relative shadow-sm shrink-0 flex items-center justify-center">
          <CameraSurface videoRef={mobileVideoRef} className="w-full h-full" mediaError={mediaError} micOnly={micOnly} activeMode={activeMode} onRetry={retry} onContinueAudioOnly={continueAudioOnly} />
          {isRecording && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs font-medium text-foreground tabular-nums">Live {formatTime(seconds)}</span>
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <div className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground">
              {mediaError ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground">
              {micOnly || mediaError ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </div>
          </div>
          {isRecording && <div className="absolute inset-0 border-4 border-destructive rounded-2xl pointer-events-none animate-pulse" />}
        </div>

        <div className="hidden md:flex w-full h-full bg-card rounded-2xl border border-border p-3 relative overflow-hidden flex-col shadow-sm shrink md:w-5/12">
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <div className="bg-foreground/80 backdrop-blur-sm text-background text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
              {micOnly || mediaError ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              {micOnly || mediaError ? 'Camera Off' : 'Camera On'}
              <span className="border-l border-background/30 ml-1 pl-2">You</span>
            </div>
          </div>
          <CameraSurface videoRef={desktopVideoRef} className="w-full h-full rounded-xl" mediaError={mediaError} micOnly={micOnly} activeMode={activeMode} onRetry={retry} onContinueAudioOnly={continueAudioOnly} />
          {isRecording && <div className="absolute inset-0 border-4 border-destructive rounded-2xl pointer-events-none" />}
        </div>

        <div className="w-full bg-card rounded-2xl border border-border shadow-sm flex flex-col md:h-full flex-1 md:w-7/12 min-h-0">
          <div className="p-4 md:p-8 flex-grow flex flex-col items-center md:items-start text-center md:text-left justify-center md:justify-start overflow-y-auto min-h-0">
            <div className="hidden md:flex items-center justify-between mb-8 w-full">
              <span className="text-xs font-medium uppercase tracking-wider text-secondary-foreground">Behavioural Interview</span>
              <div className="bg-muted py-1 px-3 rounded-full border border-border/50">
                <span className="text-xs font-medium text-foreground">Question {currentQuestion} of {TOTAL_QUESTIONS}</span>
              </div>
            </div>

            <div className="md:hidden mb-4 text-secondary-foreground">
              <HelpCircle className="w-10 h-10" strokeWidth={1.5} />
            </div>

            <div className="mb-6 flex-grow md:flex-grow-0">
              <h2 className="text-xl md:text-2xl font-semibold text-primary md:text-foreground mb-2 text-balance">&quot;{question.prompt}&quot;</h2>
              <p className="text-sm md:text-base text-muted-foreground text-pretty">{question.guidance}</p>
            </div>

            {isRecording && speechSupported && (
              <div className="w-full bg-muted rounded-lg p-3 border border-border/50 text-left">
                <p className="text-xs font-medium text-secondary-foreground mb-1">Live transcript</p>
                <p className="text-sm text-muted-foreground italic min-h-[1.5em]">{transcript || 'Listening...'}</p>
              </div>
            )}

            {sttError && <p className="mt-3 text-xs text-destructive">{sttError}</p>}

            {emptyTranscriptError && (
              <div className="mt-3 w-full bg-destructive/10 text-destructive rounded-lg p-3 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm">We couldn&apos;t capture your response. Please try again.</p>
              </div>
            )}
          </div>

          <div className="p-4 md:p-8 bg-card border-t border-border rounded-b-2xl shrink-0">
            {!isRecording ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleStart}
                  disabled={!!mediaError || isSubmitting}
                  className="w-full bg-secondary text-secondary-foreground text-sm font-medium py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Disc className="w-5 h-5 fill-current" />}
                  {isSubmitting ? submittingLabel : 'Start Recording'}
                </button>
                <p className="hidden md:block text-center text-xs text-muted-foreground">
                  {mediaError ? 'Resolve access above to start recording.' : 'Your camera and microphone are ready.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="hidden md:flex items-center justify-between bg-muted p-3 rounded-lg border border-border/50 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm font-medium text-foreground flex items-center gap-1">
                      Recording <span className="tabular-nums font-mono">{formatTime(seconds)}</span>
                    </span>
                  </div>
                  <WaveformBars />
                </div>
                <button
                  onClick={handleStop}
                  disabled={isSubmitting}
                  className={`w-full bg-card border-2 border-secondary text-foreground text-sm font-medium py-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${isSubmitting ? 'opacity-80 cursor-not-allowed' : 'hover:bg-muted'}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-secondary-foreground" />
                      {submittingLabel}
                    </>
                  ) : (
                    <>
                      <StopCircle className="w-5 h-5 text-secondary-foreground fill-current" />
                      Stop Recording
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PracticePage() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <ProtectedRoute
        unauthenticatedFallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }
      >
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
          <PracticeContent />
        </Suspense>
      </ProtectedRoute>
    </AuthProvider>
  )
}
