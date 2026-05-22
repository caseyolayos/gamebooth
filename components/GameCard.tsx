'use client'

import Link from 'next/link'

const LEAGUE_EMOJI: Record<string, string> = {
  NBA: '🏀',
  NFL: '🏈',
  MLB: '⚾',
  NHL: '🏒',
  UFC: '🥊',
  COLLEGE: '🎓',
}

interface Game {
  id: string
  league: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  status: string
  period?: string
  game_clock?: string
  start_time: string
  broadcast_count: number
}

export default function GameCard({ game, compact = false }: { game: Game; compact?: boolean }) {
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'

  const startDate = new Date(game.start_time)
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })

  if (compact) {
    return (
      <Link href={`/games/${game.id}`}>
        <div
          className="glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-white/20"
          style={{ minWidth: 280 }}
        >
          <div className="text-3xl">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white/40 uppercase">{game.league}</span>
              {isLive && (
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#FF4500' }}>
                  <span className="live-dot inline-block" />
                  LIVE
                </span>
              )}
            </div>
            <div className="font-bold text-sm truncate">
              {game.away_team} vs {game.home_team}
            </div>
            {isLive ? (
              <div className="text-xs text-white/60 mt-0.5">
                {game.away_score} – {game.home_score} · {game.period} {game.game_clock}
              </div>
            ) : (
              <div className="text-xs text-white/60 mt-0.5">{timeStr}</div>
            )}
          </div>
          {game.broadcast_count > 0 && (
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: '#F2871E' }}>{game.broadcast_count}</div>
              <div className="text-xs text-white/40">booths</div>
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/games/${game.id}`}>
      <div className="glass glass-hover rounded-2xl p-4 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</span>
            <span className="text-xs font-bold text-white/40 uppercase tracking-wide">{game.league}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500' }}
              >
                <span className="live-dot inline-block w-1.5 h-1.5" />
                LIVE
              </span>
            )}
            {isFinal && (
              <span className="text-xs font-bold text-white/40 uppercase">Final</span>
            )}
            {!isLive && !isFinal && (
              <span className="text-xs text-white/40">{timeStr}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-white/70">{game.away_team}</div>
            <div className="font-bold text-lg mt-0.5">{game.home_team}</div>
          </div>

          {(isLive || isFinal) ? (
            <div className="text-right">
              <div className="font-bold text-2xl tabular-nums">
                {game.away_score} – {game.home_score}
              </div>
              {isLive && game.period && (
                <div className="text-xs text-white/40 mt-0.5">
                  {game.period} {game.game_clock}
                </div>
              )}
            </div>
          ) : (
            <div className="text-right">
              <div className="font-bold text-xl">vs</div>
            </div>
          )}
        </div>

        {game.broadcast_count > 0 && (
          <div
            className="mt-3 pt-3 flex items-center gap-1.5 text-sm"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>🎙️</span>
            <span style={{ color: '#F2871E' }} className="font-semibold">{game.broadcast_count} booth{game.broadcast_count !== 1 ? 's' : ''} live</span>
          </div>
        )}
      </div>
    </Link>
  )
}
