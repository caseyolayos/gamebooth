'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    emoji: '📺',
    title: 'Tired of the same broadcast?',
    body: 'Same networks. Same two voices. Same tired takes. Every. Single. Game.',
  },
  {
    emoji: '🎙️',
    title: 'Pick your booth.',
    body: 'GameBooth lets real fans host live commentary for any game. Find the vibe that matches yours — hype, stats, or just your people.',
  },
  {
    emoji: '🔇',
    title: 'Mute the TV. Tune in.',
    body: 'Find a live game, pick a booth, and actually enjoy watching sports again.',
  },
]

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('gb_onboarding_seen')
      if (!seen) setVisible(true)
    } catch {}
  }, [])

  const dismiss = () => {
    try { localStorage.setItem('gb_onboarding_seen', '1') } catch {}
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="w-full max-w-lg">

        {/* Card */}
        <div className="glass rounded-3xl p-8 mb-4 text-center">
          {/* Logo */}
          <div className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: '#F2871E' }}>
            GameBooth
          </div>

          {/* Emoji */}
          <div className="text-6xl mb-6">{current.emoji}</div>

          {/* Text */}
          <h2 className="text-2xl font-black text-white mb-3 leading-tight">
            {current.title}
          </h2>
          <p className="text-white/50 text-base leading-relaxed">
            {current.body}
          </p>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-8 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background: i === step ? '#F2871E' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={next}
            className="w-full py-4 rounded-2xl font-black text-white text-lg transition-opacity active:opacity-80"
            style={{ background: '#F2871E' }}
          >
            {isLast ? "Let's Go 🎙️" : 'Next →'}
          </button>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={dismiss}
              className="w-full py-3 mt-2 text-sm text-white/25 hover:text-white/50 transition-colors"
            >
              Skip
            </button>
          )}
        </div>

        {/* About link */}
        <p className="text-center text-xs text-white/20">
          <Link href="/about" onClick={dismiss} className="underline hover:text-white/40 transition-colors">
            Learn more about GameBooth
          </Link>
        </p>
      </div>
    </div>
  )
}
