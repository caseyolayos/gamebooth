'use client'

import { useState, useEffect } from 'react'

interface Props {
  gameId: string
  initialListeners: number
  initialBooths: number
}

export default function LiveBoothCount({ gameId, initialListeners, initialBooths }: Props) {
  const [listeners, setListeners] = useState(initialListeners)
  const [booths, setBooths]       = useState(initialBooths)

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/booths/counts', { cache: 'no-store' })
        const data = await res.json()
        if (data[gameId]) {
          setListeners(data[gameId].listeners)
          setBooths(data[gameId].booths)
        } else {
          setListeners(0)
          setBooths(0)
        }
      } catch {}
    }

    refresh()
    const interval = setInterval(refresh, 15_000)
    return () => clearInterval(interval)
  }, [gameId])

  if (booths > 0) {
    return (
      <div className="mt-1">
        <div className="text-xs font-bold" style={{ color: '#F2871E' }}>
          👂 {listeners}
        </div>
        <div className="text-[10px] text-white/30">
          {booths} booth{booths !== 1 ? 's' : ''}
        </div>
      </div>
    )
  }

  return (
    <div className="text-[10px] text-white/25 mt-1">No booths yet</div>
  )
}
