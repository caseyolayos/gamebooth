import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ElevenLabsClient } from 'elevenlabs'
import { createClient } from '@supabase/supabase-js'
import { getPersonality } from '@/lib/ai-booth/personalities'
import { getGameSummary, getNewPlays } from '@/lib/ai-booth/espn'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const { personalityId, lastSeenSequence, espnId, league, roomId } = await req.json()

  if (!personalityId || !roomId) {
    return NextResponse.json({ error: 'personalityId and roomId required' }, { status: 400 })
  }

  const personality = getPersonality(personalityId)
  if (!personality) return NextResponse.json({ error: 'Invalid personality' }, { status: 400 })

  // Fetch ESPN play-by-play
  const summary = await getGameSummary(espnId ?? gameId.replace('espn-', ''), league ?? 'NFL')
  if (!summary) return NextResponse.json({ error: 'Could not fetch game data' }, { status: 502 })

  // Find plays we haven't commented on yet
  const newPlays = getNewPlays(summary.plays, lastSeenSequence)
  if (newPlays.length === 0) {
    return NextResponse.json({
      commentary: null,
      lastSeenSequence,
      score: { home: summary.homeScore, away: summary.awayScore },
    })
  }

  // Pick the most interesting play (scoring plays first, otherwise most recent)
  const targetPlay = newPlays.find(p => p.scoringPlay) ?? newPlays[newPlays.length - 1]
  const newLastSeen = summary.plays[summary.plays.length - 1]?.sequenceNumber ?? lastSeenSequence

  // Build context for the LLM
  const gameContext = `Game: ${summary.awayTeam} (${summary.awayScore}) @ ${summary.homeTeam} (${summary.homeScore}), ${summary.period > 0 ? `Period/Quarter ${summary.period}` : ''} ${summary.clock}`
  const playContext = `Play: ${targetPlay.text}`

  // Generate commentary via GPT-4o
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: personality.systemPrompt },
      { role: 'user', content: `${gameContext}\n${playContext}\n\nGive your commentary on this play.` },
    ],
    max_tokens: 120,
    temperature: 0.9,
  })

  const commentaryText = completion.choices[0]?.message?.content?.trim() ?? ''
  if (!commentaryText) return NextResponse.json({ commentary: null, lastSeenSequence: newLastSeen })

  // Generate audio via ElevenLabs
  let audioUrl: string | null = null
  try {
    const audioStream = await elevenlabs.generate({
      voice: personality.voiceId,
      text: commentaryText,
      model_id: 'eleven_turbo_v2_5',
    })

    // Collect stream into buffer
    const chunks: Buffer[] = []
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk))
    }
    const audioBuffer = Buffer.concat(chunks)

    // Upload to Supabase Storage
    const filename = `${roomId}/${Date.now()}-${personalityId}.mp3`
    const { error: uploadError } = await supabase.storage
      .from('ai-commentary')
      .upload(filename, audioBuffer, { contentType: 'audio/mpeg', upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('ai-commentary').getPublicUrl(filename)
      audioUrl = urlData.publicUrl
    }
  } catch (err) {
    console.error('ElevenLabs error:', err)
    // Continue without audio — text-only fallback
  }

  // Store in DB and broadcast via Supabase realtime
  const { data: commentary } = await supabase
    .from('ai_commentary')
    .insert({
      room_id: roomId,
      game_id: gameId,
      personality_id: personalityId,
      personality_name: personality.name,
      personality_emoji: personality.emoji,
      text: commentaryText,
      audio_url: audioUrl,
      play_text: targetPlay.text,
      is_scoring_play: targetPlay.scoringPlay,
    })
    .select()
    .single()

  return NextResponse.json({
    commentary: {
      id: commentary?.id,
      text: commentaryText,
      audioUrl,
      personalityId,
      personalityName: personality.name,
      personalityEmoji: personality.emoji,
      playText: targetPlay.text,
      isScoringPlay: targetPlay.scoringPlay,
    },
    lastSeenSequence: newLastSeen,
    score: { home: summary.homeScore, away: summary.awayScore, period: summary.period, clock: summary.clock },
  })
}
