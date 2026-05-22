import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createAdminClient()
  const { data: room } = await db.from('broadcast_rooms').select('listener_count').eq('id', params.id).single()
  if (room) {
    const newCount = Math.max(0, (room.listener_count ?? 1) - 1)
    await db.from('broadcast_rooms').update({ listener_count: newCount }).eq('id', params.id)
  }
  return NextResponse.json({ ok: true })
}
