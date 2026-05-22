'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  url: string
  title: string
  game?: string
  date?: string
  listeners?: number
  duration?: number
  breakCount?: number
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function BroadcastAudioPlayer({ url, title, game, date, listeners, duration: savedDuration, breakCount }: Props) {
  const audioRef     = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]       = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]     = useState(savedDuration ?? 0)
  const [waveform, setWaveform]     = useState<number[]>([])
  const [loadingWave, setLoadingWave] = useState(true)
  const [expanded, setExpanded]     = useState(false)

  // Build real waveform from audio data
  useEffect(() => {
    let cancelled = false
    const build = async () => {
      try {
        const res    = await fetch(url)
        const buffer = await res.arrayBuffer()
        const ctx    = new AudioContext()
        const audio  = await ctx.decodeAudioData(buffer)
        if (cancelled) { ctx.close(); return }

        const ch       = audio.getChannelData(0)
        const samples  = 80
        const block    = Math.floor(ch.length / samples)
        const peaks    = Array.from({ length: samples }, (_, i) => {
          const slice = ch.slice(i * block, (i + 1) * block)
          const rms   = Math.sqrt(slice.reduce((a, v) => a + v * v, 0) / slice.length)
          return Math.min(1, rms * 5)
        })
        setWaveform(peaks)
        if (!savedDuration) setDuration(audio.duration)
        ctx.close()
      } catch {
        // Fallback waveform
        setWaveform(Array.from({ length: 80 }, (_, i) =>
          0.15 + 0.6 * Math.abs(Math.sin(i * 0.4)) * Math.random()
        ))
      } finally {
        if (!cancelled) setLoadingWave(false)
      }
    }
    build()
    return () => { cancelled = true }
  }, [url, savedDuration])

  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause() }
    else         { audioRef.current.play() }
    setPlaying(p => !p)
  }, [playing])

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * duration
    setCurrentTime(pct * duration)
  }

  const progress = duration ? currentTime / duration : 0

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => { if (!savedDuration) setDuration(audioRef.current?.duration ?? 0) }}
        onEnded={() => { setPlaying(false); setCurrentTime(0) }}
        preload="metadata"
      />

      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        {/* Play button */}
        <button
          onClick={toggle}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
          style={{
            background: playing
              ? 'rgba(255,69,0,0.2)'
              : 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)',
            boxShadow: playing ? 'none' : '0 4px 16px rgba(242,135,30,0.4)',
          }}
        >
          <span className="text-white text-lg leading-none" style={{ marginLeft: playing ? 0 : 2 }}>
            {playing ? '⏸' : '▶'}
          </span>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm truncate">{title}</div>
          {game && <div className="text-xs text-white/40 truncate">{game}</div>}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-white/25 hover:text-white/50 transition-colors text-lg"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Waveform + scrubber */}
      <div
        className="mx-4 mb-3 rounded-xl overflow-hidden cursor-pointer select-none"
        style={{ height: 56, background: 'rgba(0,0,0,0.3)' }}
        onClick={seek}
      >
        {loadingWave ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-end gap-0.5" style={{ height: 24 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} className="w-1 rounded-full"
                  style={{
                    height: `${30 + 40 * Math.random()}%`,
                    background: 'rgba(242,135,30,0.3)',
                    animation: `waveAnim 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                  }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-px h-full px-2 py-1">
            {waveform.map((h, i) => {
              const played = i / waveform.length <= progress
              const pct    = Math.max(3, h * 100)
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${pct}%`,
                    background: played
                      ? (h > 0.65 ? '#FF4500' : h > 0.4 ? '#F2871E' : 'rgba(242,135,30,0.7)')
                      : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.05s',
                    alignSelf: 'flex-end',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Time row */}
      <div className="flex justify-between px-4 pb-3 text-xs text-white/30 tabular-nums">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>

      {/* Expanded stats */}
      {expanded && (
        <div
          className="mx-4 mb-4 rounded-xl p-4 grid grid-cols-3 gap-3 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <div className="text-lg font-black text-white">{fmt(duration)}</div>
            <div className="text-[10px] text-white/40 mt-0.5">Duration</div>
          </div>
          <div>
            <div className="text-lg font-black" style={{ color: '#F2871E' }}>{listeners ?? 0}</div>
            <div className="text-[10px] text-white/40 mt-0.5">Listeners</div>
          </div>
          <div>
            <div className="text-lg font-black text-white">{breakCount ?? 0}</div>
            <div className="text-[10px] text-white/40 mt-0.5">Breaks</div>
          </div>
          {date && (
            <div className="col-span-3 text-[10px] text-white/25 mt-1">
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
