'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, ArrowRight, ArrowLeft, Briefcase, Presentation, MessageSquare, LayoutGrid, Lightbulb, Code, BarChart, Megaphone, MoreHorizontal, Check } from 'lucide-react'
import { AuthProvider, ProtectedRoute } from 'lyzr-architect-pg/client'
import { Toaster } from 'sonner'
import { Loader2 } from 'lucide-react'

function OnboardingContent() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const [selection, setSelection] = useState({
    goal: 'job',
    role: '',
    timing: '',
  })

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // Persist the chosen role so the practice screen can select a
      // role-specific question bank. UI-preference-style storage only —
      // no application data lives here.
      localStorage.setItem('outloud_role', selection.role)
      router.push('/permissions')
    }
  }

  // Shortcut for tapping a selectable card directly: updates the selection
  // and immediately advances using the same step-forward/finish logic as
  // handleNext/Continue, so both paths stay in sync. Operates on the merged
  // value rather than the (still-stale) `selection` state, since React state
  // updates are not synchronous.
  const selectAndAdvance = (patch: Partial<typeof selection>) => {
    const updated = { ...selection, ...patch }
    setSelection(updated)
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      localStorage.setItem('outloud_role', updated.role)
      router.push('/permissions')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    } else {
      router.back()
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col antialiased">
      <header className="w-full py-6 px-4 md:px-8 max-w-4xl mx-auto flex justify-center items-center">
        <div className="text-lg font-bold text-primary flex items-center gap-2">
          <Mic className="w-6 h-6 fill-current" />
          OutLoud
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start w-full max-w-3xl mx-auto px-4 md:px-6 mt-8 gap-10 relative pb-28">
        <div className="w-full max-w-xl flex items-center justify-between gap-2 mb-2 px-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${currentStep >= step ? 'bg-secondary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {currentStep === 1 && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-center px-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 text-balance">What are you preparing for?</h1>
              <p className="text-base text-muted-foreground">Select your primary focus to tailor the studio environment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => selectAndAdvance({ goal: 'job' })}
                className={`flex flex-col items-start p-5 bg-card border-2 rounded-xl text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selection.goal === 'job' ? 'border-secondary bg-muted' : 'border-border hover:border-secondary'}`}
              >
                <Briefcase className={`w-8 h-8 mb-3 ${selection.goal === 'job' ? 'text-secondary-foreground' : 'text-muted-foreground'}`} />
                <span className="text-lg font-semibold text-foreground mb-1">Job Interview</span>
                <span className="text-sm text-muted-foreground">Practice technical, behavioral, or case study questions.</span>
              </button>

              <div className="flex flex-col items-start p-5 bg-card border-2 border-border rounded-xl text-left opacity-50 cursor-not-allowed relative">
                <span className="absolute top-2 right-2 bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Coming soon</span>
                <Presentation className="w-8 h-8 mb-3 text-muted-foreground" />
                <span className="text-lg font-semibold text-foreground mb-1">Presentation</span>
                <span className="text-sm text-muted-foreground">Rehearse public speaking, pitches, or internal reviews.</span>
              </div>

              <div className="flex flex-col items-start p-5 bg-card border-2 border-border rounded-xl text-left opacity-50 cursor-not-allowed relative">
                <span className="absolute top-2 right-2 bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Coming soon</span>
                <MessageSquare className="w-8 h-8 mb-3 text-muted-foreground" />
                <span className="text-lg font-semibold text-foreground mb-1">Difficult Conversation</span>
                <span className="text-sm text-muted-foreground">Roleplay performance reviews or negotiations.</span>
              </div>

              <div className="flex flex-col items-start p-5 bg-card border-2 border-border rounded-xl text-left opacity-50 cursor-not-allowed relative">
                <span className="absolute top-2 right-2 bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Coming soon</span>
                <LayoutGrid className="w-8 h-8 mb-3 text-muted-foreground" />
                <span className="text-lg font-semibold text-foreground mb-1">Other</span>
                <span className="text-sm text-muted-foreground">General confidence building and articulation practice.</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-center px-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 text-balance">What role are you preparing for?</h1>
              <p className="text-base text-muted-foreground">This helps us curate industry-specific prompts.</p>
            </div>

            <div className="flex flex-col gap-3 max-w-xl mx-auto w-full">
              {[
                { id: 'pm', icon: Lightbulb, label: 'Product Manager' },
                { id: 'swe', icon: Code, label: 'Software Engineer' },
                { id: 'data', icon: BarChart, label: 'Data Analyst' },
                { id: 'marketing', icon: Megaphone, label: 'Marketing' },
                { id: 'other', icon: MoreHorizontal, label: 'Other' },
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => selectAndAdvance({ role: role.id })}
                  className={`flex items-center p-4 bg-card border-2 rounded-xl text-left transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selection.role === role.id ? 'border-secondary bg-muted' : 'border-border hover:border-secondary hover:bg-muted'}`}
                >
                  <role.icon className={`mr-3 w-6 h-6 ${selection.role === role.id ? 'text-secondary-foreground' : 'text-muted-foreground group-hover:text-secondary-foreground'}`} />
                  <span className="text-lg font-medium text-foreground">{role.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-center px-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 text-balance">When is your interview?</h1>
              <p className="text-base text-muted-foreground">We&apos;ll help pace your preparation schedule.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
              {[
                { id: 'week', label: 'This week' },
                { id: 'two-weeks', label: '1-2 weeks' },
                { id: 'more', label: 'More than 2 weeks' },
                { id: 'unscheduled', label: 'Not scheduled yet' },
              ].map((time) => (
                <button
                  key={time.id}
                  onClick={() => selectAndAdvance({ timing: time.id })}
                  className={`flex items-center justify-center p-5 bg-card border-2 rounded-xl text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selection.timing === time.id ? 'border-secondary bg-muted' : 'border-border hover:border-secondary hover:bg-muted'}`}
                >
                  <span className="text-lg font-medium text-foreground">{time.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 w-full max-w-3xl left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur py-4 border-t border-border px-4 flex justify-between items-center z-10">
          <button
            onClick={handleBack}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 min-h-10 px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            className="bg-primary text-primary-foreground text-sm font-medium px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm active:scale-[0.98]"
          >
            {currentStep === totalSteps ? 'Finish' : 'Continue'}
            {currentStep === totalSteps ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </main>
    </div>
  )
}

export default function OnboardingPage() {
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
        <OnboardingContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
