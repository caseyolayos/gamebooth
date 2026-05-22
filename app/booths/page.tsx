'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import RoomCard from '@/components/RoomCard'
import { enrichRoomsWithGameData } from '@/lib/enrichRooms'

export default function BoothsPage() {
  const { user, loading } = useAuth()
  const [rooms, setRooms] = useState<any[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setRoomsLoading(true)
    const supabase = getSupabaseClient()
    supabase
      .from('broadcast_rooms')
      .select(`*, profiles (username, display_name, avatar_emoji, avatar_url), games (league, home_team, away_team, status)`)
      .in('status', ['live', 'ended'])
      .order('started_at', { ascending: false })
      .limit(20)
      .then(async ({ data }) => {
        const enriched = await enrichRoomsWithGameData(data ?? [])
        setRooms(enriched)
        setRoomsLoading(false)
      })
  }, [user])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 text-center">
        <div className="w-8 h-8 border-2 border-[#F2871E]/30 border-t-[#F2871E] rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!user) {
    return (
      <div
        className="max-w-lg mx-auto px-4 relative"
        style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: -80, left: -60,
            width: 420, height: 360,
            background: 'radial-gradient(ellipse at 25% 25%, rgba(242,135,30,0.11) 0%, rgba(242,135,30,0.03) 45%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.007) 3px, rgba(255,255,255,0.007) 4px)',
          }} />
        </div>

        <div className="relative text-center" style={{ zIndex: 1 }}>
          <div className="mx-auto mb-6" style={{ width: 72, height: 72 }}>
            <Image src="/gblogo.png" alt="GameBooth" width={72} height={72} className="object-contain" />
          </div>

          <h1 className="text-3xl font-black mb-2 leading-tight">
            Your booths.<br />Your game.
          </h1>
          <p className="text-white/45 text-sm mb-8 leading-relaxed">
            Follow your favorite broadcasters.<br />Never miss a booth.
          </p>

          <div className="space-y-3 mb-8 text-left max-w-xs mx-auto">
            {[
              { icon: '📡', label: 'Follow your favorite booths',   sub: 'Get notified when they go live' },
              { icon: '🔖', label: 'Save booths for later',          sub: 'Bookmark games and replays' },
              { icon: '📜', label: 'Your booth history',             sub: 'Every broadcast you\'ve joined' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-lg mt-0.5">{icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white/90">{label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <a
            href="/login"
            className="inline-flex items-center justify-center w-full max-w-xs py-4 rounded-2xl font-black text-base"
            style={{
              background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)',
              color: 'white',
              boxShadow: '0 0 24px rgba(242,135,30,0.4), 0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            Sign In to Follow Booths
          </a>
          <p className="text-xs text-white/25 mt-3">Free forever.</p>
        </div>
      </div>
    )
  }

  const liveRooms  = rooms.filter(r => r.status === 'live')
  const endedRooms = rooms.filter(r => r.status === 'ended')

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">📡</div>
      <p className="text-white/40 text-sm">No booths yet.</p>
      <Link href="/discover"
        className="inline-block mt-4 text-sm font-bold px-4 py-2 rounded-xl"
        style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}>
        Browse in Discover
      </Link>
    </div>
  )

  return (
    <>
      {/* ── DESKTOP LAYOUT (lg+) ── */}
      <div className="hidden lg:block px-6 pt-6 max-w-5xl xl:max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Booths</h1>
            <p className="text-sm text-white/35 mt-0.5">Following · Live · Recent</p>
          </div>
          <Link
            href="/go-live"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black"
            style={{ background: '#F2871E', color: 'white' }}
          >
            🎙️ Go Live
          </Link>
        </div>

        {/* Following CTA */}
        <div className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3"
          style={{ background: 'rgba(242,135,30,0.06)', border: '1px solid rgba(242,135,30,0.13)' }}>
          <span className="text-xl">📡</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white/70">Following &amp; saved booths</div>
            <div className="text-xs text-white/35 mt-0.5">Coming soon — follow your favorite broadcasters</div>
          </div>
        </div>

        {roomsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-[#F2871E]/30 border-t-[#F2871E] rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {liveRooms.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="live-dot inline-block" />
                  <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#FF4500' }}>
                    Live Now
                  </h2>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {liveRooms.map(room => <RoomCard key={room.id} room={room} />)}
                </div>
              </section>
            )}

            {endedRooms.length > 0 && (
              <section className="mb-8">
                <h2 className="font-bold text-sm uppercase tracking-wider text-white/30 mb-4">
                  Recent Booths
                </h2>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {endedRooms.map(room => <RoomCard key={room.id} room={room} />)}
                </div>
              </section>
            )}
          </>
        )}

        <div className="h-8" />
      </div>

      {/* ── MOBILE LAYOUT (< lg) ── */}
      <div className="lg:hidden max-w-lg mx-auto px-4 pt-6">
        <div className="mb-5">
          <h1 className="text-xl font-black">Booths</h1>
          <p className="text-xs text-white/35 mt-0.5">Following · Saved · History</p>
        </div>

        <div className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3"
          style={{ background: 'rgba(242,135,30,0.06)', border: '1px solid rgba(242,135,30,0.13)' }}>
          <span className="text-xl">📡</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white/70">Following &amp; saved booths</div>
            <div className="text-xs text-white/35 mt-0.5">Coming soon — follow your favorite broadcasters</div>
          </div>
        </div>

        {roomsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-[#F2871E]/30 border-t-[#F2871E] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {liveRooms.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="live-dot inline-block" />
                  <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#FF4500' }}>
                    Live Now
                  </h2>
                </div>
                <div className="space-y-3">
                  {liveRooms.map(room => <RoomCard key={room.id} room={room} />)}
                </div>
              </section>
            )}

            {endedRooms.length > 0 && (
              <section className="mb-6">
                <h2 className="font-bold text-sm uppercase tracking-wider text-white/30 mb-3">
                  Recent Booths
                </h2>
                <div className="space-y-3">
                  {endedRooms.map(room => <RoomCard key={room.id} room={room} />)}
                </div>
              </section>
            )}

            {rooms.length === 0 && <EmptyState />}
          </>
        )}

        <div className="h-6" />
      </div>
    </>
  )
}
