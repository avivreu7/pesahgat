'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Photo { id: string; family_name: string; photo_url: string; frame_id: number; created_at: string }

const FRAMES = [
  { id: 0, label: 'זהב וכרמים 🍷',   color: '#D4A843', accent: '#8B2635' },
  { id: 1, label: 'מצות 🫓',          color: '#C8A87A', accent: '#8B6540' },
  { id: 2, label: 'צפרדעים 🐸',       color: '#27ae60', accent: '#1a7a40' },
  { id: 3, label: 'ליל הסדר 🕯️',     color: '#2c3e50', accent: '#f39c12' },
  { id: 4, label: 'קיבוץ גת 🌾',      color: '#5A8A3C', accent: '#D4A843' },
]

const FRAME_EMOJIS = ['🍷', '🫓', '🐸', '🕯️', '🌾']

function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, frameId: number) {
  const f = FRAMES[frameId]
  const border = Math.round(w * 0.045)

  // Outer border
  ctx.strokeStyle = f.color
  ctx.lineWidth   = border
  ctx.strokeRect(border / 2, border / 2, w - border, h - border)

  // Inner thin border
  ctx.strokeStyle = f.accent
  ctx.lineWidth   = 3
  ctx.strokeRect(border + 4, border + 4, w - (border + 4) * 2, h - (border + 4) * 2)

  // Corner emojis
  const emoji = FRAME_EMOJIS[frameId]
  const es    = Math.round(w * 0.08)
  ctx.font = `${es}px serif`
  const pad = border + 2
  ctx.fillText(emoji, pad,         pad + es)
  ctx.fillText(emoji, w - pad - es, pad + es)
  ctx.fillText(emoji, pad,         h - pad)
  ctx.fillText(emoji, w - pad - es, h - pad)
}

