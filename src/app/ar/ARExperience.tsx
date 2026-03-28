'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

/* ── Plague definitions ──────────────────────────────── */
const PLAGUES = [
  { id: 'dam',      emoji: '🩸', name: 'דם',          color: '#c0392b', longDesc: 'כל מי מצרים הפכו לדם. הדגים מתו והמצרים לא יכלו לשתות.' },
  { id: 'tzfardea', emoji: '🐸', name: 'צפרדע',       color: '#27ae60', longDesc: 'צפרדעים כיסו את כל מצרים – בבתים, במיטות ובתנורים.' },
  { id: 'kinim',    emoji: '🦟', name: 'כינים',       color: '#8e44ad', longDesc: 'עפר האדמה הפך לכינים. החרטומים הודו: "אצבע אלוקים היא".' },
  { id: 'arov',     emoji: '🦁', name: 'ערוב',        color: '#e67e22', longDesc: 'חיות טרף פשטו על מצרים. ארץ גושן – בה ישראל – נשמרה.' },
  { id: 'dever',    emoji: '🐄', name: 'דבר',         color: '#7f8c8d', longDesc: 'מגפה פגעה בכל מקנה מצרים. ממקנה ישראל לא מת דבר.' },
  { id: 'shchin',   emoji: '🔴', name: 'שחין',        color: '#e74c3c', longDesc: 'פצעים מוגלתיים פרצו על כל בני מצרים. גם החרטומים לא יכלו לעמוד.' },
  { id: 'barad',    emoji: '🌨', name: 'ברד',         color: '#85c1e9', longDesc: 'ברד כבד ירד ובתוכו בערה אש. מי שיראו הכניסו מקניהם הביתה.' },
  { id: 'arbeh',    emoji: '🦗', name: 'ארבה',        color: '#d4ac0d', longDesc: 'ארבה כיסה את כל עין הארץ ואכל כל הירק שנותר מהברד.' },
  { id: 'choshech', emoji: '🌑', name: 'חושך',        color: '#2c3e50', longDesc: 'חושך כבד ירד שלושה ימים. לבני ישראל היה אור במושבותיהם.' },
  { id: 'bechorot', emoji: '👼', name: 'מכת בכורות', color: '#f39c12', longDesc: 'בחצות הלילה מת כל בכור במצרים. בני ישראל נצטוו לשים דם על המשקוף.' },
]

