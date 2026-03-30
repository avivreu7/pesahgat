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

  ctx.strokeStyle = f.color
  ctx.lineWidth   = border
  ctx.strokeRect(border / 2, border / 2, w - border, h - border)

  ctx.strokeStyle = f.accent
  ctx.lineWidth   = 3
  ctx.strokeRect(border + 4, border + 4, w - (border + 4) * 2, h - (border + 4) * 2)

  const emoji = FRAME_EMOJIS[frameId]
  const es    = Math.round(w * 0.08)
  ctx.font = `${es}px serif`
  const pad = border + 2
  ctx.fillText(emoji, pad,          pad + es)
  ctx.fillText(emoji, w - pad - es, pad + es)
  ctx.fillText(emoji, pad,          h - pad)
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
    canvas.width = W; canvas.height = H
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
        const mine: string[] = JSON.parse(localStorage.getItem('my_photobooth_ids') ?? '[]')
        localStorage.setItem('my_photobooth_ids', JSON.stringify([newPhoto.id, ...mine]))
        window.dispatchEvent(new CustomEvent('photobooth:new'))
      }
      setPhotos(prev => [newPhoto, ...prev])
      setStep('done')
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  /* ── Steps ─────────────────────────────────────────── */
  if (step === 'name') return (
    <div className="glass p-8 flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
      <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 4px 12px rgba(212,168,67,0.4))' }}>📸</div>
      <div>
        <h2 className="heading-section mb-1">עמדת הצילום</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>צלמו תמונה חגיגית ושתפו עם הקיבוץ</p>
      </div>
      <form onSubmit={e => { e.preventDefault(); if (familyName.trim()) setStep('frame') }} className="flex flex-col gap-3 w-full">
        <input
          value={familyName}
          onChange={e => setFamilyName(e.target.value)}
          placeholder="שם המשפחה שלכם"
          className="input text-center"
          maxLength={40}
          required
        />
        <button type="submit" className="btn-primary py-3 text-base">המשך לבחירת מסגרת →</button>
      </form>
    </div>
  )

  if (step === 'frame') return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto w-full">
      <div className="text-center">
        <h2 className="heading-section mb-1">בחרו מסגרת 🖼</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>הלחצו על מסגרת כדי לראות תצוגה מקדימה</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, width: '100%' }}>
        {FRAMES.map(f => (
          <button
            key={f.id}
            onClick={() => setFrameId(f.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              padding: '12px 6px', borderRadius: '1rem', cursor: 'pointer',
              border: `2.5px solid ${frameId === f.id ? f.color : 'rgba(212,168,67,0.2)'}`,
              background: frameId === f.id ? `${f.color}18` : 'rgba(255,252,235,0.05)',
              boxShadow: frameId === f.id ? `0 0 20px ${f.color}44, 0 4px 12px ${f.color}22` : '0 2px 6px rgba(0,0,0,0.08)',
              transform: frameId === f.id ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 10, position: 'relative',
              border: `5px solid ${f.color}`,
              boxShadow: `inset 0 0 0 2px ${f.accent}`,
              background: `${f.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem',
            }}>
              {FRAME_EMOJIS[f.id]}
            </div>
            <span style={{
              fontSize: '0.6rem', fontWeight: 800, lineHeight: 1.2, textAlign: 'center',
              color: frameId === f.id ? f.color : 'var(--text-muted)',
            }}>
              {f.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Selected frame preview box */}
      <div style={{
        width: '100%', maxWidth: 280, height: 80, borderRadius: '0.75rem',
        border: `6px solid ${FRAMES[frameId].color}`,
        boxShadow: `inset 0 0 0 3px ${FRAMES[frameId].accent}, 0 6px 20px ${FRAMES[frameId].color}33`,
        background: `${FRAMES[frameId].color}10`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, transition: 'all 0.3s ease',
      }}>
        <span style={{ fontSize: '1.6rem' }}>{FRAME_EMOJIS[frameId]}</span>
        <span style={{ fontWeight: 800, color: FRAMES[frameId].color, fontSize: '0.9rem' }}>{FRAMES[frameId].label}</span>
        <span style={{ fontSize: '1.6rem' }}>{FRAME_EMOJIS[frameId]}</span>
      </div>

      {permErr && <p className="text-sm" style={{ color: 'var(--wine)' }}>❌ אין גישה למצלמה – אפשר הרשאות ורענן</p>}
      <button onClick={startCamera} className="btn-primary w-full py-4 text-base" style={{ borderRadius: '9999px', fontSize: '1rem' }}>
        📷 פתח מצלמה
      </button>
      <button onClick={() => setStep('name')} className="btn-ghost text-sm px-5 py-2">← שינוי שם</button>
    </div>
  )

  if (step === 'camera') return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, borderRadius: '1.25rem', overflow: 'hidden', boxShadow: `0 8px 32px ${FRAMES[frameId].color}44` }}>
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: '100%', transform: 'scaleX(-1)', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          border: `${Math.round(480 * 0.055)}px solid ${FRAMES[frameId].color}`,
          borderRadius: '1.25rem',
          boxShadow: `inset 0 0 0 4px ${FRAMES[frameId].accent}, 0 0 0 3px ${FRAMES[frameId].color}88`,
        }}>
          {[0,1,2,3].map(pos => (
            <span key={pos} style={{
              position: 'absolute',
              top:    pos < 2 ? 10 : undefined,
              bottom: pos >= 2 ? 10 : undefined,
              right:  pos % 2 === 0 ? 10 : undefined,
              left:   pos % 2 === 1 ? 10 : undefined,
              fontSize: '2rem', lineHeight: 1,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
            }}>
              {FRAME_EMOJIS[frameId]}
            </span>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button
        onClick={capture}
        className="btn-primary px-12 py-4 text-lg"
        style={{
          borderRadius: '9999px',
          background: `linear-gradient(135deg, ${FRAMES[frameId].color}, ${FRAMES[frameId].accent})`,
          boxShadow: `0 6px 24px ${FRAMES[frameId].color}55`,
        }}
      >
        📸 צלם!
      </button>
      <button onClick={() => { stopCamera(); setStep('frame') }} className="btn-ghost text-sm px-5 py-2">← חזרה למסגרות</button>
    </div>
  )

  if (step === 'preview') return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center">
        <h2 className="heading-section mb-1">איך זה נראה? ✨</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>אפשר לצלם שוב או לשלוח לגלריה</p>
      </div>
      {captured && (
        <img
          src={captured}
          alt="תצוגה מקדימה"
          style={{ width: '100%', maxWidth: 480, borderRadius: '1rem', boxShadow: `0 8px 32px ${FRAMES[frameId].color}44` }}
        />
      )}
      <div className="flex gap-4 w-full max-w-sm">
        <button onClick={retake} className="btn-ghost flex-1 py-3">↩ צלם שוב</button>
        <button onClick={upload} disabled={sending} className="btn-primary flex-1 py-3">
          {sending ? '...שולח' : '✓ שלח לגלריה!'}
        </button>
      </div>
    </div>
  )

  /* done */
  return (
    <div className="flex flex-col items-center gap-5 text-center py-8 max-w-sm mx-auto">
      <div style={{ fontSize: '5rem', filter: 'drop-shadow(0 4px 16px rgba(212,168,67,0.5))' }}>🎉</div>
      <div>
        <h2 className="heading-section mb-2">התמונה עלתה לגלריה!</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          משפחת {familyName} — כוכבי ליל הסדר! 🌟
        </p>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)', background: 'rgba(212,168,67,0.08)', borderRadius: '0.5rem', padding: '8px 14px' }}>
        💡 הגלליה לגלריה כדי לראות את התמונה שלכם ולהוריד אותה
      </p>
      <button onClick={() => { setCaptured(null); setStep('frame') }} className="btn-primary px-8 py-3">
        📷 עוד תמונה
      </button>
    </div>
  )
}

/* ── Gallery ──────────────────────────────────────────── */
export function PhotoGallery({ photos: initial }: { photos: Photo[] }) {
  const [photos,   setPhotos]   = useState<Photo[]>(initial)
  const [myIds,    setMyIds]    = useState<string[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const [hovered,  setHovered]  = useState<string | null>(null)

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('my_photobooth_ids') ?? '[]')
    setMyIds(ids)
  }, [])

  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch('/api/photobooth', { cache: 'no-store' })
        const data = await res.json()
        setPhotos(data)
      } catch { /* silent */ }
    }
    const onNew = () => setTimeout(poll, 800)
    const id = setInterval(poll, 10_000)
    window.addEventListener('photobooth:new', onNew)
    return () => { clearInterval(id); window.removeEventListener('photobooth:new', onNew) }
  }, [])

  const downloadPhoto = async (photo: Photo) => {
    try {
      const res  = await fetch(photo.photo_url)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = `pesah-gat-${photo.family_name}.jpg`
      link.click(); URL.revokeObjectURL(url)
    } catch { window.open(photo.photo_url, '_blank') }
  }

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('למחוק את התמונה הזאת לתמיד?')) return
    setDeleting(photo.id)
    try {
      await fetch(`/api/photobooth?id=${photo.id}&photo_url=${encodeURIComponent(photo.photo_url)}`, { method: 'DELETE' })
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      const updated = myIds.filter(x => x !== photo.id)
      setMyIds(updated)
      localStorage.setItem('my_photobooth_ids', JSON.stringify(updated))
    } finally { setDeleting(null) }
  }

  if (!photos.length) return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      background: 'rgba(212,168,67,0.04)', borderRadius: '1rem',
      border: '1.5px dashed rgba(212,168,67,0.2)',
    }}>
      <p style={{ fontSize: '3rem', marginBottom: 8 }}>📸</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
        אין תמונות עדיין — היו הראשונים לצלם!
      </p>
    </div>
  )

  return (
    <section>
      <div className="text-center mb-5">
        <h2 className="heading-section mb-1">📸 גלריית כוכבי הערב</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{photos.length} תמונות · לחצו על שלכם להורדה</p>
      </div>

      {/* Masonry-style grid using CSS columns */}
      <div style={{ columns: 2, columnGap: 12, direction: 'ltr' }}>
        {photos.map(p => {
          const isMine = myIds.includes(p.id)
          const isHovered = hovered === p.id
          return (
            <div
              key={p.id}
              style={{
                breakInside: 'avoid',
                marginBottom: 12,
                direction: 'rtl',
                borderRadius: '1rem', overflow: 'hidden',
                border: isMine
                  ? '2.5px solid rgba(212,168,67,0.75)'
                  : '1.5px solid rgba(212,168,67,0.18)',
                boxShadow: isHovered
                  ? (isMine ? '0 8px 32px rgba(212,168,67,0.35)' : '0 6px 24px rgba(0,0,0,0.25)')
                  : (isMine ? '0 4px 16px rgba(212,168,67,0.2)' : '0 2px 10px rgba(0,0,0,0.12)'),
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.22s ease',
                background: 'rgba(255,252,235,0.07)',
                cursor: 'default',
              }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Image */}
              <div style={{ position: 'relative' }}>
                <img
                  src={p.photo_url}
                  alt={`משפחת ${p.family_name}`}
                  style={{ width: '100%', display: 'block' }}
                />
                {/* "Mine" glow overlay */}
                {isMine && (
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'linear-gradient(to bottom, rgba(212,168,67,0.08), transparent 40%)',
                  }} />
                )}
                {/* "Mine" badge */}
                {isMine && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'linear-gradient(135deg, rgba(212,168,67,0.95), rgba(139,38,53,0.9))',
                    borderRadius: 9999, padding: '3px 9px',
                    fontSize: '0.6rem', fontWeight: 900, color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                    letterSpacing: '0.03em',
                  }}>⭐ שלי</div>
                )}
              </div>

              {/* Family name badge */}
              <div style={{
                padding: '8px 10px',
                background: isMine
                  ? 'linear-gradient(135deg, rgba(212,168,67,0.15), rgba(139,38,53,0.1))'
                  : 'rgba(255,252,235,0.06)',
                borderTop: isMine ? '1px solid rgba(212,168,67,0.25)' : '1px solid rgba(212,168,67,0.1)',
              }}>
                <p style={{
                  fontSize: '0.72rem', fontWeight: 800, textAlign: 'center', margin: 0,
                  color: isMine ? 'var(--wheat)' : 'var(--text-muted)',
                }}>
                  🌾 משפחת {p.family_name}
                </p>
              </div>

              {/* My photo buttons */}
              {isMine && (
                <div style={{ display: 'flex', gap: 6, padding: '6px 8px 8px' }}>
                  <button
                    onClick={() => downloadPhoto(p)}
                    style={{
                      flex: 1, borderRadius: 9999, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, var(--gold), var(--wine))',
                      color: 'white', fontWeight: 800, fontSize: '0.68rem', padding: '6px 0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >⬇ הורד</button>
                  <button
                    onClick={() => deletePhoto(p)}
                    disabled={deleting === p.id}
                    style={{
                      flex: 1, borderRadius: 9999, cursor: 'pointer',
                      border: '1px solid rgba(239,68,68,0.45)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#f87171', fontWeight: 800, fontSize: '0.68rem', padding: '6px 0',
                    }}
                  >{deleting === p.id ? '...' : '🗑 מחק'}</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
