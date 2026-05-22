'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface Broadcaster {
  id: string
  username: string
  display_name: string
  avatar_emoji: string
  avatar_url?: string
  bio?: string
  role: string
  total_broadcasts: number
  follower_count: number
  isFollowing?: boolean
}

interface ActiveRoom {
  id: string
  title: string
  vibe_tag: string
  listener_count: number
  broadcaster_id: string
}

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseClient()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Broadcaster[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [followLoading, setFollowLoading] = useState<string | null>(null)

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Load current follows
  useEffect(() => {
    if (!user) return
    supabase.from('follows').select('following_id').eq('follower_id', user.id)
      .then(({ data }) => {
        if (data) setFollowingIds(new Set(data.map(f => f.following_id)))
      })
  }, [user, supabase])

  // Load active rooms for display
  useEffect(() => {
    supabase.from('broadcast_rooms')
      .select('id, title, vibe_tag, listener_count, broadcaster_id')
      .eq('status', 'live')
      .order('listener_count', { ascending: false })
      .then(({ data }) => { if (data) setActiveRooms(data) })
  }, [supabase])

  // Search profiles
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_emoji, avatar_url, bio, role, total_broadcasts, follower_count')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user?.id ?? '00000000-0000-0000-0000-000000000000')
        .limit(20)
      setResults(data ?? [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, user, supabase])

  const toggleFollow = async (targetId: string) => {
    if (!user) { router.push('/login'); return }
    setFollowLoading(targetId)
    const isFollowing = followingIds.has(targetId)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
      setFollowingIds(prev => { const s = new Set(prev); s.delete(targetId); return s })
      // Decrement follower_count
      const { data: p } = await supabase.from('profiles').select('follower_count').eq('id', targetId).single()
      if (p) await supabase.from('profiles').update({ follower_count: Math.max(0, (p.follower_count ?? 0) - 1) }).eq('id', targetId)
      setResults(prev => prev.map(b => b.id === targetId ? { ...b, follower_count: Math.max(0, b.follower_count - 1) } : b))
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
      setFollowingIds(prev => { const s = new Set(prev); s.add(targetId); return s })
      // Increment follower_count
      const { data: p } = await supabase.from('profiles').select('follower_count').eq('id', targetId).single()
      if (p) await supabase.from('profiles').update({ follower_count: (p.follower_count ?? 0) + 1 }).eq('id', targetId)
      setResults(prev => prev.map(b => b.id === targetId ? { ...b, follower_count: b.follower_count + 1 } : b))
    }
    setFollowLoading(null)
  }

  const liveRoom = (broadcasterId: string) => activeRooms.find(r => r.broadcaster_id === broadcasterId)

  const VIBE_COLORS: Record<string, string> = {
    'Unfiltered': '#FF4500',
    'Comedy Booth': '#FFD700',
    'Betting Angle': '#00C853',
    'Former Athlete': '#7B61FF',
    'Hometown Homer': '#F2871E',
    'Family Friendly': '#00BCD4',
    'Anti-Announcer': '#FF1744',
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
          ←
        </button>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search broadcasters…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {query.trim() ? (
        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#F2871E]/30 border-t-[#F2871E] rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-white/40 text-sm">No broadcasters found for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(broadcaster => {
                const room = liveRoom(broadcaster.id)
                const isFollowing = followingIds.has(broadcaster.id)
                return (
                  <div key={broadcaster.id} className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <Link href={`/profile/${broadcaster.username}`} className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-2xl"
                          style={{ background: 'rgba(242,135,30,0.15)' }}>
                          {broadcaster.avatar_url
                            ? <img src={broadcaster.avatar_url} alt={broadcaster.display_name} className="w-full h-full object-cover" />
                            : broadcaster.avatar_emoji}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{broadcaster.display_name || broadcaster.username}</span>
                          {broadcaster.role === 'broadcaster' && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(242,135,30,0.15)', color: '#F2871E' }}>
                              🎙️ Broadcaster
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/40">@{broadcaster.username}</div>
                        {broadcaster.bio && (
                          <p className="text-xs text-white/50 mt-0.5 truncate">{broadcaster.bio}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-white/30">{broadcaster.total_broadcasts} broadcasts</span>
                          <span className="text-[10px] text-white/30">{broadcaster.follower_count} followers</span>
                        </div>
                      </div>

                      {/* Follow button */}
                      {user && user.id !== broadcaster.id && (
                        <button
                          onClick={() => toggleFollow(broadcaster.id)}
                          disabled={followLoading === broadcaster.id}
                          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50"
                          style={isFollowing
                            ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' }
                            : { background: '#F2871E', color: 'white' }
                          }>
                          {followLoading === broadcaster.id ? '…' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>

                    {/* Live room badge */}
                    {room && (
                      <Link href={`/room/${room.id}`}>
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.2)' }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#FF4500' }} />
                          <span className="text-xs font-bold text-white/80 truncate flex-1">{room.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                            style={{ background: VIBE_COLORS[room.vibe_tag] ? `${VIBE_COLORS[room.vibe_tag]}20` : 'rgba(255,255,255,0.08)', color: VIBE_COLORS[room.vibe_tag] || 'rgba(255,255,255,0.5)' }}>
                            {room.vibe_tag}
                          </span>
                          <span className="text-[10px] text-white/40 flex-shrink-0">👂{room.listener_count}</span>
                        </div>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Empty state — show live broadcasters */
        <div>
          {activeRooms.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Live Right Now</h2>
              <div className="space-y-2">
                {activeRooms.map(room => (
                  <Link key={room.id} href={`/room/${room.id}`}>
                    <div className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#FF4500' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{room.title}</p>
                        <p className="text-xs text-white/30">{room.vibe_tag}</p>
                      </div>
                      <span className="text-xs text-white/40 flex-shrink-0">👂 {room.listener_count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeRooms.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">Search for broadcasters by name or username</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
