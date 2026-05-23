'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import AudioPlayer from '@/components/AudioPlayer'
import SyncPanel from '@/components/SyncPanel'
import ChatPanel from '@/components/ChatPanel'
import VibeBadge from '@/components/VibeBadge'
import VolumeMeter from '@/components/VolumeMeter'
import BroadcastTips from '@/components/BroadcastTips'
import BroadcastDebrief from '@/components/BroadcastDebrief'
import { useRecording } from '@/hooks/useRecording'
// import AIBoothPlayer from '@/components/AIBoothPlayer' // AI Booth paused

interface RoomViewProps {
  room: any
  syncMarker: any
  scheduledStart?: string | null
  espnGame?: any | null
}

function formatCountdown(ms: number) {
  const total = Math.max(0, ms)
  const h = Math.floor(total / 3600000)
  const m = Math.floor((total % 3600000) / 60000)
  const s = Math.floor((total % 60000) / 1000)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Resolves on the client after mount — avoids double-mounting components
// via CSS hidden/show tricks that keep both DOM trees alive simultaneously.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

const LEAGUE_EMOJI: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', UFC: '🥊', CFB: '🏈', CBB: '🏀', COLLEGE: '🎓',
}

export default function RoomView({ room, syncMarker: initialSyncMarker, scheduledStart, espnGame }: RoomViewProps) {
  const { user } = useAuth()
  const isDesktop = useIsDesktop()
  const [offsetMs, setOffsetMs] = useState(0)
  const [syncMarker, setSyncMarker] = useState(initialSyncMarker)
  const [roomStatus, setRoomStatus] = useState<string>(room.status ?? 'live')
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    scheduledStart ? Math.max(0, new Date(scheduledStart).getTime() - Date.now()) : 0
  )
  const [listenerCount, setListenerCount] = useState(room.listener_count ?? 0)
  const [showSetMarkerModal, setShowSetMarkerModal] = useState(false)
  const [markerPeriod, setMarkerPeriod] = useState(room.games?.period ?? '')
  const [markerClock, setMarkerClock] = useState(room.games?.game_clock ?? '')
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)
  const [debriefData, setDebriefData] = useState<{ recordingUrl: string | null; peakListeners: number } | null>(null)
  const peakListenersRef = useRef(0)
  // const [isPrimaryPoller, setIsPrimaryPoller] = useState(false) // AI Booth paused

  const recording = useRecording(room.id, user?.id ?? '')

  const supabase = getSupabaseClient()
  const isBroadcaster = user?.id === room.broadcaster_id
  const broadcaster = room.is_ai_booth ? null : room.profiles
  const game = room.games ?? espnGame

  useEffect(() => {
    if (user) {
      supabase
        .from('listener_offsets')
        .select('offset_ms')
        .eq('user_id', user.id)
        .eq('room_id', room.id)
        .single()
        .then(({ data }) => {
          if (data) setOffsetMs(data.offset_ms)
        })
    }

    const pollCount = () => {
      supabase
        .from('broadcast_rooms')
        .select('listener_count')
        .eq('id', room.id)
        .single()
        .then(({ data }) => {
          if (data && typeof data.listener_count === 'number') {
            setListenerCount(data.listener_count)
          }
        })
    }
    pollCount()
    const pollInterval = setInterval(pollCount, roomStatus === 'countdown' ? 3000 : 5000)

    const channel = supabase
      .channel(`sync:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'sync_markers',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setSyncMarker(payload.new)
      })
      .subscribe()

    const countChannel = supabase
      .channel(`room-count:${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'broadcast_rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        const updated = payload.new as any
        if (typeof updated.listener_count === 'number') setListenerCount(updated.listener_count)
        if (updated.status) setRoomStatus(updated.status)
      })
      .subscribe()

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
      supabase.removeChannel(countChannel)
    }
  }, [user, room.id, supabase])

  useEffect(() => {
    if (roomStatus !== 'countdown' || isBroadcaster) return
    fetch(`/api/rooms/${room.id}/join`, { method: 'POST' }).catch(() => {})
    return () => {
      fetch(`/api/rooms/${room.id}/leave`, { method: 'POST' }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomStatus, room.id])

  useEffect(() => {
    if (roomStatus !== 'countdown' || !scheduledStart) return
    const target = new Date(scheduledStart).getTime()
    const tick = setInterval(() => {
      const remaining = target - Date.now()
      setTimeLeft(Math.max(0, remaining))
      if (remaining <= 0) {
        clearInterval(tick)
        if (isBroadcaster) {
          supabase.from('broadcast_rooms').update({ status: 'live' }).eq('id', room.id)
            .then(() => setRoomStatus('live'))
        }
      }
    }, 250)
    return () => clearInterval(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomStatus, scheduledStart])

  const handleOffsetChange = async (ms: number) => {
    setOffsetMs(ms)
    if (user) {
      await supabase.from('listener_offsets').upsert({
        user_id: user.id,
        room_id: room.id,
        offset_ms: ms,
        updated_at: new Date().toISOString(),
      })
    }
  }

  const handleSetSyncMarker = async () => {
    if (!markerPeriod || !markerClock) return
    await supabase.from('sync_markers').insert({
      room_id: room.id,
      game_id: game?.id,
      period: markerPeriod,
      game_clock: markerClock,
      broadcaster_timestamp: new Date().toISOString(),
    })
    setShowSetMarkerModal(false)
  }

  const handleGoLiveEarly = async () => {
    await supabase.from('broadcast_rooms').update({ status: 'live' }).eq('id', room.id)
    setRoomStatus('live')
  }

  useEffect(() => {
    if (listenerCount > peakListenersRef.current) peakListenersRef.current = listenerCount
  }, [listenerCount])

  useEffect(() => {
    if (isBroadcaster && roomStatus === 'live' && !recording.state.isRecording && user?.id) {
      recording.start()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBroadcaster, roomStatus, user?.id])

  const handleEndBroadcast = async () => {
    const peak = peakListenersRef.current
    await supabase.from('broadcast_rooms').update({
      status:   'ended',
      ended_at: new Date().toISOString(),
      peak_listeners: peak,
    }).eq('id', room.id)
    const recordingUrl = await recording.stop()
    setDebriefData({ recordingUrl, peakListeners: peak })
    setShowDebrief(true)
  }

  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${room.id}` : `https://gamebooth.app/room/${room.id}`

  const shareCardUrl = (() => {
    const p = new URLSearchParams({
      title: room.title ?? '',
      vibe: room.vibe_tag ?? '',
      broadcaster: broadcaster?.display_name ?? broadcaster?.username ?? 'Anonymous',
      emoji: broadcaster?.avatar_emoji ?? '🎙️',
      listeners: String(listenerCount),
      ...(game ? {
        away: game.away_team ?? '',
        home: game.home_team ?? '',
        awayScore: String(game.away_score ?? ''),
        homeScore: String(game.home_score ?? ''),
        league: game.league ?? '',
        period: game.period ?? '',
      } : {}),
    })
    return `/api/rooms/${room.id}/share-card?v=14&${p.toString()}`
  })()

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: room.title,
        text: `${broadcaster?.display_name ?? 'Someone'} is live on GameBooth — ${room.title}`,
        url: roomUrl,
      })
    } else {
      copyLink()
    }
  }

  const downloadCard = async () => {
    try {
      const res = await fetch(shareCardUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gamebooth-${room.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(shareCardUrl, '_blank')
    }
  }

  const handleReport = async () => {
    if (!user || !reportReason) return
    await supabase.from('reports').insert({
      room_id: room.id,
      reporter_id: user.id,
      reason: reportReason,
    })
    setShowReport(false)
    setReportReason('')
    alert('Report submitted. Thank you.')
  }

  const participantName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? `Listener-${Math.floor(Math.random() * 9999)}`

  // ── Shared modals ───────────────────────────────────────────────────────────
  const modals = (
    <>
      {showSetMarkerModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="glass rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">🎯 Set Sync Marker</h3>
            <p className="text-sm text-white/60 mb-4">Tell listeners what time it is on the game clock right now.</p>
            <div className="flex gap-3 mb-4">
              <input type="text" placeholder="Period (e.g. Q3)" value={markerPeriod}
                onChange={(e) => setMarkerPeriod(e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm border" />
              <input type="text" placeholder="Clock (e.g. 5:23)" value={markerClock}
                onChange={(e) => setMarkerClock(e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm border" />
            </div>
            <button onClick={handleSetSyncMarker} className="w-full py-3 rounded-xl font-bold"
              style={{ background: '#F2871E', color: 'white' }}>Set Marker</button>
            <button onClick={() => setShowSetMarkerModal(false)} className="w-full py-2 mt-2 text-sm text-white/40">Cancel</button>
          </div>
        </div>
      )}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setShowShare(false)}>
          <div className="glass rounded-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={shareCardUrl} alt="Share card preview" className="w-full"
                style={{ display: 'block', maxHeight: '50vh', objectFit: 'contain', background: '#0a0a0f' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-black text-white text-lg">Share Your Booth</h3>
              <button onClick={downloadCard} className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: '#F2871E', color: 'white' }}>⬇️ Download Share Card</button>
              <button onClick={copyLink} className="w-full py-3.5 rounded-xl text-sm font-bold glass flex items-center justify-center gap-2">
                {linkCopied ? '✓ Link Copied!' : '🔗 Copy Room Link'}</button>
              {'share' in navigator && (
                <button onClick={nativeShare} className="w-full py-3.5 rounded-xl text-sm font-bold glass flex items-center justify-center gap-2">
                  ↗️ Share via...</button>
              )}
              <button onClick={() => setShowShare(false)} className="w-full py-2 text-sm text-white/30">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="glass rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">🚩 Report Broadcast</h3>
            <textarea placeholder="Describe the issue..." value={reportReason}
              onChange={(e) => setReportReason(e.target.value)} rows={3}
              className="w-full rounded-xl px-3 py-2 text-sm border mb-4 resize-none" />
            <button onClick={handleReport} disabled={!reportReason.trim()}
              className="w-full py-3 rounded-xl font-bold disabled:opacity-40"
              style={{ background: '#FF4500', color: 'white' }}>Submit Report</button>
            <button onClick={() => setShowReport(false)} className="w-full py-2 mt-2 text-sm text-white/40">Cancel</button>
          </div>
        </div>
      )}
      {showDebrief && debriefData && (
        <BroadcastDebrief
          duration={recording.state.duration}
          peakListeners={debriefData.peakListeners}
          breakCount={recording.state.breakCount}
          recordingUrl={debriefData.recordingUrl}
          onDone={() => { window.location.href = '/profile' }}
        />
      )}
    </>
  )

  // ── Countdown waiting room ──────────────────────────────────────────────────
  if (roomStatus === 'countdown') {
    const isEndgame = timeLeft > 0 && timeLeft <= 10000
    const secsLeft  = Math.ceil(timeLeft / 1000)
    return (
      <div className="max-w-lg mx-auto px-4 pt-4">
        {isEndgame && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
            style={{ animation: 'countdownFlash 1s ease-in-out infinite' }}>
            <div className="font-black tabular-nums leading-none"
              style={{ fontSize: 'clamp(120px,30vw,180px)', color: '#FF4500', animation: 'countdownPulse 1s ease-in-out infinite' }}>
              {secsLeft}
            </div>
            <div className="text-white/70 text-2xl font-black mt-6 uppercase tracking-widest">Going Live</div>
          </div>
        )}
        <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 mb-4">←</Link>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-end gap-0.5" style={{ height: 14 }}>
            {[0,1,2,3].map(i => <div key={i} className="waveform-bar" style={{ animationDelay: `${i*0.15}s`, background: 'rgba(242,135,30,0.5)' }} />)}
          </div>
          <span className="text-sm font-black uppercase tracking-widest" style={{ color: '#F2871E' }}>Waiting Room</span>
          <span className="text-xs text-white/30">· {listenerCount} waiting</span>
        </div>
        {game && (
          <div className="glass rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div className="text-2xl">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/40">{game.league}</div>
              <div className="font-bold text-sm truncate">{game.away_team} vs {game.home_team}</div>
            </div>
            <div className="text-xs text-white/40">
              {game.start_time
                ? new Date(game.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' })
                : 'Starting soon'}
            </div>
          </div>
        )}
        <div className="glass rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(242,135,30,0.15)' }}>{broadcaster?.avatar_emoji ?? '🎙️'}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{broadcaster?.display_name ?? broadcaster?.username ?? 'Anonymous'}</div>
              <div className="text-xs text-white/50 truncate">{room.title}</div>
            </div>
          </div>
          <VibeBadge vibe={room.vibe_tag} />
        </div>
        <div className="text-center mb-6">
          {scheduledStart ? (
            <>
              <div className="font-black tabular-nums mb-1"
                style={{ fontSize: 64, lineHeight: 1, color: timeLeft < 300000 ? '#F2871E' : 'white' }}>
                {formatCountdown(timeLeft)}
              </div>
              <div className="text-xs text-white/35 uppercase tracking-widest">
                {({ NBA: 'Until tip-off', NFL: 'Until kickoff', MLB: 'Until first pitch', NHL: 'Until puck drop', UFC: 'Until fight time' } as Record<string,string>)[game?.league ?? ''] ?? 'Until game time'}
              </div>
            </>
          ) : (
            <div className="text-white/40 text-sm">Game starting soon…</div>
          )}
        </div>
        {isBroadcaster ? (
          <div className="space-y-3">
            <button onClick={handleGoLiveEarly} className="w-full py-4 rounded-2xl font-black text-base"
              style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)', color: 'white', boxShadow: '0 0 24px rgba(242,135,30,0.4)' }}>
              📡 Go Live Early</button>
            <p className="text-center text-xs text-white/30">Or wait — your booth auto-starts at game time</p>
            <button onClick={handleEndBroadcast} className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,69,0,0.08)', color: 'rgba(255,69,0,0.6)', border: '1px solid rgba(255,69,0,0.2)' }}>
              Cancel Booth</button>
          </div>
        ) : (
          <div className="rounded-2xl px-5 py-4 text-center"
            style={{ background: 'rgba(242,135,30,0.06)', border: '1px solid rgba(242,135,30,0.12)' }}>
            <div className="text-sm font-semibold text-white/60 mb-1">You&apos;re in the waiting room</div>
            <div className="text-xs text-white/35">Stay on this page — audio starts automatically when the broadcast begins</div>
          </div>
        )}
        <div className="h-8" />
      </div>
    )
  }

  // ── DESKTOP BROADCASTER STUDIO ──────────────────────────────────────────────
  // isDesktop is a React state value — only true after mount on lg+ screens.
  // This means exactly one layout tree renders at a time; no duplicate subscriptions.
  if (isBroadcaster && roomStatus === 'live' && isDesktop) {
    return (
      <>
        {/* AudioPlayer: always mounted here for the LiveKit connection */}
        <div className="hidden">
          <AudioPlayer
            roomId={room.id}
            livekitRoomName={room.livekit_room_name}
            participantName={participantName}
            isBroadcaster
            micMuted={recording.state.isOnBreak}
          />
        </div>

        <div className="flex flex-col fixed inset-0 z-20" style={{ background: '#0a0a0f' }}>
          {/* Top bar */}
          <div className="flex-shrink-0 flex items-center gap-4 px-5 h-14 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(12,12,18,0.98)' }}>
            <Link href={game ? `/games/${game.id}` : '/'} className="text-white/30 hover:text-white/70 transition-colors text-sm">←</Link>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex-shrink-0"
              style={{
                background: recording.state.isOnBreak ? 'rgba(255,255,255,0.06)' : 'rgba(255,69,0,0.15)',
                border: `1px solid ${recording.state.isOnBreak ? 'rgba(255,255,255,0.1)' : 'rgba(255,69,0,0.4)'}`,
                color: recording.state.isOnBreak ? 'rgba(255,255,255,0.35)' : '#FF4500',
              }}>
              {recording.state.isOnBreak ? '📺 On Break' : (
                <><span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: '#FF4500' }} />On Air</>
              )}
            </div>
            {game && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-white/20 select-none">|</span>
                <span className="text-sm font-bold text-white/80 truncate">{game.away_team} vs {game.home_team}</span>
                {game.status === 'live' && (
                  <>
                    <span className="text-white/20 select-none">·</span>
                    <span className="text-sm font-black tabular-nums">{game.away_score} – {game.home_score}</span>
                    <span className="text-xs text-white/40 flex-shrink-0">{game.period}{game.game_clock ? ` · ${game.game_clock}` : ''}</span>
                  </>
                )}
              </div>
            )}
            <div className="ml-auto flex items-center gap-5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">👂</span>
                <span className="text-sm font-black tabular-nums">{listenerCount}</span>
                <span className="text-xs text-white/30">listening</span>
              </div>
              <div className="text-sm font-black tabular-nums px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: recording.state.isOnBreak ? 'rgba(255,255,255,0.3)' : '#F2871E' }}>
                {formatDuration(recording.state.duration)}
              </div>
            </div>
          </div>

          {/* Three-panel body */}
          <div className="flex flex-1 overflow-hidden">
            {/* LEFT: Mic + Controls */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-5 p-5 border-r overflow-y-auto"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(242,135,30,0.15)' }}>{broadcaster?.avatar_emoji ?? '🎙️'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{broadcaster?.display_name ?? broadcaster?.username ?? 'Anonymous'}</div>
                  <div className="text-[11px] text-white/40 truncate">{room.title}</div>
                </div>
              </div>
              <VibeBadge vibe={room.vibe_tag} />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Microphone</div>
                <VolumeMeter isOnBreak={recording.state.isOnBreak} />
              </div>
              <div>
                {recording.state.isOnBreak ? (
                  <button onClick={recording.resumeFromBreak}
                    className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)', color: 'white', boxShadow: '0 0 20px rgba(242,135,30,0.35)' }}>
                    <span className="w-2.5 h-2.5 rounded-full animate-pulse inline-block" style={{ background: 'white' }} />
                    Back Live
                  </button>
                ) : (
                  <button onClick={recording.takeBreak}
                    className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                    📺 Commercial Break
                  </button>
                )}
              </div>
              {recording.state.breakCount > 0 && (
                <div className="text-[11px] text-white/25 text-center">
                  {recording.state.breakCount} break{recording.state.breakCount !== 1 ? 's' : ''} taken
                </div>
              )}
              <div className="flex-1" />
              <div className="space-y-2">
                <button onClick={() => setShowShare(true)} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                  style={{ background: 'rgba(242,135,30,0.12)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.3)' }}>
                  🔗 Share Your Booth
                </button>
                <button onClick={handleEndBroadcast} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                  style={{ background: 'rgba(255,69,0,0.1)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.3)' }}>
                  ⏹ End Broadcast
                </button>
              </div>
              <div className="text-[10px] text-white/18 text-center leading-relaxed pb-1">
                Original fan commentary only.<br />No official broadcast audio or video.
              </div>
            </div>

            {/* CENTER: Scoreboard + Sync */}
            <div className="flex-1 flex flex-col gap-5 p-6 overflow-y-auto">
              {game ? (
                <div className="rounded-2xl p-6 flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{game.league}</span>
                    {game.status === 'live' ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#FF4500' }} />
                        {game.period}{game.game_clock ? ` · ${game.game_clock}` : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/30 font-bold uppercase">Upcoming</span>
                    )}
                  </div>
                  <div className="flex items-center justify-around gap-4">
                    <div className="flex-1 text-center">
                      {game.away_team_logo
                        ? <img src={game.away_team_logo} alt={game.away_team} className="w-20 h-20 object-contain mx-auto mb-3" />
                        : <div className="text-4xl mb-3">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</div>}
                      <div className="text-sm font-bold text-white/60">{game.away_team}</div>
                      {game.status === 'live' && <div className="text-5xl font-black tabular-nums mt-2">{game.away_score}</div>}
                    </div>
                    <div className="text-xl font-black text-white/15 flex-shrink-0">vs</div>
                    <div className="flex-1 text-center">
                      {game.home_team_logo
                        ? <img src={game.home_team_logo} alt={game.home_team} className="w-20 h-20 object-contain mx-auto mb-3" />
                        : <div className="text-4xl mb-3">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</div>}
                      <div className="text-sm font-bold text-white/60">{game.home_team}</div>
                      {game.status === 'live' && <div className="text-5xl font-black tabular-nums mt-2">{game.home_score}</div>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-6 text-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-3xl mb-2">🏟️</div>
                  <div className="text-sm text-white/40">No game data available</div>
                </div>
              )}
              <div className="rounded-2xl p-5 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🎯</span>
                  <div>
                    <div className="text-sm font-bold">Sync Marker</div>
                    <div className="text-[11px] text-white/40">Help listeners lock in to the game clock</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input type="text" placeholder="Period (e.g. Q3)" value={markerPeriod}
                    onChange={(e) => setMarkerPeriod(e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm border" />
                  <input type="text" placeholder="Clock (e.g. 5:23)" value={markerClock}
                    onChange={(e) => setMarkerClock(e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm border" />
                  <button onClick={handleSetSyncMarker} disabled={!markerPeriod || !markerClock}
                    className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 flex-shrink-0 transition-all hover:brightness-110"
                    style={{ background: 'rgba(255,193,7,0.2)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.35)' }}>
                    Set
                  </button>
                </div>
                {syncMarker && (
                  <div className="mt-3 text-[11px] text-white/35">
                    Last marker: {syncMarker.period} · {syncMarker.game_clock}
                  </div>
                )}
              </div>
              <BroadcastTips />
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Listening', value: listenerCount, icon: '👂' },
                  { label: 'Duration', value: formatDuration(recording.state.duration), icon: '⏱️' },
                  { label: 'Breaks', value: recording.state.breakCount, icon: '📺' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-lg mb-0.5">{icon}</div>
                    <div className="text-lg font-black tabular-nums">{value}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Chat — single instance */}
            <div className="w-80 flex-shrink-0 flex flex-col border-l overflow-hidden"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex-shrink-0 flex items-center gap-2 px-4 h-11 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-end gap-0.5" style={{ height: 12 }}>
                  {[0,1,2,3].map(i => <div key={i} className="waveform-bar" style={{ animationDelay: `${i*0.15}s` }} />)}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Live Chat</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel roomId={room.id} />
              </div>
            </div>
          </div>
        </div>
        {modals}
      </>
    )
  }

  // ── DESKTOP LISTENER VIEW ───────────────────────────────────────────────────
  if (!isBroadcaster && isDesktop) {
    return (
      <>
        <div className="flex" style={{ minHeight: '100vh' }}>
          {/* Left: game + broadcaster + audio + sync */}
          <div className="flex-1 min-w-0 px-6 pt-6 overflow-y-auto">
            <Link href={game ? `/games/${game.id}` : '/'} className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 mb-5">← Games</Link>
            {game && (
              <div className="rounded-2xl p-5 mb-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: game.status === 'live' ? '1px solid rgba(255,69,0,0.25)' : '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{game.league}</span>
                  {game.status === 'live' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#FF4500' }} />
                      {game.period}{game.game_clock ? ` · ${game.game_clock}` : ''}
                    </span>
                  ) : <span className="text-[10px] text-white/30">{game.status}</span>}
                </div>
                <div className="flex items-center justify-around gap-4">
                  <div className="flex-1 text-center">
                    {game.away_team_logo && <img src={game.away_team_logo} alt={game.away_team} className="w-14 h-14 object-contain mx-auto mb-2" />}
                    <div className="text-sm font-bold text-white/60">{game.away_team}</div>
                    {game.status === 'live' && <div className="text-4xl font-black tabular-nums mt-1">{game.away_score}</div>}
                  </div>
                  <div className="text-white/15 font-black text-xl">vs</div>
                  <div className="flex-1 text-center">
                    {game.home_team_logo && <img src={game.home_team_logo} alt={game.home_team} className="w-14 h-14 object-contain mx-auto mb-2" />}
                    <div className="text-sm font-bold text-white/60">{game.home_team}</div>
                    {game.status === 'live' && <div className="text-4xl font-black tabular-nums mt-1">{game.home_score}</div>}
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(242,135,30,0.15)' }}>{broadcaster?.avatar_emoji ?? '🎙️'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{broadcaster?.display_name ?? broadcaster?.username ?? 'Anonymous'}</div>
                  <div className="text-xs text-white/50 truncate">{room.title}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold">👂 {listenerCount}</span>
                  <button className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.3)' }}>
                    Follow
                  </button>
                </div>
              </div>
              <VibeBadge vibe={room.vibe_tag} />
            </div>
            <div className="mb-4">
              <AudioPlayer roomId={room.id} livekitRoomName={room.livekit_room_name} participantName={participantName} />
            </div>
            <div className="mb-4">
              <SyncPanel roomId={room.id} syncMarker={syncMarker} offsetMs={offsetMs} onOffsetChange={handleOffsetChange} />
            </div>

            <div className="flex gap-2 mb-6">
              <button onClick={() => setShowShare(true)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(242,135,30,0.1)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.3)' }}>
                🔗 Share This Booth
              </button>
              <button onClick={() => setShowReport(true)}
                className="px-4 py-2.5 rounded-xl text-xs text-white/30 hover:text-white/50 transition-colors glass">
                🚩
              </button>
            </div>
          </div>
          {/* Right: Chat — single instance */}
          <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-l"
            style={{ borderColor: 'rgba(255,255,255,0.07)', height: '100vh', position: 'sticky', top: 0 }}>
            <div className="flex-shrink-0 flex items-center gap-2 px-4 h-12 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-end gap-0.5" style={{ height: 12 }}>
                {[0,1,2,3].map(i => <div key={i} className="waveform-bar" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Live Chat</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel roomId={room.id} />
            </div>
          </div>
        </div>
        {modals}
      </>
    )
  }

  // ── MOBILE VIEW (broadcaster + listener) ───────────────────────────────────
  return (
    <>
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Link href={game ? `/games/${game.id}` : '/'} className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 mb-4">←</Link>

        {isBroadcaster && roomStatus === 'live' && (
          <div className="rounded-2xl p-3 mb-3 flex items-center justify-between"
            style={{
              background: recording.state.isOnBreak ? 'rgba(255,255,255,0.04)' : 'rgba(255,69,0,0.1)',
              border: `1px solid ${recording.state.isOnBreak ? 'rgba(255,255,255,0.1)' : 'rgba(255,69,0,0.3)'}`,
            }}>
            {recording.state.isOnBreak
              ? <span className="text-sm font-bold text-white/40">📺 ON COMMERCIAL BREAK</span>
              : <span className="live-pulse text-sm font-bold" style={{ color: '#FF4500' }}>🔴 YOU ARE LIVE</span>}
            <span className="text-sm text-white/60">👂 {listenerCount}</span>
          </div>
        )}

        {isBroadcaster && roomStatus === 'live' && (
          <div className="mb-3"><VolumeMeter isOnBreak={recording.state.isOnBreak} /></div>
        )}

        {isBroadcaster && roomStatus === 'live' && (
          <div className="flex items-center gap-3 mb-3">
            {recording.state.isOnBreak ? (
              <button onClick={recording.resumeFromBreak}
                className="flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,69,0,0.15)', border: '1px solid rgba(255,69,0,0.4)', color: '#FF4500' }}>
                <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: '#FF4500' }} />
                Back Live
              </button>
            ) : (
              <button onClick={recording.takeBreak}
                className="flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                📺 Commercial Break
              </button>
            )}
            <div className="px-3 py-3 rounded-2xl text-xs font-bold tabular-nums flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', color: recording.state.isOnBreak ? '#F2871E' : 'rgba(255,255,255,0.35)' }}>
              {recording.state.isOnBreak ? '⏸ On Break' : `🔴 ${formatDuration(recording.state.duration)}`}
            </div>
          </div>
        )}

        {isBroadcaster && <div className="mb-1"><BroadcastTips /></div>}

        {game && (
          <div className="glass rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div className="text-2xl">{LEAGUE_EMOJI[game.league] ?? '🏟️'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/40">{game.league}</div>
              <div className="font-bold text-sm truncate">{game.away_team} vs {game.home_team}</div>
            </div>
            {game.status === 'live' && (
              <div className="text-right">
                <div className="font-bold tabular-nums">{game.away_score} – {game.home_score}</div>
                <div className="text-xs text-white/40">{game.period} {game.game_clock}</div>
              </div>
            )}
          </div>
        )}

        <div className="glass rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(242,135,30,0.15)' }}>{broadcaster?.avatar_emoji ?? '🎙️'}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{broadcaster?.display_name ?? broadcaster?.username ?? 'Anonymous'}</div>
              <div className="text-xs text-white/50 truncate">{room.title}</div>
            </div>
            {!isBroadcaster && (
              <button className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.3)' }}>
                Follow
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <VibeBadge vibe={room.vibe_tag} />
            <span className="text-xs text-white/40">👂 {listenerCount} listening</span>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <AudioPlayer
            roomId={room.id}
            livekitRoomName={room.livekit_room_name}
            participantName={participantName}
            isBroadcaster={isBroadcaster}
            micMuted={isBroadcaster ? recording.state.isOnBreak : undefined}
          />
          {!isBroadcaster && (
            <SyncPanel roomId={room.id} syncMarker={syncMarker} offsetMs={offsetMs} onOffsetChange={handleOffsetChange} />
          )}

          {isBroadcaster && (
            <button onClick={() => setShowSetMarkerModal(true)} className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,193,7,0.15)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)' }}>
              🎯 Set Sync Marker
            </button>
          )}
          <button onClick={() => setShowShare(true)} className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(242,135,30,0.1)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.3)' }}>
            🔗 {isBroadcaster ? 'Share Your Booth' : 'Share This Booth'}
          </button>
          {isBroadcaster && (
            <>
              <button onClick={handleEndBroadcast} className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,69,0,0.1)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.3)' }}>
                ⏹ End Broadcast
              </button>
              <div className="rounded-xl p-3 text-xs text-white/50 text-center"
                style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.1)' }}>
                ⚖️ GameBooth is for original fan commentary only. Do not stream official broadcast audio or game video.
              </div>
            </>
          )}
          {!isBroadcaster && (
            <button onClick={() => setShowReport(true)}
              className="w-full py-2 text-xs text-white/25 hover:text-white/45 transition-colors">
              🚩 Report Broadcast
            </button>
          )}
        </div>

        <div className="mb-4">
          <ChatPanel roomId={room.id} />
        </div>
      </div>
      {modals}
    </>
  )
}
