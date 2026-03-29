'use client'

import { useRef, useState, useTransition } from 'react'
import { uploadPromoImageAction, deletePromoImageAction } from '../actions'

interface PromoImage {
  id: string
  title: string
  image_url: string
}

interface Props {
  images: PromoImage[]
}

export default function AdminImagesPanel({ images: initial }: Props) {
  const [images,    setImages]    = useState<PromoImage[]>(initial)
  const [isPending, startTransition] = useTransition()
  const [error,     setError]     = useState<string | null>(null)
  const [preview,   setPreview]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      try {
        await uploadPromoImageAction(fd)
        window.location.reload()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'שגיאה בהעלאה')
      }
    })
  }

  const handleDelete = (img: PromoImage) => {
    if (!confirm('למחוק את התמונה הזאת?')) return
    const fd = new FormData()
    fd.append('id', img.id)
    fd.append('image_url', img.image_url)
    startTransition(async () => {
      await deletePromoImageAction(fd)
      setImages(prev => prev.filter(x => x.id !== img.id))
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Upload form */}
      <form onSubmit={handleUpload} className="glass-sm p-4 flex flex-col gap-3">
        <p className="font-semibold text-sm">🖼 הוסף תמונה לקרוסלה</p>

        <input
          name="title"
          type="text"
          placeholder="כותרת (אופציונלי)"
          className="input"
          maxLength={80}
        />

        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            name="image"
            type="file"
            accept="image/*"
            required
            onChange={handleFileChange}
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

        <button type="submit" disabled={isPending} className="btn-primary self-end text-sm px-5 py-2">
          {isPending ? '...מעלה' : '⬆ העלה תמונה'}
        </button>
      </form>

      {/* Image list */}
      {images.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>אין תמונות בקרוסלה עדיין</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map(img => (
          <div key={img.id} className="glass-sm rounded-xl overflow-hidden flex flex-col">
            <img
              src={img.image_url}
              alt={img.title || 'תמונה'}
              className="w-full h-28 object-cover"
            />
            {img.title && (
              <p className="text-xs font-semibold px-2 py-1 truncate" style={{ color: 'var(--text-main)' }}>
                {img.title}
              </p>
            )}
            <button
              onClick={() => handleDelete(img)}
              disabled={isPending}
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
