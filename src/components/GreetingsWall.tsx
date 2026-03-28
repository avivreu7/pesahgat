'use client'

import { useEffect, useState } from 'react'
import GiphyPicker from './GiphyPicker'

/* ── Types ───────────────────────────────────────────── */
interface Greeting {
  id: string
  family_name: string
  message: string
  gif_url: string | null
  created_at: string
}

interface GifResult {
  id: string; url: string; original: string; title: string
}

/* ── Single greeting card ────────────────────────────── */
function GreetingCard({ g, isNew = false }: { g: Greeting; isNew?: boolean }) {
  const time = new Date(g.created_at).toLocaleTimeString('he-IL', {
    hour: '2-digit', minute: '2-digit',
  })
  return (
    <div className={`greeting-card ${isNew ? 'card-arrive card-new' : 'fade-in'}`}>
      {g.gif_url && (
        <img
          src={g.gif_url}
          alt="GIF"
          className="w-full rounded-lg mb-3 object-contain"
          loading="lazy"
        />
      )}
      <p className="text-base leading-relaxed" style={{ color: 'var(--text-card)', zIndex: 1, position: 'relative' }}>
        {g.message}
      </p>
      <div className="flex items-center justify-between mt-3 gap-2 border-t pt-2" style={{ borderColor: 'rgba(212,168,67,0.2)' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--wheat)' }}>
          🌾 משפחת {g.family_name}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{time}</span>
      </div>
    </div>
  )
}

/* ── Submission form + preview ───────────────────────── */
interface FormProps {
  onSubmitted: (g: Greeting) => void
}

function GreetingsForm({ onSubmitted }: FormProps) {
  const [familyName, setFamilyName] = useState('')
  const [message, setMessage]       = useState('')
  const [gif, setGif]               = useState<GifResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [launching, setLaunching]   = useState(false)

  const hasContent = familyName.trim() || message.trim()

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!familyName.trim() || !message.trim() || submitting) return

    setLaunching(true)
    setSubmitting(true)
    setError(null)

    // Wait for the 3D flip animation
    await new Promise(r => setTimeout(r, 600))

    try {
      const res = await fetch('/api/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_name: familyName.trim(),
          message: message.trim(),
          gif_url: gif?.original ?? '',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'שגיאה בשמירה')
      }
      const newGreeting: Greeting = await res.json()
      onSubmitted(newGreeting)
      setFamilyName('')
      setMessage('')
      setGif(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setSubmitting(false)
      setLaunching(false)
    }
  }

  return (
    <div className="w-full max-w-150 mx-auto flex flex-col gap-4">
      {/* Form card */}
      <form onSubmit={handleSubmit} className="glass p-5 flex flex-col gap-4">
        <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--wheat)' }}>
          <span>✍️</span> שלח ברכה לכל הקיבוץ
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>שם משפחה</label>
            <input
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              placeholder="רשום את שם המשפחה שלך"
              className="input text-sm"
              maxLength={60}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>ברכה</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="חג פסח שמח לכל הקיבוץ! 🌿"
              className="input text-sm resize-none"
              rows={3}
              maxLength={400}
              required
            />
          </div>
        </div>

        <GiphyPicker onSelect={setGif} selected={gif} onClear={() => setGif(null)} />

        {error && (
          <p className="text-sm font-semibold rounded-xl px-3 py-2" style={{ background: 'rgba(192,57,43,0.12)', color: '#c0392b' }}>
            ❌ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !familyName.trim() || !message.trim()}
          className="btn-gold self-end"
        >
          {submitting ? '...שולח' : '🕊 שלח ברכה'}
        </button>
      </form>

      {/* Live floating preview */}
      {hasContent && (
        <div className={`greeting-card preview-card ${launching ? 'card-launch' : ''}`} style={{ margin: '0 auto', maxWidth: '600px', width: '100%' }}>
          {gif && (
            <img src={gif.url} alt="GIF preview" className="w-full rounded-lg mb-3 object-contain" />
          )}
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-card)', position: 'relative', zIndex: 1 }}>
            {message || <span style={{ color: 'var(--text-muted)' }}>...הברכה שלך תופיע כאן</span>}
          </p>
          <div className="flex items-center justify-between mt-3 gap-2 border-t pt-2" style={{ borderColor: 'rgba(212,168,67,0.2)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--wheat)' }}>
              🌾 משפחת {familyName || '...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main wall component ─────────────────────────────── */
export default function GreetingsWall({ initial }: { initial: Greeting[] }) {
  const [greetings, setGreetings]   = useState<Greeting[]>(initial)
  const [newlyAdded, setNewlyAdded] = useState<string | null>(null)

  /* 5-second polling */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/greetings', { cache: 'no-store' })
        if (!res.ok) return
        const data: Greeting[] = await res.json()
        setGreetings(prev => {
          if (data.length === prev.length && data[0]?.id === prev[0]?.id) return prev
          return data
        })
      } catch { /* silent */ }
    }
    const id = setInterval(poll, 5_000)
    return () => clearInterval(id)
  }, [])

  const handleNewGreeting = (g: Greeting) => {
    setGreetings(prev => (prev.some(x => x.id === g.id) ? prev : [g, ...prev]))
    setNewlyAdded(g.id)
    setTimeout(() => setNewlyAdded(null), 3_500)
  }

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <GreetingsForm onSubmitted={handleNewGreeting} />

      {greetings.length > 0 && (
        <div className="w-full max-w-150 mx-auto flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(212,168,67,0.25)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            {greetings.length} ברכות
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(212,168,67,0.25)' }} />
        </div>
      )}

      {greetings.length === 0 ? (
        <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
          אין ברכות עדיין – היה הראשון לברך! 🌾
        </p>
      ) : (
        <div className="w-full flex flex-col items-center gap-3">
          {greetings.map(g => (
            <GreetingCard
              key={g.id}
              g={g}
              isNew={g.id === newlyAdded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
