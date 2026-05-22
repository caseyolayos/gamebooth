'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      })
      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccess('Check your email to confirm your account!')
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
      } else {
        router.push('/')
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-12">
      <div className="text-center mb-8">
        <img src="/gameboothlogo-cropped.png" alt="GameBooth" className="h-14 object-contain mx-auto mb-3" />
        <p className="text-white/50 text-sm">Mute the TV. Pick Your Booth.</p>
      </div>

      <div className="glass rounded-2xl p-6">
        {/* Mode Toggle */}
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setMode('signin')}
            className="flex-1 py-2.5 text-sm font-bold transition-all"
            style={{ background: mode === 'signin' ? '#F2871E' : 'transparent', color: mode === 'signin' ? 'white' : 'rgba(255,255,255,0.5)' }}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className="flex-1 py-2.5 text-sm font-bold transition-all"
            style={{ background: mode === 'signup' ? '#F2871E' : 'transparent', color: mode === 'signup' ? 'white' : 'rgba(255,255,255,0.5)' }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3 text-sm border"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl px-4 py-3 text-sm border"
          />

          {error && <p className="text-sm text-center" style={{ color: '#FF4500' }}>{error}</p>}
          {success && <p className="text-sm text-center" style={{ color: '#F2871E' }}>{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: '#F2871E', color: 'white' }}
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'signup' && (
          <p className="text-xs text-white/30 text-center mt-4">
            By signing up, you agree to our terms. GameBooth is for original fan commentary only — not streaming of official broadcast audio or video.
          </p>
        )}
      </div>
    </div>
  )
}
