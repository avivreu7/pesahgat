'use client'

import { useState } from 'react'

interface Drawing { id: string; family_name: string; image_url: string }

const TILE = 180      // px per tile in the composite
const LABEL_H = 28   // px for family name label
const COLS = 4        // tiles per row in souvenir

export default function QuiltSouvenir({ drawings }: { drawings: Drawing[] }) {
  const [loading, setLoading] = useState(false)

  const download = async () => {
    if (!drawings.length) return
    setLoading(true)

    try {
      const cols = Math.min(COLS, drawings.length)
      const rows = Math.ceil(drawings.length / cols)
      const W = cols * TILE
      const H = rows * (TILE + LABEL_H)

      const canvas = document.createElement('canvas')
      canvas.width  = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!

      // Background
      ctx.fillStyle = '#FFF8E8'
      ctx.fillRect(0, 0, W, H)

      // Load all images in parallel
      const loadImg = (url: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload  = () => resolve(img)
          img.onerror = reject
          // Use a CORS proxy path if needed; direct URL first
          img.src = url
        })

      const imgs = await Promise.all(drawings.map(d => loadImg(d.image_url)))

      for (let i = 0; i < drawings.length; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x   = col * TILE
        const y   = row * (TILE + LABEL_H)

        // Draw image tile
        ctx.drawImage(imgs[i], x, y, TILE, TILE)

        // Thin border
        ctx.strokeStyle = 'rgba(212,168,67,0.6)'
        ctx.lineWidth   = 2
        ctx.strokeRect(x, y, TILE, TILE)

        // Family name label
        ctx.fillStyle = 'rgba(212,168,67,0.15)'
        ctx.fillRect(x, y + TILE, TILE, LABEL_H)

        ctx.fillStyle = '#5A3A00'
        ctx.font      = `bold 12px Assistant, Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(
          drawings[i].family_name,
          x + TILE / 2,
          y + TILE + LABEL_H / 2 + 5,
        )
      }

      // Title bar
      ctx.fillStyle = 'rgba(139,38,53,0.85)'
      ctx.fillRect(0, 0, W, 36)
      ctx.fillStyle = '#FFF8E8'
      ctx.font      = 'bold 18px Assistant, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🧵 שמיכת הטלאים – קיבוץ גת פסח 2026', W / 2, 24)

      // Download
      const link = document.createElement('a')
      link.download = 'quilt-kibbutz-gat-2026.jpg'
      link.href = canvas.toDataURL('image/jpeg', 0.88)
      link.click()
    } catch (err) {
      console.error('Quilt download error:', err)
      alert('שגיאה בהורדת השמיכה – נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  if (drawings.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-3 fade-in">
      <button
        onClick={download}
        disabled={loading}
        className="btn-gold px-8 py-3 text-base"
        style={{ borderRadius: '1.2rem' }}
      >
        {loading ? '...מכין מזכרת' : '⬇ הורד את שמיכת הקיבוץ כתמונה'}
      </button>
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {drawings.length} טלאים – מזכרת משותפת לכל המשפחות
      </p>
    </div>
  )
}
