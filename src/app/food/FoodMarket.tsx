'use client'

import { useEffect, useRef, useState } from 'react'

interface FoodItem {
  id: string; title: string; description: string
  image_url: string | null; offered_by: string
  is_available: boolean; created_at: string
  price: number
}

const STARTING_ZUZIM = 100

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
  const [walletAnim, setWalletAnim] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('food_zuzim')
    setWallet(saved !== null ? parseInt(saved, 10) : STARTING_ZUZIM)
  }, [])

  const saveWallet = (v: number) => {
    setWallet(v)
    setWalletAnim(true)
    setTimeout(() => setWalletAnim(false), 500)
    localStorage.setItem('food_zuzim', String(v))
  }

  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch('/api/food', { cache: 'no-store' })
        const data = await res.json()
        if (Array.isArray(data)) setItems(data)
      } catch { /* silent */ }
    }
    const id = setInterval(poll, 15_000)
    return () => clearInterval(id)
  }, [])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setImgData(compressed); setPreview(compressed)
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
      if (fileRef.current) fileRef.current.value = ''
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
    if (!item.is_available && item.price > 0 && wallet !== null) saveWallet(wallet + item.price)
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_available: !x.is_available } : x))
    await fetch(`/api/food?id=${item.id}`, { method: 'PATCH' })
  }

  const available = items.filter(i => i.is_available)
  const taken     = items.filter(i => !i.is_available)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Wallet ─────────────────────────────────────── */}
      {wallet !== null && (
        <div style={{
          borderRadius: '1.5rem',
          background: 'linear-gradient(135deg, rgba(212,168,67,0.2) 0%, rgba(139,38,53,0.15) 100%)',
          border: '2px solid rgba(212,168,67,0.5)',
          boxShadow: '0 6px 28px rgba(212,168,67,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #D4A843, #8B6540)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', flexShrink: 0,
              boxShadow: '0 4px 16px rgba(212,168,67,0.4)',
              transform: walletAnim ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.6,0.64,1)',
            }}>🪙</div>
            <div>
              <p style={{
                fontWeight: 900,
                fontSize: walletAnim ? '2rem' : '1.8rem',
                color: 'var(--wheat)', lineHeight: 1, margin: 0,
                transition: 'font-size 0.3s ease',
              }}>{wallet}
                <span style={{ fontSize: '0.85rem', marginRight: 6, fontWeight: 700 }}>זוזים</span>
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '3px 0 0', fontWeight: 600 }}>הארנק שלך</p>
            </div>
          </div>
          <div style={{
            textAlign: 'center', padding: '8px 14px',
            background: 'rgba(255,255,255,0.06)', borderRadius: '0.75rem',
            border: '1px solid rgba(212,168,67,0.2)',
          }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, fontWeight: 700 }}>מטבע הקיבוץ</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>1 זוז = כוס קפה ☕</p>
          </div>
        </div>
      )}

      {/* ── Add button ──────────────────────────────────── */}
      <button
        onClick={() => setShowForm(v => !v)}
        style={{
          width: '100%', padding: '14px', borderRadius: '1rem', border: 'none', cursor: 'pointer',
          background: showForm
            ? 'rgba(90,55,10,0.15)'
            : 'linear-gradient(135deg, var(--gold) 0%, var(--wine) 100%)',
          color: showForm ? 'var(--text-muted)' : 'white',
          fontWeight: 800, fontSize: '1rem', letterSpacing: '0.01em',
          boxShadow: showForm ? 'none' : '0 4px 20px rgba(212,168,67,0.3)',
          transition: 'all 0.2s ease',
        }}
      >
        {showForm ? '✕ סגור טופס' : '➕ הציעו מנה לקיבוץ'}
      </button>

      {/* ── Form ────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass p-5 flex flex-col gap-4 fade-in" style={{ borderRadius: '1.25rem' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--wheat)', margin: '0 0 2px' }}>🍽 הצעת מנה חדשה</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>שתפו מה יש לכם להציע לחברי הקיבוץ</p>
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="שם המנה (חובה)" className="input" maxLength={80} required />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="תיאור קצר (אופציונלי)" className="input resize-none" rows={2} maxLength={300} />
          <input value={by} onChange={e => setBy(e.target.value)} placeholder="מי מציע? שם / משפחה (חובה)" className="input" maxLength={60} required />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>מחיר 🪙</span>
            <input
              type="number" min={0} max={100}
              value={price}
              onChange={e => setPrice(parseInt(e.target.value) || 0)}
              className="input w-20 text-center"
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>זוזים (0 = חינם)</span>
          </div>

          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>תמונה (אופציונלי)</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="text-sm" style={{ color: 'var(--text-muted)' }} />
            {preview && (
              <img src={preview} alt="תצוגה מקדימה" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: '0.75rem', marginTop: 8 }} />
            )}
          </div>

          <button type="submit" disabled={sending} className="btn-primary self-end px-8 py-2.5">
            {sending ? '...שולח' : '🚀 פרסם מנה'}
          </button>
        </form>
      )}

      {/* ── Available items ─────────────────────────────── */}
      {available.length > 0 && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h2 className="heading-section" style={{ marginBottom: 4 }}>🍽 זמין עכשיו</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{available.length} מנות מחכות לכם</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {available.map(item => (
              <FoodCard key={item.id} item={item} wallet={wallet} onBuy={buyItem} onToggle={toggleAvailable} />
            ))}
          </div>
        </div>
      )}

      {/* ── Taken items ─────────────────────────────────── */}
      {taken.length > 0 && (
        <div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>
            ✓ נלקח ({taken.length})
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, opacity: 0.6 }}>
            {taken.map(item => (
              <FoodCard key={item.id} item={item} wallet={wallet} onBuy={buyItem} onToggle={toggleAvailable} />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div style={{
          textAlign: 'center', padding: '52px 24px',
          background: 'rgba(212,168,67,0.04)', borderRadius: '1.25rem',
          border: '2px dashed rgba(212,168,67,0.2)',
        }}>
          <p style={{ fontSize: '3rem', marginBottom: 8 }}>🍽</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            אין מנות עדיין — היה הראשון להציע!
          </p>
        </div>
      )}
    </div>
  )
}

