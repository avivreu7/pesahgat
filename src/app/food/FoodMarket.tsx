'use client'

import { useEffect, useRef, useState } from 'react'

interface FoodItem {
  id: string; title: string; description: string
  image_url: string | null; offered_by: string
  is_available: boolean; created_at: string
}

/* Compress image to max 600px, JPEG 0.7 using canvas */
async function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 600
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = url
  })
}

export default function FoodMarket({ initial }: { initial: FoodItem[] }) {
  const [items,    setItems]    = useState<FoodItem[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [by,       setBy]       = useState('')
  const [imgData,  setImgData]  = useState<string | null>(null)
  const [preview,  setPreview]  = useState<string | null>(null)
  const [sending,  setSending]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Poll every 15s */
  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch('/api/food', { cache: 'no-store' })
        const data = await res.json()
        setItems(data)
      } catch { /* silent */ }
    }
    const id = setInterval(poll, 15_000)
    return () => clearInterval(id)
  }, [])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setImgData(compressed)
    setPreview(compressed)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !by.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, offered_by: by, image_data: imgData }),
      })
      const newItem = await res.json()
      setItems(prev => [newItem, ...prev])
      setTitle(''); setDesc(''); setBy(''); setImgData(null); setPreview(null)
      setShowForm(false)
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  const toggleAvailable = async (item: FoodItem) => {
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_available: !x.is_available } : x))
    await fetch(`/api/food?id=${item.id}`, { method: 'PATCH' })
  }

  const available = items.filter(i => i.is_available)
  const taken     = items.filter(i => !i.is_available)

  return (
    <div className="flex flex-col gap-6">

      {/* Add button */}
      <button onClick={() => setShowForm(v => !v)} className="btn-gold w-full py-3 text-base">
        {showForm ? '✕ סגור' : '➕ הוסף מנה'}
      </button>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass p-5 flex flex-col gap-3 fade-in">
          <h3 className="font-bold" style={{ color: 'var(--wheat)' }}>🍽 הצעת מנה</h3>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="שם המנה" className="input" maxLength={80} required />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="תיאור (אופציונלי)" className="input resize-none" rows={2} maxLength={300} />
          <input value={by} onChange={e => setBy(e.target.value)} placeholder="מי מציע? (שם / משפחה)" className="input" maxLength={60} required />

          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="text-sm" style={{ color: 'var(--text-muted)' }} />
            {preview && <img src={preview} alt="תצוגה מקדימה" className="w-full max-h-40 object-contain rounded-xl mt-2" />}
          </div>

          <button type="submit" disabled={sending} className="btn-primary self-end px-6 py-2">
            {sending ? '...שולח' : '🚀 פרסם'}
          </button>
        </form>
      )}

      {/* Available items */}
      {available.length > 0 && (
        <div>
          <h2 className="heading-section mb-4 text-center">🍽 זמין עכשיו ({available.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {available.map(item => (
              <FoodCard key={item.id} item={item} onToggle={toggleAvailable} />
            ))}
          </div>
        </div>
      )}

      {/* Taken items */}
      {taken.length > 0 && (
        <div>
          <h2 className="text-center text-sm font-bold mt-2 mb-3" style={{ color: 'var(--text-muted)' }}>
            נלקח ({taken.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-55">
            {taken.map(item => (
              <FoodCard key={item.id} item={item} onToggle={toggleAvailable} />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-center text-sm py-10" style={{ color: 'var(--text-muted)' }}>
          אין מנות עדיין – היה הראשון להציע! 🍽
        </p>
      )}
    </div>
  )
}

function FoodCard({ item, onToggle }: { item: FoodItem; onToggle: (i: FoodItem) => void }) {
  return (
    <div className="glass-sm rounded-2xl overflow-hidden flex flex-col" style={{ opacity: item.is_available ? 1 : 0.6 }}>
      {item.image_url && (
        <img src={item.image_url} alt={item.title} className="w-full h-36 object-cover" />
      )}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
          {item.is_available ? '' : '✅ '}{item.title}
        </p>
        {item.description && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
        )}
        <p className="text-xs font-semibold mt-auto" style={{ color: 'var(--wheat)' }}>
          🌾 מוצע על ידי: {item.offered_by}
        </p>
        <button
          onClick={() => onToggle(item)}
          className={item.is_available ? 'btn-primary text-xs py-1.5 mt-1' : 'btn-ghost text-xs py-1.5 mt-1'}
        >
          {item.is_available ? '✋ קחו אותי!' : '↩ החזר לרשימה'}
        </button>
      </div>
    </div>
  )
}
