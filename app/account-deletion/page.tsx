'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export default function AccountDeletionPage() {
  const { user, signOut } = useAuth()
  const [step, setStep] = useState<'info' | 'signin' | 'confirm' | 'done'>('info')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigningIn(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setSigningIn(false)
    } else {
      setStep('confirm')
      setSigningIn(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('No active session.'); setDeleting(false); return }

    const res = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setDeleting(false)
    } else {
      await supabase.auth.signOut()
      setStep('done')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/gameboothlogo-cropped.png" alt="GameBooth" width={140} height={42} className="object-contain mx-auto" />
          </Link>
        </div>

        {/* Info */}
        {step === 'info' && (
          <div className="glass rounded-2xl p-6">
            <h1 className="text-xl font-black text-white mb-2">Delete Your Account</h1>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              Deleting your account permanently removes your profile, broadcast history, and all associated data. This cannot be undone.
            </p>
            <div className="rounded-xl p-4 mb-6 text-sm space-y-2"
              style={{ background: 'rgba(255,69,0,0.06)', border: '1px solid rgba(255,69,0,0.2)' }}>
              <p className="font-bold text-[#FF4500]">What gets deleted:</p>
              <ul className="text-white/50 space-y-1 text-xs leading-relaxed">
                <li>• Your profile and username</li>
                <li>• All broadcast history and recordings</li>
                <li>• Listener stats and booth history</li>
                <li>• Account preferences and settings</li>
              </ul>
            </div>
            {user ? (
              <button onClick={() => setStep('confirm')}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.3)' }}>
                Continue to Delete
              </button>
            ) : (
              <>
                <button onClick={() => setStep('signin')}
                  className="w-full py-3 rounded-xl font-bold text-sm mb-3"
                  style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.3)' }}>
                  Sign In to Delete Account
                </button>
                <p className="text-center text-xs text-white/30">
                  You must sign in to verify your identity before deleting.
                </p>
              </>
            )}
            <div className="mt-4 text-center">
              <Link href="/" className="text-xs text-white/30 hover:text-white/50 transition-colors">
                ← Back to GameBooth
              </Link>
            </div>
          </div>
        )}

        {/* Sign in */}
        {step === 'signin' && (
          <div className="glass rounded-2xl p-6">
            <button onClick={() => setStep('info')} className="text-white/40 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors">
              ← Back
            </button>
            <h2 className="text-lg font-black text-white mb-1">Verify Your Identity</h2>
            <p className="text-white/40 text-sm mb-6">Sign in to confirm it&apos;s you before we delete anything.</p>
            <form onSubmit={handleSignIn} className="space-y-3">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm border text-white placeholder-white/30 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }} />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm border text-white placeholder-white/30 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }} />
              {error && <p className="text-[#FF4500] text-xs">{error}</p>}
              <button type="submit" disabled={signingIn}
                className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40"
                style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.3)' }}>
                {signingIn ? 'Signing in…' : 'Sign In & Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Confirm */}
        {step === 'confirm' && (
          <div className="rounded-2xl p-6" style={{ border: '1px solid rgba(255,69,0,0.3)', background: 'rgba(255,69,0,0.06)' }}>
            <h2 className="text-lg font-black text-white mb-1">Are you sure?</h2>
            {user && <p className="text-white/50 text-sm mb-2">Signed in as <span className="text-white font-semibold">{user.email}</span></p>}
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              This will permanently delete your account and all data. There is no way to recover it.
            </p>
            {error && <p className="text-[#FF4500] text-xs mb-4">{error}</p>}
            <button onClick={handleDelete} disabled={deleting}
              className="w-full py-3 rounded-xl font-black text-sm mb-3 disabled:opacity-40"
              style={{ background: '#FF4500', color: 'white' }}>
              {deleting ? 'Deleting…' : 'Yes, permanently delete my account'}
            </button>
            <button onClick={() => { setStep('info'); signOut() }}
              className="w-full py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors">
              Cancel
            </button>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-black text-white mb-2">Account Deleted</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Your account and all associated data have been permanently deleted. Thanks for being part of GameBooth.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
