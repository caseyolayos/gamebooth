import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import RoomCard from '@/components/RoomCard'
import { enrichRoomsWithGameData } from '@/lib/enrichRooms'

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
  status: string
  start_time: string
}

async function getUpcomingGames(sportFilter: string): Promise<Game[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gamebooth.app'
    const res = await fetch(`${baseUrl}/api/games`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.games ?? [])
      .filter((g: any) =>
        g.status === 'upcoming' &&
        (sportFilter === 'ALL' || g.league === sportFilter)
      )
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  } catch {
    return []
  }
}

async function getRecentRooms() {
  try {
    const db = createServerSupabaseClient()
    const { data } = await db
      .from('broadcast_rooms')
      .select(`*, profiles (username, display_name, avatar_emoji, avatar_url), games (league, home_team, away_team, status)`)
      .in('status', ['live', 'ended'])
      .order('started_at', { ascending: false })
      .limit(8)
    return enrichRoomsWithGameData(data ?? [])
  } catch {
    return []
  }
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { sport?: string }
}) {
  const activeSport = searchParams.sport ?? 'ALL'
  const [upcoming, recentRooms] = await Promise.all([
    getUpcomingGames(activeSport),
    getRecentRooms(),
  ])

  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const todayET = new Date(nowET.getFullYear(), nowET.getMonth(), nowET.getDate())
  const tomorrowET = new Date(todayET.getTime() + 86400000)

  const getDayLabel = (startTime: string) => {
    const d = new Date(new Date(startTime).toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const gameDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (gameDate.getTime() === todayET.getTime()) return 'Tonight'
    if (gameDate.getTime() === tomorrowET.getTime()) return 'Tomorrow'
    return gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
  }

  const groups: { label: string; games: Game[] }[] = []
  for (const game of upcoming) {
    const label = getDayLabel(game.start_time)
    const existing = groups.find(g => g.label === label)
    if (existing) existing.games.push(game)
    else groups.push({ label, games: [game] })
  }

  const liveRooms = recentRooms.filter((r: any) => r.status === 'live')
  const endedRooms = recentRooms.filter((r: any) => r.status === 'ended')

  // Shared upcoming game row component
  const GameRow = ({ game }: { game: Game }) => {
    const timeStr = new Date(game.start_time).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short',
    })
    return (
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all hover:bg-white/5"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {game.away_team_logo
            ? <img src={game.away_team_logo} alt={game.away_team} className="w-7 h-7 object-contain" />
            : <span className="text-xl">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</span>}
          {game.home_team_logo && (
            <img src={game.home_team_logo} alt={game.home_team} className="w-7 h-7 object-contain" />
          )}
        </div>
        <Link href={`/games/${game.id}`} className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight">{game.away_team}</div>
          <div className="text-xs text-white/50 mt-0.5">vs {game.home_team}</div>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-white/40">{timeStr}</span>
          <Link
            href={`/go-live?gameId=${game.id}`}
            className="text-[10px] font-black px-2 py-1 rounded-lg"
            style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}
          >
            + Booth
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── DESKTOP LAYOUT (lg+) ── */}
      <div className="hidden lg:block px-6 pt-6 max-w-5xl xl:max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black">Discover</h1>
          <p className="text-sm text-white/35 mt-0.5">Upcoming games · Featured booths</p>
        </div>

        {/* Desktop 2-col */}
        <div className="flex gap-6">
          {/* Left: upcoming games */}
          <div className="flex-1 min-w-0">
            {groups.length > 0 ? (
              groups.map(group => (
                <div key={group.label} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/30">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <div className="space-y-2">
                    {group.games.map(game => <GameRow key={game.id} game={game} />)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-white/30 text-sm">
                <div className="text-4xl mb-3">📅</div>
                No upcoming games found
                {activeSport !== 'ALL' && (
                  <Link href="/discover" className="block mt-2 text-xs" style={{ color: '#F2871E' }}>
                    Clear filter
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar: trending + recent booths */}
          <div className="w-72 xl:w-80 flex-shrink-0">
            <div
              className="rounded-2xl p-4 sticky top-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {liveRooms.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="live-dot inline-block" />
                    <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#FF4500' }}>
                      Trending Now
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {liveRooms.map((room: any) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )}

              {endedRooms.length > 0 && (
                <div>
                  <h2 className="font-bold text-sm uppercase tracking-wider text-white/35 mb-3">
                    Recent Booths
                  </h2>
                  <div className="space-y-3">
                    {endedRooms.slice(0, 4).map((room: any) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )}

              {liveRooms.length === 0 && endedRooms.length === 0 && (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">📡</div>
                  <p className="text-sm text-white/40">No booths yet tonight</p>
                  <Link href="/go-live"
                    className="inline-block mt-3 py-2 px-4 rounded-xl text-xs font-black"
                    style={{ background: '#F2871E', color: 'white' }}>
                    🎙️ Go Live First
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
        <div className="mb-5">
          <h1 className="text-xl font-black">Discover</h1>
          <p className="text-xs text-white/35 mt-0.5">Upcoming games · Featured booths · Browse</p>
        </div>

        {/* Sport filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
          {SPORTS.map((sport) => (
            <Link
              key={sport}
              href={sport === 'ALL' ? '/discover' : `/discover?sport=${sport}`}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: activeSport === sport ? '#F2871E' : 'rgba(255,255,255,0.06)',
                color: activeSport === sport ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            >
              {sport === 'ALL' ? 'All' : `${LEAGUE_EMOJI[sport]} ${sport}`}
            </Link>
          ))}
        </div>

        {liveRooms.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="live-dot inline-block" />
              <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#FF4500' }}>
                Trending Now
              </h2>
            </div>
            <div className="space-y-3">
              {liveRooms.map((room: any) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </section>
        )}

        {groups.length > 0 ? (
          <section className="mb-6">
            <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-3">
              Upcoming Games
            </h2>
            {groups.map(group => (
              <div key={group.label} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/25">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div className="space-y-2">
                  {group.games.map(game => <GameRow key={game.id} game={game} />)}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div className="text-center py-12 text-white/30 text-sm">
            No upcoming games found
            {activeSport !== 'ALL' && (
              <Link href="/discover" className="block mt-2 text-xs" style={{ color: '#F2871E' }}>
                Clear filter
              </Link>
            )}
          </div>
        )}

        {endedRooms.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-3">
              Recent Booths
            </h2>
            <div className="space-y-3">
              {endedRooms.map((room: any) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </section>
        )}

        <div className="h-6" />
      </div>
    </>
  )
}
