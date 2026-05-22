'use client'

import { useState, useEffect } from 'react'

type Platform = 'android' | 'ios' | null

export default function PWAInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dismissed, setDismissed] = useState(true) // start hidden, reveal after check
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) return

    // Check if dismissed recently (24h cooldown)
    const lastDismissed = localStorage.getItem('pwa_prompt_dismissed')
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) return

    const ua = navigator.userAgent

    // iOS Safari detection
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)
    if (isIOS && isSafari) {
      setPlatform('ios')
      setDismissed(false)
      return
    }

    // Android / Chrome — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPlatform('android')
      setDismissed(false)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString())
    setDismissed(true)
  }

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDismissed(true)
    } else {
      handleDismiss()
    }
    setDeferredPrompt(null)
  }

  if (dismissed || !platform) return null

  return (
    <div
      className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-50 rounded-2xl p-4 shadow-2xl"
      style={{
        background: 'rgba(18, 18, 24, 0.97)',
        border: '1px solid rgba(242,135,30,0.3)',
        boxShadow: '0 0 32px rgba(242,135,30,0.15), 0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)' }}
        >
          🎙️
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-black text-sm text-white mb-0.5">Add GameBooth to your home screen</div>
          <div className="text-xs text-white/45 leading-snug">
            Get faster access and a better experience — no App Store needed.
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-white/25 hover:text-white/50 transition-colors flex-shrink-0 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* iOS instructions (expandable) */}
      {platform === 'ios' && showIOSSteps && (
        <div
          className="mt-3 px-3 py-2.5 rounded-xl text-xs text-white/60 space-y-1.5"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">1️⃣</span>
            <span>Tap the <strong className="text-white/80">Share</strong> button <span className="text-base">⬆️</span> in Safari</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">2️⃣</span>
            <span>Scroll down and tap <strong className="text-white/80">&ldquo;Add to Home Screen&rdquo;</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">3️⃣</span>
            <span>Tap <strong className="text-white/80">Add</strong> — done!</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        {platform === 'android' ? (
          <>
            <button
              onClick={handleInstallAndroid}
              className="flex-1 py-2 rounded-xl text-xs font-black transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)', color: 'white' }}
            >
              Add to Home Screen
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
            >
              Not now
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowIOSSteps(s => !s)}
              className="flex-1 py-2 rounded-xl text-xs font-black transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)', color: 'white' }}
            >
              {showIOSSteps ? 'Got it 👍' : 'Show me how'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
            >
              Not now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
