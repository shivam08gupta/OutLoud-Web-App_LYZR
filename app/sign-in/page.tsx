'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mic, Loader2 } from 'lucide-react'
import { AuthProvider, LoginForm, useAuth } from 'lyzr-architect-pg/client'
import { Toaster } from 'sonner'
import { PasswordFieldToggle } from '@/components/outloud/PasswordFieldToggle'

function SignInContent() {
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
      <header className="w-full py-6 px-4 flex justify-center">
        <Link href="/" className="text-lg font-bold text-primary flex items-center gap-2">
          <Mic className="w-5 h-5 fill-current" />
          OutLoud
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-[420px]">
          <PasswordFieldToggle inputId="login-password">
            <LoginForm />
          </PasswordFieldToggle>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function SignInPage() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <SignInContent />
    </AuthProvider>
  )
}
