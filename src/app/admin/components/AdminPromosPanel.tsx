'use client'

import { useState } from 'react'
import { addPromoAction, deletePromoAction, updatePromoAction } from '../actions'
import { useTransition } from 'react'

interface Promo {
  id: string
  title: string
  video_url: string
  created_at: string
}

interface Props {
  promos: Promo[]
}

function getYoutubeThumb(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null
}

export default function AdminPromosPanel({ promos: initial }: Props) {
  const [promos, setPromos] = useState<Promo[]>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
        : x
      ))
      setEditingId(null)
    })
  }

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      await addPromoAction(formData)
      // Trigger page refresh to get the new ID from Supabase
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Add new promo form */}
      <form action={handleAdd} className="glass-sm p-4 flex flex-col gap-3">
        <p className="font-semibold text-sm">➕ הוסף סרטון חדש</p>
        <input name="title" type="text" placeholder="כותרת הסרטון" className="input" required />
        <input name="video_url" type="url" placeholder="https://www.youtube.com/watch?v=..." className="input" required />
        <button type="submit" disabled={isPending} className="btn-primary self-end text-sm px-5 py-2">
          {isPending ? '...מוסיף' : '➕ הוסף'}
        </button>
      </form>

      {/* Promo list */}
      {promos.length === 0 && (
        <p className="text-(--text-muted) text-sm text-center py-4">אין סרטוני פרומו עדיין</p>
      )}

      <div className="flex flex-col gap-3">
        {promos.map(promo => (
          <div key={promo.id} className="glass-sm p-4 flex gap-4 items-start">
            {/* Thumbnail */}
            {getYoutubeThumb(promo.video_url) && (
              <img
                src={getYoutubeThumb(promo.video_url)!}
                alt={promo.title}
                className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
              />
            )}

            {/* Info / Edit */}
            <div className="flex-1 min-w-0">
              {editingId === promo.id ? (
                <form
                  action={(fd) => handleUpdate(promo, fd)}
                  className="flex flex-col gap-2"
                >
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
                  <p className="text-(--text-muted) text-xs truncate mt-0.5">{promo.video_url}</p>
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
