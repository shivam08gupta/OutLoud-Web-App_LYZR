'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mic, Loader2, MessageSquare, Sparkles, Volume2 } from 'lucide-react'
import { AuthProvider, RegisterForm, useAuth } from 'lyzr-architect-pg/client'
import { Toaster } from 'sonner'

function SignUpContent() {
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="w-full py-6 px-4 md:px-8 flex justify-center md:justify-start">
        <Link href="/" className="text-lg font-bold text-primary flex items-center gap-2">
          <Mic className="w-5 h-5 fill-current" />
          OutLoud
        </Link>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pb-12 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        <div className="w-full max-w-[420px] md:flex-1">
          <div className="mb-6">
            <h1 className="font-serif text-3xl text-primary tracking-tight text-balance mb-2">Create your account</h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Start practising your interview answers with confidence.
            </p>
          </div>
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>

        <div className="hidden md:flex md:flex-1 w-full max-w-lg relative aspect-[4/5] bg-card rounded-2xl border border-border shadow-sm overflow-hidden items-center justify-center p-3 ring-1 ring-black/5 dark:ring-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/20 to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="absolute top-5 left-5 z-10 bg-secondary/90 text-secondary-foreground rounded-lg px-3 py-2 shadow-md flex items-center gap-2 max-w-[70%]">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium leading-tight">AI Interview Coach</span>
          </div>

          <div className="relative z-10 w-[85%] bg-card/95 backdrop-blur-sm border border-border rounded-xl p-5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-secondary-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Interview Question</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-4 text-pretty">
              &quot;Walk me through a challenge you overcame at work.&quot;
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary font-medium">Listening...</span>
            </div>
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

          <div className="absolute bottom-4 left-4 right-4 z-10 bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground">Real-time feedback</span>
              <span className="text-xs text-muted-foreground truncate">Clarity, structure and confidence coaching</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <SignUpContent />
    </AuthProvider>
  )
}
