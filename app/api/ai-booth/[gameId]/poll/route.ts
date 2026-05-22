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

  // Find new plays
  const newPlays = getNewPlays(summary.plays, lastSeenSequence)
  const newLastSeen = summary.plays[summary.plays.length - 1]?.sequenceNumber ?? lastSeenSequence

  // Pick target play or use filler if no new plays
  const targetPlay = newPlays.find(p => p.scoringPlay) ?? newPlays[newPlays.length - 1] ?? null
  const isFiller = targetPlay === null

  // Build prompt
  const gameContext = `Game: ${summary.awayTeam} (${summary.awayScore}) @ ${summary.homeTeam} (${summary.homeScore})${summary.period > 0 ? `, Period ${summary.period}` : ''}${summary.clock ? ` — ${summary.clock}` : ''}`

  const prompt = isFiller
    ? `${gameContext}\n\nThere's a pause in the action. ${personality.fillerPrompt}`
    : `${gameContext}\nPlay: ${targetPlay!.text}\n\nGive your commentary on this play.`

  const systemPrompt = isFiller ? personality.fillerPrompt : personality.systemPrompt

  // Generate commentary
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 100,
    temperature: 0.92,
  })

  const commentaryText = completion.choices[0]?.message?.content?.trim() ?? ''
  if (!commentaryText) return NextResponse.json({ commentary: null, lastSeenSequence: newLastSeen })

  // Generate audio via ElevenLabs with proper voice settings
  let audioUrl: string | null = null
  try {
    const audioStream = await elevenlabs.generate({
      voice: personality.voiceId,
      text: commentaryText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: personality.voiceSettings.stability,
        similarity_boost: personality.voiceSettings.similarity_boost,
        style: personality.voiceSettings.style,
        use_speaker_boost: personality.voiceSettings.use_speaker_boost,
      },
    })

    const chunks: Buffer[] = []
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk))
    }
    const audioBuffer = Buffer.concat(chunks)

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
  }

  // Store + broadcast via Supabase realtime
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
      play_text: targetPlay?.text ?? null,
      is_scoring_play: targetPlay?.scoringPlay ?? false,
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
      playText: targetPlay?.text ?? null,
      isScoringPlay: targetPlay?.scoringPlay ?? false,
      isFiller,
    },
    lastSeenSequence: newLastSeen,
    score: {
      home: summary.homeScore,
      away: summary.awayScore,
      period: summary.period,
      clock: summary.clock,
    },
  })
}
