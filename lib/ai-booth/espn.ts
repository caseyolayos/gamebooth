// ESPN unofficial play-by-play API helper
// Maps league labels to ESPN sport/league slugs

const ESPN_SLUGS: Record<string, { sport: string; league: string }> = {
  NFL: { sport: 'football', league: 'nfl' },
  NBA: { sport: 'basketball', league: 'nba' },
  MLB: { sport: 'baseball', league: 'mlb' },
  NHL: { sport: 'hockey', league: 'nhl' },
  CFB: { sport: 'football', league: 'college-football' },
  CBB: { sport: 'basketball', league: 'mens-college-basketball' },
}

export interface ESPNPlay {
  id: string
  sequenceNumber: string
  text: string           // human-readable play description
  period: number
  clock: string
  scoringPlay: boolean
  homeScore?: number
  awayScore?: number
  team?: string
}

export interface ESPNGameSummary {
  gameId: string
  status: string         // 'in', 'post', 'pre'
  period: number
  clock: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  plays: ESPNPlay[]
  lastUpdated: number
}

export async function getGameSummary(espnGameId: string, leagueLabel: string): Promise<ESPNGameSummary | null> {
  const slug = ESPN_SLUGS[leagueLabel]
  if (!slug) return null

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${slug.sport}/${slug.league}/summary?event=${espnGameId}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const data = await res.json()

    const header = data.header
    const comp = header?.competitions?.[0]
    const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
    const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
    const statusType = comp?.status?.type

    // Extract plays from the plays array
    const rawPlays: any[] = data.plays ?? []
    const plays: ESPNPlay[] = rawPlays.map((p: any) => ({
      id: String(p.id ?? p.sequenceNumber ?? Math.random()),
      sequenceNumber: String(p.sequenceNumber ?? ''),
      text: p.text ?? p.alternativeText ?? '',
      period: p.period?.number ?? 0,
      clock: p.clock?.displayValue ?? '',
      scoringPlay: p.scoringPlay ?? false,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      team: p.team?.displayName ?? undefined,
    })).filter(p => p.text.length > 5)

    return {
      gameId: espnGameId,
      status: statusType?.state ?? 'pre',  // 'in', 'post', 'pre'
      period: comp?.status?.period ?? 0,
      clock: comp?.status?.displayClock ?? '',
      homeTeam: home?.team?.displayName ?? 'Home',
      awayTeam: away?.team?.displayName ?? 'Away',
      homeScore: parseInt(home?.score ?? '0') || 0,
      awayScore: parseInt(away?.score ?? '0') || 0,
      plays,
      lastUpdated: Date.now(),
    }
  } catch (err) {
    console.error('ESPN fetch error:', err)
    return null
  }
}

// Returns only plays newer than the last seen sequence number
export function getNewPlays(plays: ESPNPlay[], lastSeenSequence: string): ESPNPlay[] {
  if (!lastSeenSequence) return plays.slice(-3) // first time: grab last 3 plays
  const lastIdx = plays.findIndex(p => p.sequenceNumber === lastSeenSequence)
  if (lastIdx === -1) return []
  return plays.slice(lastIdx + 1)
}
