'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronRight,
  CheckCircle2,
  Sliders,
  FileEdit,
  MicOff,
  Lightbulb,
  ArrowDown,
  Quote,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { AuthProvider, ProtectedRoute, useAuth } from 'lyzr-architect-pg/client'
import { Toaster } from 'sonner'
import { callAIAgent } from '@/lib/aiAgent'
import { AppSidebar } from '@/components/outloud/AppSidebar'
import { trackEvent, identifyUser } from '@/lib/analytics'

const TOTAL_QUESTIONS = 3
const SCENARIO_TYPE = 'behavioural_interview'
const FEEDBACK_AGENT_ID = '6a8e702831e45f765e8e001a'

type FeedbackShape = {
  whatWentWell: { summary: string; tags: string[] }
  focusOn: { title: string; description: string; example: { youSaid: string; tryInstead: string } }[]
  trySayingItThisWay: { suggestion: string; why: string }
}

// Defensive coercion — the schema guarantees the shape, but a live response
// is never trusted blindly. Falls back to safe empty structures per field
// instead of crashing if something is missing.
function coerceFeedback(raw: any): FeedbackShape {
  const whatWentWell = raw?.whatWentWell && typeof raw.whatWentWell === 'object' ? raw.whatWentWell : {}
  const trySayingItThisWay = raw?.trySayingItThisWay && typeof raw.trySayingItThisWay === 'object' ? raw.trySayingItThisWay : {}
  return {
    whatWentWell: {
      summary: typeof whatWentWell.summary === 'string' ? whatWentWell.summary : '',
      tags: Array.isArray(whatWentWell.tags) ? whatWentWell.tags.filter((t: unknown) => typeof t === 'string') : [],
    },
    focusOn: Array.isArray(raw?.focusOn)
      ? raw.focusOn
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => ({
            title: typeof item.title === 'string' ? item.title : 'Focus area',
            description: typeof item.description === 'string' ? item.description : '',
            example: {
              youSaid: typeof item.example?.youSaid === 'string' ? item.example.youSaid : '',
              tryInstead: typeof item.example?.tryInstead === 'string' ? item.example.tryInstead : '',
            },
          }))
      : [],
    trySayingItThisWay: {
      suggestion: typeof trySayingItThisWay.suggestion === 'string' ? trySayingItThisWay.suggestion : '',
      why: typeof trySayingItThisWay.why === 'string' ? trySayingItThisWay.why : '',
    },
  }
}

