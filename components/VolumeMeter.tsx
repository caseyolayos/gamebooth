'use client'

import { useState, useEffect, useRef } from 'react'

export default function VolumeMeter({ isOnBreak = false }: { isOnBreak?: boolean }) {
  const [levels, setLevels] = useState([0, 0, 0, 0, 0, 0, 0])
  const [active, setActive] = useState(false)
  const animFrameRef = useRef<number>()
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        streamRef.current = stream

        const ctx = new AudioContext()
        ctxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.75
        source.connect(analyser)

        const data = new Uint8Array(analyser.frequencyBinCount)
        setActive(true)

        const tick = () => {
          analyser.getByteFrequencyData(data)
          const bands = 7
          const binSize = Math.floor(data.length / bands)
          const newLevels = Array.from({ length: bands }, (_, i) => {
            const slice = data.slice(i * binSize, (i + 1) * binSize)
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length
            return avg / 255
          })
          setLevels(newLevels)
          animFrameRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch {
        // Mic access denied — degrade gracefully, just show static indicator
        setActive(false)
      }
    }

    start()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      ctxRef.current?.close()
    }
  }, [])

  const maxLevel = Math.max(...levels)
  const isSpeaking = maxLevel > 0.08

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        background: isOnBreak ? 'rgba(255,255,255,0.03)' : isSpeaking ? 'rgba(255,69,0,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isOnBreak ? 'rgba(255,255,255,0.07)' : isSpeaking ? 'rgba(255,69,0,0.35)' : 'rgba(255,255,255,0.1)'}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      {/* Mic icon + status */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-sm">🎙️</span>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: isOnBreak ? 'rgba(255,255,255,0.2)' : active ? (isSpeaking ? '#FF4500' : '#F2871E') : 'rgba(255,255,255,0.2)',
            boxShadow: (!isOnBreak && isSpeaking) ? '0 0 8px rgba(255,69,0,0.8)' : 'none',
            animation: (!isOnBreak && active && isSpeaking) ? 'livePulse 0.8s ease-in-out infinite' : 'none',
          }}
        />
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: isOnBreak ? 'rgba(255,255,255,0.25)' : active ? (isSpeaking ? '#FF4500' : '#F2871E') : 'rgba(255,255,255,0.3)' }}
        >
          {isOnBreak ? 'Muted' : active ? (isSpeaking ? 'Live' : 'Mic On') : 'No Mic'}
        </span>
      </div>

      {/* Volume bars */}
      <div className="flex items-end gap-0.5 flex-1" style={{ height: 22 }}>
        {levels.map((level, i) => {
          const height = Math.max(3, Math.round(level * 22))
          const color = level > 0.65
            ? '#FF4500'
            : level > 0.35
              ? '#F2871E'
              : 'rgba(242,135,30,0.4)'
          return (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: isOnBreak ? 3 : height,
                background: isOnBreak ? 'rgba(255,255,255,0.08)' : color,
                transition: 'height 0.2s ease-out, background 0.2s',
                alignSelf: 'flex-end',
              }}
            />
          )
        })}
      </div>

      {/* Peak level hint */}
      <span
        className="text-[10px] font-bold flex-shrink-0 tabular-nums"
        style={{ color: 'rgba(255,255,255,0.25)', minWidth: 28, textAlign: 'right' }}
      >
        {active ? `${Math.round(maxLevel * 100)}%` : '--'}
      </span>
    </div>
  )
}
