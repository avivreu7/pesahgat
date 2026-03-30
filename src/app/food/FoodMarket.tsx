'use client'

import { useEffect, useRef, useState } from 'react'

interface FoodItem {
  id: string; title: string; description: string
  image_url: string | null; offered_by: string
  is_available: boolean; created_at: string
  price: number
}

const STARTING_ZUZIM = 100

/* Compress image to max 600px JPEG 0.7, using createImageBitmap which respects EXIF orientation */
async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const MAX = 600
  let w = bitmap.width, h = bitmap.height
  if (w > MAX || h > MAX) {
    const ratio = Math.min(MAX / w, MAX / h)
    w = Math.round(w * ratio); h = Math.round(h * ratio)
  }
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.7)
}

export default function FoodMarket({ initial }: { initial: FoodItem[] }) {
  const [items,    setItems]    = useState<FoodItem[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [by,       setBy]       = useState('')
  const [price,    setPrice]    = useState(0)
  const [imgData,  setImgData]  = useState<string | null>(null)
  const [preview,  setPreview]  = useState<string | null>(null)
  const [sending,  setSending]  = useState(false)
  const [wallet,   setWallet]   = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Load wallet from localStorage */
  useEffect(() => {
    const saved = localStorage.getItem('food_zuzim')
    setWallet(saved !== null ? parseInt(saved, 10) : STARTING_ZUZIM)
  }, [])

  const saveWallet = (v: number) => {
    setWallet(v)
    localStorage.setItem('food_zuzim', String(v))
  }

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
        body: JSON.stringify({ title, description: desc, offered_by: by, image_data: imgData, price }),
      })
      const newItem = await res.json()
      setItems(prev => [newItem, ...prev])
      setTitle(''); setDesc(''); setBy(''); setPrice(0); setImgData(null); setPreview(null)
      setShowForm(false)
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  const buyItem = async (item: FoodItem) => {
    if (wallet === null || wallet < item.price) return
    saveWallet(wallet - item.price)
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_available: false } : x))
    await fetch(`/api/food?id=${item.id}`, { method: 'PATCH' })
  }

  const toggleAvailable = async (item: FoodItem) => {
    // Return to list — refund if it was bought (give back price)
    if (!item.is_available && item.price > 0 && wallet !== null) {
      saveWallet(wallet + item.price)
    }
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_available: !x.is_available } : x))
    await fetch(`/api/food?id=${item.id}`, { method: 'PATCH' })
  }

  const available = items.filter(i => i.is_available)
  const taken     = items.filter(i => !i.is_available)

  return (
    <div className="flex flex-col gap-6">

      {/* Wallet bar */}
      {wallet !== null && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,168,67,0.18) 0%, rgba(139,38,53,0.12) 100%)',
          border: '1.5px solid rgba(212,168,67,0.45)',
          borderRadius: '1.25rem', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '2.4rem', lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(212,168,67,0.5))' }}>🪙</span>
            <div>
              <p style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--wheat)', lineHeight: 1 }}>{wallet}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>זוזים בארנק</p>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>מטבע הקיבוץ 🏡</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1 זוז = כוס קפה ☕</p>
          </div>
        </div>
      )}

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

          {/* Price */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-muted)' }}>
              מחיר 🪙
            </label>
            <input
              type="number"
              min={0} max={100}
              value={price}
              onChange={e => setPrice(parseInt(e.target.value) || 0)}
              className="input w-24 text-center"
            />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>זוזים (0 = חינם)</span>
          </div>

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
              <FoodCard key={item.id} item={item} wallet={wallet} onBuy={buyItem} onToggle={toggleAvailable} />
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
              <FoodCard key={item.id} item={item} wallet={wallet} onBuy={buyItem} onToggle={toggleAvailable} />
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

function FoodCard({
  item, wallet, onBuy, onToggle,
}: {
  item: FoodItem
  wallet: number | null
  onBuy: (i: FoodItem) => void
  onToggle: (i: FoodItem) => void
}) {
  const canAfford = wallet !== null && wallet >= item.price
  const isFree    = item.price === 0
  const taken     = !item.is_available

  return (
    <div style={{
      borderRadius: '1.25rem', overflow: 'hidden',
      background: 'rgba(255,252,235,0.07)',
      border: taken ? '1.5px solid rgba(90,55,10,0.2)' : '1.5px solid rgba(212,168,67,0.3)',
      boxShadow: taken ? 'none' : '0 4px 20px rgba(90,55,10,0.13)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Taken stamp */}
      {taken && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,6,2,0.38)', backdropFilter: 'blur(1px)',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: '2.5rem', fontWeight: 900, color: '#4ade80',
            border: '3px solid #4ade80', borderRadius: 8, padding: '2px 12px',
            transform: 'rotate(-18deg)', opacity: 0.95, letterSpacing: 2,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>נלקח ✓</span>
        </div>
      )}

      {item.image_url ? (
        <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{
          height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(139,38,53,0.08))',
          fontSize: '2.5rem',
        }}>🍽</div>
      )}

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', margin: 0 }}>{item.title}</p>
        {item.description && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{item.description}</p>
        )}
        <p style={{ fontSize: '0.72rem', color: 'var(--wheat)', fontWeight: 700, margin: 0 }}>
          🌾 {item.offered_by}
        </p>

        {/* Price badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: isFree ? 'rgba(74,222,128,0.15)' : 'rgba(212,168,67,0.15)',
          border: `1px solid ${isFree ? 'rgba(74,222,128,0.4)' : 'rgba(212,168,67,0.4)'}`,
          borderRadius: 9999, padding: '2px 10px', alignSelf: 'flex-start',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isFree ? '#4ade80' : 'var(--wheat)' }}>
            {isFree ? '🎁 חינם' : `🪙 ${item.price} זוזים`}
          </span>
        </div>

        {item.is_available ? (
          <button
            onClick={() => onBuy(item)}
            disabled={!isFree && !canAfford}
            style={{
              marginTop: 4, borderRadius: 9999, border: 'none', cursor: (!isFree && !canAfford) ? 'not-allowed' : 'pointer',
              padding: '8px 0', fontWeight: 800, fontSize: '0.82rem',
              background: (!isFree && !canAfford)
                ? 'rgba(90,55,10,0.15)'
                : 'linear-gradient(135deg, var(--gold), var(--wine))',
              color: (!isFree && !canAfford) ? 'var(--text-muted)' : 'white',
              transition: 'opacity 0.15s',
            }}
          >
            {isFree ? '✋ קחו אותי!' : canAfford ? `✋ קנה ב-${item.price} 🪙` : `🪙 חסרים ${item.price - (wallet ?? 0)}`}
          </button>
        ) : (
          <button onClick={() => onToggle(item)} style={{
            marginTop: 4, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 9999, padding: '6px 0', fontSize: '0.78rem', color: 'var(--text-muted)',
            cursor: 'pointer', fontWeight: 600,
          }}>
            ↩ החזר לרשימה
          </button>
        )}
      </div>
    </div>
  )
}