export default function PhotoBooth({ initial }: { initial: Photo[] }) {
  const [step,       setStep]       = useState<'name' | 'frame' | 'camera' | 'preview' | 'done'>('name')
  const [familyName, setFamilyName] = useState('')
  const [frameId,    setFrameId]    = useState(0)
  const [photos,     setPhotos]     = useState<Photo[]>(initial)
  const [sending,    setSending]    = useState(false)
  const [permErr,    setPermErr]    = useState(false)
  const [captured,   setCaptured]   = useState<string | null>(null)

  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /* Poll gallery every 10s */
  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch('/api/photobooth', { cache: 'no-store' })
        const data = await res.json()
        setPhotos(data)
      } catch { /* silent */ }
    }
    const id = setInterval(poll, 10_000)
    return () => clearInterval(id)
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      setStep('camera')
    } catch { setPermErr(true) }
  }

  useEffect(() => {
    if (step === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [step])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const capture = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const W = 800, H = 600
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -W, 0, W, H)
    ctx.restore()

    drawFrame(ctx, W, H, frameId)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
    setCaptured(dataUrl)
    stopCamera()
    setStep('preview')
  }

  const retake = () => {
    setCaptured(null)
    startCamera().then(() => setStep('camera'))
  }

  const upload = async () => {
    if (!captured) return
    setSending(true)
    try {
      const res = await fetch('/api/photobooth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_name: familyName, frame_id: frameId, image_data: captured }),
      })
      const newPhoto = await res.json()
      if (newPhoto?.id) {
        // Remember this photo so the user can delete/download it later
        const mine: string[] = JSON.parse(localStorage.getItem('my_photobooth_ids') ?? '[]')
        localStorage.setItem('my_photobooth_ids', JSON.stringify([newPhoto.id, ...mine]))
        // Notify gallery to refresh immediately
        window.dispatchEvent(new CustomEvent('photobooth:new'))
      }
      setPhotos(prev => [newPhoto, ...prev])
      setStep('done')
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  /* ── Steps ─────────────────────────────────────────── */
  if (step === 'name') return (
    <div className="glass p-6 flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
      <p className="text-4xl">📸</p>
      <h2 className="heading-section">עמדת הצילום</h2>
      <form onSubmit={e => { e.preventDefault(); if (familyName.trim()) setStep('frame') }} className="flex flex-col gap-3 w-full">
        <input
          value={familyName}
          onChange={e => setFamilyName(e.target.value)}
          placeholder="שם המשפחה שלכם"
          className="input text-center"
          maxLength={40}
          required
        />
        <button type="submit" className="btn-primary py-3">המשך →</button>
      </form>
    </div>
  )

  if (step === 'frame') return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto w-full">
      <h2 className="heading-section text-center">בחרו מסגרת 🖼</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, width: '100%' }}>
        {FRAMES.map(f => (
          <button
            key={f.id}
            onClick={() => setFrameId(f.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 8px', borderRadius: '1rem', cursor: 'pointer',
              border: `2.5px solid ${frameId === f.id ? f.color : 'rgba(212,168,67,0.2)'}`,
              background: frameId === f.id ? `${f.color}22` : 'rgba(255,252,235,0.05)',
              boxShadow: frameId === f.id ? `0 0 16px ${f.color}44` : 'none',
              transition: 'all 0.18s',
            }}
          >
            {/* Mini frame preview */}
            <div style={{
              width: 44, height: 44, borderRadius: 8, position: 'relative',
              border: `5px solid ${f.color}`,
              boxShadow: `inset 0 0 0 2px ${f.accent}`,
              background: `${f.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}>
              {FRAME_EMOJIS[f.id]}
            </div>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: frameId === f.id ? f.color : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
              {f.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
      {permErr && <p className="text-sm" style={{ color: 'var(--wine)' }}>❌ אין גישה למצלמה – אפשר הרשאות ורענן</p>}
      <button onClick={startCamera} className="btn-primary w-full py-3 text-base" style={{ borderRadius: '9999px' }}>
        📷 פתח מצלמה
      </button>
    </div>
  )

  if (step === 'camera') return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, borderRadius: '1rem', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: '100%', transform: 'scaleX(-1)', display: 'block' }}
        />
        {/* Frame overlay preview */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          border: `${Math.round(480 * 0.055)}px solid ${FRAMES[frameId].color}`,
          borderRadius: '1rem',
          boxShadow: `inset 0 0 0 4px ${FRAMES[frameId].accent}, 0 0 0 2px ${FRAMES[frameId].color}88`,
          outline: `2px solid ${FRAMES[frameId].accent}`,
        }}>
          {[0,1,2,3].map(pos => (
            <span key={pos} style={{
              position: 'absolute',
              top:    pos < 2 ? 10 : undefined,
              bottom: pos >= 2 ? 10 : undefined,
              right:  pos % 2 === 0 ? 10 : undefined,
              left:   pos % 2 === 1 ? 10 : undefined,
              fontSize: '1.8rem', lineHeight: 1,
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
            }}>
              {FRAME_EMOJIS[frameId]}
            </span>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={capture} className="btn-primary px-10 py-4 text-lg" style={{ borderRadius: '9999px' }}>
        📸 צלם!
      </button>
      <button onClick={() => { stopCamera(); setStep('frame') }} className="btn-ghost text-sm px-5 py-2">
        ← חזרה
      </button>
    </div>
  )

  if (step === 'preview') return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="heading-section text-center">איך זה נראה?</h2>
      {captured && (
        <img src={captured} alt="תצוגה מקדימה" style={{ width: '100%', maxWidth: 480, borderRadius: '1rem' }} />
      )}
      <div className="flex gap-3">
        <button onClick={retake} className="btn-ghost px-6 py-3">↩ צלם שוב</button>
        <button onClick={upload} disabled={sending} className="btn-primary px-6 py-3">
          {sending ? '...שולח' : '✓ שלח לגלריה!'}
        </button>
      </div>
    </div>
  )

  /* done */
  return (
    <div className="flex flex-col items-center gap-4 text-center py-6">
      <p style={{ fontSize: '4rem' }}>🎉</p>
      <h2 className="heading-section">התמונה עלתה!</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        משפחת {familyName} – כוכבי ליל הסדר! 🌟
      </p>
      <button onClick={() => { setCaptured(null); setStep('frame') }} className="btn-primary px-8 py-3">
        📷 עוד תמונה
      </button>
    </div>
  )
}

/* ── Gallery ──────────────────────────────────────────── */
export function PhotoGallery({ photos: initial }: { photos: Photo[] }) {
  const [photos,   setPhotos]  = useState<Photo[]>(initial)
  const [myIds,    setMyIds]   = useState<string[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('my_photobooth_ids') ?? '[]')
    setMyIds(ids)
  }, [])

  /* Poll gallery every 10s + immediate refresh when a new photo is uploaded */
  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch('/api/photobooth', { cache: 'no-store' })
        const data = await res.json()
        setPhotos(data)
      } catch { /* silent */ }
    }
    const onNew = () => {
      // Small delay so the API has time to persist before fetching
      setTimeout(poll, 800)
    }
    const id = setInterval(poll, 10_000)
    window.addEventListener('photobooth:new', onNew)
    return () => {
      clearInterval(id)
      window.removeEventListener('photobooth:new', onNew)
    }
  }, [])

  const downloadPhoto = async (photo: Photo) => {
    try {
      const res  = await fetch(photo.photo_url)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `pesah-gat-${photo.family_name}.jpg`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(photo.photo_url, '_blank')
    }
  }

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('למחוק את התמונה הזאת לתמיד?')) return
    setDeleting(photo.id)
    try {
      await fetch(
        `/api/photobooth?id=${photo.id}&photo_url=${encodeURIComponent(photo.photo_url)}`,
        { method: 'DELETE' },
      )
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      const updated = myIds.filter(x => x !== photo.id)
      setMyIds(updated)
      localStorage.setItem('my_photobooth_ids', JSON.stringify(updated))
    } finally { setDeleting(null) }
  }

  if (!photos.length) return (
    <p className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>
      אין תמונות עדיין – היו הראשונים! 📸
    </p>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {photos.map(p => {
        const isMine = myIds.includes(p.id)
        return (
          <div key={p.id} style={{
            borderRadius: '1rem', overflow: 'hidden',
            border: isMine ? '2px solid rgba(212,168,67,0.7)' : '1.5px solid rgba(212,168,67,0.2)',
            boxShadow: isMine ? '0 4px 20px rgba(212,168,67,0.2)' : '0 2px 10px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
            background: 'rgba(255,252,235,0.06)',
          }}>
            <div style={{ position: 'relative' }}>
              <img
                src={p.photo_url}
                alt={`משפחת ${p.family_name}`}
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
              />
              {isMine && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(212,168,67,0.9)', borderRadius: 9999,
                  padding: '2px 7px', fontSize: '0.6rem', fontWeight: 800, color: '#1a0f00',
                }}>שלי ⭐</div>
              )}
            </div>
            <div style={{ padding: '7px 10px' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--wheat)', margin: 0, textAlign: 'center' }}>
                🌾 משפחת {p.family_name}
              </p>
            </div>
            {isMine && (
              <div style={{ display: 'flex', gap: 6, padding: '0 8px 8px' }}>
                <button
                  onClick={() => downloadPhoto(p)}
                  style={{
                    flex: 1, borderRadius: 9999, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, var(--gold), var(--wine))',
                    color: 'white', fontWeight: 700, fontSize: '0.7rem', padding: '5px 0',
                  }}
                >⬇ הורד</button>
                <button
                  onClick={() => deletePhoto(p)}
                  disabled={deleting === p.id}
                  style={{
                    flex: 1, borderRadius: 9999, border: '1px solid rgba(239,68,68,0.5)',
                    cursor: 'pointer', background: 'rgba(239,68,68,0.12)',
                    color: '#f87171', fontWeight: 700, fontSize: '0.7rem', padding: '5px 0',
                  }}
                >{deleting === p.id ? '...' : '🗑 מחק'}</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
