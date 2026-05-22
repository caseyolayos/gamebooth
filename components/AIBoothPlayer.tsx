'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { PERSONALITIES } from '@/lib/ai-booth/personalities'

interface Commentary {
  id: string
  text: string
  audioUrl: string | null
  personalityId: string
  personalityName: string
  personalityEmoji: string
  playText: string
  isScoringPlay: boolean
}

interface AIBoothPlayerProps {
  gameId: string
  espnId: string
  league: string
  roomId: string
  personalityId: string
  onPersonalityChange: (id: string) => void
  isPrimary: boolean  // only one listener should poll; others receive via realtime
}

const POLL_INTERVAL_MS = 22000 // poll every 22 seconds

export default function AIBoothPlayer({
  gameId, espnId, league, roomId, personalityId, onPersonalityChange, isPrimary
}: AIBoothPlayerProps) {
  const [commentary, setCommentary] = useState<Commentary | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [log, setLog] = useState<Commentary[]>([])
  const [, setScore] = useState<{ home: number; away: number; period: number; clock: string } | null>(null)
  const lastSeenRef = useRef<string>('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = getSupabaseClient()

  const playCommentary = useCallback((item: Commentary) => {
    setCommentary(item)
    setLog(prev => [item, ...prev].slice(0, 10))

    if (item.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      const audio = new Audio(item.audioUrl)
      audioRef.current = audio
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.onerror = () => setIsPlaying(false)
      audio.play().catch(() => {})
    }
  }, [])

  // Poll ESPN + generate commentary (only the "primary" listener does this)
  const poll = useCallback(async () => {
    if (!isPrimary) return
    try {
      const res = await fetch(`/api/ai-booth/${gameId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalityId,
          lastSeenSequence: lastSeenRef.current,
          espnId,
          league,
          roomId,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.lastSeenSequence) lastSeenRef.current = data.lastSeenSequence
      if (data.score) setScore(data.score)
      if (data.commentary) playCommentary(data.commentary)
    } catch (err) {
      console.error('AI Booth poll error:', err)
    }
  }, [isPrimary, gameId, personalityId, espnId, league, roomId, playCommentary])

  // Subscribe to realtime commentary from Supabase (all listeners get this)
  useEffect(() => {
    const channel = supabase
      .channel(`ai-commentary:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_commentary',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const row = payload.new as any
        // Don't double-play if we're the primary and already played it
        if (isPrimary) return
        playCommentary({
          id: row.id,
          text: row.text,
          audioUrl: row.audio_url,
          personalityId: row.personality_id,
          personalityName: row.personality_name,
          personalityEmoji: row.personality_emoji,
          playText: row.play_text,
          isScoringPlay: row.is_scoring_play,
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase, isPrimary, playCommentary])

  // Start polling if primary
  useEffect(() => {
    if (!isPrimary) return
    poll() // immediate first poll
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [isPrimary, poll])

  const personality = PERSONALITIES.find(p => p.id === personalityId)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">{personality?.emoji ?? '🤖'}</span>
          <div>
            <div className="text-xs font-black uppercase tracking-wider" style={{ color: personality?.color ?? '#F2871E' }}>
              AI BOOTH — {personality?.name ?? 'AI Commentator'}
            </div>
            <div className="text-[10px] text-white/30">{personality?.description}</div>
          </div>
        </div>
        {isPlaying && (
          <div className="flex items-end gap-0.5 px-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.15}s`, background: personality?.color ?? '#F2871E' }} />
            ))}
          </div>
        )}
      </div>

      {/* Current commentary */}
      {commentary ? (
        <div className="px-4 py-3">
          {commentary.isScoringPlay && (
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: personality?.color ?? '#F2871E' }}>
              🚨 Scoring Play
            </div>
          )}
          <p className="text-sm leading-relaxed text-white/80 mb-1">&ldquo;{commentary.text}&rdquo;</p>
          <p className="text-[11px] text-white/25 truncate">↳ {commentary.playText}</p>
        </div>
      ) : (
        <div className="px-4 py-5 text-center">
          <div className="text-2xl mb-1">{personality?.emoji ?? '🤖'}</div>
          <div className="text-xs text-white/30">Warming up the booth...</div>
        </div>
      )}

      {/* Personality switcher */}
      <div className="px-4 pb-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Switch Booth</div>
        <div className="flex flex-wrap gap-1.5">
          {PERSONALITIES.map(p => (
            <button
              key={p.id}
              onClick={() => onPersonalityChange(p.id)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
              style={{
                background: personalityId === p.id ? p.color + '25' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${personalityId === p.id ? p.color + '60' : 'rgba(255,255,255,0.08)'}`,
                color: personalityId === p.id ? p.color : 'rgba(255,255,255,0.4)',
              }}
            >
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Recent log */}
      {log.length > 1 && (
        <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Recent</div>
          {log.slice(1, 4).map(item => (
            <p key={item.id} className="text-[11px] text-white/25 line-clamp-1">
              {item.personalityEmoji} &ldquo;{item.text}&rdquo;
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
