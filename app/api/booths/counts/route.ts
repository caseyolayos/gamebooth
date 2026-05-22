import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export const revalidate = 0 // always fresh

export async function GET() {
  try {
    const db = createServerSupabaseClient()
    const { data } = await db
      .from('broadcast_rooms')
      .select('espn_game_id, game_id, listener_count')
      .eq('status', 'live')

    const counts: Record<string, { listeners: number; booths: number }> = {}

    for (const room of data ?? []) {
      const key = room.espn_game_id ?? room.game_id
      if (!key) continue
      if (!counts[key]) counts[key] = { listeners: 0, booths: 0 }
      counts[key].listeners += room.listener_count ?? 0
      counts[key].booths   += 1
    }

    return NextResponse.json(counts, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch {
    return NextResponse.json({})
  }
}
