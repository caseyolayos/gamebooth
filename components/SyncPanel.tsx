'use client'

import { useState } from 'react'

interface SyncMarker {
  period: string
  game_clock: string
  broadcaster_timestamp: string
}

interface SyncPanelProps {
  roomId?: string
  syncMarker?: SyncMarker | null
  offsetMs: number
  onOffsetChange: (ms: number) => void
}

const PROVIDER_PRESETS: { label: string; delay: number }[] = [
  { label: 'Cable', delay: -3000 },
  { label: 'YouTube TV', delay: 10000 },
  { label: 'Hulu Live', delay: 15000 },
  { label: 'ESPN App', delay: 20000 },
  { label: 'League Pass', delay: 30000 },
]

const OFFSET_BUTTONS = [
  { label: '-10s', delta: -10000 },
  { label: '-5s', delta: -5000 },
  { label: '-1s', delta: -1000 },
  { label: '+1s', delta: 1000 },
  { label: '+5s', delta: 5000 },
  { label: '+10s', delta: 10000 },
]

export default function SyncPanel({ syncMarker, offsetMs, onOffsetChange }: SyncPanelProps) {
  const [showSyncModal, setShowSyncModal] = useState(false)

  const formatOffset = (ms: number) => {
    const s = ms / 1000
    if (s === 0) return 'Synced'
    return s > 0 ? `+${s}s ahead` : `${s}s behind`
  }

  const handlePreset = (delay: number) => {
    onOffsetChange(delay)
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">🔄 Sync Controls</h3>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{
            background: offsetMs === 0 ? 'rgba(242,135,30,0.15)' : 'rgba(255,193,7,0.15)',
            color: offsetMs === 0 ? '#F2871E' : '#FFC107',
          }}
        >
          {formatOffset(offsetMs)}
        </span>
      </div>

      {syncMarker && (
        <button
          onClick={() => setShowSyncModal(true)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.3)' }}
        >
          🎯 Sync to Game Clock
        </button>
      )}

      <div>
        <p className="text-xs text-white/40 mb-2">Fine-tune offset</p>
        <div className="grid grid-cols-6 gap-1">
          {OFFSET_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => onOffsetChange(offsetMs + btn.delta)}
              className="py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-white/40 mb-2">Provider delay preset</p>
        <div className="flex flex-wrap gap-1.5">
          {PROVIDER_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.delay)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: offsetMs === preset.delay ? 'rgba(242,135,30,0.2)' : 'rgba(255,255,255,0.06)',
                color: offsetMs === preset.delay ? '#F2871E' : 'rgba(255,255,255,0.7)',
                border: offsetMs === preset.delay ? '1px solid rgba(242,135,30,0.4)' : '1px solid transparent',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {offsetMs !== 0 && (
        <button
          onClick={() => onOffsetChange(0)}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Reset to 0
        </button>
      )}

      {showSyncModal && syncMarker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowSyncModal(false)}
        >
          <div
            className="glass rounded-2xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2">🎯 Sync to Game Clock</h3>
            <p className="text-sm text-white/70 mb-4">
              When your TV shows{' '}
              <span className="font-bold text-white">{syncMarker.game_clock}</span>{' '}
              in{' '}
              <span className="font-bold text-white">{syncMarker.period}</span>,
              tap Sync below.
            </p>
            <button
              onClick={() => {
                const markerTime = new Date(syncMarker.broadcaster_timestamp).getTime()
                const nowTime = Date.now()
                const calculated = nowTime - markerTime
                onOffsetChange(calculated)
                setShowSyncModal(false)
              }}
              className="w-full py-3 rounded-xl text-base font-bold"
              style={{ background: '#F2871E', color: 'white' }}
            >
              Sync Now ⚡
            </button>
            <button
              onClick={() => setShowSyncModal(false)}
              className="w-full py-2 mt-2 rounded-xl text-sm text-white/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
