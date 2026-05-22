import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Watch Sports Without Announcers | GameBooth',
  description: 'Tired of the same broadcast voices ruining your game? GameBooth lets you mute the TV and pick fan commentary you actually like. Free alternative to sports announcers.',
  keywords: 'watch sports without announcers, mute sports commentators, alternative sports commentary, how to watch NFL without announcers, sports fan commentary, replace sports announcers, mute Joe Buck, sports broadcast alternative, watch games without commentary, fan sports commentary',
  openGraph: {
    title: 'Done with the Broadcast Booth? Same. | GameBooth',
    description: 'Mute the TV. Pick commentary from real fans. Free.',
    type: 'website',
    url: 'https://gamebooth.app/watch-sports-without-announcers',
  },
  alternates: {
    canonical: 'https://gamebooth.app/watch-sports-without-announcers',
  },
}

const ANNOUNCER_COMPLAINTS = [
  { name: 'The one who explains the sport to you', quote: '"Now, for those who don\'t know, a touchdown is worth six points..."', reaction: 'I\'ve been watching football for 30 years.' },
  { name: 'The one who only talks about their guy', quote: '"And speaking of Patrick Mahomes — incredible athlete, incredible human being, did I mention Mahomes?"', reaction: 'There are 21 other players on the field.' },
  { name: 'The one obsessed with storylines', quote: '"This game means so much to this franchise, given what happened in 2019, which brings us back to 1987..."', reaction: 'Just tell me the score.' },
  { name: 'The awkward comedy duo', quote: '"Ha. Ha. Ha." *silence* "Great stuff."', reaction: 'Please. I\'m begging.' },
  { name: 'The one who missed the play', quote: '"Oh! Oh, something happened! Let\'s see the replay."', reaction: 'You\'re literally being paid to watch this.' },
]

const SPORTS = [
  { emoji: '🏈', sport: 'NFL', pain: 'Three-hour games where the announcers spend 40 minutes talking about one quarterback\'s childhood.' },
  { emoji: '🏀', sport: 'NBA', pain: 'Forced drama on a Tuesday night regular season game between two teams going nowhere.' },
  { emoji: '⚾', sport: 'MLB', pain: 'Four hours of broadcast filler between pitches, none of it actually interesting.' },
  { emoji: '🏒', sport: 'NHL', pain: 'Getting a great game butchered by a broadcaster who clearly doesn\'t watch hockey.' },
  { emoji: '🥊', sport: 'UFC / Boxing', pain: 'Hype men screaming over every single moment. Zero nuance. All noise.' },
]

const HOW_IT_WORKS = [
  { step: '1', title: 'Mute your TV', body: 'Seriously. Just mute it. Your blood pressure will thank you.' },
  { step: '2', title: 'Open GameBooth', body: 'Find your game — we pull live scores and game data for every major sport.' },
  { step: '3', title: 'Pick a booth', body: 'Browse fan-run commentary booths for that exact game. Different hosts, different vibes, different takes.' },
  { step: '4', title: 'Actually enjoy the game', body: 'Imagine that.' },
]

export default function WatchWithoutAnnouncersPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-24">

      <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 mb-10">
        ← GameBooth
      </Link>

      {/* Hero */}
      <div className="mb-12 text-center">
        <div
          className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(255,69,0,0.12)', color: '#FF4500' }}
        >
          For Every Fan Who&apos;s Ever Muted Their TV
        </div>
        <h1 className="text-4xl font-black text-white mb-4 leading-tight">
          Watch sports without<br />
          <span style={{ color: '#F2871E' }}>the announcers you hate.</span>
        </h1>
        <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          You love the game. You can&apos;t stand the broadcast.
          GameBooth lets you mute the TV and switch to real fan commentary instead.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: '#F2871E' }}
        >
          Find Your Game →
        </Link>
        <p className="text-white/25 text-sm mt-4">Free. No account needed to listen.</p>
      </div>

      {/* Validated */}
      <div className="glass rounded-3xl p-8 mb-6 text-center">
        <div className="text-4xl mb-4">📺</div>
        <h2 className="text-2xl font-black text-white mb-3">You&apos;re not alone.</h2>
        <p className="text-white/55 leading-relaxed mb-3">
          Every single week, millions of sports fans mute their TVs. Not because they don&apos;t love the sport — but because they&apos;ve heard the same three catchphrases, the same forced banter, and the same completely wrong take delivered with complete confidence, one too many times.
        </p>
        <p className="text-white/55 leading-relaxed">
          The broadcast booth hasn&apos;t changed. The talent hasn&apos;t changed. The complaints haven&apos;t changed. GameBooth is the change.
        </p>
      </div>

      {/* Announcer archetypes */}
      <h2 className="text-2xl font-black text-white mb-2 mt-10">Which one sent you here?</h2>
      <p className="text-white/40 text-sm mb-6">No names. You know exactly who we&apos;re talking about.</p>
      <div className="space-y-3 mb-12">
        {ANNOUNCER_COMPLAINTS.map(({ name, quote, reaction }) => (
          <div key={name} className="glass rounded-2xl p-5">
            <div className="font-bold text-white mb-2">{name}</div>
            <div
              className="text-sm italic rounded-xl px-3 py-2 mb-2 text-white/60"
              style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid rgba(242,135,30,0.4)' }}
            >
              &ldquo;{quote}&rdquo;
            </div>
            <div className="text-xs text-white/35">{reaction}</div>
          </div>
        ))}
      </div>

      {/* By sport */}
      <h2 className="text-2xl font-black text-white mb-6">The pain is universal</h2>
      <div className="space-y-3 mb-12">
        {SPORTS.map(({ emoji, sport, pain }) => (
          <div key={sport} className="flex gap-4 glass rounded-2xl p-4 items-start">
            <span className="text-2xl flex-shrink-0">{emoji}</span>
            <div>
              <div className="font-bold text-white text-sm mb-1">{sport}</div>
              <p className="text-white/45 text-sm leading-relaxed">{pain}</p>
            </div>
          </div>
        ))}
      </div>

      {/* The fix */}
      <div
        className="rounded-3xl p-8 mb-6"
        style={{ background: 'rgba(242,135,30,0.06)', border: '1px solid rgba(242,135,30,0.2)' }}
      >
        <h2 className="text-2xl font-black text-white mb-2">The fix is simpler than you think.</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-0">
          You don&apos;t need to pay for a different cable package. You don&apos;t need to find an illegal stream with a random European broadcast.
          You just need GameBooth.
        </p>
      </div>

      {/* How it works */}
      <h2 className="text-2xl font-black text-white mb-6 mt-10">How it works</h2>
      <div className="space-y-3 mb-12">
        {HOW_IT_WORKS.map(({ step, title, body }) => (
          <div key={step} className="flex gap-4 glass rounded-2xl p-5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(242,135,30,0.2)', color: '#F2871E' }}
            >
              {step}
            </div>
            <div>
              <div className="font-bold text-white mb-1">{title}</div>
              <p className="text-white/50 text-sm leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* What you get instead */}
      <h2 className="text-2xl font-black text-white mb-6">What you get instead</h2>
      <div className="grid gap-4 mb-12">
        {[
          { emoji: '🎙️', title: 'Real fan energy', body: 'People who actually care about the game. No one&apos;s reading a teleprompter. No one&apos;s worried about their contract.' },
          { emoji: '🏠', title: 'Your team, your angle', body: 'Find a hometown homer, a neutral analyst, or someone who hates your team as much as you love them. Every booth is different.' },
          { emoji: '💬', title: 'Live chat that&apos;s actually live', body: 'React with other fans in real time. No algorithm deciding what you see. No delay.' },
          { emoji: '🔥', title: 'Actually hot takes', body: 'Fan booths don&apos;t have broadcast standards to maintain. You&apos;ll hear things the network would never say.' },
          { emoji: '🎧', title: 'Your choice, every game', body: 'Different booths for every game. Find one you love and follow that host across every game they call.' },
        ].map(({ emoji, title, body }) => (
          <div key={title} className="flex gap-4 glass rounded-2xl p-5">
            <span className="text-2xl flex-shrink-0">{emoji}</span>
            <div>
              <h3 className="font-bold text-white mb-1">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
            </div>
          </div>
        ))}
      </div>

      {/* The broadcaster angle */}
      <div
        className="rounded-3xl p-8 mb-12 text-center"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-3xl mb-4">🎙️</div>
        <h2 className="text-xl font-black text-white mb-3">Think you can do better?</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-5">
          A lot of people who hate announcers end up becoming one on GameBooth.
          Turns out calling games is hard — but also incredibly fun. Go live on any game tonight, free.
        </p>
        <Link
          href="/go-live"
          className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.3)' }}
        >
          Try Going Live →
        </Link>
      </div>

      {/* Final CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-3">
          The game is great.<br />The broadcast doesn&apos;t have to ruin it.
        </h2>
        <p className="text-white/40 text-sm mb-6">Free to listen. No account needed. Mute the TV first.</p>
        <Link
          href="/"
          className="inline-block px-10 py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: '#F2871E' }}
        >
          Find Tonight&apos;s Games →
        </Link>
      </div>

    </div>
  )
}
