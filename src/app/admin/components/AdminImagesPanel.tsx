'use client'

import { useRef, useState } from 'react'

interface PromoImage { id: string; title: string; image_url: string }

async function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const r = Math.min(MAX / width, MAX / height)
        width  = Math.round(width  * r)
        height = Math.round(height * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = url
  })
}

export default function AdminImagesPanel({ images: initial }: { images: PromoImage[] }) {
  const [images,  setImages]  = useState<PromoImage[]>(initial)
  const [title,   setTitle]   = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [imgData, setImgData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) { setPreview(null); setImgData(null); return }
    const compressed = await compressImage(file)
    setImgData(compressed)
    setPreview(compressed)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imgData) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/promo-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, image_data: imgData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה בהעלאה')
      setImages(prev => [...prev, data])
      setTitle(''); setImgData(null); setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהעלאה')
    } finally { setLoading(false) }
  }

  const handleDelete = async (img: PromoImage) => {
    if (!confirm('למחוק את התמונה הזאת?')) return
    setImages(prev => prev.filter(x => x.id !== img.id))
    await fetch(`/api/promo-images?id=${img.id}&image_url=${encodeURIComponent(img.image_url)}`, {
      method: 'DELETE',
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleUpload} className="glass-sm p-4 flex flex-col gap-3">
        <p className="font-semibold text-sm">🖼 הוסף תמונה לקרוסלה</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          type="text"
          placeholder="כותרת (אופציונלי)"
          className="input"
          maxLength={80}
        />
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            required
            onChange={handleFile}
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          />
          {preview && (
            <img
              src={preview}
              alt="תצוגה מקדימה"
              className="w-full max-h-40 object-contain rounded-xl"
              style={{ border: '1px solid rgba(212,168,67,0.3)' }}
            />
          )}
        </div>
        {error && (
          <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'rgba(192,57,43,0.12)', color: '#c0392b' }}>
            ❌ {error}
          </p>
        )}
        <button type="submit" disabled={loading || !imgData} className="btn-primary self-end text-sm px-5 py-2">
          {loading ? '...מעלה' : '⬆ העלה תמונה'}
        </button>
      </form>

      {images.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>אין תמונות בקרוסלה עדיין</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map(img => (
          <div key={img.id} className="glass-sm rounded-xl overflow-hidden flex flex-col">
            <img src={img.image_url} alt={img.title || 'תמונה'} className="w-full h-28 object-cover" />
            {img.title && (
              <p className="text-xs font-semibold px-2 py-1 truncate" style={{ color: 'var(--text-main)' }}>
                {img.title}
              </p>
            )}
            <button
              onClick={() => handleDelete(img)}
              className="btn-danger text-xs px-3 py-1.5 m-2 mt-auto"
            >
              🗑 מחק
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
