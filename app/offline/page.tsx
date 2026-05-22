'use client'

export default function OfflinePage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-16 text-center">
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-black mb-2">You&apos;re offline</h1>
      <p className="text-white/50 text-sm mb-6">
        GameBooth needs a connection for live audio. Check your internet and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl font-bold text-sm"
        style={{ background: '#F2871E', color: 'white' }}
      >
        Try Again
      </button>
    </div>
  )
}
