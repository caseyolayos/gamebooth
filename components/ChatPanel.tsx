'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  username: string
  message: string
  created_at: string
}

export default function ChatPanel({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Load last 50 messages
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data)
      })

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage
          // Deduplicate: drop any optimistic temp message with same content/user
          setMessages((prev) => {
            const withoutTemp = prev.filter(
              (m) => !(m.id.startsWith('temp-') && m.message === incoming.message && m.user_id === incoming.user_id)
            )
            // Don't add if already present by real ID
            if (withoutTemp.some((m) => m.id === incoming.id)) return withoutTemp
            return [...withoutTemp, incoming]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user || sending) return

    setSending(true)
    const username = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'Fan'
    const text = input.trim()

    // Optimistic update — show immediately
    const tempId = `temp-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId,
      room_id: roomId,
      user_id: user.id,
      username,
      message: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setInput('')

    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId,
      user_id: user.id,
      username,
      message: text,
    })

    if (error) {
      // Roll back optimistic message and restore input
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setInput(text)
      console.error('Chat send failed:', error.message)
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col h-64 glass rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <span className="text-sm font-semibold text-white/60">💬 Live Chat</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-hide">
        {messages.length === 0 && (
          <p className="text-center text-white/30 text-sm py-4">Be the first to chat!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 text-sm">
            <span className="font-bold text-white/70 flex-shrink-0">{msg.username}</span>
            <span className="text-white/90">{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {user ? (
        <form
          onSubmit={sendMessage}
          className="flex gap-2 p-2 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            maxLength={200}
            className="flex-1 rounded-xl px-3 py-1.5 text-sm border"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'white',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: '#F2871E', color: 'white' }}
          >
            Send
          </button>
        </form>
      ) : (
        <div className="p-2 text-center text-xs text-white/40 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <a href="/login" className="underline" style={{ color: '#F2871E' }}>Sign in</a> to chat
        </div>
      )}
    </div>
  )
}
