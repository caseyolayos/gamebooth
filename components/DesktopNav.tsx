'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Suspense } from 'react'

const NAV_ITEMS = [
  { href: '/',         label: 'Live',     icon: '🔴' },
  { href: '/discover', label: 'Discover', icon: '🔭' },
  { href: '/booths',   label: 'Booths',   icon: '📡' },
  { href: '/profile',  label: 'Profile',  icon: '👤' },
]

const SPORTS = [
  { key: 'ALL', label: 'All Sports',   emoji: '🏟️' },
  { key: 'NBA', label: 'NBA',          emoji: '🏀' },
  { key: 'NFL', label: 'NFL',          emoji: '🏈' },
  { key: 'CFB', label: 'College FB',   emoji: '🏈' },
  { key: 'CBB', label: 'College BB',   emoji: '🏀' },
  { key: 'MLB', label: 'MLB',          emoji: '⚾' },
  { key: 'NHL', label: 'NHL',          emoji: '🏒' },
  { key: 'UFC', label: 'UFC',          emoji: '🥊' },
]

function DesktopNavInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const activeSport = searchParams.get('sport') ?? 'ALL'
  const isHomeLike = pathname === '/' || pathname === '/discover'

  return (
    <nav
      className="hidden lg:flex flex-col w-56 xl:w-60 flex-shrink-0 min-h-screen sticky top-0 border-r overflow-y-auto"
      style={{
        borderColor: 'rgba(255,255,255,0.07)',
        background: 'rgba(10,10,15,0.98)',
      }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href="/">
          <Image
            src="/gameboothlogo-cropped.png"
            alt="GameBooth"
            width={132}
            height={40}
            className="object-contain rounded-lg"
          />
        </Link>
        <p className="text-[10px] text-white/25 mt-1.5 leading-tight">Mute the TV. Pick Your Booth.</p>
      </div>

      {/* Main nav */}
      <div className="px-3 pt-3 pb-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-semibold transition-all"
              style={{
                background: active ? 'rgba(242,135,30,0.12)' : 'transparent',
                color: active ? '#F2871E' : 'rgba(255,255,255,0.55)',
                border: active ? '1px solid rgba(242,135,30,0.2)' : '1px solid transparent',
              }}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
              {label}
            </Link>
          )
        })}
      </div>

      {/* Go Live CTA */}
      <div className="px-4 py-3 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link
          href="/go-live"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-black transition-all hover:brightness-110"
          style={{
            background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)',
            color: 'white',
            boxShadow: '0 0 16px rgba(242,135,30,0.25)',
          }}
        >
          🎙️ Go Live
        </Link>
      </div>

      {/* Sport filter — only show on home/discover */}
      {isHomeLike && (
        <div className="px-3 pt-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/25 px-2 mb-2">
            Filter by Sport
          </div>
          {SPORTS.map(({ key, label, emoji }) => {
            const sportHref = key === 'ALL'
              ? pathname
              : `${pathname}?sport=${key}`
            const sportActive = activeSport === key
            return (
              <Link
                key={key}
                href={sportHref}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 text-sm transition-all"
                style={{
                  background: sportActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: sportActive ? 'white' : 'rgba(255,255,255,0.4)',
                  fontWeight: sportActive ? 700 : 400,
                }}
              >
                <span className="text-sm w-5 text-center flex-shrink-0">{emoji}</span>
                {label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: user/auth */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {user ? (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: 'rgba(242,135,30,0.15)' }}
            >
              🎙️
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white/70 truncate">
                {user.email?.split('@')[0]}
              </div>
              <Link href="/profile" className="text-[10px] text-white/30 hover:text-white/50 transition-colors">
                View profile →
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center w-full py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  )
}

export default function DesktopNav() {
  return (
    <Suspense fallback={null}>
      <DesktopNavInner />
    </Suspense>
  )
}
