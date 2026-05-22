import { NextResponse } from 'next/server'
import { createServerSupabaseClient as createServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const LEAGUES = [
  { key: 'nba',  sport: 'basketball', league: 'nba',              label: 'NBA' },
  { key: 'nfl',  sport: 'football',   league: 'nfl',              label: 'NFL' },
  { key: 'mlb',  sport: 'baseball',   league: 'mlb',              label: 'MLB' },
  { key: 'nhl',  sport: 'hockey',     league: 'nhl',              label: 'NHL' },
  { key: 'ufc',  sport: 'mma',        league: 'ufc',              label: 'UFC' },
]

interface ESPNEvent {
  id: string
  name: string
  date: string
  status: {
    type: { name: string; description: string; completed: boolean }
    displayClock?: string
    period?: number
  }
  competitions: Array<{
    venue?: { fullName?: string }
    competitors: Array<{
      homeAway: 'home' | 'away'
      team: { displayName: string; abbreviation: string }
      score?: string
    }>
  }>
}

function mapStatus(espnStatus: string): string {
  if (espnStatus.includes('IN_PROGRESS') || espnStatus.includes('HALFTIME')) return 'live'
  if (espnStatus.includes('FINAL') || espnStatus.includes('COMPLETE')) return 'final'
  return 'upcoming'
}

function mapPeriod(label: string, period: number | undefined, espnStatus: string): string | null {
  if (!period) return null
  if (espnStatus.includes('HALFTIME')) return 'Halftime'
  switch (label) {
    case 'NBA': return `Q${period}`
    case 'NFL': return period === 5 ? 'OT' : `Q${period}`
    case 'NHL': return `P${period}`
    case 'MLB': return `${period % 2 === 1 ? 'Top' : 'Bot'} ${Math.ceil(period / 2)}`
    case 'UFC': return `R${period}`
    default:    return `${period}`
  }
}

function normalizeEvent(event: ESPNEvent, label: string) {
  const comp = event.competitions[0]
  const home = comp?.competitors?.find(c => c.homeAway === 'home')
  const away = comp?.competitors?.find(c => c.homeAway === 'away')
  const espnStatus = event.status.type.name

  return {
    espn_id: event.id,
    league: label,
    home_team: home?.team.displayName ?? 'Home',
    away_team: away?.team.displayName ?? 'Away',
    home_score: parseInt(home?.score ?? '0') || 0,
    away_score: parseInt(away?.score ?? '0') || 0,
    status: mapStatus(espnStatus),
    period: mapPeriod(label, event.status.period, espnStatus),
    game_clock: event.status.displayClock ?? null,
    start_time: event.date,
    venue: comp?.venue?.fullName ?? null,
  }
}

export async function GET() {
  const db = createServerClient()
  const results: Record<string, number> = {}

  for (const { sport, league, label } of LEAGUES) {
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`,
        { next: { revalidate: 0 } }
      )
      if (!res.ok) continue
      const data = await res.json()
      const events: ESPNEvent[] = data.events ?? []

      if (events.length === 0) { results[label] = 0; continue }

      const rows = events.map(e => normalizeEvent(e, label))

      const { error } = await db
        .from('games')
        .upsert(rows, { onConflict: 'espn_id', ignoreDuplicates: false })

      results[label] = error ? -1 : rows.length
    } catch {
      results[label] = -1
    }
  }

  return NextResponse.json({ synced: results, ts: new Date().toISOString() })
}
