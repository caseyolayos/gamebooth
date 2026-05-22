import { createServerSupabaseClient } from '@/lib/supabaseServer'
import RoomView from './RoomView'

async function getRoom(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('broadcast_rooms')
      .select(`*, profiles (username, display_name, avatar_emoji, bio), games (*)`)
      .eq('id', id)
      .single()
    if (data) return data
  } catch {}
  return null
}

async function getSyncMarker(roomId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('sync_markers')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return data
  } catch {}
  return null
}

async function getEspnGameData(room: any): Promise<{ scheduledStart: string | null; espnGame: any | null }> {
  if (!room.espn_game_id) return { scheduledStart: null, espnGame: null }
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gamebooth.app'
    const res = await fetch(`${baseUrl}/api/games`, { cache: 'no-store' })
    const data = await res.json()
    const espnGame = (data.games ?? []).find((g: any) => g.id === room.espn_game_id) ?? null
    const scheduledStart = room.status === 'countdown' && espnGame?.start_time ? espnGame.start_time : null
    return { scheduledStart, espnGame }
  } catch {
    return { scheduledStart: null, espnGame: null }
  }
}

export default async function RoomPage({ params }: { params: { id: string } }) {
  const room = await getRoom(params.id)
  const syncMarker = await getSyncMarker(params.id)

  if (!room) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 text-center">
        <div className="text-5xl mb-4">🎙️</div>
        <h1 className="text-xl font-bold mb-2">Booth not found</h1>
        <a href="/" className="text-sm" style={{ color: '#F2871E' }}>← Back to live</a>
      </div>
    )
  }

  const { scheduledStart, espnGame } = await getEspnGameData(room)
  return <RoomView room={room} syncMarker={syncMarker} scheduledStart={scheduledStart} espnGame={espnGame} />
}
