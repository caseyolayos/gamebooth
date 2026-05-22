import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sports Broadcasting Training Tool for Students | GameBooth',
  description: 'Practice live sports commentary on real games with a real audience. GameBooth is the go-to training tool for sports broadcasting students — free to use, no equipment needed.',
  keywords: 'sports broadcasting training, sports broadcasting practice, how to become a sports broadcaster, broadcast school, sports commentary practice, sports broadcasting student, learn sports broadcasting, sports announcing practice',
  openGraph: {
    title: 'The Practice Field for Sports Broadcasters | GameBooth',
    description: 'Call real games. Build a real audience. Free for students.',
    type: 'website',
    url: 'https://gamebooth.app/sports-broadcasting-training',
  },
  alternates: {
    canonical: 'https://gamebooth.app/sports-broadcasting-training',
  },
}

const FEATURES = [
  {
    emoji: '🎙️',
    title: 'Call real games, live',
    body: 'Practice on actual NBA, NFL, MLB, NHL, and UFC games as they happen — not simulations, not recordings. The pressure is real.',
  },
  {
    emoji: '👥',
    title: 'Build a real audience from day one',
    body: 'Fans tune into booths live. Your listener count is live feedback — a coaching signal no classroom can replicate.',
  },
  {
    emoji: '📊',
    title: 'Track your improvement',
    body: 'Every broadcast logs your stats. Watch your listener counts grow, your session length increase, and your confidence compound.',
  },
  {
    emoji: '🔊',
    title: 'Voice volume meter',
    body: 'See your mic levels in real time while you broadcast. Know when you\'re too quiet, too loud, or hitting the sweet spot.',
  },
  {
    emoji: '💬',
    title: 'Live audience chat',
    body: 'Your listeners react in real time. Read the room, field questions, and learn how to engage an audience mid-broadcast.',
  },
  {
    emoji: '🏆',
    title: 'Portfolio that lives online',
    body: 'Your broadcast history is your demo reel. Share your GameBooth profile with recruiters, professors, or your next employer.',
  },
]

const TIPS = [
  'Say the score every 2–3 minutes — new listeners tune in constantly.',
  'Keep dead air under 3 seconds. React to crowd noise if you\'re stuck.',
  'Vary your energy. Match the moment — calm in a timeout, explosive on a big play.',
  'Throw in a stat every few minutes. Context is what separates great broadcasters.',
]

const FAQ = [
  {
    q: 'Do I need any equipment?',
    a: 'Just a phone or laptop with a microphone — the one built into your device works fine. No mixer, no interface, no studio.',
  },
  {
    q: 'Is it actually free?',
    a: 'Yes, completely free to broadcast and listen. We\'ll always have a free tier for students.',
  },
  {
    q: 'What sports can I call?',
    a: 'NBA, NFL, MLB, NHL, UFC, and college sports. We pull live game data automatically so you\'re always calling a real, current game.',
  },
  {
    q: 'Can my professor see my broadcasts?',
    a: 'Not yet — but we\'re building an instructor dashboard for programs that want to incorporate GameBooth into their curriculum. Reach out if you\'re interested.',
  },
  {
    q: 'Will this actually help me get a job?',
    a: 'Reps matter more than anything in broadcasting. GameBooth gives you reps — with a real audience, on real games, tracked over time. That\'s hard to replicate anywhere else.',
  },
]

