const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outDir = path.join(__dirname, '../public/icons')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

for (const size of sizes) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Dark background
  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, size, size)

  // Blue gradient circle
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.45)
  gradient.addColorStop(0, '#00A3FF')
  gradient.addColorStop(1, '#0070CC')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2)
  ctx.fill()

  // Microphone emoji or "FC" text
  const fontSize = Math.floor(size * 0.38)
  ctx.fillStyle = 'white'
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('FC', size / 2, size / 2)

  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buffer)
  console.log(`Generated icon-${size}.png`)
}

console.log('All icons generated!')
