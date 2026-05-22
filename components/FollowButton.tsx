'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'

interface Props {
  targetUserId: string
  initialFollowing?: boolean
  initialFollowerCount?: number
  showCount?: boolean
  size?: 'sm' | 'md'
  onCountChange?: (delta: number) => void
}

export default function FollowButton({
  targetUserId,
  initialFollowing = false,
  initialFollowerCount,
  showCount = false,
  size = 'md',
  onCountChange,
}: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  // If we weren't given initial state, check from DB
  useEffect(() => {
    if (!user || user.id === targetUserId || initialFollowing) {
      setChecked(true)
      return
    }
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFollowing(!!data)
        setChecked(true)
      })
  }, [user, targetUserId, supabase, initialFollowing])

  // Don't render for own profile
  if (!user || user.id === targetUserId) return null

  const toggle = async () => {
    if (!user) { router.push('/login'); return }
    setLoading(true)

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)

        // Decrement follower count
        const { data: p } = await supabase
          .from('profiles')
          .select('follower_count')
          .eq('id', targetUserId)
          .single()
        if (p) {
          await supabase
            .from('profiles')
            .update({ follower_count: Math.max(0, (p.follower_count ?? 0) - 1) })
            .eq('id', targetUserId)
        }

        setIsFollowing(false)
        onCountChange?.(-1)
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId })

        // Increment follower count
        const { data: p } = await supabase
          .from('profiles')
          .select('follower_count')
          .eq('id', targetUserId)
          .single()
        if (p) {
          await supabase
            .from('profiles')
            .update({ follower_count: (p.follower_count ?? 0) + 1 })
            .eq('id', targetUserId)
        }

        setIsFollowing(true)
        onCountChange?.(1)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!checked) return null

  const isSmall = size === 'sm'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full font-bold transition-all disabled:opacity-50"
      style={{
        padding: isSmall ? '6px 14px' : '8px 20px',
        fontSize: isSmall ? '11px' : '13px',
        ...(isFollowing
          ? {
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.15)',
            }
          : {
              background: 'linear-gradient(135deg, #FF6B1A 0%, #F2871E 100%)',
              color: 'white',
              border: '1px solid transparent',
            }),
      }}
    >
      {loading ? (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {isFollowing ? '✓ Following' : '+ Follow'}
          {showCount && initialFollowerCount !== undefined && (
            <span className="opacity-60 ml-0.5">· {initialFollowerCount}</span>
          )}
        </>
      )}
    </button>
  )
}
