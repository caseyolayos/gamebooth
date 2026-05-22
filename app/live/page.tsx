import Link from 'next/link'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import RoomCard from '@/components/RoomCard'

const LEAGUE_EMOJI: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', UFC: '🥊', COLLEGE: '🎓',
}

async function getLiveRooms() {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('broadcast_rooms')
      .select(`*, profiles (username, display_name, avatar_emoji, avatar_url)`)
      .eq('status', 'live')
      .order('listener_count', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

async function getTonightGames() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gamebooth.app'
    const res = await fetch(`${baseUrl}/api/games`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    const games: any[] = data.games ?? []
    const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const todayET = new Date(nowET.getFullYear(), nowET.getMonth(), nowET.getDate())
    return games
      .filter((g) => {
        if (g.status === 'live' || g.status === 'delayed') return true
        if (g.status !== 'upcoming') return false
        const d = new Date(new Date(g.start_time).toLocaleString('en-US', { timeZone: 'America/New_York' }))
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() === todayET.getTime()
      })
      .slice(0, 6)
  } catch {
    return []
  }
}

export default async function LivePage() {
  const [rooms, tonightGames] = await Promise.all([getLiveRooms(), getTonightGames()])

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 relative">

      {/* Broadcast control room background layers */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* Orange radial glow — top left */}
        <div style={{
          position: 'absolute', top: -100, left: -80,
          width: 480, height: 400,
          background: 'radial-gradient(ellipse at 25% 25%, rgba(242,135,30,0.10) 0%, rgba(242,135,30,0.03) 40%, transparent 68%)',
        }} />
        {/* Subtle horizontal scan lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.007) 3px, rgba(255,255,255,0.007) 4px)',
        }} />
        {/* Bottom vignette */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: 'linear-gradient(to top, rgba(10,10,15,0.6) 0%, transparent 100%)',
        }} />
      </div>

      {/* Content */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <span className="live-dot inline-block" />
          <h1 className="text-xl font-black" style={{ color: '#FF4500' }}>Live Broadcasts</h1>
          {rooms.length > 0 && (
            <>
              <span className="text-white/40 text-sm">({rooms.length})</span>
              <div className="flex items-end gap-0.5 ml-1" style={{ height: 14 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </>
          )}
        </div>

        {rooms.length > 0 ? (
          <div className="space-y-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room as any} />
            ))}
          </div>
        ) : (
          <div>
            {/* Creator-first empty state */}
            <div className="text-center pt-6 pb-8">
              {/* GB Logo */}
              <div className="mx-auto mb-6" style={{ width: 72, height: 72 }}>
                <Image src="/gblogo.png" alt="GameBooth" width={72} height={72} className="object-contain" />
              </div>

              <h2 className="text-xl font-black mb-2">Nobody&apos;s live yet.</h2>
              <p className="text-white/50 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                Your voice could be the first live booth tonight.
              </p>
              <Link
                href="/go-live"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(242,135,30,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <svg viewBox="0 0 20 22" fill="none" style={{ width: 16, height: 16 }}>
                  <rect x="5" y="1" width="10" height="13" rx="5" stroke="white" strokeWidth="2" />
                  <path d="M2 11c0 4.4 3.6 8 8 8s8-3.6 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <line x1="10" y1="19" x2="10" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Start a Booth
              </Link>
            </div>

            {/* Tonight's games */}
            {tonightGames.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/25">
                    Tonight&apos;s Games
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>
                <div className="space-y-2">
                  {tonightGames.map((game: any) => {
                    const timeStr = game.status === 'live' || game.status === 'delayed'
                      ? null
                      : new Date(game.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short',
                        })
                    return (
                      <Link key={game.id} href={`/games/${game.id}`}>
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-lg">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {game.away_team} <span className="text-white/35">vs</span> {game.home_team}
                            </div>
                          </div>
                          {game.status === 'live' ? (
                            <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500' }}>
                              <span className="live-dot inline-block" style={{ width: 5, height: 5 }} />
                              LIVE
                            </span>
                          ) : (
                            <span className="text-xs text-white/35 flex-shrink-0">{timeStr}</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <p className="text-center text-xs text-white/25 mt-5 font-medium">
                  Be the first booth live tonight.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="h-6" />
    </div>
  )
}
