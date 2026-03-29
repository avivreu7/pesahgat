'use client'

import { useEffect, useRef, useState } from 'react'

interface Greeting { id: string; family_name: string; message: string }

interface Props {
  targetIso: string
  videoUrl:  string
  greetings?: Greeting[]
}

interface BubbleInstance {
  id: number
  greeting: Greeting
  left: number        // vw percent
  startBottom: number // vh percent from bottom
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function calcRemaining(targetIso: string) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now())
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
    done: diff === 0,
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

/* ── Last 10 seconds – dramatic countdown ─────────────── */
function LastTenCountdown({ seconds }: { seconds: number }) {
  const rings = [1, 2, 3]
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
      position: 'relative', padding: '20px 40px',
      animation: 'lastTenBg 1s ease-in-out infinite',
      borderRadius: '2rem',
    }}>
      {/* Expanding rings – re-trigger each second via key */}
      {rings.map(i => (
        <div
          key={`${seconds}-ring-${i}`}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: `${i * 110}px`, height: `${i * 110}px`,
            borderRadius: '50%',
            border: `${4 - i}px solid rgba(139,38,53,${0.55 - i * 0.12})`,
            animation: 'ringExpand 1s ease-out forwards',
            animationDelay: `${(i - 1) * 0.12}s`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Big number – key re-triggers countBoom each second */}
      <div
        key={seconds}
        style={{
          fontSize: 'clamp(6rem, 24vw, 10rem)',
          fontWeight: 900,
          lineHeight: 1,
          color: 'var(--wine)',
          animation: 'countBoom 0.9s cubic-bezier(0.34,1.4,0.64,1) forwards',
          filter: 'drop-shadow(0 4px 24px rgba(139,38,53,0.55))',
          zIndex: 1,
        }}
      >
        {seconds}
      </div>

      {/* Label */}
      <p style={{
        fontSize: '1.15rem', fontWeight: 800, color: 'var(--wine)',
        animation: 'lastTenLabel 1s ease-in-out infinite',
        zIndex: 1,
      }}>
        {seconds > 5 ? '🎊 הסדר מתחיל!' : '🎉 כבר עכשיו!'}
      </p>
    </div>
  )
}

/* ── Single floating greeting bubble ──────────────────── */
function FloatingBubble({ b, onDone }: { b: BubbleInstance; onDone: (id: number) => void }) {
  const dur = 14 + Math.floor(b.id % 4) * 1.5  // 14–19.5s, stable per id

  useEffect(() => {
    const t = setTimeout(() => onDone(b.id), dur * 1000 + 200)
    return () => clearTimeout(t)
  }, [b.id, dur, onDone])

  const msg = b.greeting.message.slice(0, 60) + (b.greeting.message.length > 60 ? '…' : '')

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `${b.startBottom}%`,
        left: `${b.left}%`,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 1,
        animation: `greetingFloat ${dur}s ease-out forwards`,
      }}
    >
      <div style={{
        background: 'rgba(255,252,235,0.78)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(212,168,67,0.4)',
        borderRight: '3px solid rgba(212,168,67,0.65)',
        borderRadius: '0.9rem',
        padding: '8px 14px',
        maxWidth: '200px',
        textAlign: 'right',
        boxShadow: '0 4px 16px rgba(90,55,10,0.12)',
      }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--wheat)', marginBottom: '3px' }}>
          🌾 משפחת {b.greeting.family_name}
        </p>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-card)', lineHeight: 1.4 }}>
          {msg}
        </p>
      </div>
    </div>
  )
}

