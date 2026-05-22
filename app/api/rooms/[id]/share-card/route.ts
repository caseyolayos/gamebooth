import { NextRequest, NextResponse } from 'next/server'
import { createCanvas, registerFont, loadImage } from 'canvas'
import path from 'path'

export const dynamic = 'force-dynamic'

try {
  const d = path.join(process.cwd(), 'public')
  registerFont(path.join(d, 'NotoSans-Regular.ttf'), { family: 'NotoSans', weight: 'normal' })
  registerFont(path.join(d, 'NotoSans-Bold.ttf'), { family: 'NotoSans', weight: 'bold' })
} catch { /* already registered */ }

const VIBE_COLORS: Record<string, string> = {
  'Unfiltered': '#FF4500', 'Comedy Booth': '#FFD700', 'Betting Angle': '#00C853',
  'Former Athlete': '#7B61FF', 'Hometown Homer': '#F2871E',
  'Family Friendly': '#00BCD4', 'Anti-Announcer': '#FF1744',
}

function ha(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}
function rr(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r)
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r)
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath()
}

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams
  const title = s.get('title') || 'Live Booth'
  const vibe = s.get('vibe') || 'Unfiltered'
  const broadcaster = s.get('broadcaster') || 'Anonymous'
  const listeners = parseInt(s.get('listeners') || '0')
  const away = s.get('away') || '', home = s.get('home') || ''
  const awayScore = s.get('awayScore') || '', homeScore = s.get('homeScore') || ''
  const league = s.get('league') || '', period = s.get('period') || ''
  const vc = VIBE_COLORS[vibe] || '#F2871E'
  const hasGame = !!(away && home && awayScore && homeScore)

  const W = 1080, H = 1920, PAD = 88
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as any

  // Use 'top' baseline everywhere — y always means TOP of text, never baseline
  ctx.textBaseline = 'top'

  // Background image (stadium scene)
  try {
    const bg = await loadImage(path.join(process.cwd(), 'public', 'gbsocialsharebg.png'))
    ctx.drawImage(bg, 0, 0, W, H)
  } catch {
    // Fallback solid background
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H)
    const g = ctx.createLinearGradient(0, 0, 0, 900)
    g.addColorStop(0, ha(vc, 0.25)); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900)
  }
  // Vibe color accent bar at top
  ctx.fillStyle = vc; ctx.fillRect(0, 0, W, 8)

  // Dark scrim over middle content area for text legibility
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(0, 80, W, H - 360) // leave top lights + bottom tagline visible

  let y = 100

  // ── LOGO ──────────────────────────────────────────────
  try {
    const logo = await loadImage(path.join(process.cwd(), 'public', 'gameboothlogo-cropped.png'))
    const lh = 80, lw = Math.round(logo.width * (lh / logo.height))
    ctx.drawImage(logo, PAD, y, lw, lh)
    y += lh + 16
  } catch {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 60px NotoSans'
    ctx.fillText('GameBooth', PAD, y); y += 72
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '26px NotoSans'
  ctx.fillText('Live Fan Commentary', PAD, y)
  y += 46
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(PAD, y, W-PAD*2, 1)
  y += 52

  // ── GAME CARD ─────────────────────────────────────────
  if (hasGame) {
    const cardH = 234
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    rr(ctx, PAD, y, W-PAD*2, cardH, 24); ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1.5; ctx.stroke()

    ctx.fillStyle = vc; ctx.font = 'bold 26px NotoSans'
    ctx.fillText(league, PAD+32, y+18)

    ctx.fillStyle = 'rgba(255,69,0,0.2)'
    rr(ctx, W-PAD-140, y+10, 118, 44, 22); ctx.fill()
    ctx.fillStyle = '#FF4500'
    ctx.beginPath(); ctx.arc(W-PAD-118, y+32, 8, 0, Math.PI*2); ctx.fill()
    ctx.font = 'bold 22px NotoSans'; ctx.fillText('LIVE', W-PAD-104, y+22)

    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '34px NotoSans'
    ctx.fillText(away, PAD+32, y+68)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 46px NotoSans'
    ctx.fillText(home, PAD+32, y+116)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#fff'; ctx.font = 'bold 72px NotoSans'
    ctx.fillText(`${awayScore} - ${homeScore}`, W-PAD-32, y+110)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '24px NotoSans'
    ctx.fillText(period, W-PAD-32, y+192)
    ctx.textAlign = 'left'
    y += cardH + 48
  }

  // ── VIBE BADGE + LIVE (same row) ─────────────────────
  const badgeH = 66
  ctx.font = 'bold 30px NotoSans'
  const vw = Math.min(ctx.measureText(vibe).width + 64, 480)
  ctx.fillStyle = ha(vc, 0.18); rr(ctx, PAD, y, vw, badgeH, 33); ctx.fill()
  ctx.strokeStyle = ha(vc, 0.5); ctx.lineWidth = 2; ctx.stroke()
  ctx.fillStyle = vc; ctx.fillText(vibe, PAD+32, y+18)

  const liveX = PAD + vw + 20
  ctx.fillStyle = 'rgba(255,69,0,0.2)'; rr(ctx, liveX, y, 120, badgeH, 33); ctx.fill()
  ctx.strokeStyle = 'rgba(255,69,0,0.4)'; ctx.lineWidth = 2; ctx.stroke()
  ctx.fillStyle = '#FF4500'
  ctx.beginPath(); ctx.arc(liveX+24, y+33, 9, 0, Math.PI*2); ctx.fill()
  ctx.font = 'bold 26px NotoSans'; ctx.fillText('LIVE', liveX+40, y+20)
  y += badgeH + 48  // clear bottom of badge + gap

  // ── TITLE ─────────────────────────────────────────────
  ctx.fillStyle = '#fff'; ctx.font = 'bold 80px NotoSans'
  const maxW = W - PAD*2
  const words = title.split(' '); let line = ''; const lineH = 94
  for (const word of words) {
    const test = line ? line+' '+word : word
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, PAD, y); y += lineH; line = word }
    else { line = test }
  }
  if (line) { ctx.fillText(line, PAD, y); y += lineH }
  y += 52

  // ── BROADCASTER ───────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(PAD, y, W-PAD*2, 1)
  y += 48

  const cx = PAD + 50, cy = y + 50, cr = 50
  ctx.fillStyle = ha(vc, 0.2)
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = ha(vc, 0.45); ctx.lineWidth = 2; ctx.stroke()
  ctx.fillStyle = vc
  ctx.beginPath(); ctx.arc(cx, cy-16, 14, 0, Math.PI*2); ctx.fill()
  ctx.fillRect(cx-10, cy-16, 20, 24)
  ctx.strokeStyle = vc; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(cx, cy+2, 22, Math.PI, 0); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy+24); ctx.lineTo(cx, cy+34); ctx.stroke()

  ctx.fillStyle = '#fff'; ctx.font = 'bold 44px NotoSans'
  ctx.fillText(broadcaster, PAD+118, y+16)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '30px NotoSans'
  ctx.fillText(listeners > 0 ? `${listeners} listening now` : 'Live on GameBooth', PAD+118, y+68)
  y += 120

  // ── LINK PLACEHOLDER BOX ─────────────────────────────
  const ctaY = Math.max(y + 70, H - 420) // leave room for baked-in tagline at bottom
  const boxX = PAD + 70, boxW = W - PAD*2 - 140, boxH = 170, boxMid = ctaY + boxH/2

  // Left arrow → (pointing right, toward the box)
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round'
  const arrowL = PAD + 10
  ctx.beginPath(); ctx.moveTo(arrowL, boxMid); ctx.lineTo(arrowL + 44, boxMid); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(arrowL + 22, boxMid - 22); ctx.lineTo(arrowL + 44, boxMid); ctx.lineTo(arrowL + 22, boxMid + 22); ctx.stroke()

  // Right arrow ← (pointing left, toward the box)
  const arrowR = W - PAD - 10
  ctx.beginPath(); ctx.moveTo(arrowR, boxMid); ctx.lineTo(arrowR - 44, boxMid); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(arrowR - 22, boxMid - 22); ctx.lineTo(arrowR - 44, boxMid); ctx.lineTo(arrowR - 22, boxMid + 22); ctx.stroke()

  // Dashed placeholder rectangle
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 3
  ctx.setLineDash([18, 12])
  rr(ctx, boxX, ctaY, boxW, boxH, 22); ctx.stroke()
  ctx.restore()

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '30px NotoSans'
  ctx.textAlign = 'center'
  ctx.fillText('add your link here', W/2, boxMid - 15)
  ctx.textAlign = 'left'

  const buf = canvas.toBuffer('image/png')
  return new NextResponse(buf as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }
  })
}
