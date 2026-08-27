import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { IframeLoggerInit } from '@/components/IframeLoggerInit'
import ClientProviders from '@/components/ClientProviders'
import { SSOGuard } from '@/components/SSOGuard'

// `variable: '--font-inter'` makes Next.js expose Inter as a CSS variable on
// whatever element we mount `inter.variable` on (we put it on <html>). That
// lets tailwind.config.ts's `font-sans` resolve through the chain
// `var(--font-sans, var(--font-inter), ui-sans-serif, …)`: a design-system
// overlay's `--font-sans` wins when set, Inter remains the default otherwise.
// Replacing the previous `inter.className` on <body> with `font-sans` makes
// the whole body participate in the same cascade — including elements with
// no explicit font class, which previously got Inter via the high-specificity
// hashed className and couldn't be overridden by a `--font-sans` override.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'OutLoud',
  description: 'AI-powered interview practice. Practise speaking your interview answers and get focused feedback to improve your next response.',
  icons: {
    icon: '/lyzr.png',
  },
}

async function fetchHideWatermark(): Promise<boolean> {
  const backendUrl = process.env.ARCHITECT_BACKEND_URL
  const tenantId = process.env.ARCHITECT_TENANT_ID || process.env.TENANT_ID
  if (!backendUrl || !tenantId) return false
  try {
    const res = await fetch(`${backendUrl}/api/v1/tenant/config?domain=${tenantId}`, {
      headers: { 'X-Tenant': tenantId },
      next: { revalidate: 300 },
    })
    if (!res.ok) return false
    const config = await res.json()
    return config?.features?.hide_watermark === true
  } catch {
    return false
  }
}

