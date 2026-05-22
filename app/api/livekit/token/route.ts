import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
  const { roomName, participantName, isBroadcaster } = await req.json()

  if (!roomName || !participantName) {
    return NextResponse.json({ error: 'roomName and participantName are required' }, { status: 400 })
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit not configured' }, { status: 500 })
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl: '4h',
  })

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isBroadcaster === true,
    canSubscribe: true,
    canPublishData: true,
  })

  const token = await at.toJwt()

  return NextResponse.json({ token })
}
