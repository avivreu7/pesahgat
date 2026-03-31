'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Maker } from '@/app/api/kneidlach/route'

const POLL_MS   = 3_000
const LS_KEY    = 'kneidlach_name'
const MEDALS    = ['🥇', '🥈', '🥉']

/* Animated digit */
function AnimatedCount({ count }: { count: number }) {
  const [display, setDisplay] = useState(count)
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    if (count === display) return
    setFlipping(true)
    const t = setTimeout(() => { setDisplay(count); setFlipping(false) }, 180)
    return () => clearTimeout(t)
  }, [count, display])

  return (
    <span style={{
      display: 'inline-block',
      transition: 'transform 0.18s ease, opacity 0.18s ease',
      transform: flipping ? 'translateY(-12px) scale(0.85)' : 'translateY(0) scale(1)',
      opacity:   flipping ? 0 : 1,
    }}>
      {display.toLocaleString('he-IL')}
    </span>
  )
}

/* Flying kneidlach ball */
interface Ball { id: number; x: number; y: number; kx: number; ky: number; kr: number }

interface Props {
  initial: { makers: Maker[]; total: number }
}

export default function KneidlachCounter({ initial }: Props) {
  const [makers,  setMakers]  = useState<Maker[]>(initial.makers)
  const [total,   setTotal]   = useState(initial.total)
  const [name,    setName]    = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [burst,   setBurst]   = useState(false)
  const [sending, setSending] = useState(false)
  const [balls,   setBalls]   = useState<Ball[]>([])
  const btnRef = useRef<HTMLButtonElement>(null)

  /* Load name from localStorage (client only) */
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) setName(saved)
  }, [])

  /* Poll every 3s */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/kneidlach', { cache: 'no-store' })
      const { makers: m, total: t } = await res.json()
      setMakers(m)
      setTotal(t)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    const id = setInterval(fetchData, POLL_MS)
    return () => clearInterval(id)
  }, [fetchData])

  /* Flying balls */
  const spawnBalls = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top  + rect.height / 2
    const newBalls: Ball[] = Array.from({ length: 5 }, (_, i) => {
      const angle = ((i / 5) * Math.PI * 1.4) - (Math.PI * 0.7)
      const speed = 120 + (i % 3) * 55
      return {
        id: Date.now() + i,
        x:  cx + (i % 2 === 0 ? 1 : -1) * i * 8,
        y:  cy,
        kx: Math.sin(angle) * speed,
        ky: -(Math.cos(angle) * speed + 60),
        kr: (i % 2 === 0 ? 1 : -1) * (180 + i * 90),
      }
    })
    setBalls(prev => [...prev, ...newBalls])
    setTimeout(() => setBalls(prev => prev.filter(b => !newBalls.find(nb => nb.id === b.id))), 1000)
  }

  const handleClick = async () => {
    if (sending || !name) return
    setSending(true)
    spawnBalls()

    // Optimistic update
    setTotal(t => t + 1)
    setMakers(prev => {
      const existing = prev.find(m => m.maker_name === name)
      if (existing) {
        return prev
          .map(m => m.maker_name === name ? { ...m, count: m.count + 1 } : m)
          .sort((a, b) => b.count - a.count)
      }
      return [...prev, { maker_name: name, count: 1 }].sort((a, b) => b.count - a.count)
    })
    setBurst(true)
    setTimeout(() => setBurst(false), 350)

    try {
      const res = await fetch('/api/kneidlach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const { makers: m, total: t } = await res.json()
      setMakers(m)
      setTotal(t)
    } catch { /* keep optimistic */ }
    finally { setSending(false) }
  }

  const saveName = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) return
    localStorage.setItem(LS_KEY, trimmed)
    setName(trimmed)
    setEditing(false)
    setNameInput('')
  }

  const myCount = makers.find(m => m.maker_name === name)?.count ?? 0

  /* ── Name input screen ──────────────────────────────── */
  if (!name || editing) {
    const maxCount = makers[0]?.count ?? 1
    return (
      <div className="glass p-6 sm:p-8 flex flex-col items-center gap-5 text-center w-full">
        <div>
          <h2 className="heading-section mb-1">🫕 קניידלך הקיבוץ</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {editing ? 'שנה את שמך' : 'מי הכין קניידלך הלילה?'}
          </p>
        </div>
        <form onSubmit={saveName} className="flex flex-col gap-3 w-full max-w-xs">
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder={editing && name ? name : 'הכנס את שמך / שם המשפחה'}
            className="input text-center text-base"
            maxLength={40}
            autoFocus
            required
          />
          <div className="flex gap-2 justify-center">
            <button type="submit" className="btn-primary px-6 py-2">
              {editing ? 'שמור שם' : '✓ אישור'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost px-6 py-2">
                ביטול
              </button>
            )}
          </div>
        </form>

        {/* Live preview — total + leaderboard */}
        {total > 0 && (
          <div className="w-full max-w-xs flex flex-col items-center gap-3 pt-2 border-t" style={{ borderColor: 'rgba(212,168,67,0.2)' }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>🫕</span>
              <div>
                <p className="font-extrabold text-2xl" style={{ color: 'var(--wheat)', lineHeight: 1 }}>
                  <AnimatedCount count={total} />
                </p>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>קניידלך בקיבוץ עד כה</p>
              </div>
            </div>
            {makers.length > 0 && (
              <div className="w-full flex flex-col gap-1.5">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>🏆 טבלת המכינים</p>
                {makers.map((m, i) => (
                  <div key={m.maker_name} className="glass-sm flex flex-col gap-1 px-3 py-2 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                        <span style={{ minWidth: '1.4rem' }}>{i < 3 ? MEDALS[i] : `${i + 1}.`}</span>
                        {m.maker_name}
                      </span>
                      <span className="font-extrabold text-sm" style={{ color: 'var(--wheat)' }}>{m.count} 🫕</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((m.count / maxCount) * 100)}%`, borderRadius: 4, background: 'linear-gradient(90deg, rgba(212,168,67,0.5), rgba(139,38,53,0.5))', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ── Main counter + leaderboard ─────────────────────── */
  return (
    <>
      {/* Flying balls */}
      {balls.map(b => (
        <div
          key={b.id}
          className="kneidlach-ball"
          style={{
            left: b.x, top: b.y,
            '--kx': `${b.kx}px`,
            '--ky': `${b.ky}px`,
            '--kr': `${b.kr}deg`,
          } as React.CSSProperties}
        />
      ))}

      <div className="glass p-6 sm:p-8 flex flex-col items-center gap-5 text-center w-full">
        <div>
          <h2 className="heading-section mb-1">🫕 קניידלך הקיבוץ</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>כמה קניידלך הכנו הלילה?</p>
        </div>

        {/* Total */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="glass font-extrabold tabular-nums flex items-center justify-center px-8"
            style={{
              fontSize: 'clamp(3rem, 14vw, 6rem)', lineHeight: 1.1,
              minWidth: 'clamp(180px, 45vw, 320px)', height: 'clamp(90px, 20vw, 140px)',
              borderRadius: '1.5rem', letterSpacing: '-0.03em', color: 'var(--text-main)',
            }}
          >
            <AnimatedCount count={total} />
          </div>
          <p className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
            קניידלך סה&quot;כ בקיבוץ
          </p>
        </div>

        {/* Big button */}
        <button
          ref={btnRef}
          onClick={handleClick}
          disabled={sending}
          aria-label="הכנתי קניידלך!"
          className="relative select-none focus:outline-none"
          style={{ background: 'none', border: 'none', cursor: sending ? 'default' : 'pointer', padding: 0 }}
        >
          {burst && (
            <>
              <span className="absolute inset-0 rounded-full border-4 animate-ping"
                style={{ borderColor: 'var(--wheat)' }} aria-hidden="true" />
              <span className="absolute -inset-2 rounded-full border-2 animate-ping"
                style={{ borderColor: 'var(--wheat-light)', animationDelay: '80ms' }} aria-hidden="true" />
            </>
          )}
          <div
            className="btn-primary flex flex-col items-center gap-1 px-8 py-5 rounded-3xl"
            style={{
              fontSize: '1.1rem',
              transform: burst ? 'scale(0.88)' : 'scale(1)',
              transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: burst
                ? '0 2px 8px rgba(139,38,53,0.3)'
                : '0 8px 28px rgba(139,38,53,0.35)',
            }}
          >
            <span style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', lineHeight: 1 }}>🫕</span>
            <span className="font-extrabold text-lg">הכנתי קניידלך!</span>
          </div>
        </button>

        {/* My count + change name */}
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          הכנת <strong style={{ color: 'var(--text-main)' }}>{myCount}</strong> קניידלך עד כה, {name}
          {' · '}
          <button
            onClick={() => { setNameInput(name); setEditing(true) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wheat)', fontWeight: 700, fontSize: 'inherit' }}
          >
            שנה שם
          </button>
        </p>

        {/* Leaderboard */}
        {makers.length > 0 && (
          <div className="w-full max-w-xs flex flex-col gap-2">
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              🏆 טבלת המכינים
            </p>
            {makers.map((m, i) => {
              const maxCount = makers[0]?.count ?? 1
              const pct = Math.round((m.count / maxCount) * 100)
              const isMe = m.maker_name === name
              return (
                <div
                  key={m.maker_name}
                  className="glass-sm flex flex-col gap-1.5 px-4 py-2.5 rounded-xl"
                  style={{
                    background: isMe ? 'rgba(212,168,67,0.15)' : undefined,
                    border: isMe ? '1.5px solid rgba(212,168,67,0.5)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                      <span style={{ fontSize: '1.1rem', minWidth: '1.5rem' }}>
                        {i < 3 ? MEDALS[i] : `${i + 1}.`}
                      </span>
                      {m.maker_name}
                      {isMe && <span style={{ fontSize: '0.7rem', color: 'var(--wheat)', fontWeight: 800 }}>← אתה</span>}
                    </span>
                    <span className="font-extrabold text-sm" style={{ color: 'var(--wheat)' }}>
                      {m.count} 🫕
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    height: 5, borderRadius: 4,
                    background: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 4,
                      background: isMe
                        ? 'linear-gradient(90deg, var(--wheat), var(--wine))'
                        : 'linear-gradient(90deg, rgba(212,168,67,0.5), rgba(139,38,53,0.5))',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
