import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import BroadcastAudioPlayer from '@/components/BroadcastAudioPlayer'
import VibeBadge from '@/components/VibeBadge'
import FollowButton from '@/components/FollowButton'
import type { Metadata } from 'next'

const LEAGUE_EMOJI: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', UFC: '🥊', CFB: '🏈', CBB: '🏀', COLLEGE: '🎓',
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const db = createServerSupabaseClient()
  const { data: profile } = await db
    .from('profiles')
    .select('username, display_name, bio, avatar_emoji')
    .eq('username', params.username)
    .single()

  if (!profile) return { title: 'Broadcaster Not Found — GameBooth' }

  return {
    title: `${profile.display_name || profile.username} — GameBooth`,
    description: profile.bio || `Listen to ${profile.display_name || profile.username} broadcast live sports commentary on GameBooth.`,
    openGraph: {
      title: `${profile.display_name || profile.username} on GameBooth`,
      description: profile.bio || `${profile.avatar_emoji ?? '🎙️'} Live sports broadcaster`,
      type: 'profile',
    },
  }
}

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const db = createServerSupabaseClient()

  const { data: profile } = await db
    .from('profiles')
    .select('id, username, display_name, avatar_emoji, avatar_url, bio, role, follower_count, total_broadcasts, total_listeners, favorite_teams')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  // Fetch broadcast history
  const { data: broadcasts } = await db
    .from('broadcast_rooms')
    .select('id, title, vibe_tag, listener_count, peak_listeners, recording_url, recording_duration, break_count, ended_at, started_at, espn_game_id, games(league, home_team, away_team)')
    .eq('broadcaster_id', profile.id)
    .in('status', ['ended'])
    .order('ended_at', { ascending: false })
    .limit(20)

  // Check if currently live
  const { data: liveRoom } = await db
    .from('broadcast_rooms')
    .select('id, title, vibe_tag, listener_count')
    .eq('broadcaster_id', profile.id)
    .eq('status', 'live')
    .maybeSingle()

  // Real stats (calculated, not cached profile values)
  const broadcastsWithRecording = (broadcasts ?? []).filter(b => b.recording_url)
  const allBroadcasts = broadcasts ?? []
  const realTotalListeners = allBroadcasts.reduce((s, b) => s + (b.peak_listeners ?? b.listener_count ?? 0), 0)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-32 lg:pb-10">

      {/* Back */}
      <div className="mb-5">
        <Link href="/search" className="text-white/35 hover:text-white/60 text-sm transition-colors">
          ← Search
        </Link>
      </div>

      {/* Profile header */}
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-4xl flex-shrink-0"
            style={{ background: 'rgba(242,135,30,0.15)', border: '2px solid rgba(242,135,30,0.2)' }}
          >
            {profile.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt={profile.display_name ?? ''} className="w-full h-full object-cover" />
              : (profile.avatar_emoji ?? '🎙️')}
          </div>

          {/* Name + follow */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="font-black text-xl leading-tight">
                  {profile.display_name || profile.username}
                </h1>
                <div className="text-sm text-white/40">@{profile.username}</div>
                {profile.role === 'broadcaster' && (
                  <span
                    className="inline-flex items-center gap-1 mt-1 text-[11px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(242,135,30,0.12)', color: '#F2871E' }}
                  >
                    🎙️ Broadcaster
                  </span>
                )}
              </div>
              <FollowButton
                targetUserId={profile.id}
                initialFollowerCount={profile.follower_count ?? 0}
              />
            </div>

            {profile.bio && (
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div className="text-xl font-black">{allBroadcasts.length}</div>
            <div className="text-[11px] text-white/35 mt-0.5">Broadcasts</div>
          </div>
          <div>
            <div className="text-xl font-black">
              {realTotalListeners > 999 ? `${(realTotalListeners / 1000).toFixed(1)}k` : realTotalListeners}
            </div>
            <div className="text-[11px] text-white/35 mt-0.5">Total Listeners</div>
          </div>
          <div>
            <div className="text-xl font-black">{profile.follower_count ?? 0}</div>
            <div className="text-[11px] text-white/35 mt-0.5">Followers</div>
          </div>
        </div>
      </div>

      {/* Currently LIVE badge */}
      {liveRoom && (
        <Link href={`/room/${liveRoom.id}`}>
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{
              background: 'rgba(255,69,0,0.08)',
              border: '1px solid rgba(255,69,0,0.3)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#FF4500' }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white/90 truncate">{liveRoom.title}</div>
              <div className="text-xs text-white/45 mt-0.5 flex items-center gap-1.5">
                <VibeBadge vibe={liveRoom.vibe_tag} />
                <span>· 👂 {liveRoom.listener_count} listening</span>
              </div>
            </div>
            <div
              className="text-xs font-black px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ background: '#FF4500', color: 'white' }}
            >
              Join Live
            </div>
          </div>
        </Link>
      )}

      {/* Favorite sports */}
      {(profile.favorite_teams?.length ?? 0) > 0 && (
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-white/35 mb-2">Follows</div>
          <div className="flex flex-wrap gap-2">
            {profile.favorite_teams!.map((sport: string) => (
              <span key={sport} className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(242,135,30,0.12)', color: '#F2871E' }}>
                {sport}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast replays */}
      {broadcastsWithRecording.length > 0 ? (
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span>🎧</span>
            <h2 className="font-bold text-sm">Broadcast Replays</h2>
            <span className="text-xs text-white/30">{broadcastsWithRecording.length}</span>
          </div>
          <div className="space-y-3">
            {broadcastsWithRecording.map((b) => {
              const game = b.games as any
              const gameLabel = game ? `${game.away_team} vs ${game.home_team}` : undefined
              return (
                <BroadcastAudioPlayer
                  key={b.id}
                  url={b.recording_url!}
                  title={b.title}
                  game={gameLabel}
                  date={b.ended_at ?? undefined}
                  listeners={b.peak_listeners ?? b.listener_count ?? 0}
                  duration={b.recording_duration ?? undefined}
                  breakCount={b.break_count ?? 0}
                />
              )
            })}
          </div>
        </div>
      ) : allBroadcasts.length > 0 ? (
        /* Has broadcasts but no recordings */
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-white/35 mb-3">Recent Broadcasts</div>
          <div className="space-y-2">
            {allBroadcasts.slice(0, 8).map((b) => {
              const game = b.games as any
              return (
                <Link key={b.id} href={`/booth/${b.id}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{b.title}</div>
                      {game && (
                        <div className="text-xs text-white/35 mt-0.5 truncate">
                          {LEAGUE_EMOJI[game.league]} {game.away_team} vs {game.home_team}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-white/30 flex-shrink-0 text-right">
                      <div>{b.peak_listeners ?? b.listener_count ?? 0} 👂</div>
                      {b.ended_at && <div className="mt-0.5">{timeAgo(b.ended_at)}</div>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        /* No broadcasts yet */
        <div
          className="rounded-2xl px-5 py-8 mb-4 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-4xl mb-2">🎙️</div>
          <p className="text-sm font-semibold text-white/50">No broadcasts yet</p>
          <p className="text-xs text-white/30 mt-1">Follow {profile.display_name || profile.username} to get notified when they go live</p>
        </div>
      )}

      {/* CTA — start your own booth */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-3"
        style={{ background: 'rgba(242,135,30,0.06)', border: '1px solid rgba(242,135,30,0.12)' }}
      >
        <div>
          <div className="text-sm font-semibold text-white/65">Want to broadcast too?</div>
          <div className="text-xs text-white/35 mt-0.5">Pick a game and go live in seconds</div>
        </div>
        <Link
          href="/go-live"
          className="text-xs font-black px-4 py-2 rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)', color: 'white' }}
        >
          Go Live
        </Link>
      </div>
    </div>
  )
}
