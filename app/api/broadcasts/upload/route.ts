import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

// Service-role client for storage uploads (bypasses RLS)
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://gvxmpqqzzhmmqdgqszls.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2eG1wcXF6emhtbXFkZ3FzemxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE1MDA1NSwiZXhwIjoyMDk0NzI2MDU1fQ.5_rCpIDwp1PTie6vesZNr_dnWPK4_RZGKm0zSgsn-4Q'
)

export async function POST(req: NextRequest) {
  try {
    // Verify caller is authenticated
    const db = createServerSupabaseClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData  = await req.formData()
    const file      = formData.get('file') as File | null
    const roomId    = formData.get('roomId') as string | null
    const duration  = parseInt(formData.get('duration') as string ?? '0')
    const breaks    = parseInt(formData.get('breaks') as string ?? '0')
    const peak      = parseInt(formData.get('peak') as string ?? '0')

    if (!file || !roomId) {
      return NextResponse.json({ error: 'Missing file or roomId' }, { status: 400 })
    }

    const ext  = file.type.includes('mp4') ? 'mp4' : 'webm'
    const path = `${user.id}/${roomId}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await serviceClient.storage
      .from('broadcasts')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = serviceClient.storage
      .from('broadcasts')
      .getPublicUrl(path)

    // Save URL + stats to broadcast_rooms
    await serviceClient.from('broadcast_rooms').update({
      recording_url:      publicUrl,
      recording_duration: duration,
      break_count:        breaks,
      peak_listeners:     peak,
      status:             'ended',
      ended_at:           new Date().toISOString(),
    }).eq('id', roomId)

    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
