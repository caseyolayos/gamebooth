'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

type Tab = {
  href: string
  label: string
  icon?: string
  isLiveTab?: boolean
  isGoLive?: boolean
  isProfile?: boolean
}

const tabs: Tab[] = [
  { href: '/',          label: 'Live',     isLiveTab: true },
  { href: '/discover',  label: 'Discover', icon: '🔭' },
  { href: '/go-live',   label: 'Go Live',  isGoLive: true },
  { href: '/booths',    label: 'Booths',   icon: '📡' },
  { href: '/profile',   label: 'Profile',  isProfile: true },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarEmoji, setAvatarEmoji] = useState<string>('👤')

  useEffect(() => {
    if (!user) { setAvatarUrl(null); setAvatarEmoji('👤'); return }
    const supabase = getSupabaseClient()
    supabase
      .from('profiles')
      .select('avatar_url, avatar_emoji')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
        if (data?.avatar_emoji) setAvatarEmoji(data.avatar_emoji)
      })
  }, [user])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: 'rgba(10, 10, 15, 0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        overflow: 'visible',
      }}
    >
      <div
        className="flex items-center justify-around max-w-lg mx-auto py-2"
        style={{ overflow: 'visible', paddingLeft: 4, paddingRight: 4 }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 rounded-xl transition-all"
              style={{
                color: isActive ? '#F2871E' : 'rgba(255,255,255,0.5)',
                background: tab.isGoLive ? 'transparent' : (isActive ? 'rgba(242,135,30,0.1)' : 'transparent'),
                overflow: 'visible',
                paddingLeft: 10, paddingRight: 10,
                paddingTop: 6, paddingBottom: 6,
                minWidth: 0,
              }}
            >
              {/* Go Live — center FAB */}
              {tab.isGoLive ? (
                <div style={{
                  width: 50, height: 50,
                  background: isActive
                    ? 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)'
                    : 'linear-gradient(135deg, #D9720F 0%, #C4650A 100%)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -22,
                  boxShadow: isActive
                    ? '0 0 28px rgba(242,135,30,0.65), 0 4px 16px rgba(0,0,0,0.5)'
                    : '0 0 16px rgba(242,135,30,0.3), 0 4px 12px rgba(0,0,0,0.4)',
                  border: '3px solid #0a0a0f',
                  flexShrink: 0,
                  transition: 'box-shadow 0.2s ease',
                }}>
                  <svg viewBox="0 0 24 26" fill="none" style={{ width: 20, height: 20 }}>
                    <rect x="7" y="1" width="10" height="14" rx="5" stroke="white" strokeWidth="2" />
                    <path d="M3 13c0 5 4 9 9 9s9-4 9-9" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="22" x2="12" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

              /* Live — pulsing red dot */
              ) : tab.isLiveTab ? (
                <div className="flex items-center justify-center" style={{ width: 22, height: 22 }}>
                  <span className="rounded-full" style={{
                    width: 9, height: 9,
                    background: isActive ? '#FF4500' : 'rgba(255,69,0,0.4)',
                    boxShadow: isActive ? '0 0 8px rgba(255,69,0,0.7), 0 0 16px rgba(255,69,0,0.3)' : 'none',
                    animation: 'livePulse 2s ease-in-out infinite',
                    display: 'inline-block',
                  }} />
                </div>

              /* Profile — avatar */
              ) : tab.isProfile ? (
                <div
                  className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{
                    border: isActive ? '2px solid #F2871E' : '2px solid rgba(255,255,255,0.2)',
                    background: 'rgba(242,135,30,0.1)',
                  }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontSize: 13 }}>{user ? avatarEmoji : '👤'}</span>
                  )}
                </div>

              /* Default — emoji icon */
              ) : (
                <span style={{ fontSize: 18, lineHeight: '22px' }}>{tab.icon}</span>
              )}

              <span className="font-medium" style={{ fontSize: 10 }}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
