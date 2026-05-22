import { createServerSupabaseClient } from '@/lib/supabaseServer'
import RoomCard from '@/components/RoomCard'
import GameScoreboard from '@/components/GameScoreboard'
import Link from 'next/link'

async function getGame(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase.from('games').select('*').eq('id', id).single()
    if (data) return data
  } catch {}

  if (id.startsWith('espn-')) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gamebooth.app'
      const res = await fetch(`${baseUrl}/api/games`, { next: { revalidate: 0 } })
      if (res.ok) {
        const { games } = await res.json()
        const match = games.find((g: any) => g.id === id)
        if (match) return match
      }
    } catch {}
  }
  return null
}

async function getRooms(gameId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const isEspn   = gameId.startsWith('espn-')
    const isUuid   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gameId)

    let q = supabase
      .from('broadcast_rooms')
      .select(`*, profiles (username, display_name, avatar_emoji)`)
      .in('status', ['live', 'countdown'])
      .order('listener_count', { ascending: false })

    if (isEspn)       q = q.eq('espn_game_id', gameId)
    else if (isUuid)  q = q.eq('game_id', gameId)

    const { data } = await q
    return data ?? []
  } catch { return [] }
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const [game, rooms] = await Promise.all([getGame(params.id), getRooms(params.id)])

  if (!game) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 text-center">
        <div className="text-5xl mb-4">🏟️</div>
        <h1 className="text-xl font-bold mb-2">Game not found</h1>
        <Link href="/" className="text-sm" style={{ color: '#F2871E' }}>← Back to games</Link>
      </div>
    )
  }

  const isLive = game.status === 'live'

  return (
    <>
      {/* ── DESKTOP LAYOUT (lg+) ── */}
      <div className="hidden lg:block px-6 pt-6 max-w-5xl xl:max-w-6xl">
        <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 mb-5">
          ← Games
        </Link>

        <div className="flex gap-6">
          {/* Left: scoreboard + booth list */}
          <div className="flex-1 min-w-0">
            <GameScoreboard game={game} liveBoothCount={rooms.length} />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-base text-white">
                  {rooms.length > 0 ? `${rooms.length} Live Booth${rooms.length !== 1 ? 's' : ''}` : 'No Booths Yet'}
                </h2>
                {isLive && rooms.length === 0 && (
                  <p className="text-xs text-white/35 mt-0.5">Be the first to call this game</p>
                )}
              </div>
            </div>

            {rooms.length === 0 ? (
              <div
                className="rounded-2xl p-10 text-center mb-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
              >
                <div className="text-4xl mb-3">🎙️</div>
                <h3 className="font-bold text-white mb-1">No booths live yet</h3>
                <p className="text-sm text-white/40 mb-5">
                  {isLive ? 'The game is live — be the first to call it.' : 'Start a booth and build an audience before the game begins.'}
                </p>
                <Link
                  href={`/go-live?gameId=${params.id}`}
                  className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
                  style={{ background: '#F2871E', color: 'white' }}
                >
                  Start a Booth →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-6">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room as any} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar: Go Live CTA */}
          <div className="w-72 xl:w-80 flex-shrink-0">
            <div
              className="rounded-2xl p-5 sticky top-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-center mb-5">
                <div className="text-4xl mb-2">🎙️</div>
                <h3 className="font-bold text-base mb-1">Start Your Booth</h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  {isLive
                    ? 'The game is live. Go live now and pick up listeners instantly.'
                    : 'Set up your booth early and build your audience before tip-off.'}
                </p>
              </div>

              <Link
                href={`/go-live?gameId=${params.id}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-sm transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(242,135,30,0.3)',
                }}
              >
                🎙️ Go Live for This Game
              </Link>

              {rooms.length > 0 && (
                <div
                  className="mt-4 p-3 rounded-xl text-center"
                  style={{ background: 'rgba(242,135,30,0.06)', border: '1px solid rgba(242,135,30,0.12)' }}
                >
                  <div className="text-lg font-black" style={{ color: '#F2871E' }}>
                    {rooms.reduce((s: number, r: any) => s + (r.listener_count ?? 0), 0)}
                  </div>
                  <div className="text-xs text-white/40">listeners active right now</div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {[
                  { icon: '⚡', text: isLive ? 'Listeners join immediately' : 'Early booths get more listeners' },
                  { icon: '🎭', text: 'Pick your vibe — homer, analysis, comedy...' },
                  { icon: '📡', text: 'Free to broadcast, always' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-2 text-xs text-white/45">
                    <span className="flex-shrink-0 mt-0.5">{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>

      {/* ── MOBILE LAYOUT (< lg) ── */}
      <div className="lg:hidden max-w-lg mx-auto px-4 pt-5">
        <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 mb-5">
          ← Games
        </Link>

        <GameScoreboard game={game} liveBoothCount={rooms.length} />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-black text-base text-white">
              {rooms.length > 0 ? `${rooms.length} Live Booth${rooms.length !== 1 ? 's' : ''}` : 'No Booths Yet'}
            </h2>
            {isLive && rooms.length === 0 && (
              <p className="text-xs text-white/35 mt-0.5">Be the first to call this game</p>
            )}
          </div>
          <Link
            href={`/go-live?gameId=${params.id}`}
            className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-all"
            style={{ background: '#F2871E', color: 'white' }}
          >
            🎙️ Go Live
          </Link>
        </div>

        {rooms.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center mb-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
          >
            <div className="text-4xl mb-3">🎙️</div>
            <h3 className="font-bold text-white mb-1">No booths live yet</h3>
            <p className="text-sm text-white/40 mb-5">
              {isLive ? 'The game is live — be the first to call it.' : 'Start a booth and build an audience before the game begins.'}
            </p>
            <Link
              href={`/go-live?gameId=${params.id}`}
              className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: '#F2871E', color: 'white' }}
            >
              Start a Booth →
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room as any} />
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </>
  )
}
