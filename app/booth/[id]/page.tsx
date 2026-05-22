import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import VibeBadge from '@/components/VibeBadge'
import FollowButton from '@/components/FollowButton'
import { notFound } from 'next/navigation'

const LEAGUE_EMOJI: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', UFC: '🥊', COLLEGE: '🎓',
}

function durationBetween(start: string, end?: string | null) {
  const from = new Date(start).getTime()
  const to = end ? new Date(end).getTime() : Date.now()
  const mins = Math.floor((to - from) / 60000)
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function BoothPage({ params }: { params: { id: string } }) {
  const db = createServerSupabaseClient()
  const { data: room } = await db
    .from('broadcast_rooms')
    .select(`*, profiles (username, display_name, avatar_emoji)`)
    .eq('id', params.id)
    .single()

  if (!room) notFound()

  const broadcaster = room.profiles as any
  const game = room.games as any
  const isLive = room.status === 'live'
  const isEnded = room.status === 'ended'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">

      {/* Broadcaster header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'rgba(242,135,30,0.15)', border: '2px solid rgba(242,135,30,0.2)' }}
        >
          {broadcaster?.avatar_emoji ?? '🎙️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg truncate">
            {broadcaster?.display_name ?? broadcaster?.username ?? 'Anonymous'}
          </div>
          {broadcaster?.username && (
            <div className="text-sm text-white/40">
              <Link href={`/profile/${broadcaster.username}`} className="hover:text-white/60 transition-colors">
                @{broadcaster.username}
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {room.broadcaster_id && (
            <FollowButton targetUserId={room.broadcaster_id} size="sm" />
          )}
          {isLive && (
            <Link
              href={`/room/${room.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0"
              style={{ background: '#FF4500', color: 'white' }}
            >
              <span className="live-dot inline-block" style={{ width: 7, height: 7 }} />
              Join Live
            </Link>
          )}
        </div>
      </div>

      {/* Booth card */}
      <div className="glass rounded-2xl p-5 mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="font-bold text-base leading-snug flex-1">{room.title}</h1>
          {isEnded && (
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
            >
              Ended
            </span>
          )}
          {isLive && (
            <span
              className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500' }}
            >
              <span className="live-dot inline-block" style={{ width: 5, height: 5 }} />
              LIVE
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <VibeBadge vibe={room.vibe_tag} />
          {game && (
            <span className="text-xs text-white/40">
              {LEAGUE_EMOJI[game.league]} {game.away_team} vs {game.home_team}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-white/30">
          {isEnded && room.ended_at && (
            <>
              <span>⏱ {durationBetween(room.started_at, room.ended_at)}</span>
              <span>🕐 {timeAgo(room.ended_at)}</span>
            </>
          )}
          {isLive && (
            <span>👂 {room.listener_count} listening</span>
          )}
          {room.started_at && (
            <span>
              {new Date(room.started_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      {isEnded && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between gap-3"
          style={{ background: 'rgba(242,135,30,0.07)', border: '1px solid rgba(242,135,30,0.15)' }}
        >
          <div>
            <div className="text-sm font-semibold text-white/70">
              {game ? `Start a booth for ${game.home_team}` : 'Start your own booth'}
            </div>
            <div className="text-xs text-white/35 mt-0.5">Be the voice for the next game</div>
          </div>
          <Link
            href={game ? `/go-live?gameId=${room.espn_game_id ?? room.game_id ?? ''}` : '/go-live'}
            className="text-sm font-black px-4 py-2 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)', color: 'white' }}
          >
            Go Live
          </Link>
        </div>
      )}

      {/* Replay placeholder */}
      {isEnded && (
        <div
          className="rounded-2xl px-5 py-4 mt-3 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-xs text-white/20 font-medium uppercase tracking-widest">
            🎧 Replay · Coming Soon
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
