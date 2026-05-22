'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

export interface RecordingState {
  isRecording: boolean
  isOnBreak: boolean
  duration: number   // seconds of actual commentary (breaks excluded)
  breakCount: number
  uploading: boolean
}

export function useRecording(roomId: string, userId: string) {
  const recorderRef    = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<Blob[]>([])
  const streamRef      = useRef<MediaStream | null>(null)
  const intervalRef    = useRef<ReturnType<typeof setInterval>>()
  // Keep userId in a ref so stop() always uses the latest value
  const userIdRef      = useRef(userId)
  useEffect(() => { userIdRef.current = userId }, [userId])
  const stateRef       = useRef<RecordingState>({ isRecording: false, isOnBreak: false, duration: 0, breakCount: 0, uploading: false })

  const updateState = (update: Partial<RecordingState>) => {
    setState(prev => { const next = { ...prev, ...update }; stateRef.current = next; return next })
  }

  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isOnBreak:   false,
    duration:    0,
    breakCount:  0,
    uploading:   false,
  })

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')           ? 'audio/webm'
        :                                                          'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(500)
      recorderRef.current = recorder

      // Only tick duration while NOT on break
      intervalRef.current = setInterval(() => {
        setState(prev => { if (prev.isOnBreak) return prev; const next = { ...prev, duration: prev.duration + 1 }; stateRef.current = next; return next })
      }, 1000)

      updateState({ isRecording: true })
    } catch (err) {
      console.error('Recording failed:', err)
    }
  }, [])

  const takeBreak = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause()
      updateState({ isOnBreak: true, breakCount: stateRef.current.breakCount + 1 })
    }
  }, [])

  const resumeFromBreak = useCallback(() => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume()
      updateState({ isOnBreak: false })
    }
  }, [])

  const stop = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      clearInterval(intervalRef.current)

      if (!recorderRef.current || recorderRef.current.state === 'inactive') {
        resolve(null)
        return
      }

      setState(prev => ({ ...prev, uploading: true }))
      recorderRef.current.requestData()

      recorderRef.current.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop())

        const mimeType = recorderRef.current?.mimeType ?? 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })

        if (blob.size < 2000) {
          setState(prev => ({ ...prev, uploading: false }))
          resolve(null)
          return
        }

        try {
          const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm'
          const file = new File([blob], `${roomId}.${ext}`, { type: mimeType })

          const form = new FormData()
          form.append('file',     file)
          form.append('roomId',   roomId)
          form.append('duration', String(stateRef.current.duration))
          form.append('breaks',   String(stateRef.current.breakCount))
          form.append('peak',     '0') // peak tracked in RoomView

          const res  = await fetch('/api/broadcasts/upload', { method: 'POST', body: form })
          const json = await res.json()

          if (!res.ok || !json.url) throw new Error(json.error ?? 'Upload failed')

          setState(prev => ({ ...prev, uploading: false }))
          resolve(json.url)
        } catch (err) {
          console.error('Upload failed:', err)
          setState(prev => ({ ...prev, uploading: false }))
          resolve(null)
        }
      }

      recorderRef.current.stop()
    })
  }, [roomId, userId])

  return { state, start, takeBreak, resumeFromBreak, stop }
}
