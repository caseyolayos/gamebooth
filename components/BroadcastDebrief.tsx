'use client'

interface Props {
  duration: number
  peakListeners: number
  breakCount: number
  recordingUrl: string | null
  onDone: () => void
}

function fmt(s: number) {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function grade(duration: number, listeners: number): { label: string; color: string; note: string } {
  if (duration >= 1200 && listeners >= 10) return { label: 'Pro',       color: '#FFD700', note: 'Exceptional session. Real duration, real audience.' }
  if (duration >= 600  && listeners >= 5)  return { label: 'Strong',    color: '#F2871E', note: 'Solid work. Keep building those reps.' }
  if (duration >= 300  && listeners >= 1)  return { label: 'Good Start', color: '#7EB3FF', note: 'Every broadcast gets you sharper. Keep going.' }
  if (duration >= 60)                       return { label: 'Warming Up', color: 'rgba(255,255,255,0.5)', note: 'Short session, but it counts. Aim for 5+ minutes next time.' }
  return                                           { label: 'Just Getting Started', color: 'rgba(255,255,255,0.3)', note: 'Go longer next time — the more reps, the better.' }
}

const FEEDBACK = [
  { threshold: 0,    tip: 'Try to stay live for at least 5 minutes — listeners need time to find your booth.' },
  { threshold: 300,  tip: 'Great — 5 minutes is a real session. Push toward 10 next time.' },
  { threshold: 600,  tip: 'Strong 10-minute broadcast. You\'re building stamina.' },
  { threshold: 1200, tip: 'Elite endurance. 20+ minutes puts you in the top tier of game callers.' },
]

export default function BroadcastDebrief({ duration, peakListeners, breakCount, recordingUrl, onDone }: Props) {
  const g          = grade(duration, peakListeners)
  const feedbackTip = [...FEEDBACK].reverse().find(f => duration >= f.threshold)?.tip ?? FEEDBACK[0].tip

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
    >
      <div className="w-full max-w-lg">

        {/* Card */}
        <div className="glass rounded-3xl overflow-hidden mb-4">

          {/* Header */}
          <div
            className="px-6 pt-8 pb-6 text-center"
            style={{ background: 'linear-gradient(180deg, rgba(242,135,30,0.12) 0%, transparent 100%)' }}
          >
            <div className="text-4xl mb-2">🎙️</div>
            <h2 className="text-2xl font-black text-white mb-1">Broadcast Complete</h2>
            <p className="text-white/40 text-sm">Here&apos;s how you did</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-px mx-6 mb-6 rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { label: 'On Air',     value: fmt(duration),       sub: 'active time'       },
              { label: 'Peak',       value: peakListeners,        sub: 'listeners'         },
              { label: 'Breaks',     value: breakCount,           sub: 'commercial breaks' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="py-4 text-center"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">{label}</div>
                <div className="text-[9px] text-white/25 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Grade badge */}
          <div className="mx-6 mb-5 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: g.color }}>
              {g.label === 'Pro' ? '🏆' : g.label === 'Strong' ? '🔥' : g.label === 'Good Start' ? '📈' : '🎙️'}
            </div>
            <div>
              <div className="font-black text-sm" style={{ color: g.color }}>{g.label}</div>
              <div className="text-xs text-white/50 mt-0.5 leading-relaxed">{g.note}</div>
            </div>
          </div>

          {/* Coaching tip */}
          <div className="mx-6 mb-6 rounded-2xl p-4"
            style={{ background: 'rgba(242,135,30,0.06)', border: '1px solid rgba(242,135,30,0.15)' }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1.5"
              style={{ color: '#F2871E' }}>💡 For Next Time</div>
            <p className="text-sm text-white/60 leading-relaxed">{feedbackTip}</p>
          </div>

          {/* Recording CTA */}
          {recordingUrl ? (
            <div className="mx-6 mb-6 rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-2xl">🎧</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">Recording saved</div>
                <div className="text-xs text-white/40 truncate">Available on your profile</div>
              </div>
              <a
                href={recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}
              >
                Download
              </a>
            </div>
          ) : (
            <div className="mx-6 mb-6 rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <span className="text-xl">⏳</span>
              <div className="text-sm text-white/40">Recording uploading... check your profile shortly.</div>
            </div>
          )}

          {/* CTA */}
          <div className="px-6 pb-8">
            <button
              onClick={onDone}
              className="w-full py-4 rounded-2xl font-black text-white text-base"
              style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)' }}
            >
              View Profile →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
