'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'

const SPORT_OPTIONS = ['NBA', 'NFL', 'MLB', 'NHL', 'UFC', 'COLLEGE', 'SOCCER', 'TENNIS']

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<'listener' | 'broadcaster'>('listener')
  const [sports, setSports] = useState<string[]>([])
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const toggleSport = (sport: string) => {
    setSports((prev) => prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport])
  }

  const finish = async () => {
    if (!user || !username.trim() || !agreed) return
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('profiles').upsert({
      id: user.id,
      username: username.toLowerCase().replace(/\s+/g, '_'),
      display_name: username,
      role,
      favorite_teams: sports,
      avatar_emoji: '🎙️',
    })

    if (err) {
      setError(err.message.includes('unique') ? 'Username taken, try another.' : err.message)
      setSaving(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">👋</div>
        <h1 className="text-2xl font-black">Welcome to GameBooth!</h1>
        <p className="text-white/50 text-sm mt-1">Let&apos;s set up your profile</p>
      </div>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 h-1 rounded-full" style={{ background: s <= step ? '#F2871E' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      {step === 1 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Pick a username</h2>
          <input
            type="text"
            placeholder="e.g. HoopsHead or LakersLifer"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            className="w-full rounded-xl px-4 py-3 text-sm border mb-4"
          />
          <button
            onClick={() => setStep(2)}
            disabled={!username.trim()}
            className="w-full py-3 rounded-xl font-bold disabled:opacity-40"
            style={{ background: '#F2871E', color: 'white' }}
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-2">How will you use GameBooth?</h2>
          <p className="text-sm text-white/50 mb-4">You can always change this later.</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['listener', 'broadcaster'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="p-4 rounded-xl text-left transition-all"
                style={role === r ? { background: 'rgba(242,135,30,0.15)', border: '1px solid #F2871E' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="text-2xl mb-2">{r === 'listener' ? '👂' : '🎙️'}</div>
                <div className="font-bold text-sm capitalize">{r}</div>
                <div className="text-xs text-white/40 mt-1">{r === 'listener' ? 'Tune in to fan booths' : 'Host your own commentary'}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl glass text-sm font-bold">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: '#F2871E', color: 'white' }}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-2">Favorite sports?</h2>
          <p className="text-sm text-white/50 mb-4">We&apos;ll surface relevant games for you.</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {SPORT_OPTIONS.map((sport) => (
              <button
                key={sport}
                onClick={() => toggleSport(sport)}
                className="px-3 py-2 rounded-xl text-sm font-bold transition-all"
                style={sports.includes(sport) ? { background: '#F2871E', color: 'white' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
              >
                {sport}
              </button>
            ))}
          </div>

          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-5 h-5" />
            <span className="text-sm text-white/70">
              I understand GameBooth is for original fan commentary only — not streaming official broadcast audio or video.
            </span>
          </label>

          {error && <p className="text-sm mb-3" style={{ color: '#FF4500' }}>{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl glass text-sm font-bold">Back</button>
            <button
              onClick={finish}
              disabled={!agreed || saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: '#F2871E', color: 'white' }}
            >
              {saving ? 'Saving...' : 'Let\'s go! 🎙️'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
