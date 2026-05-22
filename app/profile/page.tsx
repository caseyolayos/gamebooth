'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import BroadcastAudioPlayer from '@/components/BroadcastAudioPlayer'

const SPORT_OPTIONS = ['NBA', 'NFL', 'MLB', 'NHL', 'UFC', 'COLLEGE', 'SOCCER', 'TENNIS']
const AVATAR_EMOJIS = ['🎙️', '🏀', '🏈', '⚾', '🏒', '🥊', '🎤', '📡', '🔥', '🏟️', '🎯', '💪']

interface Profile {
  username: string
  display_name: string
  avatar_emoji: string
  avatar_url?: string
  bio: string
  role: string
  favorite_teams: string[]
  total_broadcasts: number
  total_listeners: number
  follower_count: number
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Profile>>({})
  const [realStats, setRealStats] = useState<{ total_listeners: number; total_broadcasts: number } | null>(null)
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user) {
      // Fetch real stats + broadcast history
      supabase
        .from('broadcast_rooms')
        .select('id, title, vibe_tag, listener_count, recording_url, recording_duration, break_count, peak_listeners, ended_at, espn_game_id, games(league, home_team, away_team)')
        .eq('broadcaster_id', user.id)
        .order('ended_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            setRealStats({
              total_broadcasts: data.length,
              total_listeners: data.reduce((sum, r) => sum + (r.peak_listeners ?? r.listener_count ?? 0), 0),
            })
            setBroadcasts(data.filter(r => r.recording_url))
          }
        })

      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data)
          setForm(data)
        } else {
          // Create profile
          const defaultProfile = {
            id: user.id,
            username: user.email?.split('@')[0] ?? 'fan',
            display_name: user.user_metadata?.full_name ?? 'Fan',
            avatar_emoji: '🎙️',
            bio: '',
            role: 'listener',
            favorite_teams: [],
            total_broadcasts: 0,
            total_listeners: 0,
            follower_count: 0,
          }
          supabase.from('profiles').insert(defaultProfile).then(() => {
            setProfile(defaultProfile as any)
            setForm(defaultProfile as any)
          })
        }
      })
    }
  }, [user, supabase])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingPhoto(true)
    setUploadError(null)
    try {
      const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : file.type.includes('gif') ? 'gif' : 'jpg'
      const path = `${user.id}/avatar.${ext}`

      // Upload directly from client using user's auth token
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { contentType: file.type, upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = `${publicUrl}?t=${Date.now()}`

      // Save to profile
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: 'id' })

      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev)
      setForm(prev => ({ ...prev, avatar_url: avatarUrl }))
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      ...form,
    })
    setProfile({ ...profile!, ...form })
    setEditing(false)
    setSaving(false)
  }

  const toggleTeam = (team: string) => {
    const teams = form.favorite_teams ?? []
    setForm({
      ...form,
      favorite_teams: teams.includes(team) ? teams.filter((t) => t !== team) : [...teams, team],
    })
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 text-center">
        <div className="text-white/40">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 relative" style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* Broadcast background layers */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: -80, left: -60,
            width: 420, height: 360,
            background: 'radial-gradient(ellipse at 25% 25%, rgba(242,135,30,0.11) 0%, rgba(242,135,30,0.03) 45%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.007) 3px, rgba(255,255,255,0.007) 4px)',
          }} />
        </div>

        <div className="relative text-center" style={{ zIndex: 1 }}>
          {/* Logo */}
          <div className="mx-auto mb-6" style={{ width: 72, height: 72 }}>
            <Image src="/gblogo.png" alt="GameBooth" width={72} height={72} className="object-contain" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-black mb-2 leading-tight">
            Your booth identity.
          </h1>
          <p className="text-white/45 text-sm mb-8 leading-relaxed">
            Build your profile. Grow your audience.<br />Track every broadcast.
          </p>

          {/* Value props */}
          <div className="space-y-3 mb-8 text-left max-w-xs mx-auto">
            {[
              { icon: '🎙️', label: 'Broadcaster or listener — you decide', sub: 'Switch roles anytime' },
              { icon: '📊', label: 'Track your stats', sub: 'Broadcasts, listeners, and followers' },
              { icon: '👥', label: 'Build a following', sub: 'Fans follow your booth across games' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-lg mt-0.5">{icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white/90">{label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full max-w-xs py-4 rounded-2xl font-black text-base"
            style={{
              background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)',
              color: 'white',
              boxShadow: '0 0 24px rgba(242,135,30,0.4), 0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            Sign In / Join GameBooth
          </a>
          <p className="text-xs text-white/25 mt-3">Free forever. No credit card.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black">Profile</h1>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-sm text-white/50 px-3 py-1.5 rounded-xl glass">
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="text-sm font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
              style={{ background: '#F2871E', color: 'white' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm px-3 py-1.5 rounded-xl glass text-white/70">
            Edit
          </button>
        )}
      </div>

      {/* Avatar + Name */}
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-4xl"
              style={{ background: 'rgba(242,135,30,0.15)' }}
            >
              {(form.avatar_url || profile?.avatar_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url || profile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{form.avatar_emoji ?? '🎙️'}</span>
              )}
            </div>
            {/* Upload / emoji toggle */}
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{ background: '#F2871E', color: 'white', border: '2px solid #0a0a0f' }}
              title="Upload photo"
            >
              {uploadingPhoto ? '⏳' : '📷'}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={form.display_name ?? ''}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Display name"
                className="w-full rounded-xl px-3 py-2 text-sm border mb-2"
              />
            ) : (
              <div className="font-bold text-xl">{profile?.display_name ?? profile?.username}</div>
            )}
            <div className="text-sm text-white/40">@{profile?.username}</div>
          </div>
        </div>

        {editing && (
          <textarea
            value={form.bio ?? ''}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Bio (optional)"
            rows={2}
            maxLength={160}
            className="w-full rounded-xl px-3 py-2 text-sm border mt-3 resize-none"
          />
        )}
        {!editing && profile?.bio && (
          <p className="text-sm text-white/60 mt-3">{profile.bio}</p>
        )}
      </div>

      {uploadError && (
        <p className="text-xs mb-3" style={{ color: '#FF4500' }}>⚠️ {uploadError}</p>
      )}

      {/* Role Toggle */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="text-sm font-bold text-white/60 mb-3">I am a...</div>
        <div className="flex gap-3">
          {(['listener', 'broadcaster'] as const).map((role) => (
            <button
              key={role}
              onClick={() => editing && setForm({ ...form, role })}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all"
              style={form.role === role ? {
                background: '#F2871E', color: 'white',
              } : {
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)',
                cursor: editing ? 'pointer' : 'default',
              }}
            >
              {role === 'listener' ? '👂 Listener' : '🎙️ Broadcaster'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-black">{realStats?.total_broadcasts ?? profile?.total_broadcasts ?? 0}</div>
            <div className="text-xs text-white/40 mt-0.5">Broadcasts</div>
          </div>
          <div>
            <div className="text-2xl font-black">{realStats?.total_listeners ?? profile?.total_listeners ?? 0}</div>
            <div className="text-xs text-white/40 mt-0.5">Total Listeners</div>
          </div>
          <div>
            <div className="text-2xl font-black">{profile?.follower_count ?? 0}</div>
            <div className="text-xs text-white/40 mt-0.5">Followers</div>
          </div>
        </div>
      </div>

      {/* Favorite Sports */}
      {editing && (
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="text-sm font-bold text-white/60 mb-3">Favorite Sports</div>
          <div className="flex flex-wrap gap-2">
            {SPORT_OPTIONS.map((sport) => {
              const selected = (form.favorite_teams ?? []).includes(sport)
              return (
                <button
                  key={sport}
                  onClick={() => toggleTeam(sport)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={selected ? { background: '#F2871E', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  {sport}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!editing && (profile?.favorite_teams?.length ?? 0) > 0 && (
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="text-sm font-bold text-white/60 mb-3">Favorite Sports</div>
          <div className="flex flex-wrap gap-2">
            {profile!.favorite_teams.map((sport) => (
              <span key={sport} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: '#F2871E', color: 'white' }}>
                {sport}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast History */}
      {broadcasts.length > 0 && (
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🎧</span>
            <h2 className="font-bold text-white">Broadcast Replays</h2>
            <span className="text-xs text-white/30">{broadcasts.length}</span>
          </div>
          <div className="space-y-3">
            {broadcasts.map((b) => {
              const game = b.games
              const gameLabel = game ? `${game.away_team} vs ${game.home_team}` : null
              return (
                <BroadcastAudioPlayer
                  key={b.id}
                  url={b.recording_url}
                  title={b.title}
                  game={gameLabel ?? undefined}
                  date={b.ended_at}
                  listeners={b.peak_listeners ?? b.listener_count ?? 0}
                  duration={b.recording_duration ?? undefined}
                  breakCount={b.break_count ?? 0}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full py-3 rounded-xl text-sm font-bold text-white/50 glass mt-2"
      >
        Sign Out
      </button>

      {/* Delete Account */}
      <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-xs text-white/25 mb-2 text-center">Danger Zone</p>
        <a
          href="/account-deletion"
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-center block transition-colors"
          style={{ background: 'rgba(255,69,0,0.08)', color: 'rgba(255,69,0,0.6)', border: '1px solid rgba(255,69,0,0.2)' }}
        >
          Delete Account
        </a>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="glass rounded-2xl p-6 w-full max-w-lg">
            <h3 className="font-bold mb-4">Pick your avatar</h3>
            <div className="grid grid-cols-6 gap-3 mb-4">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { setForm({ ...form, avatar_emoji: emoji }); setShowAvatarPicker(false) }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all"
                  style={{ background: form.avatar_emoji === emoji ? 'rgba(242,135,30,0.2)' : 'rgba(255,255,255,0.05)' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAvatarPicker(false)} className="w-full py-2 text-sm text-white/40">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