export default function ARExperience() {
  const [scriptsReady, setScriptsReady] = useState(false)
  const [plagueIdx, setPlagueIdx]       = useState(0)
  const [arStarted, setArStarted]       = useState(false)
  const [permError, setPermError]       = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const current = PLAGUES[plagueIdx]

  /* Start AR: grab camera + show live view */
  const startAR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setArStarted(true)
    } catch {
      setPermError(true)
    }
  }

  /* Attach stream to video element once AR starts */
  useEffect(() => {
    if (!arStarted || !videoRef.current || !streamRef.current) return
    videoRef.current.srcObject = streamRef.current
  }, [arStarted])

  /* Cleanup stream on unmount */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const nextPlague = () => setPlagueIdx(i => (i + 1) % PLAGUES.length)
  const prevPlague = () => setPlagueIdx(i => (i - 1 + PLAGUES.length) % PLAGUES.length)

  /* ── Pre-launch screen ─────────────────────────────── */
  if (!arStarted) {
    return (
      <main className="min-h-dvh flex flex-col items-center pb-20 gap-0" style={{ position: 'relative' }}>
        <a href="/" className="self-start text-sm font-semibold m-4" style={{ color: 'var(--text-muted)' }}>
          ← חזרה לדף הבית
        </a>

        <header className="text-center px-6 pb-5 fade-in">
          <p className="text-6xl mb-2">🔟</p>
          <h1 className="heading-hero hero-pulse mb-1">10 המכות</h1>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            חווית מציאות רבודה – כוון את המצלמה לראות את המכות!
          </p>
        </header>

        {/* Horizontal scroll strip */}
        <div className="w-full overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-3 px-4" style={{ width: 'max-content' }}>
            {PLAGUES.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPlagueIdx(i)}
                className="flex flex-col items-center gap-1 rounded-2xl transition-all duration-200"
                style={{
                  minWidth: '68px', padding: '10px 8px',
                  background: plagueIdx === i ? `${p.color}22` : 'rgba(255,252,235,0.75)',
                  border: `2px solid ${plagueIdx === i ? p.color : 'rgba(212,168,67,0.25)'}`,
                  boxShadow: plagueIdx === i ? `0 4px 16px ${p.color}44` : '0 2px 8px rgba(90,55,10,0.08)',
                  transform: plagueIdx === i ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{p.emoji}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: plagueIdx === i ? p.color : 'var(--text-muted)', textAlign: 'center' }}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="w-full max-w-sm mx-auto px-4 mt-5 fade-in" key={current.id}>
          <div className="rounded-2xl p-5 flex flex-col gap-3" style={{
            background: `${current.color}18`,
            border: `1.5px solid ${current.color}55`,
            boxShadow: `0 8px 24px ${current.color}22`,
          }}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl flex items-center justify-center" style={{
                fontSize: '2.4rem', width: 56, height: 56, flexShrink: 0,
                background: `${current.color}22`, border: `1.5px solid ${current.color}44`,
              }}>{current.emoji}</span>
              <div>
                <p className="font-extrabold text-lg" style={{ color: 'var(--text-main)', lineHeight: 1.2 }}>{current.name}</p>
                <p className="text-xs font-semibold" style={{ color: current.color }}>מכה {plagueIdx + 1} מתוך {PLAGUES.length}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-card)' }}>{current.longDesc}</p>
            <div className="flex gap-1.5 justify-center flex-wrap mt-1">
              {PLAGUES.map((p, i) => (
                <button key={p.id} onClick={() => setPlagueIdx(i)} style={{
                  width: plagueIdx === i ? 20 : 8, height: 8, borderRadius: 9999,
                  background: plagueIdx === i ? current.color : 'rgba(90,55,10,0.18)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                }} />
              ))}
            </div>
          </div>
        </div>

        {permError && (
          <p className="mx-4 mt-3 text-sm text-center rounded-xl px-4 py-3"
            style={{ background: 'rgba(192,57,43,0.1)', color: 'var(--wine)' }}>
            ❌ אין גישה למצלמה. אנא אפשר הרשאות ורענן.
          </p>
        )}

        <div className="px-4 w-full max-w-sm mx-auto mt-5">
          <button
            onClick={startAR}
            className="btn-primary w-full text-lg py-4"
            style={{
              background: `linear-gradient(135deg, ${current.color} 0%, ${current.color}bb 100%)`,
              boxShadow: `0 6px 24px ${current.color}55`,
            }}
          >
            {current.emoji} הפעל מציאות רבודה
          </button>
        </div>
        <p className="text-xs text-center px-4 mt-3" style={{ color: 'var(--text-muted)' }}>
          כוון את המצלמה ותראה את המכות חיות!
        </p>
      </main>
    )
  }

  /* ── AR Live View: camera + CSS-centered 3D overlay ── */
  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden', background: '#000' }}>

      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Dark tint overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)', pointerEvents: 'none' }} />

      {/* ── Centered 3D plague object ─── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        pointerEvents: 'none',
      }}>
        {/* Outer pulse ring 1 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 200, height: 200, borderRadius: '50%',
          border: `2px solid ${current.color}`,
          animation: 'arRingPulse 2.4s ease-in-out infinite',
        }} />
        {/* Outer pulse ring 2 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 280, height: 280, borderRadius: '50%',
          border: `1.5px solid ${current.color}88`,
          animation: 'arRingPulse2 3.2s ease-in-out infinite',
        }} />

        {/* Bobbing container */}
        <div style={{ animation: 'arBob 2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {/* Spinning emoji */}
          <div style={{
            fontSize: '7rem',
            animation: 'arSpin 4s linear infinite',
            filter: `drop-shadow(0 0 24px ${current.color}) drop-shadow(0 0 60px ${current.color}88)`,
            display: 'block',
          }}>
            {current.emoji}
          </div>
          {/* Plague name badge */}
          <div style={{
            background: `${current.color}cc`,
            backdropFilter: 'blur(10px)',
            borderRadius: 10, padding: '5px 14px',
            color: 'white', fontWeight: 800, fontSize: 16,
            border: `1px solid ${current.color}`,
          }}>
            {current.name}
          </div>
        </div>
      </div>

      {/* HUD – Back */}
      <button onClick={() => { setArStarted(false); streamRef.current?.getTracks().forEach(t => t.stop()) }} style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(0,0,0,0.55)', color: 'white',
        border: '1px solid rgba(255,255,255,0.3)', borderRadius: 9999,
        padding: '6px 14px', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', backdropFilter: 'blur(8px)',
      }}>
        ← חזרה
      </button>

      {/* HUD – counter */}
      <div style={{ position: 'absolute', top: 16, left: 16, color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>
        מכה {plagueIdx + 1} / {PLAGUES.length}
      </div>

      {/* HUD – nav */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <button onClick={prevPlague} style={{
          background: 'rgba(0,0,0,0.55)', color: 'white',
          border: '1px solid rgba(255,255,255,0.25)', borderRadius: 9999,
          width: 48, height: 48, fontSize: 22, cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}>›</button>

        <div style={{ display: 'flex', gap: 5 }}>
          {PLAGUES.map((p, i) => (
            <button key={p.id} onClick={() => setPlagueIdx(i)} style={{
              width: plagueIdx === i ? 18 : 8, height: 8, borderRadius: 9999,
              background: plagueIdx === i ? current.color : 'rgba(255,255,255,0.3)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
            }} />
          ))}
        </div>

        <button onClick={nextPlague} style={{
          background: 'rgba(0,0,0,0.55)', color: 'white',
          border: '1px solid rgba(255,255,255,0.25)', borderRadius: 9999,
          width: 48, height: 48, fontSize: 22, cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}>‹</button>
      </div>
    </div>
  )
}

/* Remove A-Frame/AR.js — no longer needed */
