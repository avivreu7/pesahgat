'use client'

import { useRef, useState, useTransition } from 'react'
import { addPromoAction, deletePromoAction, updatePromoAction } from '../actions'

interface Promo { id: string; title: string; video_url: string; created_at: string }

function getYoutubeThumb(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export default function AdminPromosPanel({ promos: initial }: { promos: Promo[] }) {
  const [promos,    setPromos]    = useState<Promo[]>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tab,       setTab]       = useState<'url' | 'file'>('url')
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef  = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const handleDelete = (id: string) => {
    if (!confirm('למחוק את הסרטון הזה?')) return
    const fd = new FormData()
    fd.append('id', id)
    startTransition(async () => {
      await deletePromoAction(fd)
      setPromos(p => p.filter(x => x.id !== id))
    })
  }

  const handleUpdate = (promo: Promo, formData: FormData) => {
    formData.append('id', promo.id)
    startTransition(async () => {
      await updatePromoAction(formData)
      setPromos(p => p.map(x => x.id === promo.id
        ? { ...x, title: formData.get('title') as string, video_url: formData.get('video_url') as string }
        : x))
      setEditingId(null)
    })
  }

  const handleAddUrl = (formData: FormData) => {
    startTransition(async () => {
      await addPromoAction(formData)
      window.location.reload()
    })
  }

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault()
    const file  = fileRef.current?.files?.[0]
    const title = titleRef.current?.value?.trim() ?? ''
    if (!file) return
    setFileError(null)
    setUploading(true)
    try {
      /* Step 1: get signed upload URL (bypasses Next.js 4.5MB body limit) */
      const signRes = await fetch('/api/promo-videos/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content_type: file.type || 'video/mp4' }),
      })
      const signData = await signRes.json()
      if (!signRes.ok) throw new Error(signData.error ?? 'שגיאה ביצירת URL')

      /* Step 2: upload directly to Supabase Storage */
      const uploadRes = await fetch(signData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'video/mp4' },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('שגיאה בהעלאת הקובץ')

      /* Step 3: save metadata to DB */
      const completeRes = await fetch('/api/promo-videos/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: signData.path, title: title || file.name }),
      })
      const data = await completeRes.json()
      if (!completeRes.ok) throw new Error(data.error ?? 'שגיאה בשמירה')

      setPromos(prev => [data, ...prev])
      if (fileRef.current)  fileRef.current.value  = ''
      if (titleRef.current) titleRef.current.value = ''
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'שגיאה')
    } finally { setUploading(false) }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tab toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,168,67,0.3)' }}>
        {(['url', 'file'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={t === tab ? 'btn-primary flex-1 py-2 text-sm rounded-none' : 'flex-1 py-2 text-sm'}
            style={t !== tab ? { color: 'var(--text-muted)', background: 'transparent' } : {}}
          >
            {t === 'url' ? '🔗 קישור YouTube' : '📁 קובץ MP4'}
          </button>
        ))}
      </div>

      {/* URL form */}
      {tab === 'url' && (
        <form action={handleAddUrl} className="glass-sm p-4 flex flex-col gap-3">
          <p className="font-semibold text-sm">➕ הוסף סרטון (YouTube / קישור ישיר)</p>
          <input name="title" type="text" placeholder="כותרת הסרטון" className="input" required />
          <input name="video_url" type="url" placeholder="https://www.youtube.com/watch?v=... או קישור ישיר ל-MP4" className="input" required />
          <button type="submit" disabled={isPending} className="btn-primary self-end text-sm px-5 py-2">
            {isPending ? '...מוסיף' : '➕ הוסף'}
          </button>
        </form>
      )}

      {/* File upload form */}
      {tab === 'file' && (
        <form onSubmit={handleUploadFile} className="glass-sm p-4 flex flex-col gap-3">
          <p className="font-semibold text-sm">📁 העלה קובץ MP4 ישירות</p>
          <input ref={titleRef} type="text" placeholder="כותרת הסרטון" className="input" />
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,.mp4,.webm"
            required
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            תומך בסרטונים גדולים — מועלה ישירות לאחסון (ללא הגבלת גודל)
          </p>
          {fileError && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(192,57,43,0.12)', color: '#c0392b' }}>
              ❌ {fileError}
            </p>
          )}
          <button type="submit" disabled={uploading} className="btn-primary self-end text-sm px-5 py-2">
            {uploading ? '...מעלה' : '⬆ העלה סרטון'}
          </button>
        </form>
      )}

      {/* Promo list */}
      {promos.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>אין סרטוני פרומו עדיין</p>
      )}

      <div className="flex flex-col gap-3">
        {promos.map(promo => (
          <div key={promo.id} className="glass-sm p-4 flex gap-4 items-start">
            {getYoutubeThumb(promo.video_url) ? (
              <img
                src={getYoutubeThumb(promo.video_url)!}
                alt={promo.title}
                className="w-24 h-16 object-cover rounded-lg shrink-0"
              />
            ) : isDirectVideo(promo.video_url) ? (
              <div className="w-24 h-16 rounded-lg shrink-0 flex items-center justify-center"
                   style={{ background: 'rgba(0,0,0,0.3)' }}>
                <span className="text-2xl">🎬</span>
              </div>
            ) : null}

            <div className="flex-1 min-w-0">
              {editingId === promo.id ? (
                <form action={(fd) => handleUpdate(promo, fd)} className="flex flex-col gap-2">
                  <input name="title" defaultValue={promo.title} className="input text-sm" required />
                  <input name="video_url" defaultValue={promo.video_url} className="input text-sm" required />
                  <div className="flex gap-2 mt-1">
                    <button type="submit" disabled={isPending} className="btn-primary text-xs px-4 py-1.5">שמור</button>
                    <button type="button" onClick={() => setEditingId(null)} className="btn-ghost text-xs px-4 py-1.5">ביטול</button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="font-semibold text-sm truncate">{promo.title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{promo.video_url}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setEditingId(promo.id)} className="btn-ghost text-xs px-3 py-1">✏️ ערוך</button>
                    <button onClick={() => handleDelete(promo.id)} disabled={isPending} className="btn-danger text-xs px-3 py-1">🗑 מחק</button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
