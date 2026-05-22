import { Room, RoomEvent, ConnectionState } from 'livekit-client'

export interface TokenRequest {
  roomName: string
  participantName: string
  isBroadcaster: boolean
}

export async function getLiveKitToken(req: TokenRequest): Promise<string> {
  const response = await fetch('/api/livekit/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!response.ok) {
    throw new Error('Failed to get LiveKit token')
  }

  const data = await response.json()
  return data.token
}

export function createRoom(): Room {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })
}

export async function connectToRoom(
  room: Room,
  url: string,
  token: string
): Promise<void> {
  await room.connect(url, token)
}

export { RoomEvent, ConnectionState }
