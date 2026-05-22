import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createAdminClient()
  const { error } = await db.rpc('increment_listener_count', { room_id: params.id })
  if (error) {
    // Fallback: manual increment
    const { data: room } = await db.from('broadcast_rooms').select('listener_count').eq('id', params.id).single()
    if (room) {
      await db.from('broadcast_rooms').update({ listener_count: (room.listener_count ?? 0) + 1 }).eq('id', params.id)
    }
  }
  return NextResponse.json({ ok: true })
}
