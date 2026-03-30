'use client'

import { useEffect, useState } from 'react'
import QuiltSouvenir from './QuiltSouvenir'

interface Drawing { id: string; family_name: string; image_url: string }

export default function QuiltGallery({ initial }: { initial: Drawing[] }) {
  const [drawings, setDrawings] = useState<Drawing[]>(initial)

  /* Poll every 15s + listen for new drawings from QuiltDrawing */
  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch('/api/quilt', { cache: 'no-store' })
        const data = await res.json()
        if (Array.isArray(data)) setDrawings(data)
      } catch { /* silent */ }
    }
    const onNew = () => setTimeout(poll, 600)
    const id = setInterval(poll, 15_000)
    window.addEventListener('quilt:new', onNew)
    return () => { clearInterval(id); window.removeEventListener('quilt:new', onNew) }
  }, [])

  if (drawings.length === 0) return (
    <p className="text-center text-sm py-6 fade-in" style={{ color: 'var(--text-muted)' }}>
      אין ציורים עדיין – היו הראשונים לצייר! 🎨
    </p>
  )

  return (
    <section className="fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-section">🧵 שמיכת הקיבוץ ({drawings.length} טלאים)</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 6,
      }}>
        {drawings.map(d => (
          <div key={d.id} style={{
            borderRadius: '0.5rem', overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
            border: '2px solid rgba(212,168,67,0.35)',
          }}>
            <img
              src={d.image_url}
              alt={`ציור של משפחת ${d.family_name}`}
              style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              background: 'rgba(255,252,235,0.92)', padding: '4px 8px',
              fontSize: '0.65rem', fontWeight: 700, color: 'var(--wheat)',
              textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {d.family_name}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <QuiltSouvenir drawings={drawings} />
      </div>
    </section>
  )
}
