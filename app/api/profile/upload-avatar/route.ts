import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
  }

  const db = createAdminClient()
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${user.id}/avatar.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await db.storage
    .from('avatars')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage.from('avatars').getPublicUrl(path)

  // Cache bust
  const avatarUrl = `${publicUrl}?t=${Date.now()}`

  // Save to profile
  await db.from('profiles').upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: 'id' })

  return NextResponse.json({ avatarUrl })
}
