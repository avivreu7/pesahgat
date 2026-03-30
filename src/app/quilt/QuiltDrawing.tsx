'use client'

import { useEffect, useRef, useState } from 'react'

interface Drawing { id: string; family_name: string; image_url: string }

const COLORS = [
  '#C8304A', '#8B2635', '#D4A843', '#5A8A3C', '#2c7a2c',
  '#2c3e50', '#7f8c8d', '#e67e22', '#ffffff', '#000000',
]
const SIZES  = [3, 8, 18]
const SIZE_LABELS = ['דק', 'בינוני', 'עבה']

export default function QuiltDrawing({ initial }: { initial: Drawing[] }) {
  const [step,       setStep]       = useState<'name' | 'draw' | 'done'>('name')
  const [familyName, setFamilyName] = useState('')
  const [drawings,   setDrawings]   = useState<Drawing[]>(initial)
  const [color,      setColor]      = useState(COLORS[0])
  const [size,       setSize]       = useState(1)
  const [erasing,    setErasing]    = useState(false)
  const [sending,    setSending]    = useState(false)

  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const isDrawing  = useRef(false)
  const lastPos    = useRef<{ x: number; y: number } | null>(null)

  /* Initialize canvas white bg */
  useEffect(() => {
    if (step !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFF8E8'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Draw light border hint
    ctx.strokeStyle = 'rgba(212,168,67,0.4)'
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3)
  }, [step])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    isDrawing.current = true
    lastPos.current   = getPos(e, canvas)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx  = canvas.getContext('2d')!
    const pos  = getPos(e, canvas)
    const prev = lastPos.current ?? pos

    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(pos.x,  pos.y)
    ctx.strokeStyle   = erasing ? '#FFF8E8' : color
    ctx.lineWidth     = erasing ? SIZES[size] * 2.5 : SIZES[size]
    ctx.lineCap       = 'round'
    ctx.lineJoin      = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = () => { isDrawing.current = false; lastPos.current = null }

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFF8E8'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = 'rgba(212,168,67,0.4)'
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3)
  }

  const submit = async () => {
    const canvas = canvasRef.current; if (!canvas) return
    setSending(true)
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    try {
      const res = await fetch('/api/quilt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_name: familyName, image_data: imageData }),
      })
      const newDrawing = await res.json()
      setDrawings(prev => [...prev, newDrawing])
      window.dispatchEvent(new CustomEvent('quilt:new'))
      setStep('done')
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  if (step === 'name') return (
    <div className="glass p-6 flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
      <p className="text-4xl">🎨</p>
      <h2 className="heading-section">שמיכת הטלאים</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>כל משפחה מציירת טלאי אחד</p>
      <form onSubmit={e => { e.preventDefault(); if (familyName.trim()) setStep('draw') }} className="flex flex-col gap-3 w-full">
        <input
          value={familyName}
          onChange={e => setFamilyName(e.target.value)}
          placeholder="שם המשפחה"
          className="input text-center"
          maxLength={40}
          required
        />
        <button type="submit" className="btn-primary py-3">✏️ התחל לצייר</button>
      </form>
    </div>
  )

  if (step === 'draw') return (
    <div className="glass p-4 flex flex-col gap-4 w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-base" style={{ color: 'var(--wheat)' }}>
          🎨 הטלאי של משפחת {familyName}
        </h2>
        <button onClick={clearCanvas} className="btn-ghost text-xs px-3 py-1.5">נקה</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={400} height={300}
        style={{ width: '100%', borderRadius: '0.75rem', touchAction: 'none', cursor: erasing ? 'cell' : 'crosshair' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />

      {/* Tools */}
      <div className="flex flex-col gap-3">
        {/* Colors */}
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setErasing(false) }}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: c,
                border: color === c && !erasing ? '3px solid var(--wheat)' : '2px solid rgba(0,0,0,0.2)',
                cursor: 'pointer',
              }}
            />
          ))}
          <button
            onClick={() => setErasing(e => !e)}
            style={{
              padding: '0 10px', height: 28, borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700,
              background: erasing ? 'rgba(212,168,67,0.3)' : 'rgba(200,200,200,0.2)',
              border: erasing ? '2px solid var(--wheat)' : '2px solid rgba(0,0,0,0.15)',
              cursor: 'pointer', color: 'var(--text-main)',
            }}
          >
            ↩ מחק
          </button>
        </div>

        {/* Sizes */}
        <div className="flex gap-2">
          {SIZES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSize(i)}
              style={{
                flex: 1, padding: '6px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                background: size === i ? 'rgba(212,168,67,0.2)' : 'rgba(200,200,200,0.1)',
                border: `1.5px solid ${size === i ? 'var(--wheat)' : 'rgba(0,0,0,0.1)'}`,
                cursor: 'pointer', color: 'var(--text-main)',
              }}
            >
              {SIZE_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      <button onClick={submit} disabled={sending} className="btn-primary py-3 text-base">
        {sending ? '...שולח' : '✓ שלח את הטלאי שלנו!'}
      </button>
    </div>
  )

  return (
    <div className="glass p-6 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
      <p style={{ fontSize: '3rem' }}>🥳</p>
      <h2 className="heading-section">הטלאי שלכם התווסף!</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        משפחת {familyName} – תודה! הציור שלכם בשמיכה למטה
      </p>
      <button onClick={() => { setFamilyName(''); setStep('name') }} className="btn-gold px-6 py-2">
        ← משפחה נוספת
      </button>
    </div>
  )
}