function FoodCard({ item, wallet, onBuy, onToggle }: {
  item: FoodItem; wallet: number | null
  onBuy: (i: FoodItem) => void; onToggle: (i: FoodItem) => void
}) {
  const [hov, setHov] = useState(false)
  const canAfford = wallet !== null && wallet >= item.price
  const isFree    = item.price === 0
  const taken     = !item.is_available

  return (
    <div
      style={{
        borderRadius: '1.25rem', overflow: 'hidden',
        background: 'rgba(255,252,235,0.07)',
        border: taken
          ? '1.5px solid rgba(90,55,10,0.2)'
          : hov
            ? '1.5px solid rgba(212,168,67,0.6)'
            : '1.5px solid rgba(212,168,67,0.25)',
        boxShadow: taken ? 'none' : hov
          ? '0 8px 32px rgba(90,55,10,0.2)'
          : '0 4px 16px rgba(90,55,10,0.1)',
        transform: hov && !taken ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.22s ease',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Image area */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {item.image_url ? (
          <>
            <img
              src={item.image_url} alt={item.title}
              style={{
                width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block',
                filter: taken ? 'grayscale(0.4) brightness(0.85)' : hov ? 'brightness(1.05)' : 'brightness(1)',
                transition: 'filter 0.22s ease',
              }}
            />
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
              background: 'linear-gradient(transparent, rgba(15,8,0,0.78))',
              pointerEvents: 'none',
            }} />
            {/* Offered-by on image */}
            <div style={{
              position: 'absolute', bottom: 8, right: 10,
              fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ opacity: 0.7 }}>🙋</span> {item.offered_by}
            </div>
            {/* Price badge on image */}
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: isFree
                ? 'linear-gradient(135deg, rgba(74,222,128,0.9), rgba(21,128,61,0.9))'
                : 'linear-gradient(135deg, rgba(212,168,67,0.95), rgba(139,38,53,0.85))',
              backdropFilter: 'blur(8px)',
              borderRadius: 9999, padding: '3px 10px',
              fontSize: '0.7rem', fontWeight: 900, color: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>
              {isFree ? '🎁 חינם' : `🪙 ${item.price}`}
            </div>
          </>
        ) : (
          <div style={{
            aspectRatio: '16/9',
            background: 'linear-gradient(135deg, rgba(212,168,67,0.1), rgba(139,38,53,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3.5rem', position: 'relative',
          }}>
            🍽
            {/* Price badge for no-image */}
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: isFree
                ? 'rgba(74,222,128,0.85)'
                : 'rgba(212,168,67,0.85)',
              borderRadius: 9999, padding: '3px 10px',
              fontSize: '0.7rem', fontWeight: 900, color: isFree ? 'white' : '#1a0f00',
            }}>
              {isFree ? '🎁 חינם' : `🪙 ${item.price}`}
            </div>
          </div>
        )}

        {/* TAKEN stamp overlay */}
        {taken && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(1px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '1.6rem', fontWeight: 900,
              color: 'rgba(100,255,130,0.95)',
              border: '3px solid rgba(100,255,130,0.85)',
              borderRadius: 8, padding: '4px 14px',
              transform: 'rotate(-14deg)',
              letterSpacing: 2,
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              boxShadow: '0 0 16px rgba(100,255,130,0.2)',
              backdropFilter: 'blur(2px)',
            }}>נלקח ✓</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
          {item.title}
        </p>
        {item.description && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{item.description}</p>
        )}
        {!item.image_url && (
          <p style={{ fontSize: '0.7rem', color: 'var(--wheat)', fontWeight: 700, margin: 0 }}>🙋 {item.offered_by}</p>
        )}

        {/* Buy / Return button */}
        {item.is_available ? (
          <button
            onClick={() => onBuy(item)}
            disabled={!isFree && !canAfford}
            style={{
              marginTop: 'auto', borderRadius: 9999, border: 'none',
              cursor: (!isFree && !canAfford) ? 'not-allowed' : 'pointer',
              padding: '10px 0', fontWeight: 800, fontSize: '0.85rem',
              background: (!isFree && !canAfford)
                ? 'rgba(90,55,10,0.12)'
                : 'linear-gradient(135deg, var(--gold) 0%, var(--wine) 100%)',
              color: (!isFree && !canAfford) ? 'var(--text-muted)' : 'white',
              boxShadow: (!isFree && !canAfford) ? 'none' : '0 4px 16px rgba(212,168,67,0.3)',
              transition: 'all 0.18s ease',
              transform: hov && (isFree || canAfford) ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {isFree
              ? '✋ קחו אותי!'
              : canAfford
                ? `✋ קנה ב-${item.price} 🪙`
                : `🪙 חסרים ${item.price - (wallet ?? 0)} זוזים`}
          </button>
        ) : (
          <button onClick={() => onToggle(item)} style={{
            marginTop: 'auto', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 9999, padding: '8px 0',
            fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600,
          }}>
            ↩ החזר לרשימה
          </button>
        )}
      </div>
    </div>
  )
}
