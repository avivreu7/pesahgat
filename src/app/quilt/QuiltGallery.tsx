'use client'

import { useEffect, useState } from 'react'
import QuiltSouvenir from './QuiltSouvenir'

interface Drawing { id: string; family_name: string; image_url: string }

export default function QuiltGallery({ initial }: { initial: Drawing[] }) {
  const [drawings, setDrawings] = useState<Drawing[]>(initial)
  const [hovered,  setHovered]  = useState<string | null>(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch('/api/quilt', { cache: 'no-store' })
        const data = await res.json()
        if (Array.isArray(data)) setDrawings(data)
      } catch { /* silent */ }
    }
    const onNew = (e: Event) => {
      const drawing = (e as CustomEvent).detail
      if (drawing?.id) {
        setDrawings(prev => prev.some(d => d.id === drawing.id) ? prev : [...prev, drawing])
      } else {
        setTimeout(poll, 600)
      }
    }
    const id = setInterval(poll, 15_000)
    window.addEventListener('quilt:new', onNew)
    return () => { clearInterval(id); window.removeEventListener('quilt:new', onNew) }
  }, [])

  if (drawings.length === 0) return (
    <div style={{
      textAlign: 'center', padding: '52px 24px',
      background: 'rgba(90,55,10,0.08)', borderRadius: '1.25rem',
      border: '2px dashed rgba(90,55,10,0.2)',
    }}>
      <p style={{ fontSize: '3rem', marginBottom: 10 }}>🧵</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>
        השמיכה ריקה עדיין — היו הראשונים לצייר טלאי!
      </p>
    </div>
  )

  return (
    <section className="fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 className="heading-section" style={{ marginBottom: 4 }}>🧵 שמיכת הטלאים הקהילתית</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
          {drawings.length} טלאים · כל משפחה תרמה חתיכה לשמיכה המשותפת
        </p>
      </div>

      {/* Quilt frame */}
      <div style={{
        borderRadius: '1.25rem',
        padding: 12,
        background: 'linear-gradient(135deg, #2d1a06, #1a0e03)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,168,67,0.15)',
        border: '3px solid #5c3a1e',
        position: 'relative',
      }}>
        {/* Corner decorations */}
        {['top-2 right-2', 'top-2 left-2', 'bottom-2 right-2', 'bottom-2 left-2'].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            top:    i < 2 ? 8 : undefined, bottom: i >= 2 ? 8 : undefined,
            right:  i % 2 === 0 ? 8 : undefined, left: i % 2 === 1 ? 8 : undefined,
            color: 'rgba(212,168,67,0.5)', fontSize: '1rem', lineHeight: 1,
            pointerEvents: 'none',
          }}>✦</div>
        ))}

        {/* Quilt grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 4,
          padding: 4,
        }}>
          {drawings.map((d, idx) => {
            const isHov = hovered === d.id
            /* Cycle through warm quilt colors for border variation */
            const threadColors = ['#8B6540', '#6B4C2A', '#A07848', '#5c3a1e', '#C8A87A']
            const thread = threadColors[idx % threadColors.length]

            return (
              <div
                key={d.id}
                style={{
                  borderRadius: '0.35rem',
                  overflow: 'hidden',
                  border: `3px solid ${thread}`,
                  boxShadow: isHov
                    ? `0 0 0 2px rgba(212,168,67,0.5), 0 8px 24px rgba(0,0,0,0.6)`
                    : `0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  transform: isHov ? 'scale(1.06) translateY(-2px) rotate(0.5deg)' : 'scale(1)',
                  transition: 'all 0.22s ease',
                  cursor: 'default',
                  position: 'relative',
                  zIndex: isHov ? 10 : 1,
                }}
                onMouseEnter={() => setHovered(d.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <img
                  src={d.image_url}
                  alt={`ציור של משפחת ${d.family_name}`}
                  style={{
                    width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block',
                    filter: isHov ? 'brightness(1.08)' : 'brightness(0.95)',
                    transition: 'filter 0.2s ease',
                  }}
                />
                {/* Family label */}
                <div style={{
                  background: isHov
                    ? `linear-gradient(135deg, ${thread}ee, rgba(0,0,0,0.8))`
                    : `rgba(0,0,0,0.72)`,
                  padding: '4px 7px',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'background 0.2s ease',
                }}>
                  <span style={{ fontSize: '0.55rem', color: thread }}>🧵</span>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800,
                    color: isHov ? '#F0C96A' : 'rgba(212,168,67,0.75)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    flex: 1, direction: 'rtl',
                    transition: 'color 0.2s ease',
                  }}>
                    {d.family_name}
                  </span>
                </div>

                {/* Tooltip on hover */}
                {isHov && (
                  <div style={{
                    position: 'absolute', top: -32, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(20,10,0,0.92)', backdropFilter: 'blur(8px)',
                    color: '#F0C96A', fontSize: '0.7rem', fontWeight: 800,
                    padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap',
                    border: '1px solid rgba(212,168,67,0.3)',
                    pointerEvents: 'none', zIndex: 20,
                  }}>
                    משפחת {d.family_name}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Souvenir download */}
      <div className="mt-5">
        <QuiltSouvenir drawings={drawings} />
      </div>
    </section>
  )
}
