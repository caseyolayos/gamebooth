'use client'

import { useState, useEffect, useCallback } from 'react'
import { Room, RoomEvent, Track } from 'livekit-client'
import { getLiveKitToken, createRoom } from '@/lib/livekit'

type PlayerState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

interface AudioPlayerProps {
  roomId: string
  livekitRoomName: string
  participantName: string
  isBroadcaster?: boolean
  micMuted?: boolean
}

export default function AudioPlayer({
  roomId,
  livekitRoomName,
  participantName,
  isBroadcaster = false,
  micMuted = false,
}: AudioPlayerProps) {
  const [state, setState] = useState<PlayerState>('idle')
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setState('connecting')
    setError(null)

    try {
      const token = await getLiveKitToken({
        roomName: livekitRoomName,
        participantName,
        isBroadcaster,
      })

      const url = process.env.NEXT_PUBLIC_LIVEKIT_URL
      if (!url) throw new Error('LiveKit URL not configured')

      const newRoom = createRoom()

      newRoom.on(RoomEvent.Disconnected, () => setState('disconnected'))
      newRoom.on(RoomEvent.Connected, () => setState('connected'))
      newRoom.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          track.attach()
        }
      })

      await newRoom.connect(url, token)

      if (isBroadcaster) {
        await newRoom.localParticipant.setMicrophoneEnabled(true)
      } else {
        // Track listener join
        fetch(`/api/rooms/${roomId}/join`, { method: 'POST' }).catch(() => {})
      }

      setRoom(newRoom)
      setState('connected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setState('error')
    }
  }, [livekitRoomName, participantName, isBroadcaster])

  const disconnect = useCallback(async () => {
    if (room) {
      await room.disconnect()
      setRoom(null)
      if (!isBroadcaster) {
        fetch(`/api/rooms/${roomId}/leave`, { method: 'POST' }).catch(() => {})
      }
    }
    setState('disconnected')
  }, [room, isBroadcaster, roomId])

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect()
        if (!isBroadcaster) {
          fetch(`/api/rooms/${roomId}/leave`, { method: 'POST' }).catch(() => {})
        }
      }
    }
  }, [room, isBroadcaster, roomId])

  // Auto-connect broadcaster immediately — they already committed to going live
  useEffect(() => {
    if (isBroadcaster) connect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mute/unmute LiveKit mic track when commercial break toggles
  useEffect(() => {
    if (!room || !isBroadcaster) return
    room.localParticipant.setMicrophoneEnabled(!micMuted).catch(() => {})
  }, [micMuted, room, isBroadcaster])

  const isConnected = state === 'connected'

  if (isBroadcaster) {
    if (state === 'idle' || state === 'connecting') {
      return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl glass">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#F2871E' }} />
          <span className="text-sm text-white/50">Connecting mic...</span>
        </div>
      )
    }
    if (state === 'error' || state === 'disconnected') {
      return (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.3)' }}>
          {error && <p className="text-sm text-white/60 mb-3">{error}</p>}
          <button
            onClick={connect}
            className="w-full py-2.5 rounded-xl font-bold text-sm"
            style={{ background: '#F2871E', color: 'white' }}
          >
            Reconnect Mic
          </button>
        </div>
      )
    }
    // Connected — render nothing; RoomView owns all broadcaster UI
    return null
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <button
        onClick={isConnected ? disconnect : connect}
        disabled={state === 'connecting'}
        className="w-28 h-28 rounded-full flex items-center justify-center text-5xl transition-all disabled:opacity-50"
        style={{
          background: isConnected
            ? 'rgba(242,135,30,0.2)'
            : 'rgba(255,255,255,0.05)',
          border: isConnected
            ? '3px solid #F2871E'
            : '3px solid rgba(255,255,255,0.15)',
          boxShadow: isConnected ? '0 0 30px rgba(242,135,30,0.3)' : 'none',
        }}
      >
        {state === 'connecting' ? '⏳' : isConnected ? '⏸' : '▶️'}
      </button>

      <div className="text-center">
        <div className="font-semibold text-sm">
          {state === 'idle' && 'Tap to listen'}
          {state === 'connecting' && 'Connecting...'}
          {state === 'connected' && 'Listening live'}
          {state === 'disconnected' && 'Disconnected — tap to rejoin'}
          {state === 'error' && 'Connection failed'}
        </div>
        {error && <p className="text-xs mt-1" style={{ color: '#FF4500' }}>{error}</p>}
      </div>
    </div>
  )
}
