'use client'

import { useState } from 'react'

const TIPS = [
  { emoji: '🎯', tip: 'Paint the picture. Your listeners can\'t see the screen — describe what\'s happening as it unfolds.' },
  { emoji: '⏱️', tip: 'Keep dead air under 3 seconds. When in doubt, react to the crowd noise or recap the score.' },
  { emoji: '🔊', tip: 'Vary your energy. Match the moment — calm during a timeout, explosive on a big play.' },
  { emoji: '👂', tip: 'Use listener count as your feedback loop. Dropping? You\'ve gone quiet. Growing? Keep doing what you\'re doing.' },
  { emoji: '📊', tip: 'Throw in a stat or context every few minutes. "This is the third time tonight he\'s hit from that spot."' },
  { emoji: '🎙️', tip: 'Say the score out loud every 2-3 minutes. New listeners tune in constantly — don\'t leave them guessing.' },
  { emoji: '💬', tip: 'Read the chat out loud occasionally. It makes listeners feel heard and boosts engagement.' },
  { emoji: '🌡️', tip: 'Hot takes get listeners talking. Don\'t be afraid to have a real opinion — that\'s why they\'re here.' },
]

export default function BroadcastTips() {
  const [dismissed, setDismissed] = useState(false)
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))

  if (dismissed) return null

  const { emoji, tip } = TIPS[tipIndex]

  return (
    <div
      className="rounded-2xl p-4 mb-4 relative"
      style={{
        background: 'rgba(242,135,30,0.06)',
        border: '1px solid rgba(242,135,30,0.2)',
      }}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors text-lg leading-none"
      >
        ×
      </button>
      <div className="flex items-start gap-3 pr-5">
        <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
        <div>
          <div
            className="text-[10px] font-black uppercase tracking-widest mb-1"
            style={{ color: '#F2871E' }}
          >
            Broadcaster Tip
          </div>
          <p className="text-sm text-white/70 leading-relaxed">{tip}</p>
        </div>
      </div>
    </div>
  )
}
