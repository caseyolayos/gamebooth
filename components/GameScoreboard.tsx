'use client'

import { useState, useEffect } from 'react'

interface Game {
  id: string
  league: string
  away_team: string
  home_team: string
  away_team_logo?: string | null
  home_team_logo?: string | null
  away_team_abbr?: string
  home_team_abbr?: string
  away_score: number
  home_score: number
  status: string
  period?: string | null
  game_clock?: string | null
  start_time: string
  venue?: string | null
  broadcast_count?: number
}

interface Props {
  game: Game
  liveBoothCount?: number
}

function StatusChip({ game }: { game: Game }) {
  if (game.status === 'live') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black"
        style={{ background: 'rgba(255,69,0,0.18)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.3)' }}>
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#FF4500', animation: 'livePulse 1.5s ease-in-out infinite' }} />
        LIVE
      </div>
    )
  }
  if (game.status === 'final') {
    return (
      <div className="px-3 py-1 rounded-full text-xs font-black"
        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
        FINAL
      </div>
    )
  }
  if (game.status === 'delayed') {
    return (
      <div className="px-3 py-1 rounded-full text-xs font-black"
        style={{ background: 'rgba(100,150,255,0.15)', color: '#7EB3FF' }}>
        🌧 DELAYED
      </div>
    )
  }
  return (
    <div className="px-3 py-1 rounded-full text-xs font-bold text-white/40"
      style={{ background: 'rgba(255,255,255,0.06)' }}>
      {new Date(game.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short',
      })}
    </div>
  )
}

function TeamLogo({ src, alt, size = 72 }: { src?: string | null; alt: string; size?: number }) {
  const [err, setErr] = useState(false)
  if (!src || err) {
    return (
      <div className="flex items-center justify-center rounded-full text-3xl"
        style={{ width: size, height: size, background: 'rgba(255,255,255,0.06)' }}>
        🏟️
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src} alt={alt}
      onError={() => setErr(true)}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}

export default function GameScoreboard({ game: initialGame, liveBoothCount = 0 }: Props) {
  const [game, setGame] = useState(initialGame)
  const [booths, setBooths] = useState(liveBoothCount)

  // Poll for live score updates every 30s
  useEffect(() => {
    if (game.status !== 'live') return
    const refresh = async () => {
      try {
        const res = await fetch('/api/games', { cache: 'no-store' })
        if (!res.ok) return
        const { games } = await res.json()
        const updated = games.find((g: Game) => g.id === game.id)
        if (updated) setGame(updated)
      } catch {}
    }
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [game.id, game.status])

  // Poll booth count
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/booths/counts', { cache: 'no-store' })
        const data = await res.json()
        if (data[game.id]) setBooths(data[game.id].booths ?? 0)
      } catch {}
    }
    refresh()
    const interval = setInterval(refresh, 15_000)
    return () => clearInterval(interval)
  }, [game.id])

  const isLive     = game.status === 'live'
  const isFinal    = game.status === 'final'
  const isUpcoming = !isLive && !isFinal && game.status !== 'delayed'
  const awayWin    = isFinal && game.away_score > game.home_score
  const homeWin    = isFinal && game.home_score > game.away_score

  return (
    <div
      className="rounded-3xl overflow-hidden mb-6"
      style={{
        background: 'linear-gradient(180deg, rgba(15,15,22,1) 0%, rgba(10,10,15,1) 100%)',
        border: isLive ? '1px solid rgba(255,69,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isLive ? '0 0 40px rgba(255,69,0,0.08)' : 'none',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-white/35">{game.league}</span>
          {game.venue && (
            <span className="text-xs text-white/20 hidden sm:inline">· {game.venue}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {booths > 0 && (
            <span className="text-xs font-bold" style={{ color: '#F2871E' }}>
              🎙️ {booths} booth{booths !== 1 ? 's' : ''} live
            </span>
          )}
          <StatusChip game={game} />
        </div>
      </div>

      {/* Main scoreboard */}
      <div className="px-5 py-6">
        <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr auto 1fr' }}>

          {/* Away team */}
          <div className={`flex flex-col items-center gap-2 ${awayWin ? 'opacity-100' : homeWin ? 'opacity-50' : ''}`}>
            <TeamLogo src={game.away_team_logo} alt={game.away_team} size={64} />
            <div className="text-center">
              <div className="font-black text-sm text-white/90 leading-tight">
                {game.away_team_abbr || game.away_team.split(' ').pop()}
              </div>
              <div className="text-[10px] text-white/35 leading-tight truncate max-w-[80px]">
                {game.away_team}
              </div>
            </div>
            {awayWin && (
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#F2871E' }}>Winner</div>
            )}
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center">
            {isUpcoming ? (
              <>
                <div className="text-3xl font-black text-white/20 mb-1">VS</div>
                <div className="text-xs text-white/40 text-center">
                  {new Date(game.start_time).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                  })}
                </div>
              </>
            ) : (
              <>
                <div
                  className="font-black tabular-nums text-center leading-none"
                  style={{
                    fontSize: 'clamp(28px, 8vw, 48px)',
                    letterSpacing: '-0.02em',
                    color: 'white',
                    whiteSpace: 'nowrap',
                    textShadow: isLive ? '0 0 30px rgba(255,69,0,0.3)' : 'none',
                  }}
                >
                  {game.away_score}
                  <span className="text-white/20" style={{ fontSize: '0.45em', margin: '0 4px' }}>–</span>
                  {game.home_score}
                </div>
                {isLive && game.period && (
                  <div className="mt-2 text-center">
                    <div
                      className="text-xs font-black uppercase tracking-widest"
                      style={{ color: '#FF4500' }}
                    >
                      {game.period}
                    </div>
                    {game.game_clock && game.game_clock !== '0.0' && (
                      <div className="text-xs text-white/40 tabular-nums mt-0.5">{game.game_clock}</div>
                    )}
                  </div>
                )}
                {isFinal && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-2">Final</div>
                )}
              </>
            )}
          </div>

          {/* Home team */}
          <div className={`flex flex-col items-center gap-2 ${homeWin ? 'opacity-100' : awayWin ? 'opacity-50' : ''}`}>
            <TeamLogo src={game.home_team_logo} alt={game.home_team} size={64} />
            <div className="text-center">
              <div className="font-black text-sm text-white/90 leading-tight">
                {game.home_team_abbr || game.home_team.split(' ').pop()}
              </div>
              <div className="text-[10px] text-white/35 leading-tight truncate max-w-[80px]">
                {game.home_team}
              </div>
            </div>
            {homeWin && (
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#F2871E' }}>Winner</div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom ticker — live game only */}
      {isLive && (
        <div
          className="px-5 py-2.5 flex items-center justify-center gap-2"
          style={{ borderTop: '1px solid rgba(255,69,0,0.12)', background: 'rgba(255,69,0,0.04)' }}
        >
          <div className="flex items-end gap-0.5" style={{ height: 12 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="waveform-bar" style={{ animationDelay: `${i*0.15}s`, background: 'rgba(255,69,0,0.6)' }} />
            ))}
          </div>
          <span className="text-xs font-bold text-white/40">Scores update every 30s</span>
        </div>
      )}
    </div>
  )
}
