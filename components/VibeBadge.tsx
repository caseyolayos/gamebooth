const VIBE_STYLES: Record<string, { bg: string; label: string; emoji: string }> = {
  'Hometown Homer': { bg: 'rgba(242,135,30,0.2)', label: 'Hometown Homer', emoji: '🏠' },
  'Comedy Booth': { bg: 'rgba(255,193,7,0.2)', label: 'Comedy Booth', emoji: '😂' },
  'Betting Angle': { bg: 'rgba(76,175,80,0.2)', label: 'Betting Angle', emoji: '💰' },
  'Former Athlete': { bg: 'rgba(156,39,176,0.2)', label: 'Former Athlete', emoji: '🏆' },
  'Unfiltered': { bg: 'rgba(255,69,0,0.2)', label: 'Unfiltered', emoji: '🔥' },
  'Family Friendly': { bg: 'rgba(233,30,99,0.2)', label: 'Family Friendly', emoji: '👨‍👩‍👧' },
  'Anti-Announcer': { bg: 'rgba(255,152,0,0.2)', label: 'Anti-Announcer', emoji: '📢' },
}

export default function VibeBadge({ vibe }: { vibe: string }) {
  const style = VIBE_STYLES[vibe] ?? { bg: 'rgba(255,255,255,0.1)', label: vibe, emoji: '🎙️' }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: 'white' }}
    >
      <span>{style.emoji}</span>
      <span>{style.label}</span>
    </span>
  )
}
