# GameBooth 🎙️

> **Mute TV. Pick Your Booth.**

GameBooth is a live alternate sports commentary platform. Users mute their TV, pick a fan broadcaster, and listen to real-time audio commentary synced to the game clock. Think Spotify meets ESPN dark mode meets Discord voice rooms.

---

## What is GameBooth?

- **Broadcasters** go live for any game, choosing a vibe (Comedy Booth, Betting Angle, Hometown Homer, etc.)
- **Listeners** join a booth, sync to the game clock with provider delay presets, and tune in
- **Chat** in real-time while listening
- **Sync panel** lets listeners fine-tune audio delay to match their TV feed (cable lag, streaming delay, etc.)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + glassmorphism |
| Auth + DB | Supabase (auth, postgres, realtime) |
| Audio Rooms | LiveKit (WebRTC) |
| PWA | next-pwa + workbox |
| Deployment | Vercel |

---

## Local Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd fancast
npm install

# 2. Copy and fill in environment variables
cp .env.local.example .env.local

# 3. Run dev server
npm run dev
```

---

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run `supabase/schema.sql` to create all tables + RLS policies
4. (Optional) Run `supabase/seed.sql` to seed demo game data
5. Enable **Realtime** for `chat_messages`, `sync_markers`, and `broadcast_rooms` in the Supabase dashboard → Database → Replication
6. Copy your project URL and anon key from **Settings → API** into `.env.local`
7. Copy the service role key as well (keep it server-side only)

---

## LiveKit Setup

1. Sign up at [livekit.io](https://livekit.io) (free tier available)
2. Create a new project
3. Copy your **API Key**, **API Secret**, and **WebSocket URL** into `.env.local`
4. Broadcasters get `PUBLISH` permissions; listeners get `SUBSCRIBE` only (handled server-side in `/api/livekit/token`)

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Never expose this client-side!

# LiveKit
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=your_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-app.livekit.cloud

# App
NEXT_PUBLIC_APP_URL=https://gamebooth.app
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard and it'll auto-deploy on push.

**Important:** Add all environment variables in Vercel → Project → Settings → Environment Variables.

---

## PWA Packaging (PWABuilder)

1. Deploy to Vercel first
2. Go to [pwabuilder.com](https://www.pwabuilder.com)
3. Enter your deployed URL
4. Download iOS or Android package
5. For iOS: Submit through Xcode to App Store
6. For Android: Upload `.aab` to Google Play

---

## Project Structure

```
fancast/
├── app/
│   ├── layout.tsx           # Root layout + bottom nav
│   ├── page.tsx             # Home: today's games
│   ├── live/page.tsx        # Live broadcasts list
│   ├── games/[id]/page.tsx  # Game detail + booths
│   ├── room/[id]/           # Broadcaster/listener room
│   ├── go-live/page.tsx     # 3-step go-live flow
│   ├── profile/page.tsx     # User profile
│   ├── login/page.tsx       # Auth
│   ├── onboarding/page.tsx  # Post-signup setup
│   ├── offline/page.tsx     # PWA offline fallback
│   └── api/livekit/token/   # LiveKit JWT endpoint
├── components/
│   ├── BottomNav.tsx        # Mobile tab bar
│   ├── GameCard.tsx         # Game display card
│   ├── RoomCard.tsx         # Broadcast room card
│   ├── VibeBadge.tsx        # Vibe tag badge
│   ├── AudioPlayer.tsx      # LiveKit audio player
│   ├── SyncPanel.tsx        # Sync controls
│   └── ChatPanel.tsx        # Realtime chat
├── lib/
│   ├── supabase.ts          # Browser Supabase client
│   ├── supabaseServer.ts    # Server Supabase client
│   ├── auth.tsx             # useAuth hook + provider
│   └── livekit.ts           # LiveKit helpers
├── supabase/
│   ├── schema.sql           # Full database schema + RLS
│   └── seed.sql             # Demo game data
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker
│   └── icons/               # PWA icons (72–512px)
└── .env.local.example       # Environment variable template
```

---

## Legal Notes

⚖️ GameBooth is designed for **original fan commentary only**. Broadcasters must not:
- Stream official broadcast audio from TV/radio
- Stream game video
- Use copyrighted music

This is enforced via:
- Legal warning banner shown to all broadcasters before going live
- Terms acceptance required on signup and when starting a broadcast
- Report mechanism for listeners to flag violations

Consult legal counsel before commercial launch regarding sports audio/commentary rights in your jurisdiction.

---

## Vibe Tags

| Tag | Audience |
|-----|----------|
| 🏠 Hometown Homer | Ride-or-die fans of one team |
| 😂 Comedy Booth | Casual, funny, lighthearted |
| 💰 Betting Angle | DFS, lines, picks, props |
| 🏆 Former Athlete | Inside knowledge and analysis |
| 🔥 Unfiltered | Hot takes, raw opinions |
| 👨‍👩‍👧 Family Friendly | Clean commentary for all ages |
| 📢 Anti-Announcer | Better than the real broadcast |
