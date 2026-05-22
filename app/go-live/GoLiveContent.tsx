'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'

const VIBE_TAGS = [
  { id: 'Hometown Homer', emoji: '🏠', label: 'Hometown Homer', desc: 'Ride or die for your team' },
  { id: 'Comedy Booth',   emoji: '😂', label: 'Comedy Booth',   desc: 'Keep it light and funny' },
  { id: 'Betting Booth',  emoji: '💰', label: 'Betting Booth',  desc: 'Lines, picks, and props' },
  { id: 'Film Room',      emoji: '🎬', label: 'Film Room',      desc: 'Breakdowns & athlete insight' },
  { id: 'Unfiltered',     emoji: '🔥', label: 'Unfiltered',     desc: 'Hot takes, no filter' },
  { id: 'Chill Booth',    emoji: '😌', label: 'Chill Booth',    desc: 'Laid-back, no pressure' },
  { id: 'Family Friendly',emoji: '👨‍👩‍👧', label: 'Family Friendly',desc: 'Clean commentary' },
  { id: 'Anti-Announcer', emoji: '📢', label: 'Anti-Announcer', desc: 'Better than the real thing' },
]

function getStatusBadge(status: string, startTime: string) {
  if (status === 'live') return (
    <span className="flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full"
      style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500' }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#FF4500' }} />
      LIVE
    </span>
  )
  if (status === 'delayed') return (
    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
      style={{ background: 'rgba(100,150,255,0.15)', color: '#7EB3FF' }}>🌧 DELAYED</span>
  )
  if (status === 'final') return (
    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>FINAL</span>
  )
  const timeStr = new Date(startTime).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
  })
  return <span className="text-[10px] text-white/40 font-medium">{timeStr} ET</span>
}

function generateBoothNames(game: Game, vibe: string): string[] {
  const home = game.home_team.split(' ').pop() ?? game.home_team
  const away = game.away_team.split(' ').pop() ?? game.away_team
  const templates: Record<string, string[]> = {
    'Hometown Homer':  [`${home} Nation Live`, `Ride or Die ${home}`, `${home} Win or Riot`, `The ${home} Faithful`],
    'Comedy Booth':    [`${away} Comedy Central`, `${home} Meltdown Live`, `Unfiltered ${home} Reactions`, `The Casual Booth`],
    'Betting Booth':   [`${home} vs ${away} Sharp Picks`, `Tonight's Best Lines`, `The Degen Booth`, `${home} Props & Locks`],
    'Film Room':       [`${home} Breakdown`, `${away} at ${home} Film Study`, `X's & O's Booth`, `Inside the ${home} Game`],
    'Unfiltered':      [`No Filter ${home}`, `Hot Takes Only`, `${away} vs ${home} Real Talk`, `${home} Uncut`],
    'Chill Booth':     [`Laid Back ${home} Watch`, `Chill ${away} vs ${home}`, `Low Key Tonight`, `The Couch Booth`],
    'Family Friendly': [`${home} Family Booth`, `Clean ${home} Commentary`, `${home} for Everyone`, `The Family Section`],
    'Anti-Announcer':  [`Better Than the Broadcast`, `The Real ${home} Commentary`, `Anti-ESPN Booth`, `${away} vs ${home} Done Right`],
  }
  return templates[vibe] ?? [`${home} Live Booth`, `${away} vs ${home} Commentary`, `Tonight's ${game.league} Booth`, `Live ${game.league} Reactions`]
}

function getListenerEstimate(game: Game, vibe: string): number {
  const base: Record<string, number> = { NBA: 80, NFL: 150, MLB: 45, NHL: 40, UFC: 120, CFB: 120, CBB: 70, COLLEGE: 35 }
  const vibeBoost: Record<string, number> = { 'Unfiltered': 1.3, 'Comedy Booth': 1.2, 'Betting Booth': 1.25, 'Film Room': 1.1 }
  const seed = game.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return Math.max(14, Math.round((base[game.league] ?? 50) * (vibeBoost[vibe] ?? 1.0) + (seed % 38) - 12))
}


