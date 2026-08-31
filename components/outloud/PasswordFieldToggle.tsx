'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Adds a show/hide toggle to a password <input> rendered by an opaque child
 * component (lyzr-architect-pg/client's LoginForm/RegisterForm), which has
 * no prop or slot for injecting one. Rather than reimplementing the auth
 * form, this measures the input's position by its stable DOM id and overlays
 * a positioned button on top of it, then flips only the input's `type`
 * attribute directly. It never touches the child form's validation, submit
 * handling, or auth state -- all of that remains entirely inside the package.
 */
export function PasswordFieldToggle({ children, inputId }: { children: React.ReactNode; inputId: string }) {
  const [visible, setVisible] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' })
  const wrapperRef = useRef<HTMLDivElement>(null)

  const reposition = useCallback(() => {
    const input = document.getElementById(inputId) as HTMLInputElement | null
    const wrapper = wrapperRef.current
    if (!input || !wrapper) return
    const inputRect = input.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()
    setStyle({
      position: 'absolute',
      top: inputRect.top - wrapperRect.top + inputRect.height / 2,
      left: inputRect.left - wrapperRect.left + inputRect.width - 26,
      transform: 'translateY(-50%)',
    })
  }, [inputId])

  useEffect(() => {
    reposition()
    window.addEventListener('resize', reposition)
    // Repositions if an error message or other content shifts the input
    // (e.g. a validation error appearing above it) changes its position.
    const observer = new MutationObserver(reposition)
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current, { childList: true, subtree: true, attributes: true })
    }
    return () => {
      window.removeEventListener('resize', reposition)
      observer.disconnect()
    }
  }, [reposition])

  useEffect(() => {
    const input = document.getElementById(inputId) as HTMLInputElement | null
    if (input) input.type = visible ? 'text' : 'password'
  }, [visible, inputId])

  return (
    <div ref={wrapperRef} className="relative">
      <style>{`#${inputId} { padding-right: 36px !important; }`}</style>
      {children}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        style={{ ...style, background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0, zIndex: 1 }}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