// Resolve the stored colour scheme before first paint.
//
// tailwind.config.ts sets `darkMode: ['class']`, so every `.dark { … }` token
// block in app/globals.css is inert until the generated page's own theme
// control puts that class on <html>.
//
// Precedence, most specific first:
//   1. the visitor's own stored choice
//   2. the theme's CANONICAL face — `color-scheme: dark` is how a dark-native
//      theme declares that its dark half is the real one; the stylesheet is
//      render-blocking, so it is already computed when this runs
//   3. light, because `:root` is the face the theme was designed and reviewed in
//
// The OS preference deliberately does NOT decide the initial face. It used to,
// and that was the bug: every catalogue theme declares `color-scheme: light dark`
// (it ships both halves), which is neither 'dark' nor 'light', so every app fell
// through to `prefers-color-scheme`. A visitor whose OS was dark saw the dark
// half of a theme whose light half is what the App Mockup showed and what the
// build agent designed against — so the face nobody reviewed was the face that
// shipped. Design intent wins first paint; the generated page can still override
// it with its own toggle, and that choice persists.
//
// Runs as the first child of <body>: <head> (and the stylesheet link) is parsed,
// no body content has painted yet, so the class lands without a flash. <html>
// already carries suppressHydrationWarning, which covers the mutation.
const COLOR_SCHEME_INIT = `(function(){try{
var d=document.documentElement;
var stored=null;try{stored=localStorage.getItem('theme')}catch(e){}
var mode=(stored==='dark'||stored==='light')?stored
  :(getComputedStyle(d).colorScheme==='dark')?'dark':'light';
d.classList.toggle('dark',mode==='dark');
d.style.colorScheme=mode;
}catch(e){}})()`

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isPaidUser = process.env.IS_PAID_USER === 'true'
  const hideWatermark = isPaidUser || await fetchHideWatermark()
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_INIT }} />
        <IframeLoggerInit />
        <SSOGuard>
          <ClientProviders>
            {children}
          </ClientProviders>
        </SSOGuard>
        {/* Architect Badge — architect.new */}
        {!hideWatermark && <Script id="architect-badge" strategy="afterInteractive">{`
(function(){"use strict";if(sessionStorage.getItem("architect-badge-dismissed"))return;const B={whiteAmber:"#F3EFEA",lyzerFerra:"#71514F",creamSkin:"#E3D0C2",congoBrown:"#4A2F2D"};const f=document.createElement("link");f.rel="stylesheet";f.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Noto+Sans:wght@400;500;600&display=swap";document.head.appendChild(f);const I={logo:\`<img src="/lyzr.png" width="16" height="16" alt="Lyzr" style="border-radius:4px">\`,arrow:\`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>\`,close:\`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>\`,sparkle:\`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="\${B.lyzerFerra}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>\`};const t=document.createElement("button");t.id="architect-badge-trigger";t.innerHTML=\`<span class="architect-badge__icon">\${I.logo}</span><span class="architect-badge__label">Built with <strong>Architect</strong></span><span class="architect-badge__dismiss" aria-label="Dismiss">\${I.close}</span>\`;document.body.appendChild(t);const c=document.createElement("div");c.id="architect-badge-card";c.innerHTML=\`<button class="architect-card__close" aria-label="Close">\${I.close}</button><div class="architect-card__header"><div class="architect-card__logo-row">\${I.logo}<span class="architect-card__wordmark">Architect</span><span class="architect-card__sparkle">\${I.sparkle}</span></div><p class="architect-card__tagline">Design. Build. Ship.</p></div><div class="architect-card__divider"></div><p class="architect-card__body">This project was crafted with <strong>Architect</strong> — the AI-powered platform that turns ideas into production-ready apps.</p><a href="https://architect.new" target="_blank" rel="noopener noreferrer" class="architect-card__cta"><span>Start building</span>\${I.arrow}</a><div class="architect-card__footer">architect.new</div>\`;document.body.appendChild(c);const s=document.createElement("style");s.textContent=\`#architect-badge-trigger{position:fixed;bottom:20px;right:20px;z-index:999998;display:inline-flex;align-items:center;gap:6px;padding:6px 12px 6px 10px;background:\${B.whiteAmber};border:1.5px solid \${B.creamSkin};border-radius:50px;cursor:pointer;font-family:'Noto Sans',system-ui,sans-serif;font-size:11px;font-weight:500;color:\${B.congoBrown};letter-spacing:.01em;box-shadow:0 1px 3px rgba(74,47,45,.08),0 6px 20px rgba(74,47,45,.06);transition:all .3s cubic-bezier(.4,0,.2,1);transform-origin:bottom right;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}#architect-badge-trigger:hover{box-shadow:0 2px 8px rgba(74,47,45,.12),0 12px 32px rgba(74,47,45,.1);transform:translateY(-1px);border-color:\${B.lyzerFerra}}#architect-badge-trigger:active{transform:scale(.97)}#architect-badge-trigger.architect--hidden{opacity:0;pointer-events:none;transform:scale(.85) translateY(8px)}.architect-badge__icon{display:flex;align-items:center;justify-content:center;width:22px;height:22px;background:\${B.creamSkin};border-radius:50%;flex-shrink:0}.architect-badge__label{white-space:nowrap;color:\${B.lyzerFerra}}.architect-badge__label strong{font-family:'Playfair Display',Georgia,serif;font-weight:600;color:\${B.congoBrown};letter-spacing:.02em}.architect-badge__dismiss{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;margin-left:2px;opacity:.4;transition:opacity .2s,background .2s;flex-shrink:0}.architect-badge__dismiss:hover{opacity:1;background:\${B.creamSkin}}#architect-badge-card{position:fixed;bottom:20px;right:20px;z-index:999999;width:310px;background:\${B.whiteAmber};border:1.5px solid \${B.creamSkin};border-radius:20px;padding:24px;box-shadow:0 4px 12px rgba(74,47,45,.08),0 20px 48px rgba(74,47,45,.14);font-family:'Noto Sans',system-ui,sans-serif;opacity:0;pointer-events:none;transform:scale(.92) translateY(12px);transform-origin:bottom right;transition:all .35s cubic-bezier(.4,0,.2,1)}#architect-badge-card.architect--visible{opacity:1;pointer-events:auto;transform:scale(1) translateY(0)}.architect-card__close{position:absolute;top:14px;right:14px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:none;background:0 0;color:\${B.lyzerFerra};border-radius:8px;cursor:pointer;transition:background .2s;padding:0}.architect-card__close:hover{background:\${B.creamSkin}}.architect-card__header{margin-bottom:16px}.architect-card__logo-row{display:flex;align-items:center;gap:10px;margin-bottom:4px}.architect-card__wordmark{font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:22px;color:\${B.congoBrown};letter-spacing:.02em}.architect-card__sparkle{display:flex;animation:architect-pulse 2.5s ease-in-out infinite}@keyframes architect-pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.15)}}.architect-card__tagline{margin:0;font-size:12.5px;font-weight:500;color:\${B.lyzerFerra};letter-spacing:.06em;text-transform:uppercase;opacity:.7}.architect-card__divider{height:1px;background:linear-gradient(90deg,transparent,\${B.creamSkin},transparent);margin-bottom:16px}.architect-card__body{margin:0 0 20px;font-size:13.5px;line-height:1.65;color:\${B.lyzerFerra}}.architect-card__body strong{font-family:'Playfair Display',Georgia,serif;font-weight:600;color:\${B.congoBrown}}.architect-card__cta{display:flex;align-items:center;gap:8px;justify-content:center;padding:12px 24px;box-sizing:border-box;background:\${B.congoBrown};color:\${B.whiteAmber};border:none;border-radius:12px;font-family:'Noto Sans',system-ui,sans-serif;font-size:14px;font-weight:600;letter-spacing:.02em;text-decoration:none;cursor:pointer;transition:all .25s cubic-bezier(.4,0,.2,1);box-shadow:0 2px 8px rgba(74,47,45,.2)}.architect-card__cta:hover{background:\${B.lyzerFerra};box-shadow:0 4px 16px rgba(74,47,45,.25);transform:translateY(-1px)}.architect-card__cta:active{transform:scale(.98)}.architect-card__footer{margin-top:16px;text-align:center;font-size:11.5px;color:\${B.creamSkin};font-weight:500;letter-spacing:.04em}#architect-badge-card.architect--visible .architect-card__header,#architect-badge-card.architect--visible .architect-card__divider,#architect-badge-card.architect--visible .architect-card__body,#architect-badge-card.architect--visible .architect-card__cta,#architect-badge-card.architect--visible .architect-card__footer{animation:architect-fadeUp .4s ease forwards}#architect-badge-card.architect--visible .architect-card__divider{animation-delay:.06s}#architect-badge-card.architect--visible .architect-card__body{animation-delay:.12s}#architect-badge-card.architect--visible .architect-card__cta{animation-delay:.18s}#architect-badge-card.architect--visible .architect-card__footer{animation-delay:.24s}@keyframes architect-fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\`;document.head.appendChild(s);let o=false;function open(){o=true;t.classList.add("architect--hidden");c.classList.add("architect--visible")}function close(){o=false;c.classList.remove("architect--visible");dismiss()}function dismiss(){sessionStorage.setItem("architect-badge-dismissed","1");t.style.display="none";c.style.display="none"}t.querySelector(".architect-badge__dismiss").addEventListener("click",function(e){e.stopPropagation();dismiss()});t.addEventListener("click",open);c.querySelector(".architect-card__close").addEventListener("click",close);document.addEventListener("click",function(e){if(o&&!c.contains(e.target)&&!t.contains(e.target))close()});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&o)close()})})();
        `}</Script>}
      </body>
    </html>
  )
}
