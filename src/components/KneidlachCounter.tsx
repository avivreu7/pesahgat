'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const POLL_MS = 3_000   // 3 seconds for real-time feel

const MILESTONES: Record<number, string> = {
  1:   'הכנדלך הראשון! 🎉',
  10:  'עשרה כנדלך! 🔥',
  18:  'חי! מזל טוב! ✡️',
  36:  'שלושים ושש – כפול חי! 💪',
  50:  'חצי מאה כנדלך! 🏆',
  100: '100 כנדלך!!! 🤯🥇',
  180: 'מאה ושמונים – עשרה פעמים חי! 🌟',
  200: 'מאתיים! הקיבוץ אוכל! 🫕',
  360: '360 – שנה שלמה של כנדלך 🔄',
  500: 'חצי אלף! מדהים! 🎆',
  1000:'אלף כנדלך!!! האגדה! 👑🫕',
}

function getMilestone(count: number): string | null {
  return MILESTONES[count] ?? null
}

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

export default function KneidlachCounter({ initial }: { initial: number }) {
  const [count,   setCount]   = useState(initial)
  const [burst,   setBurst]   = useState(false)
  const [toast,   setToast]   = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [balls,   setBalls]   = useState<Ball[]>([])
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const btnRef   = useRef<HTMLButtonElement>(null)

  /* Poll every 3s for real-time updates from other users */
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/kneidlach', { cache: 'no-store' })
      const { count: c } = await res.json()
      setCount(c)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    const id = setInterval(fetchCount, POLL_MS)
    return () => clearInterval(id)
  }, [fetchCount])

  /* Spawn flying balls from button center */
  const spawnBalls = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const newBalls: Ball[] = Array.from({ length: 5 }, (_, i) => {
      const angle = ((i / 5) * Math.PI * 1.4) - (Math.PI * 0.7)  // spread arc upward
      const speed = 120 + (i % 3) * 55
      return {
        id:  Date.now() + i,
        x:   cx + (i % 2 === 0 ? 1 : -1) * i * 8,
        y:   cy,
        kx:  Math.sin(angle) * speed,
        ky:  -(Math.cos(angle) * speed + 60),
        kr:  (i % 2 === 0 ? 1 : -1) * (180 + i * 90),
      }
    })
    setBalls(prev => [...prev, ...newBalls])
    setTimeout(() => setBalls(prev => prev.filter(b => !newBalls.find(nb => nb.id === b.id))), 1000)
  }

  const handleClick = async () => {
    if (sending) return
    setSending(true)

    spawnBalls()

    const optimistic = count + 1
    setCount(optimistic)
    setBurst(true)
    setTimeout(() => setBurst(false), 350)

    const msg = getMilestone(optimistic)
    if (msg) {
      clearTimeout(toastRef.current!)
      setToast(msg)
      toastRef.current = setTimeout(() => setToast(null), 3500)
    }

    try {
      const res = await fetch('/api/kneidlach', { method: 'POST' })
      const { count: confirmed } = await res.json()
      setCount(confirmed)
    } catch { /* keep optimistic */ }
    finally { setSending(false) }
  }

  return (
    <>
      {/* Flying balls – rendered fixed over page */}
      {balls.map(b => (
        <div
          key={b.id}
          className="kneidlach-ball"
          style={{
            left: b.x,
            top:  b.y,
            '--kx': `${b.kx}px`,
            '--ky': `${b.ky}px`,
            '--kr': `${b.kr}deg`,
          } as React.CSSProperties}
        />
      ))}

      <div className="glass p-6 sm:p-8 flex flex-col items-center gap-5 text-center w-full">
        <div>
          <h2 className="heading-section mb-1">🫕 כנדלך הקיבוץ</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>כמה כנדלך אכל הקיבוץ הלילה?</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div
            className="glass font-extrabold tabular-nums flex items-center justify-center px-8"
            style={{
              fontSize: 'clamp(3rem, 14vw, 6rem)', lineHeight: 1.1,
              minWidth: 'clamp(180px, 45vw, 320px)', height: 'clamp(90px, 20vw, 140px)',
              borderRadius: '1.5rem', letterSpacing: '-0.03em', color: 'var(--text-main)',
            }}
          >
            <AnimatedCount count={count} />
          </div>
          <p className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
            כנדלך סה&quot;כ
          </p>
        </div>

        <div
          className="min-h-[2rem] flex items-center justify-center transition-all duration-300"
          style={{ opacity: toast ? 1 : 0, transform: toast ? 'scale(1)' : 'scale(0.9)' }}
        >
          <span className="glass-sm px-5 py-2 font-bold text-sm" style={{ color: 'var(--text-main)' }}>
            {toast ?? '‎'}
          </span>
        </div>

        <button
          ref={btnRef}
          onClick={handleClick}
          disabled={sending}
          aria-label="אכלתי כנדלך!"
          className="relative select-none focus:outline-none"
          style={{ background: 'none', border: 'none', cursor: sending ? 'default' : 'pointer', padding: 0 }}
        >
          {burst && (
            <>
              <span className="absolute inset-0 rounded-full border-4 animate-ping"
                style={{ borderColor: 'var(--wheat)' }} aria-hidden="true" />
              <span className="absolute inset-[-8px] rounded-full border-2 animate-ping"
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
            <span className="font-extrabold text-lg">אכלתי כנדלך!</span>
          </div>
        </button>

        <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
          לחץ בכל פעם שאכלת כנדלך – נספור יחד כמה אכל הקיבוץ!
        </p>
      </div>
    </>
  )
}