export default function BroadcastTrainingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-24">

      {/* Back */}
      <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 mb-10">
        ← GameBooth
      </Link>

      {/* Hero */}
      <div className="mb-12 text-center">
        <div
          className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}
        >
          For Broadcast Students
        </div>
        <h1 className="text-4xl font-black text-white mb-4 leading-tight">
          The practice field for<br />
          <span style={{ color: '#F2871E' }}>sports broadcasters.</span>
        </h1>
        <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          Call real games live. Build a real audience. Track your improvement over time.
          GameBooth is the training tool broadcast schools have been waiting for — and it&apos;s free.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/go-live"
            className="px-8 py-4 rounded-2xl font-black text-white text-lg"
            style={{ background: '#F2871E' }}
          >
            Start Broadcasting Free →
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 rounded-2xl font-bold text-white/70 glass text-lg"
          >
            Learn More
          </Link>
        </div>
        <p className="text-white/25 text-sm mt-4">No credit card. No equipment. Just a mic.</p>
      </div>

      {/* The problem */}
      <div className="glass rounded-3xl p-8 mb-6">
        <h2 className="text-2xl font-black text-white mb-4">Broadcast schools teach the craft. Nobody gives you the reps.</h2>
        <p className="text-white/50 leading-relaxed mb-4">
          You can study Mike Breen&apos;s cadence. You can read books on sports journalism. You can practice in a recording booth with three classmates pretending to listen.
        </p>
        <p className="text-white/50 leading-relaxed mb-4">
          But nothing replaces calling a real game with a real audience — the kind of pressure that exposes bad habits and builds real confidence.
        </p>
        <p className="text-white/70 font-semibold leading-relaxed">
          GameBooth gives you that. Any game, any time, with real listeners from day one.
        </p>
      </div>

      {/* Features */}
      <h2 className="text-2xl font-black text-white mb-6 mt-10">Everything you need to get better, faster</h2>
      <div className="grid gap-4 mb-12">
        {FEATURES.map(({ emoji, title, body }) => (
          <div key={title} className="glass rounded-2xl p-5 flex gap-4">
            <span className="text-2xl flex-shrink-0">{emoji}</span>
            <div>
              <h3 className="font-bold text-white mb-1">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick tips */}
      <div
        className="rounded-3xl p-8 mb-12"
        style={{ background: 'rgba(242,135,30,0.06)', border: '1px solid rgba(242,135,30,0.2)' }}
      >
        <h2 className="text-xl font-black text-white mb-5">
          🎙️ Quick tips from working broadcasters
        </h2>
        <ul className="space-y-3">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-white/65 leading-relaxed">
              <span className="flex-shrink-0 font-black" style={{ color: '#F2871E' }}>{i + 1}.</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* How it works */}
      <h2 className="text-2xl font-black text-white mb-6">How to use GameBooth for practice</h2>
      <div className="space-y-4 mb-12">
        {[
          { n: '1', title: 'Create a free account', body: 'Sign up in 30 seconds. No credit card, no app download required — GameBooth is a web app that works on your phone or laptop.' },
          { n: '2', title: 'Find a live game', body: 'The home screen shows every game happening right now across major leagues. Pick one you know well — familiarity with the teams makes your commentary sharper.' },
          { n: '3', title: 'Open your booth', body: 'Hit Go Live, pick your vibe (Homer, Film Room, Unfiltered, etc.), name your booth, and start broadcasting. Your mic goes live immediately.' },
          { n: '4', title: 'Call the game', body: 'Watch the volume meter — it shows your mic levels in real time. Check your listener count. Read the chat. Call the game like you mean it.' },
          { n: '5', title: 'Review your stats', body: 'After every broadcast, check your profile for session stats. How long did you go? How many listeners? Compare it to last time.' },
        ].map(({ n, title, body }) => (
          <div key={n} className="flex gap-4 glass rounded-2xl p-5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(242,135,30,0.2)', color: '#F2871E' }}
            >
              {n}
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <h2 className="text-2xl font-black text-white mb-6">Common questions</h2>
      <div className="space-y-4 mb-12">
        {FAQ.map(({ q, a }) => (
          <div key={q} className="glass rounded-2xl p-5">
            <h3 className="font-bold text-white mb-2">{q}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      {/* Are you a professor? */}
      <div
        className="rounded-3xl p-8 mb-12 text-center"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-3xl mb-4">🏫</div>
        <h2 className="text-xl font-black text-white mb-3">Are you a broadcast professor or program director?</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-5">
          We&apos;re building tools for instructors to track student broadcasts, leave feedback, and run GameBooth inside a curriculum. If you&apos;re interested in piloting it at your program, we&apos;d love to talk.
        </p>
        <a
          href="mailto:support@gamebooth.app?subject=Broadcast Program Inquiry"
          className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E', border: '1px solid rgba(242,135,30,0.3)' }}
        >
          Get in touch →
        </a>
      </div>

      {/* Final CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-3">Start calling games tonight.</h2>
        <p className="text-white/40 text-sm mb-6">Free. No equipment. Real games. Real listeners.</p>
        <Link
          href="/go-live"
          className="inline-block px-10 py-4 rounded-2xl font-black text-white text-lg"
          style={{ background: '#F2871E' }}
        >
          Go Live Now →
        </Link>
      </div>

    </div>
  )
}
