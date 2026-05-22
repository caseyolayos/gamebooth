-- Run this in your Supabase SQL editor (GameBooth project)

-- AI Commentary table
CREATE TABLE IF NOT EXISTS ai_commentary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id text NOT NULL,
  game_id text NOT NULL,
  personality_id text NOT NULL,
  personality_name text,
  personality_emoji text,
  text text NOT NULL,
  audio_url text,
  play_text text,
  is_scoring_play boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_commentary ENABLE ROW LEVEL SECURITY;

-- Anyone can read commentary (listeners need to see it)
CREATE POLICY "Public read ai_commentary" ON ai_commentary
  FOR SELECT TO anon, authenticated USING (true);

-- Only service role can insert (server-side only)
CREATE POLICY "Service role insert ai_commentary" ON ai_commentary
  FOR INSERT TO service_role WITH CHECK (true);

-- Enable realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE ai_commentary;

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-commentary', 'ai-commentary', true)
ON CONFLICT DO NOTHING;

-- Allow public reads on audio files
CREATE POLICY "Public read ai-commentary audio" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'ai-commentary');

-- Service role can upload
CREATE POLICY "Service role upload ai-commentary" ON storage.objects
  FOR INSERT TO service_role WITH CHECK (bucket_id = 'ai-commentary');
