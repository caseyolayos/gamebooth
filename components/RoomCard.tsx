'use client'

import Link from 'next/link'
import VibeBadge from './VibeBadge'

interface Room {
  id: string
  title: string
  vibe_tag: string
  listener_count: number
  started_at: string
  ended_at?: string | null
  status?: string
  broadcaster_id: string
  profiles?: {
    username: string
    display_name: string
    avatar_emoji: string
    avatar_url?: string | null
  }
  games?: {
    league: string
    home_team: string
    away_team: string
    status: string
    start_time?: string | null
  }
}

const LEAGUE_EMOJI: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', UFC: '🥊', COLLEGE: '🎓',
}

function durationBetween(start: string, end?: string | null) {
  const from = new Date(start).getTime()
  const to = end ? new Date(end).getTime() : Date.now()
  const mins = Math.floor((to - from) / 60000)
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RoomCard({ room }: { room: Room }) {
  const broadcaster = room.profiles
  const game = room.games
  const isEnded     = room.status === 'ended'
  const isCountdown = room.status === 'countdown'

  const cardInner = (
    <div
      className={`glass rounded-2xl p-4 ${isEnded ? 'opacity-60' : 'glass-hover cursor-pointer'}`}
      style={isCountdown ? { borderColor: 'rgba(242,135,30,0.3)' } : {}}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(242,135,30,0.15)' }}
        >
          {broadcaster?.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={broadcaster.avatar_url} alt={broadcaster.display_name ?? ''} className="w-full h-full object-cover" />
            : (broadcaster?.avatar_emoji ?? '🎙️')
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="font-bold text-sm truncate">
              {broadcaster?.display_name ?? broadcaster?.username ?? 'Anonymous'}
            </div>
            {isEnded ? (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
              >
                Ended
              </span>
            ) : isCountdown ? (
              <span
                className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#F2871E', animation: 'livePulse 2s ease-in-out infinite' }} />
                Starting Soon
              </span>
            ) : (
              <div className="flex items-center gap-1 text-sm font-semibold flex-shrink-0" style={{ color: '#F2871E' }}>
                <span>👂</span>
                <span>{room.listener_count}</span>
              </div>
            )}
          </div>

          <div className="text-sm text-white/70 truncate mb-2">{room.title}</div>

          <div className="flex flex-wrap items-center gap-2">
            <VibeBadge vibe={room.vibe_tag} />
            {game && (
              <span className="text-xs text-white/40">
                {LEAGUE_EMOJI[game.league]} {game.away_team} vs {game.home_team}
              </span>
            )}
            {isEnded ? (
              <span className="text-xs text-white/25">
                {durationBetween(room.started_at, room.ended_at)} · {timeAgo(room.ended_at ?? room.started_at)}
              </span>
            ) : isCountdown ? (
              game?.start_time ? (
                <span className="text-xs text-white/35">
                  {new Date(game.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short',
                  })}
                </span>
              ) : null
            ) : (
              <span className="text-xs text-white/30">
                {durationBetween(room.started_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (isEnded) return <div>{cardInner}</div>
  return <Link href={`/room/${room.id}`} className="block">{cardInner}</Link>
}
