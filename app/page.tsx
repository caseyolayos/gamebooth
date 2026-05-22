import Link from 'next/link'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import RoomCard from '@/components/RoomCard'
import { enrichRoomsWithGameData } from '@/lib/enrichRooms'
import LiveBoothCount from '@/components/LiveBoothCount'


const LEAGUE_EMOJI: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', UFC: '🥊', CFB: '🏈', CBB: '🏀', COLLEGE: '🎓',
}

const SPORTS = ['ALL', 'NBA', 'NFL', 'CFB', 'CBB', 'MLB', 'NHL', 'UFC']

interface Game {
  id: string
  league: string
  home_team: string
  away_team: string
  home_team_logo?: string | null
  away_team_logo?: string | null
  home_score: number
  away_score: number
  status: string
  period?: string | null
  game_clock?: string | null
  start_time: string
  totalListeners: number
  boothCount: number
}

async function getLiveRooms() {
  try {
    const db = createServerSupabaseClient()
    const { data } = await db
      .from('broadcast_rooms')
      .select(`*, profiles!left (username, display_name, avatar_emoji, avatar_url), games!left (league, home_team, away_team, status)`)
      .in('status', ['live', 'countdown'])
      .order('listener_count', { ascending: false })
      .limit(8)
    return enrichRoomsWithGameData(data ?? [])
  } catch {
    return []
  }
}

