'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Zap,
  ArrowRight,
  TrendingUp,
  Timer,
  MessageSquare,
  ChevronRight,
  History,
  Mic,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  FlaskConical,
} from 'lucide-react'
import { AuthProvider, ProtectedRoute, useAuth } from 'lyzr-architect-pg/client'
import { Toaster } from 'sonner'
import { AppSidebar } from '@/components/outloud/AppSidebar'
import { formatRelativeDate } from '@/lib/utils'

type FeedbackShape = {
  whatWentWell?: { summary?: string; tags?: string[] }
}
type Answer = { question?: string; transcript?: string; feedback?: FeedbackShape }
type Session = { id: string; answers: Answer[]; completed_at: string }

const SAMPLE_SESSIONS: Session[] = [
  {
    id: 'sample-1',
    completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    answers: [
      {
        question: 'Walk me through a time you used metrics to make a product decision.',
        transcript: 'Sample transcript...',
        feedback: { whatWentWell: { summary: 'Clear structure and specific metric.', tags: ['Clear structure', 'Specific metric'] } },
      },
    ],
  },
  {
    id: 'sample-2',
    completed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    answers: [
      {
        question: 'Tell me about a time you had to align conflicting stakeholders.',
        transcript: 'Sample transcript...',
        feedback: { whatWentWell: { summary: 'Good framing of the conflict.', tags: ['Concrete outcome'] } },
      },
    ],
  },
  {
    id: 'sample-3',
    completed_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    answers: [
      {
        question: 'Describe how you would design a system to handle a traffic spike.',
        transcript: 'Sample transcript...',
        feedback: { whatWentWell: { summary: 'Solid trade-off discussion.', tags: ['Structured thinking'] } },
      },
    ],
  },
]

function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored ? stored === 'dark' : document.documentElement.classList.contains('dark')
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { user, authFetch } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sampleData, setSampleData] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    authFetch('/api/sessions')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (!data.success) {
          setError(data.error || 'Failed to load sessions')
          return
        }
        const rows = Array.isArray(data.data) ? data.data : []
        setSessions(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Network error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authFetch])

  const displaySessions = sampleData ? SAMPLE_SESSIONS : sessions
  const sessionCount = displaySessions.length
  const questionsAnswered = displaySessions.reduce((sum, s) => sum + (Array.isArray(s.answers) ? s.answers.length : 0), 0)
  const lastSession = displaySessions[0]
  const recentSessions = displaySessions.slice(0, 3)
  const name = user?.name ?? ''
  const lastPracticedLabel = lastSession
    ? `You last practised ${formatRelativeDate(new Date(lastSession.completed_at))}. Ready to continue?`
    : 'Ready for your first practice?'
  const lastFocusTags = lastSession?.answers?.[0]?.feedback?.whatWentWell?.tags?.slice(0, 2) ?? []

  return (
    <AppSidebar active="dashboard">
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full mb-16 md:mb-0">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-1 text-balance">
              Good afternoon{name ? `, ${name}` : ''} 👋
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mb-3">Ready for today&apos;s practice?</p>
            <div className="inline-flex items-center gap-2 bg-muted text-foreground px-3 py-1.5 rounded-full text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              {lastPracticedLabel}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2 cursor-pointer">
              <FlaskConical className="w-3.5 h-3.5" />
              Sample Data
              <input
                type="checkbox"
                checked={sampleData}
                onChange={(e) => setSampleData(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
            </label>
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <section className="lg:col-span-8">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-muted rounded-lg text-secondary-foreground">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recommended Module</span>
                </div>
                <h2 className="text-xl font-semibold text-primary mb-3">Unexpected Interview Questions</h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6 text-pretty">
                  Practise answering questions you haven&apos;t prepared for. Focus on structuring thoughts quickly under pressure.
                </p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    <span className="text-xs">5 min</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs">3 questions</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/onboarding')}
                className="bg-primary text-primary-foreground text-sm font-medium py-3 px-6 rounded-lg w-full md:w-fit hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 z-10 active:scale-[0.98]"
              >
                Start Practice
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          <section className="lg:col-span-4">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-full">
              <h3 className="text-sm font-medium text-primary mb-4 flex items-center justify-between">
                Your Progress
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </h3>
              <div className="flex items-baseline gap-4 mb-6">
                <div>
                  <span className="font-serif text-4xl text-primary tabular-nums">{sessionCount}</span>
                  <p className="text-xs text-muted-foreground mt-1">sessions</p>
                </div>
                <div>
                  <span className="font-serif text-4xl text-primary tabular-nums">{questionsAnswered}</span>
                  <p className="text-xs text-muted-foreground mt-1">questions</p>
                </div>
              </div>
              {lastFocusTags.length > 0 ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Last Focus</div>
                  <div className="flex flex-wrap gap-2">
                    {lastFocusTags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-muted border border-border text-primary rounded-md text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Complete a practice session to see your focus areas here.</p>
              )}
            </div>
          </section>

          <section className="lg:col-span-12 mt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">{sampleData ? 'Sample Data' : 'Recent sessions'}</h3>
              {sessionCount > 0 && (
                <Link href="/returning" className="text-sm text-primary hover:underline">
                  View All
                </Link>
              )}
            </div>

            {loading ? (
              <div className="bg-card rounded-2xl border border-border p-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-10 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <History className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Your practice history will appear here after your first session.
                </p>
                <button
                  onClick={() => router.push('/onboarding')}
                  className="mt-1 bg-primary text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors active:scale-[0.98]"
                >
                  Start Practising
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {recentSessions.map((session) => {
                    const firstAnswer = session.answers?.[0]
                    const focusTag = firstAnswer?.feedback?.whatWentWell?.tags?.[0]
                    return (
                      <div
                        key={session.id}
                        className={`p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${sampleData ? '' : 'hover:bg-muted/50'}`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary shrink-0">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-primary mb-1 line-clamp-1">
                              {firstAnswer?.question ?? 'Practice session'}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              {!sampleData && <span>{formatRelativeDate(new Date(session.completed_at))}</span>}
                              {!sampleData && <span className="w-1 h-1 rounded-full bg-border" />}
                              <span>{session.answers?.length ?? 0} question{(session.answers?.length ?? 0) === 1 ? '' : 's'}</span>
                              {focusTag && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-border" />
                                  <span>Focus: {focusTag}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {!sampleData && <ChevronRight className="w-5 h-5 text-muted-foreground self-end md:self-auto shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="hidden md:flex mt-12 pt-6 border-t border-border justify-between items-center gap-4 text-xs text-muted-foreground">
          <div>© 2024 OutLoud Studio. Precision in every word.</div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-primary transition-colors">Contact Support</Link>
          </div>
        </footer>
      </div>
    </AppSidebar>
  )
}

export default function DashboardPage() {
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
        <DashboardGuard />
      </ProtectedRoute>
    </AuthProvider>
  )
}

function DashboardGuard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user && !user.name) {
      router.replace('/welcome-name')
    }
  }, [user, isLoading, router])

  if (isLoading || (user && !user.name)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return <DashboardContent />
}