function FeedbackContent() {
  const router = useRouter()
  const search = useSearchParams()
  const { user } = useAuth()
  const userId = user?.id

  const currentQuestion = Math.min(Math.max(parseInt(search.get('q') ?? '1', 10) || 1, 1), TOTAL_QUESTIONS)
  const isLastQuestion = currentQuestion >= TOTAL_QUESTIONS

  const [sttUnsupported, setSttUnsupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [questionText, setQuestionText] = useState('Tell me about your response.')
  const [sessionDataLoaded, setSessionDataLoaded] = useState(false)

  useEffect(() => {
    setSttUnsupported(sessionStorage.getItem(`outloud_transcript_unsupported_${currentQuestion}`) === '1')
    setTranscript(sessionStorage.getItem(`outloud_transcript_${currentQuestion}`) ?? '')
    setQuestionText(sessionStorage.getItem(`outloud_question_${currentQuestion}`) ?? 'Tell me about your response.')
    setSessionDataLoaded(true)
  }, [currentQuestion])

  const [feedback, setFeedback] = useState<FeedbackShape | null>(null)
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true)
  const [isFeedbackError, setIsFeedbackError] = useState(false)
  const requestedForRef = useRef<number | null>(null)

  const stashFeedback = (result: FeedbackShape) => {
    sessionStorage.setItem(`outloud_feedback_${currentQuestion}`, JSON.stringify(result))
    trackEvent('feedback_generated', {
      scenario_type: SCENARIO_TYPE,
      question_number: currentQuestion,
      user_id: userId,
    })
  }

  const requestFeedback = async () => {
    setIsFeedbackLoading(true)
    setIsFeedbackError(false)
    const message = `Interview question: ${questionText}\n\nCandidate's transcribed spoken response: ${
      transcript || '(no speech was captured)'
    }`
    const result = await callAIAgent(message, FEEDBACK_AGENT_ID)
    if (!result.success || result.response?.status !== 'success') {
      setIsFeedbackLoading(false)
      setIsFeedbackError(true)
      return
    }
    const coerced = coerceFeedback(result.response.result)
    setFeedback(coerced)
    setIsFeedbackLoading(false)
    stashFeedback(coerced)
  }

  useEffect(() => {
    if (!sessionDataLoaded) return
    if (!questionText) return
    if (requestedForRef.current === currentQuestion) return
    requestedForRef.current = currentQuestion
    identifyUser(userId)
    requestFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, questionText, sessionDataLoaded])

  const handleRetryFeedback = () => {
    trackEvent('retry_clicked', {
      scenario_type: SCENARIO_TYPE,
      question_number: currentQuestion,
      user_id: userId,
    })
    requestFeedback()
  }

  const handleTryAgain = () => router.push(`/practice?q=${currentQuestion}`)
  const handleNext = () => {
    if (isLastQuestion) {
      router.push('/complete')
    } else {
      router.push(`/practice?q=${currentQuestion + 1}`)
    }
  }

  return (
    <AppSidebar active="practice">
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full mb-16 md:mb-0">
        <div className="mb-8 max-w-3xl">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
            <Link href="/practice" className="hover:text-primary transition-colors">Practice</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Behavioural Interview · Question {currentQuestion} of {TOTAL_QUESTIONS}</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-primary tracking-tight text-balance">Your feedback</h2>
          <p className="text-base text-muted-foreground mt-2 max-w-2xl">Here&apos;s what went well and what you can improve in your next attempt.</p>
        </div>

        <div className="mb-8 max-w-3xl bg-card rounded-2xl border border-border p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-secondary-foreground block mb-2">Your transcript</span>
          {sttUnsupported ? (
            <p className="text-sm text-muted-foreground italic">
              Speech-to-text isn&apos;t available in this browser, so no transcript could be captured. Your response was still recorded. Try Chrome for a full transcript.
            </p>
          ) : transcript ? (
            <p className="text-base text-foreground text-pretty">&quot;{transcript}&quot;</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No transcript available for this question yet.</p>
          )}
        </div>

        {isFeedbackLoading ? (
          <div className="mb-8 bg-card rounded-2xl border border-border p-12 flex flex-col items-center justify-center gap-3 text-center min-h-[240px]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-lg font-semibold text-primary">Analyzing your response...</p>
            <p className="text-sm text-muted-foreground max-w-md">Our AI coach is reviewing your transcript for clarity, structure, and delivery.</p>
          </div>
        ) : isFeedbackError ? (
          <div className="mb-8 bg-destructive/10 text-destructive rounded-2xl border border-destructive/30 p-8 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8" />
            <p className="text-lg font-semibold">We couldn&apos;t generate feedback right now. Please try again.</p>
            <button onClick={handleRetryFeedback} className="mt-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]">
              Try Again
            </button>
          </div>
        ) : feedback ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 mb-8">
            <div className="md:col-span-4 bg-card rounded-2xl border border-border p-5 transition-transform hover:-translate-y-0.5 hover:shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center text-secondary-foreground">
                  <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-primary">What went well</h3>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                  {feedback.whatWentWell.summary || 'No summary was returned for this response.'}
                </p>
              </div>
              {feedback.whatWentWell.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                  {feedback.whatWentWell.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground border border-border">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-8 bg-card rounded-2xl border border-border p-5 transition-transform hover:-translate-y-0.5 hover:shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-primary">Focus on</h3>
              </div>

              {feedback.focusOn.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedback.focusOn.map((item, index) => (
                    <div key={item.title + index} className="bg-background rounded-lg p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        {index === 0 ? <FileEdit className="w-4 h-4 text-muted-foreground" /> : <MicOff className="w-4 h-4 text-muted-foreground" />}
                        <h4 className="text-sm font-medium text-primary">{item.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                      <div className="space-y-2">
                        {item.example.youSaid && (
                          <div className="p-2 bg-muted rounded border border-destructive/20 line-through text-muted-foreground text-xs opacity-70">
                            &quot;{item.example.youSaid}&quot;
                          </div>
                        )}
                        <div className="flex justify-center">
                          <ArrowDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {item.example.tryInstead && (
                          <div className="p-2 bg-secondary/20 rounded border border-secondary/40 text-primary text-xs font-medium">
                            &quot;{item.example.tryInstead}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-background rounded-lg p-4 border border-border flex gap-3 items-start">
                  <Lightbulb className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
                  <p className="text-xs text-muted-foreground">Nothing specific to flag this time — keep practicing to build on what&apos;s working.</p>
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-12 bg-primary text-primary-foreground rounded-2xl p-6 md:p-8 relative overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-sm">
              <Quote className="absolute right-0 top-0 w-48 h-48 opacity-5 translate-x-4 -translate-y-4 pointer-events-none" />
              <h3 className="text-lg font-semibold mb-4 relative z-10">Try saying it this way</h3>
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold opacity-70">You said:</span>
                  <p className="text-sm opacity-90">{transcript ? `"${transcript}"` : 'No transcript was captured for this attempt.'}</p>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-primary-foreground/10 rounded-lg border border-primary-foreground/20">
                  <span className="text-xs font-bold">Try:</span>
                  <p className="text-base font-medium">{feedback.trySayingItThisWay.suggestion || 'No suggestion was returned.'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold opacity-70">Why:</span>
                  <p className="text-sm opacity-90">{feedback.trySayingItThisWay.why}</p>
                </div>
                <p className="pt-2 text-xs opacity-80 italic">Now try answering the question again in your own words.</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 pt-8 border-t border-border">
          <button onClick={handleTryAgain} className="w-full sm:w-auto bg-card border border-border text-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors active:scale-[0.98]">
            Try Again
          </button>
          <button onClick={handleNext} className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]">
            {isLastQuestion ? 'Complete Session' : 'Next Question'}
          </button>
        </div>
      </div>
    </AppSidebar>
  )
}

export default function FeedbackPage() {
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
          <FeedbackContent />
        </Suspense>
      </ProtectedRoute>
    </AuthProvider>
  )
}
