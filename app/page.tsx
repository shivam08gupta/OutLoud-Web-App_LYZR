'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Menu, Mic, Loader2, MessageSquare, Sparkles } from 'lucide-react'
import { AuthProvider, useAuth } from 'lyzr-architect-pg/client'
import { Toaster } from 'sonner'

function LandingContent() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (user) {
      router.replace(user.name ? '/dashboard' : '/welcome-name')
    }
  }, [user, isLoading, router])

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-4 md:px-8 max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary flex items-center gap-2">
              <Mic className="w-5 h-5 fill-current" />
              OutLoud
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Practice
            </Link>
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              History
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="notifications" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted">
              <Bell className="w-5 h-5" />
            </button>
            <button aria-label="Menu" className="md:hidden text-muted-foreground hover:text-primary transition-colors w-10 h-10 flex items-center justify-center">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex gap-2">
              <Link
                href="/sign-in"
                className="text-sm font-medium border border-border text-primary px-4 py-2 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center justify-center md:justify-between gap-10 md:gap-16">
        <div className="flex flex-col gap-6 max-w-2xl">
          <h1 className="font-serif text-5xl md:text-6xl md:leading-[1.1] text-primary tracking-tight text-balance">
            Practise speaking. Walk into interviews confident.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl text-pretty">
            Practise realistic job interview conversations, speak your answers out loud, and get focused feedback to improve your next response.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/sign-up"
              className="bg-primary text-primary-foreground text-sm font-medium px-8 py-3 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              Start Practising
            </Link>
            <Link
              href="/sign-in"
              className="border border-border text-primary text-sm font-medium px-8 py-3 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              I already have an account
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-4 opacity-80">
            <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3 stroke-[3px]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground">Private, calm studio environment.</span>
          </div>
        </div>

        <div className="relative w-full max-w-lg aspect-square md:aspect-[4/5] bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col items-center justify-center p-3 ring-1 ring-black/5 dark:ring-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/20 to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="absolute top-5 right-5 z-10 bg-secondary/90 text-secondary-foreground rounded-lg px-3 py-2 shadow-md flex items-center gap-2 max-w-[62%]">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium leading-tight">AI coaching in real time</span>
          </div>

          <div className="relative z-10 w-[85%] bg-card/95 backdrop-blur-sm border border-border rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-secondary-foreground" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Interview Question</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                <span className="text-[10px] font-medium text-muted-foreground">Recording</span>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-4 text-pretty">
              &quot;Tell me about a time you solved a difficult problem under pressure.&quot;
            </p>
            <div className="flex items-center justify-center gap-1 h-8">
              {[6, 14, 9, 18, 11, 16, 7, 13, 10].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/70 rounded-full animate-pulse"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Audio Input Active</span>
                <span className="text-xs text-primary">Clear enunciation detected</span>
              </div>
            </div>
            <div className="w-16 h-8 flex items-center justify-between gap-[2px] opacity-70">
              {[3, 6, 4, 7, 2].map((h, i) => (
                <div key={i} className="w-1 bg-primary rounded-full" style={{ height: `${h * 4}px` }} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border w-full py-6 px-4 md:px-8 mt-auto flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="text-sm font-bold text-primary flex items-center gap-2">
          OutLoud
          <span className="text-sm font-normal text-muted-foreground ml-2 hidden md:inline">| Studio</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all">Privacy Policy</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all">Terms of Service</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all">Contact Support</Link>
        </div>
        <div className="text-xs text-muted-foreground">© 2024 OutLoud Studio. Precision in every word.</div>
      </footer>
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <LandingContent />
    </AuthProvider>
  )
}