async function getGamesWithAudience(sportFilter: string): Promise<{ live: Game[]; upcoming: Game[] }> {
  let espnGames: any[] = []
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gamebooth.app'
    const res = await fetch(`${baseUrl}/api/games`, { next: { revalidate: 10 } })
    if (res.ok) {
      const data = await res.json()
      espnGames = data.games ?? []
    }
  } catch {}

  const listenersByGame: Record<string, { listeners: number; booths: number }> = {}
  try {
    const db = createServerSupabaseClient()
    const { data: rooms } = await db
      .from('broadcast_rooms')
      .select('espn_game_id, listener_count')
      .eq('status', 'live')

    if (rooms) {
      for (const room of rooms) {
        if (room.espn_game_id) {
          if (!listenersByGame[room.espn_game_id]) {
            listenersByGame[room.espn_game_id] = { listeners: 0, booths: 0 }
          }
          listenersByGame[room.espn_game_id].listeners += room.listener_count ?? 0
          listenersByGame[room.espn_game_id].booths += 1
        }
      }
    }
  } catch {}

  const games: Game[] = espnGames
    .filter((g: any) => sportFilter === 'ALL' || g.league === sportFilter)
    .map((g: any) => ({
      ...g,
      totalListeners: listenersByGame[g.id]?.listeners ?? 0,
      boothCount: listenersByGame[g.id]?.booths ?? 0,
    }))

  const live = games
    .filter(g => g.status === 'live' || g.status === 'delayed')
    .sort((a, b) => b.totalListeners - a.totalListeners || b.boothCount - a.boothCount)

  const upcoming = games
    .filter(g => g.status === 'upcoming')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  return { live, upcoming }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { sport?: string }
}) {
  const activeSport = searchParams.sport ?? 'ALL'
  const [{ live, upcoming }, rooms] = await Promise.all([
    getGamesWithAudience(activeSport),
    getLiveRooms(),
  ])
  const totalListeners = live.reduce((s, g) => s + g.totalListeners, 0)
  const totalBooths = live.reduce((s, g) => s + g.boothCount, 0)

  // ── GAME CARD (shared between mobile + desktop) ──────────────────────────
  const GameCard = ({ game }: { game: Game }) => (
    <Link href={`/games/${game.id}`}>
      <div className="glass rounded-2xl p-4 cursor-pointer transition-all hover:border-white/20 active:scale-[0.99] h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 flex items-center gap-1">
              {game.away_team_logo
                ? <img src={game.away_team_logo} alt={game.away_team} className="w-8 h-8 object-contain" />
                : <span className="text-2xl">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</span>}
              {game.home_team_logo && (
                <img src={game.home_team_logo} alt={game.home_team} className="w-8 h-8 object-contain" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{game.league}</span>
                {game.status === 'delayed' ? (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black"
                    style={{ background: 'rgba(100,150,255,0.15)', color: '#7EB3FF' }}>
                    🌧 DELAYED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black"
                    style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500' }}>
                    <span className="live-dot inline-block" style={{ width: '6px', height: '6px' }} />
                    LIVE
                  </span>
                )}
              </div>
              <div className="font-semibold text-sm text-white/70 truncate">{game.away_team}</div>
              <div className="font-bold text-base truncate">{game.home_team}</div>
              {game.period && (
                <div className="text-xs text-white/40 mt-0.5">
                  {game.period}{game.game_clock ? ` · ${game.game_clock}` : ''}
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-black text-2xl tabular-nums">
              {game.away_score} – {game.home_score}
            </div>
            <LiveBoothCount
              gameId={game.id}
              initialListeners={game.totalListeners}
              initialBooths={game.boothCount}
            />
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <>
      {/* ── DESKTOP LAYOUT (lg+) ── */}
      <div className="hidden lg:block px-6 pt-6 max-w-5xl xl:max-w-6xl">

        {/* Desktop header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Live Now</h1>
            <p className="text-sm text-white/35 mt-0.5">Games with active booths · all times ET</p>
          </div>
          <div className="flex items-center gap-4">
            {totalListeners > 0 && (
              <div className="text-right">
                <div className="text-base font-black" style={{ color: '#F2871E' }}>
                  {totalListeners} listening
                </div>
                <div className="text-xs text-white/30">{totalBooths} booths live</div>
              </div>
            )}
            <Link href="/search"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.6)" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Desktop 2-col: main feed + booths sidebar */}
        <div className="flex gap-6">

          {/* Left: game feed */}
          <div className="flex-1 min-w-0">
            {live.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="live-dot inline-block" />
                  <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#FF4500' }}>
                    Live Games
                  </h2>
                  <div className="flex items-end gap-0.5" style={{ height: '14px' }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-8">
                  {live.map((game) => <GameCard key={game.id} game={game} />)}
                </div>
              </>
            ) : (
              <div className="rounded-2xl px-5 py-8 mb-6 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-4xl mb-3">🏟️</div>
                <p className="text-sm font-semibold text-white/60">No games live right now</p>
                <p className="text-xs text-white/30 mt-1">Check back soon or browse upcoming games</p>
                <Link href="/discover"
                  className="inline-block mt-4 text-xs font-bold px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}>
                  Upcoming Games →
                </Link>
              </div>
            )}

            {/* Upcoming preview on desktop */}
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm uppercase tracking-wider text-white/40">Up Next</h2>
                  <Link href="/discover" className="text-xs font-bold" style={{ color: '#F2871E' }}>
                    See all →
                  </Link>
                </div>
                <div className="space-y-2">
                  {upcoming.slice(0, 5).map((game) => {
                    const timeStr = new Date(game.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short',
                    })
                    return (
                      <div key={game.id}
                        className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all hover:bg-white/5"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {game.away_team_logo
                            ? <img src={game.away_team_logo} alt={game.away_team} className="w-7 h-7 object-contain" />
                            : <span className="text-lg">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</span>}
                          {game.home_team_logo && (
                            <img src={game.home_team_logo} alt={game.home_team} className="w-7 h-7 object-contain" />
                          )}
                        </div>
                        <Link href={`/games/${game.id}`} className="flex-1 min-w-0">
                          <div className="text-sm font-semibold leading-tight">{game.away_team} <span className="text-white/35">vs</span> {game.home_team}</div>
                          <div className="text-xs text-white/35 mt-0.5">{game.league}</div>
                        </Link>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-white/40">{timeStr}</span>
                          <Link href={`/go-live?gameId=${game.id}`}
                            className="text-[10px] font-black px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}>
                            + Booth
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: Live Booths */}
          <div className="w-72 xl:w-80 flex-shrink-0">
            <div
              className="rounded-2xl p-4 sticky top-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {rooms.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-end gap-0.5" style={{ height: 14 }}>
                      {[0,1,2,3].map(i => (
                        <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <h2 className="font-bold text-sm uppercase tracking-wider text-white/50">
                      Live Booths
                    </h2>
                    <span className="text-xs text-white/25">{rooms.length}</span>
                  </div>
                  <div className="space-y-3">
                    {rooms.map((room: any) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                  <Link href="/booths"
                    className="flex items-center justify-center mt-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(242,135,30,0.1)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.2)' }}>
                    All Booths →
                  </Link>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">📡</div>
                  <p className="text-sm font-semibold text-white/50 mb-1">No booths live yet</p>
                  <p className="text-xs text-white/30 mb-4">Be the first to go live tonight</p>
                  <Link href="/go-live"
                    className="inline-block py-2 px-4 rounded-xl text-xs font-black"
                    style={{ background: '#F2871E', color: 'white' }}>
                    🎙️ Start a Booth
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>

      {/* ── MOBILE LAYOUT (< lg) ── */}
      <div className="lg:hidden max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="relative">
            <div
              className="absolute pointer-events-none"
              style={{
                top: '-20px', left: '-24px',
                width: '220px', height: '100px',
                background: 'radial-gradient(ellipse at 40% 50%, rgba(242,135,30,0.28) 0%, rgba(242,135,30,0.08) 45%, transparent 72%)',
                filter: 'blur(18px)',
                animation: 'heroGlow 3.5s ease-in-out infinite',
                zIndex: 0,
              }}
            />
            <div className="relative" style={{ zIndex: 1 }}>
              <Image src="/gameboothlogo-cropped.png" alt="GameBooth" width={148} height={44} className="object-contain rounded-xl" />
              <p className="text-xs text-white/40 mt-1">Mute the TV. Pick Your Booth.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalListeners > 0 && (
              <div className="text-right">
                <div className="text-sm font-black" style={{ color: '#F2871E' }}>
                  {totalListeners} listening
                </div>
                <div className="text-xs text-white/30">{totalBooths} booths live</div>
              </div>
            )}
            <Link href="/search"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.6)" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Sport filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
          {SPORTS.map((sport) => (
            <Link
              key={sport}
              href={sport === 'ALL' ? '/' : `/?sport=${sport}`}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: activeSport === sport ? '#F2871E' : 'rgba(255,255,255,0.06)',
                color: activeSport === sport ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            >
              {sport}
            </Link>
          ))}
        </div>

        {/* Live games */}
        {live.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="live-dot inline-block" />
              <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#FF4500' }}>
                Live Now
              </h2>
              <div className="flex items-end gap-0.5" style={{ height: '14px', marginLeft: '2px' }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {live.map((game) => <GameCard key={game.id} game={game} />)}
            </div>
          </section>
        )}

        {/* Live Booths */}
        {rooms.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-end gap-0.5" style={{ height: 14 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <h2 className="font-bold text-sm uppercase tracking-wider text-white/50">
                Live Booths
              </h2>
              <span className="text-xs text-white/25">{rooms.length}</span>
            </div>
            <div className="space-y-3">
              {rooms.map((room: any) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </section>
        )}

        {live.length === 0 && rooms.length === 0 && (
          <div className="rounded-2xl px-5 py-5 mb-5 flex items-center justify-between gap-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-sm font-semibold text-white/60">Nothing live right now</p>
              <p className="text-xs text-white/30 mt-0.5">See tonight&apos;s upcoming games in Discover</p>
            </div>
            <Link href="/discover"
              className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}>
              Discover →
            </Link>
          </div>
        )}

        <div className="text-center pb-2">
          <Link href="/about" className="text-xs text-white/20 hover:text-white/40 transition-colors underline">
            What is GameBooth?
          </Link>
        </div>
        <div className="h-6" />
      </div>
    </>
  )
}
