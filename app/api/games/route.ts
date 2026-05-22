import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LEAGUES = [
  { sport: 'basketball', league: 'nba',                        label: 'NBA',  params: '' },
  { sport: 'football',   league: 'nfl',                        label: 'NFL',  params: '' },
  { sport: 'baseball',   league: 'mlb',                        label: 'MLB',  params: '' },
  { sport: 'hockey',     league: 'nhl',                        label: 'NHL',  params: '' },
  { sport: 'mma',        league: 'ufc',                        label: 'UFC',  params: '' },
  // College — groups=80 = FBS only; groups=50 = D1; limit=25 surfaces marquee matchups
  { sport: 'football',   league: 'college-football',           label: 'CFB',  params: '?groups=80&limit=25' },
  { sport: 'basketball', league: 'mens-college-basketball',    label: 'CBB',  params: '?groups=50&limit=25' },
]

function mapStatus(s: string) {
  if (s.includes('IN_PROGRESS') || s.includes('HALFTIME') || s.includes('END_PERIOD') || s.includes('INTERMISSION')) return 'live'
  if (s.includes('RAIN_DELAY') || s.includes('DELAYED') || s.includes('WEATHER')) return 'delayed'
  if (s.includes('FINAL') || s.includes('COMPLETE')) return 'final'
  return 'upcoming'
}

function mapPeriod(label: string, period: number | undefined, espnStatus: string): string | null {
  if (!period) return null
  if (espnStatus.includes('HALFTIME')) return 'Halftime'
  if (espnStatus.includes('END_PERIOD') || espnStatus.includes('INTERMISSION')) {
    switch (label) {
      case 'NHL': return `End P${period}`
      case 'NBA': return `End Q${period}`
      case 'NFL': return `End Q${period}`
      case 'CFB': return `End Q${period}`
      default: return `End of ${period}`
    }
  }
  switch (label) {
    case 'NBA': return `Q${period}`
    case 'NFL': return period === 5 ? 'OT' : `Q${period}`
    case 'CFB': return period === 5 ? 'OT' : period === 6 ? '2OT' : `Q${period}`
    case 'NHL': return period === 4 ? 'OT' : `P${period}`
    case 'MLB': return `${period % 2 === 1 ? 'Top' : 'Bot'} ${Math.ceil(period / 2)}`
    case 'UFC': return `R${period}`
    // CBB: halves, not quarters
    case 'CBB': return period === 1 ? '1st Half' : period === 2 ? '2nd Half' : period === 3 ? 'OT' : `${period - 2}OT`
    default:    return `${period}`
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    LEAGUES.map(async ({ sport, league, label, params }) => {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard${params}`,
        { next: { revalidate: 30 } }
      )
      if (!res.ok) return []
      const data = await res.json()
      const now = Date.now()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      const fourHours = 4 * 60 * 60 * 1000
      return (data.events ?? []).filter((event: any) => {
        const startMs = new Date(event.date).getTime()
        const status = event.status?.type?.name ?? ''
        // Always include live/final-recent games; for upcoming, only within 7 days
        if (status.includes('IN_PROGRESS') || status.includes('END_PERIOD') || status.includes('HALFTIME')) return true
        if (status.includes('FINAL') || status.includes('COMPLETE')) return (now - startMs) < fourHours
        return (startMs - now) < sevenDays && startMs > now - fourHours
      }).map((event: any) => {
        const comp = event.competitions?.[0]
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
        const espnStatus = event.status?.type?.name ?? ''
        // MLB: use ESPN's own detail string (e.g. "Top 8th") instead of calculating
        const periodLabel = label === 'MLB'
          ? (event.status?.type?.detail ?? event.status?.type?.shortDetail ?? null)
          : mapPeriod(label, event.status?.period, espnStatus)

        return {
          id: `espn-${event.id}`,
          espn_id: event.id,
          league: label,
          home_team: home?.team?.displayName ?? 'Home',
          away_team: away?.team?.displayName ?? 'Away',
          home_team_abbr: home?.team?.abbreviation ?? null,
          away_team_abbr: away?.team?.abbreviation ?? null,
          home_team_logo: home?.team?.logo ?? null,
          away_team_logo: away?.team?.logo ?? null,
          home_score: parseInt(home?.score ?? '0') || 0,
          away_score: parseInt(away?.score ?? '0') || 0,
          status: mapStatus(espnStatus),
          period: periodLabel,
          game_clock: label === 'MLB' ? null : (event.status?.displayClock ?? null),
          start_time: event.date,
          venue: comp?.venue?.fullName ?? null,
          broadcast_count: 0,
        }
      })
    })
  )

  const games = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<any[]>).value)
    .sort((a, b) => {
      // live first, then upcoming, then final
      const order = { live: 0, upcoming: 1, final: 2 }
      return (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1)
    })

  return NextResponse.json({ games }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
  })
}