const LEAGUE_EMOJI: Record<string, string> = { NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', UFC: '🥊', CFB: '🏈', CBB: '🏀', COLLEGE: '🎓' }

interface Game {
  id: string
  league: string
  home_team: string
  away_team: string
  home_team_logo?: string | null
  away_team_logo?: string | null
  status: string
  start_time: string
}

export default function GoLiveContent({ initialGameId }: { initialGameId?: string }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const preselectedGameId = initialGameId ?? null

  const [step, setStep] = useState(preselectedGameId ? 2 : 1)
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedVibe, setSelectedVibe] = useState('')
  const [title, setTitle] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [gamesLoading, setGamesLoading] = useState(!!preselectedGameId)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then(({ games: liveGames }) => {
        if (liveGames?.length > 0) {
          setGames(liveGames)
          if (preselectedGameId) {
            const match = liveGames.find((g: Game) => g.id === preselectedGameId)
            if (match) { setSelectedGame(match); setStep(2) }
          }
        } else if (preselectedGameId) {
          // Fallback: Supabase
          supabase.from('games').select('*').eq('id', preselectedGameId).single()
            .then(({ data }) => { if (data) { setSelectedGame(data); setStep(2) } })
        }
      })
      .catch(() => {})
      .finally(() => setGamesLoading(false))
  }, [supabase, preselectedGameId])

  if (gamesLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <div className="w-8 h-8 border-2 border-[#F2871E]/30 border-t-[#F2871E] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-sm">Loading game...</p>
      </div>
    )
  }

  if (!loading && !user) {
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
            Your booth.<br />Your voice.
          </h1>
          <p className="text-white/45 text-sm mb-8 leading-relaxed">
            Pick a game. Set your vibe.<br />Go live in seconds.
          </p>

          {/* Value props */}
          <div className="space-y-3 mb-8 text-left max-w-xs mx-auto">
            {[
              { icon: '🔴', label: 'Go live for any game tonight', sub: 'NBA, NFL, CFB, CBB, MLB, NHL, UFC' },
              { icon: '🎙️', label: 'Set your booth vibe', sub: 'Homer, Unfiltered, Comedy, and more' },
              { icon: '👥', label: 'Build your audience', sub: 'Listeners tune in, react, and follow you' },
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
            Sign In to Go Live
          </a>
          <p className="text-xs text-white/25 mt-3">Free to broadcast. Always.</p>
        </div>
      </div>
    )
  }

  const filteredGames = games.filter((g) =>
    search === '' ||
    g.home_team.toLowerCase().includes(search.toLowerCase()) ||
    g.away_team.toLowerCase().includes(search.toLowerCase()) ||
    g.league.toLowerCase().includes(search.toLowerCase())
  )

  const createRoom = async () => {
    setError(null)
    if (!user) { setError('You must be signed in to go live.'); return }
    if (!selectedGame) { setError('No game selected — go back and pick a game.'); return }
    if (!selectedVibe) { setError('Pick a vibe for your booth.'); return }
    if (!title.trim()) { setError('Give your booth a name.'); return }
    if (!agreed) { setError('You must agree to the terms.'); return }

    setCreating(true)

    // Ensure profile exists (FK requirement)
    await supabase.from('profiles').upsert(
      { id: user.id, display_name: user.email?.split('@')[0] ?? 'Fan' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const roomName = `gamebooth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedGame.id)
    const isEspnId = selectedGame.id.startsWith('espn-')

    const { data: room, error: roomError } = await supabase
      .from('broadcast_rooms')
      .insert({
        ...(isRealUuid ? { game_id: selectedGame.id } : {}),
        ...(isEspnId ? { espn_game_id: selectedGame.id } : {}),
        broadcaster_id: user.id,
        title,
        vibe_tag: selectedVibe,
        status: selectedGame.status === 'upcoming' ? 'countdown' : 'live',
        listener_count: 0,
        livekit_room_name: roomName,
      })
      .select()
      .single()

    if (roomError || !room) {
      setError(`Failed to create room: ${roomError?.message ?? 'unknown error'}`)
      setCreating(false)
      return
    }

    router.push(`/room/${room.id}`)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl">🎙️</div>
        <div>
          <h1 className="text-xl font-black">Go Live</h1>
          <p className="text-sm text-white/40">Step {step} of 3</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="flex-1 h-1 rounded-full transition-all"
            style={{ background: s <= step ? '#F2871E' : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>

      {/* Step 1: Select Game */}
      {step === 1 && (
        <div>
          <h2 className="font-bold text-lg mb-4">Which game?</h2>
          <input
            type="text"
            placeholder="Search tonight's games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm border mb-4"
          />
          <div className="space-y-2">
            {filteredGames.map((game) => (
              <button
                key={game.id}
                onClick={() => { setSelectedGame(game); setStep(2) }}
                className="w-full glass glass-hover rounded-xl p-4 text-left transition-all"
                style={selectedGame?.id === game.id ? { borderColor: '#F2871E' } : {}}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {game.away_team_logo
                      ? <img src={game.away_team_logo} alt={game.away_team} className="w-8 h-8 object-contain" />
                      : <span className="text-xl">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</span>}
                    {game.home_team_logo && (
                      <img src={game.home_team_logo} alt={game.home_team} className="w-8 h-8 object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-tight">{game.away_team}</div>
                    <div className="text-xs text-white/50">vs {game.home_team}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{game.league}</span>
                        {getStatusBadge(game.status, game.start_time)}
                      </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose Vibe */}
      {step === 2 && (
        <div>
          <h2 className="font-bold text-lg mb-1">What&apos;s your vibe?</h2>
          <p className="text-sm text-white/50 mb-4">
            {selectedGame ? `${selectedGame.away_team} vs ${selectedGame.home_team}` : ''}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {VIBE_TAGS.map((vibe) => {
              const selected = selectedVibe === vibe.id
              return (
                <button
                  key={vibe.id}
                  onClick={() => setSelectedVibe(vibe.id)}
                  className="rounded-xl p-4 text-left transition-all"
                  style={selected ? {
                    border: '2px solid #F2871E',
                    background: 'rgba(242,135,30,0.13)',
                    transform: 'scale(1.04)',
                    boxShadow: '0 0 18px rgba(242,135,30,0.35), 0 0 6px rgba(242,135,30,0.2)',
                    animation: 'vibeSelected 1.8s ease-in-out infinite',
                  } : {
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    transform: 'scale(1)',
                  }}
                >
                  <div className="text-2xl mb-1">{vibe.emoji}</div>
                  <div className="font-bold text-sm">{vibe.label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{vibe.desc}</div>
                </button>
              )
            })}
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4"
            style={{ background: 'rgba(10,10,15,0.97)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
            <div className="flex gap-3 max-w-lg mx-auto">
              <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl text-sm font-bold glass">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedVibe}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold disabled:opacity-40"
                style={{ background: '#F2871E', color: 'white' }}
              >
                Next →
              </button>
            </div>
          </div>
          <div className="h-28" />
        </div>
      )}

      {/* Step 3: Room Title + Launch */}
      {step === 3 && (
        <div>
          <h2 className="font-bold text-lg mb-1">Name your booth</h2>

          {/* Listener estimate */}
          {selectedGame && selectedVibe && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">👥</span>
              <p className="text-xs text-white/40">
                ~{getListenerEstimate(selectedGame, selectedVibe)} fans looking for{' '}
                <span className="text-white/65 font-semibold">{selectedGame.home_team}</span> booths tonight
              </p>
            </div>
          )}

          <input
            type="text"
            placeholder="Name your booth..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl px-4 py-3 text-sm border mb-1"
          />
          <p className="text-xs text-white/30 mb-3">{title.length}/60</p>

          {/* Name suggestions */}
          {selectedGame && selectedVibe && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {generateBoothNames(selectedGame, selectedVibe).map(name => (
                  <button
                    key={name}
                    onClick={() => setTitle(name)}
                    className="text-xs px-3 py-1.5 rounded-xl transition-all"
                    style={{
                      background: title === name ? 'rgba(242,135,30,0.18)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${title === name ? 'rgba(242,135,30,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: title === name ? '#F2871E' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="rounded-xl p-4 mb-4 text-sm text-white/70"
            style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)' }}
          >
            ⚖️ <strong>Legal notice:</strong> GameBooth is for original fan commentary only. Do not stream official broadcast audio or game video. By going live, you agree to our terms of service.
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded"
            />
            <span className="text-sm text-white/70">
              I understand and agree to provide only original fan commentary.
            </span>
          </label>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-3 text-sm" style={{ background: 'rgba(255,69,0,0.1)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.3)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Sticky buttons — always visible above bottom nav */}
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe"
            style={{ background: 'rgba(10,10,15,0.97)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
            <div className="flex gap-3 max-w-lg mx-auto">
              <button onClick={() => { setError(null); setStep(2) }} className="flex-1 py-3.5 rounded-xl text-sm font-bold glass">
                Back
              </button>
              <button
                onClick={createRoom}
                disabled={creating}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold disabled:opacity-40"
                style={{ background: '#FF4500', color: 'white' }}
              >
                {creating ? 'Creating...' : '🎙 Go Live'}
              </button>
            </div>
          </div>
          <div className="h-32" />{/* spacer for sticky bar */}
        </div>
      )}
    </div>
  )
}
