import Link from 'next/link'

export const metadata = {
  title: 'About – GameBooth',
  description: 'Why we built GameBooth. Mute the TV. Pick Your Booth.',
}

export default function AboutPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">

      {/* Back */}
      <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 mb-8">
        ← Home
      </Link>

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-3 leading-tight">
          Mute the TV.<br />
          <span style={{ color: '#F2871E' }}>Pick Your Booth.</span>
        </h1>
        <p className="text-white/50 text-lg leading-relaxed">
          GameBooth is a live alternate commentary platform for sports fans who are done with the same two voices on every broadcast.
        </p>
      </div>

      {/* The problem */}
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="text-2xl mb-3">📺</div>
        <h2 className="text-lg font-bold text-white mb-2">The broadcast is broken</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          Every game, same networks, same analysts, same takes. You&apos;re stuck with whoever the league sold the rights to — no matter how much you hate them.
        </p>
      </div>

      {/* The fix */}
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="text-2xl mb-3">🎙️</div>
        <h2 className="text-lg font-bold text-white mb-2">Your crowd, your commentary</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          GameBooth lets real fans host live commentary booths for any game. Find a booth that matches your energy — whether that&apos;s a die-hard homer, a stats nerd, or your friend group calling the game from their couch.
        </p>
      </div>

      {/* How it works */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="text-2xl mb-3">⚡</div>
        <h2 className="text-lg font-bold text-white mb-4">How it works</h2>
        <div className="space-y-4">
          {[
            { n: '1', title: 'Find your game', body: 'See every live game happening right now, with real-time scores and which booths are active.' },
            { n: '2', title: 'Pick a booth', body: 'Browse fan-run booths for that game. Each one has a different host, vibe, and angle.' },
            { n: '3', title: 'Mute the TV', body: 'Tune in to the booth audio, follow along with the chat, and actually enjoy the game.' },
          ].map(({ n, title, body }) => (
            <div key={n} className="flex gap-4">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(242,135,30,0.2)', color: '#F2871E' }}
              >
                {n}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{title}</div>
                <div className="text-white/40 text-sm mt-0.5">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why we built it */}
      <div className="mb-10">
        <h2 className="text-xl font-black text-white mb-4">Why we built this</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-3">
          We were watching a game and realized we&apos;d rather hear our group chat than the broadcast. So we muted the TV and hopped on a call — but that&apos;s a mess. Someone&apos;s dog barks. Someone&apos;s buffering. Nobody can hear the reaction when it actually matters.
        </p>
        <p className="text-white/50 text-sm leading-relaxed mb-3">
          GameBooth is the version of that we always wanted. Polished enough to actually work. Open enough that anyone can host. Synced to the real game so the chaos lands at the right moment.
        </p>
        <p className="text-white/50 text-sm leading-relaxed">
          Sports are better with the right voices. We&apos;re just building the stage.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-block px-8 py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: '#F2871E' }}
        >
          Find a Booth →
        </Link>
        <p className="text-white/30 text-xs mt-4">Free to listen. Free to host.</p>
      </div>

    </div>
  )
}