/* ── Main component ───────────────────────────────────── */
export default function CountdownTimer({ targetIso, videoUrl, greetings = [] }: Props) {
  const [liveTarget,     setLiveTarget]     = useState(targetIso)
  const [liveVideoUrl,   setLiveVideoUrl]   = useState(videoUrl)
  const [liveGreetings,  setLiveGreetings]  = useState<Greeting[]>(greetings)
  const [time,  setTime]  = useState(() => calcRemaining(targetIso))
  const [phase, setPhase] = useState<'counting' | 'fading' | 'video'>(() =>
    calcRemaining(targetIso).done ? 'video' : 'counting',
  )
  const [bubbles, setBubbles] = useState<BubbleInstance[]>([])
  const phaseRef = useRef(phase)
  useEffect(() => { phaseRef.current = phase }, [phase])

  /* Remove a bubble when its animation ends */
  const removeBubble = (id: number) =>
    setBubbles(prev => prev.filter(b => b.id !== id))

  /* ── Spawn floating greeting bubbles one at a time ─── */
  useEffect(() => {
    if (phase !== 'counting' || !liveGreetings.length) return

    let timeoutId: ReturnType<typeof setTimeout>
    let idx = 0

    const spawnNext = () => {
      const g = liveGreetings[idx % liveGreetings.length]
      idx++
      const left        = 6 + Math.floor(((idx * 137) % 82))   // pseudo-random, stable positions
      const startBottom = 2 + Math.floor(((idx * 53)  % 38))   // 2–40% from bottom

      setBubbles(prev => prev.length < 10 ? [...prev, { id: Date.now() + idx, greeting: g, left, startBottom }] : prev)

      const nextDelay = 3500 + Math.floor(((idx * 71) % 3000))  // 3.5–6.5s between bubbles
      timeoutId = setTimeout(spawnNext, nextDelay)
    }

    timeoutId = setTimeout(spawnNext, 1500)  // first bubble after 1.5s
    return () => clearTimeout(timeoutId)
  }, [phase, liveGreetings])

  /* ── Poll settings every 15s ─────────────────────────── */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data.start_time)              setLiveTarget(t => t !== data.start_time ? data.start_time : t)
        if (data.main_video_url !== undefined) setLiveVideoUrl(data.main_video_url)
      } catch { /* silent */ }
    }
    const id = setInterval(poll, 15_000)
    return () => clearInterval(id)
  }, [])

  /* ── Poll greetings every 20s ─────────────────────────── */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/greetings', { cache: 'no-store' })
        if (!res.ok) return
        const data: Greeting[] = await res.json()
        if (Array.isArray(data) && data.length) setLiveGreetings(data)
      } catch { /* silent */ }
    }
    const id = setInterval(poll, 20_000)
    return () => clearInterval(id)
  }, [])

  /* ── Countdown clock ─────────────────────────────────── */
  useEffect(() => {
    const trigger = () => {
      if (phaseRef.current !== 'video') {
        setPhase('fading')
        setTimeout(() => setPhase('video'), 900)
      }
    }

    const remaining = calcRemaining(liveTarget)
    if (remaining.done) { trigger(); return }

    if (phaseRef.current !== 'video') setPhase('counting')
    setTime(remaining)

    const id = setInterval(() => {
      const next = calcRemaining(liveTarget)
      setTime(next)
      if (next.done) { clearInterval(id); trigger() }
    }, 1_000)

    return () => clearInterval(id)
  }, [liveTarget])

  const videoId         = extractYoutubeId(liveVideoUrl)
  const countdownVisible = phase === 'counting' || phase === 'fading'
  const isLastTen       = time.h === 0 && time.m === 0 && time.s <= 10 && time.s > 0

  return (
    <>
      {/* Floating greeting bubbles – rendered over whole page */}
      {phase === 'counting' && bubbles.map(b => (
        <FloatingBubble key={b.id} b={b} onDone={removeBubble} />
      ))}

      <div className="relative w-full">
        {countdownVisible && (
          <div
            className="flex flex-col items-center gap-6 transition-opacity duration-700"
            style={{ opacity: phase === 'fading' ? 0 : 1 }}
          >
            {isLastTen ? (
              <LastTenCountdown seconds={time.s} />
            ) : (
              <>
                {/* Standard digit row: hours LEFT, minutes CENTER, seconds RIGHT */}
                <div className="flex items-center gap-2 sm:gap-4" dir="ltr">
                  <DigitBlock value={pad(time.h)} label="שעות" />
                  <Colon />
                  <DigitBlock value={pad(time.m)} label="דקות" />
                  <Colon />
                  <DigitBlock value={pad(time.s)} label="שניות" />
                </div>
                <div className="text-center flex flex-col items-center gap-0.5">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    ספירה לאחור עד
                  </p>
                  <p className="font-extrabold text-base sm:text-lg" style={{ color: 'var(--wheat)' }}>
                    🌿 השידור החגיגי – א׳ באפריל, 20:00 🕯️
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* YouTube player */}
        {phase === 'video' && videoId && (
          <div className="w-full fade-in">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title="פסח בקיבוץ"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
            <p className="text-center text-sm mt-3 font-semibold" style={{ color: 'var(--text-muted)' }}>
              🎉 הסדר מתחיל – חג פסח שמח!
            </p>
          </div>
        )}

        {phase === 'video' && !videoId && (
          <div className="text-center py-10 fade-in">
            <p className="text-3xl mb-2">🎉</p>
            <p className="heading-section">חג פסח שמח!</p>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Sub-components ───────────────────────────────────── */
function DigitBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="glass flex items-center justify-center rounded-2xl font-extrabold tabular-nums"
        style={{
          fontSize: 'clamp(2.4rem, 9vw, 5rem)',
          width: 'clamp(72px, 18vw, 130px)',
          height: 'clamp(80px, 20vw, 140px)',
          letterSpacing: '-0.02em',
          color: 'var(--text-main)',
        }}
      >
        {value}
      </div>
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

function Colon() {
  return (
    <span
      className="font-extrabold pb-6 select-none"
      style={{ fontSize: 'clamp(2rem, 7vw, 4rem)', color: 'var(--text-main)' }}
    >
      :
    </span>
  )
}
