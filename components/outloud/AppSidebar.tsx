'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Mic,
  History,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuth } from 'lyzr-architect-pg/client'
import { initialFor } from '@/lib/utils'

type ActiveNav = 'dashboard' | 'practice' | 'history'

/**
 * Shared authenticated-shell chrome: desktop sidebar, mobile top bar, and the
 * Settings/Help "coming soon" dialogs used across dashboard, feedback and
 * returning. Ported from the donor's per-page inline nav (kept identical in
 * copy/structure) and consolidated into one place since three screens
 * duplicated it verbatim.
 */
export function AppSidebar({ active, children }: { active: ActiveNav; children?: React.ReactNode }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const initial = initialFor(user?.name)

  const navItem = (href: string, icon: React.ReactNode, label: string, isActive: boolean) => (
    <Link
      href={href}
      className={
        isActive
          ? 'flex items-center gap-3 bg-secondary text-secondary-foreground rounded-lg px-4 py-2 font-medium transition-colors'
          : 'flex items-center gap-3 text-muted-foreground px-4 py-2 hover:bg-muted rounded-lg hover:text-primary transition-colors duration-200'
      }
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )

  return (
    <div className="bg-background text-foreground flex flex-col md:flex-row min-h-screen">
      {/* Mobile top bar */}
      <nav className="md:hidden flex justify-between items-center w-full px-4 h-16 bg-card border-b border-border sticky top-0 z-50">
        <div className="text-lg font-bold text-primary">OutLoud</div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            onClick={() => setSettingsOpen(true)}
            className="text-muted-foreground p-2 hover:bg-muted rounded-full transition-colors min-w-10 min-h-10 flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            aria-label="Account"
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm"
          >
            {initial}
          </button>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-screen p-4 gap-2 w-64 shrink-0 bg-card border-r border-border sticky top-0 z-40">
        <div className="flex flex-col mb-8">
          <div className="text-lg font-bold text-primary">OutLoud</div>
          <div className="text-xs text-muted-foreground mt-1">Speak with Confidence</div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItem('/dashboard', <LayoutDashboard className="w-5 h-5" />, 'Dashboard', active === 'dashboard')}
          {navItem('/onboarding', <Mic className="w-5 h-5" />, 'Practice', active === 'practice')}
          {navItem('/returning', <History className="w-5 h-5" />, 'History', active === 'history')}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 text-muted-foreground px-4 py-2 hover:bg-muted rounded-lg hover:text-primary transition-colors duration-200 text-left"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]"
          >
            Start Practice
          </button>

          <div className="flex flex-col gap-1 pt-4 border-t border-border">
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-3 text-muted-foreground px-4 py-2 hover:bg-muted rounded-lg hover:text-primary transition-colors duration-200 text-left"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Help</span>
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 text-muted-foreground px-4 py-2 hover:bg-muted rounded-lg hover:text-primary transition-colors duration-200 w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">
              {initial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-primary truncate">{user?.name || 'Your account'}</span>
              <span className="text-xs text-muted-foreground">Free Plan</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}

        {/* Bottom nav (mobile) */}
        <nav className="fixed bottom-0 w-full bg-card border-t border-border px-4 py-2 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
          <Link href="/dashboard" className={`flex flex-col items-center gap-1 p-2 min-w-16 ${active === 'dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
          <Link href="/onboarding" className={`flex flex-col items-center gap-1 p-2 min-w-16 ${active === 'practice' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Mic className="w-5 h-5" />
            <span className="text-[10px]">Practice</span>
          </Link>
          <Link href="/returning" className={`flex flex-col items-center gap-1 p-2 min-w-16 ${active === 'history' ? 'text-primary' : 'text-muted-foreground'}`}>
            <History className="w-5 h-5" />
            <span className="text-[10px]">History</span>
          </Link>
        </nav>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle>Settings coming soon</DialogTitle>
            <DialogDescription>
              We&apos;re still building account and notification settings. Check back in a future update.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle>Help &amp; Support coming soon</DialogTitle>
            <DialogDescription>
              A dedicated help center is on the way. In the meantime, reach out via the footer contact link.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
