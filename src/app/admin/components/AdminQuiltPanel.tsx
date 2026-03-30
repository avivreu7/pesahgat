'use client'

import { useState } from 'react'
import QuiltSouvenir from '@/app/quilt/QuiltSouvenir'

interface Drawing { id: string; family_name: string; image_url: string }

export default function AdminQuiltPanel({ drawings: initial }: { drawings: Drawing[] }) {
  const [drawings, setDrawings] = useState<Drawing[]>(initial)
  const [deleting, setDeleting] = useState<string | null>(null)

  const deleteDrawing = async (d: Drawing) => {
    if (!confirm(`למחוק את הטלאי של משפחת ${d.family_name}?`)) return
    setDeleting(d.id)
    try {
      await fetch(`/api/quilt?id=${d.id}&image_url=${encodeURIComponent(d.image_url)}`, { method: 'DELETE' })
      setDrawings(prev => prev.filter(x => x.id !== d.id))
    } finally { setDeleting(null) }
  }

  if (drawings.length === 0) return (
    <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>אין ציורים עדיין.</p>
  )

  return (
    <div className="flex flex-col gap-4">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {drawings.map(d => (
          <div key={d.id} style={{
            borderRadius: '0.75rem', overflow: 'hidden',
            border: '1.5px solid rgba(212,168,67,0.35)',
            background: 'rgba(255,252,235,0.06)',
          }}>
            <img
              src={d.image_url}
              alt={`ציור של משפחת ${d.family_name}`}
              style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ padding: '4px 8px 6px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--wheat)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {d.family_name}
              </p>
              <button
                onClick={() => deleteDrawing(d)}
                disabled={deleting === d.id}
                style={{
                  fontSize: '0.62rem', padding: '3px 10px', borderRadius: 9999,
                  border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)',
                  color: '#f87171', cursor: 'pointer', fontWeight: 700, width: '100%',
                }}
              >
                {deleting === d.id ? '...' : '🗑 מחק'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-2">
        <QuiltSouvenir drawings={drawings} />
        <a href="/quilt" target="_blank" className="btn-ghost text-sm px-4 py-2">
          🔗 פתח דף שמיכה
        </a>
      </div>
    </div>
  )
}
