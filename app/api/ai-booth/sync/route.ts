/**
 * AI Booth Sync — called by Vercel cron every 2 minutes
 * - Creates AI booth rooms for every live game (one per personality)
 * - Closes AI booth rooms when games end
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PERSONALITIES } from '@/lib/ai-booth/personalities'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LEAGUES = [
  { sport: 'football',   league: 'nfl',                     label: 'NFL' },
  { sport: 'baseball',   league: 'mlb',                     label: 'MLB' },
  { sport: 'basketball', league: 'nba',                     label: 'NBA' },
  { sport: 'hockey',     league: 'nhl',                     label: 'NHL' },
  { sport: 'football',   league: 'college-football',        label: 'CFB' },
]

interface LiveGame {
  espnId: string
  label: string
  homeTeam: string
  awayTeam: string
  status: string
}

async function fetchLiveGames(): Promise<LiveGame[]> {
  const results = await Promise.allSettled(
    LEAGUES.map(async ({ sport, league, label }) => {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`,
        { next: { revalidate: 0 } }
      )
      if (!res.ok) return []
      const data = await res.json()
      return (data.events ?? [])
        .filter((e: any) => {
          const s = e.status?.type?.name ?? ''
          return s.includes('IN_PROGRESS') || s.includes('HALFTIME') || s.includes('END_PERIOD')
        })
        .map((e: any) => {
          const comp = e.competitions?.[0]
          const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
          const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
          return {
            espnId: e.id,
            label,
            homeTeam: home?.team?.displayName ?? 'Home',
            awayTeam: away?.team?.displayName ?? 'Away',
            status: 'live',
          }
        })
    })
  )

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<LiveGame[]>).value)
}

export async function GET() {
  const liveGames = await fetchLiveGames()
  const liveEspnIds = new Set(liveGames.map(g => g.espnId))

  // Get all existing AI booth rooms
  const { data: existingRooms } = await supabase
    .from('broadcast_rooms')
    .select('id, espn_game_id, ai_personality_id, status')
    .eq('is_ai_booth', true)

  const existing = existingRooms ?? []
  const created: string[] = []
  const closed: string[] = []

  // Close AI booths for games that are no longer live
  for (const room of existing) {
    if (room.status === 'live' && room.espn_game_id && !liveEspnIds.has(room.espn_game_id)) {
      await supabase
        .from('broadcast_rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', room.id)
      closed.push(room.id)
    }
  }

  // Create AI booth rooms for new live games
  for (const game of liveGames) {
    for (const personality of PERSONALITIES) {
      // Check if this personality already has a room for this game
      const alreadyExists = existing.some(
        r => r.espn_game_id === game.espnId &&
             r.ai_personality_id === personality.id &&
             r.status === 'live'
      )
      if (alreadyExists) continue

      const title = `${personality.emoji} ${personality.name}'s Booth — ${game.awayTeam} vs ${game.homeTeam}`

      const { data: newRoom, error } = await supabase
        .from('broadcast_rooms')
        .insert({
          title,
          vibe_tag: personality.id,
          status: 'live',
          espn_game_id: `espn-${game.espnId}`,
          is_ai_booth: true,
          ai_personality_id: personality.id,
          broadcaster_id: null,
          livekit_room_name: `ai-${personality.id}-${game.espnId}`,
          listener_count: 0,
        })
        .select('id')
        .single()

      if (!error && newRoom) created.push(newRoom.id)
    }
  }

  return NextResponse.json({
    liveGames: liveGames.length,
    created: created.length,
    closed: closed.length,
    personalities: PERSONALITIES.length,
  })
}
