'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* ── Plague definitions ──────────────────────────────── */
const PLAGUES = [
  { id: 'dam',      emoji: '🩸', name: 'דם',          color: '#c0392b', bg: '#6b0f0f', longDesc: 'כל מי מצרים הפכו לדם. הדגים מתו והמצרים לא יכלו לשתות.', verse: '"וַיֵּהָפֵךְ הַמַּיִם אֲשֶׁר בַּיְאֹר לְדָם"', particles: 18, soundFreq: 60,  soundType: 'sine'     as OscillatorType },
  { id: 'tzfardea', emoji: '🐸', name: 'צפרדע',       color: '#27ae60', bg: '#0d4a22', longDesc: 'צפרדעים כיסו את כל מצרים – בבתים, במיטות ובתנורים.', verse: '"וַתַּעַל הַצְּפַרְדֵּעַ וַתְּכַס אֶת אֶרֶץ מִצְרָיִם"', particles: 22, soundFreq: 320, soundType: 'sine'     as OscillatorType },
  { id: 'kinim',    emoji: '🦟', name: 'כינים',       color: '#8e44ad', bg: '#3b1a50', longDesc: 'עפר האדמה הפך לכינים. החרטומים הודו: "אצבע אלוקים היא".', verse: '"כִּי אֶצְבַּע אֱלֹהִים הִוא"', particles: 28, soundFreq: 900, soundType: 'sawtooth' as OscillatorType },
  { id: 'arov',     emoji: '🦁', name: 'ערוב',        color: '#e67e22', bg: '#6e3108', longDesc: 'חיות טרף פשטו על מצרים. ארץ גושן – בה ישראל – נשמרה.', verse: '"וַיִּשָּׁחֵת הַבַּיִת וְגַם הָאֲדָמָה"', particles: 18, soundFreq: 80,  soundType: 'sine'     as OscillatorType },
  { id: 'dever',    emoji: '🐄', name: 'דבר',         color: '#7f8c8d', bg: '#2c3333', longDesc: 'מגפה פגעה בכל מקנה מצרים. ממקנה ישראל לא מת דבר.', verse: '"וַיָּמָת כֹּל מִקְנֵה מִצְרָיִם"', particles: 16, soundFreq: 110, soundType: 'triangle' as OscillatorType },
  { id: 'shchin',   emoji: '🔴', name: 'שחין',        color: '#e74c3c', bg: '#5c1010', longDesc: 'פצעים מוגלתיים פרצו על כל בני מצרים. גם החרטומים לא יכלו לעמוד.', verse: '"וַיִּהְיֶה שְׁחִין אֲבַעְבֻּעֹת פֹּרֵחַ"', particles: 20, soundFreq: 200, soundType: 'square'   as OscillatorType },
  { id: 'barad',    emoji: '🌨', name: 'ברד',         color: '#85c1e9', bg: '#0d2d45', longDesc: 'ברד כבד ירד ובתוכו בערה אש. מי שיראו הכניסו מקניהם הביתה.', verse: '"וַיְהִי בָרָד וְאֵשׁ מִתְלַקַּחַת בְּתוֹךְ הַבָּרָד"', particles: 24, soundFreq: 1200, soundType: 'triangle' as OscillatorType },
  { id: 'arbeh',    emoji: '🦗', name: 'ארבה',        color: '#d4ac0d', bg: '#4a3800', longDesc: 'ארבה כיסה את כל עין הארץ ואכל כל הירק שנותר מהברד.', verse: '"כִּסָּה אֶת עֵין כָּל הָאָרֶץ"', particles: 32, soundFreq: 600, soundType: 'sawtooth' as OscillatorType },
  { id: 'choshech', emoji: '🌑', name: 'חושך',        color: '#aab7b8', bg: '#0a0a0a', longDesc: 'חושך כבד ירד שלושה ימים. לבני ישראל היה אור במושבותיהם.', verse: '"וְלֹא רָאוּ אִישׁ אֶת אָחִיו"', particles: 10, soundFreq: 50,  soundType: 'sine'     as OscillatorType },
  { id: 'bechorot', emoji: '👼', name: 'מכת בכורות', color: '#f39c12', bg: '#4a2800', longDesc: 'בחצות הלילה מת כל בכור במצרים. בני ישראל נצטוו לשים דם על המשקוף.', verse: '"וַיְהִי בַּחֲצִי הַלַּיְלָה"', particles: 16, soundFreq: 440, soundType: 'sine'     as OscillatorType },
]

const DRIFT_ANIMS = ['arDrift0', 'arDrift1', 'arDrift2', 'arDrift3']

function buildParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    left:    (i * 137)  % 90 + 5,
    top:     (i * 89)   % 80 + 8,
    anim:    DRIFT_ANIMS[i % 4],
    dur:     2.8 + (i % 5) * 1.1,
    delay:   (i * 0.35) % 3.5,
    size:    ['2rem', '2.8rem', '3.6rem', '1.8rem', '4rem'][i % 5],
    opacity: 0.45 + (i % 4) * 0.15,
    blur:    i % 4 === 0 ? 'blur(2px)' : i % 4 === 3 ? 'blur(4px)' : 'none',
  }))
}

/* Splash background particles from all plagues */
const SPLASH_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  plague:  PLAGUES[i % 10],
  left:    (i * 137) % 88 + 6,
  top:     (i * 89)  % 78 + 8,
  size:    ['2.4rem', '1.6rem', '3rem', '2rem'][i % 4],
  dur:     4 + (i % 5) * 1.2,
  delay:   (i * 0.6) % 4,
  anim:    DRIFT_ANIMS[i % 4],
  opacity: 0.22 + (i % 3) * 0.08,
}))

/* Web Audio sound effect */
function playPlagueSound(freq: number, type: OscillatorType) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
    gain.connect(ctx.destination)
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.6)
    osc.connect(gain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.7)
    setTimeout(() => ctx.close(), 1200)
  } catch { /* silent */ }
}

export default function ARExperience() {
  const [plagueIdx,  setPlagueIdx]  = useState(0)
  const [arStarted,  setArStarted]  = useState(false)
  const [permError,  setPermError]  = useState(false)
  const [flash,      setFlash]      = useState(false)
  const [swipeStart, setSwipeStart] = useState<number | null>(null)

  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const current = PLAGUES[plagueIdx]

  const changePlague = useCallback((newIdx: number) => {
    const idx = (newIdx + PLAGUES.length) % PLAGUES.length
    setFlash(true)
    setTimeout(() => setFlash(false), 350)
    setPlagueIdx(idx)
    playPlagueSound(PLAGUES[idx].soundFreq, PLAGUES[idx].soundType)
  }, [])

  const startAR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      playPlagueSound(current.soundFreq, current.soundType)
      setArStarted(true)
    } catch {
      setPermError(true)
    }
  }

  useEffect(() => {
    if (!arStarted || !videoRef.current || !streamRef.current) return
    videoRef.current.srcObject = streamRef.current
  }, [arStarted])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  /* ── Splash screen ────────────────────────────────────── */
  if (!arStarted) {
    return (
      <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #0d0005 0%, #1a0a00 60%, #0a0d1a 100%)' }}>

        {/* Background floating plague particles */}
        {SPLASH_PARTICLES.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.left}%`, top: `${p.top}%`,
            fontSize: p.size,
            opacity: p.opacity,
            animation: `${p.anim} ${p.dur}s ease-in-out ${p.delay}s infinite`,
            pointerEvents: 'none', lineHeight: 1,
            filter: `drop-shadow(0 0 6px ${p.plague.color}66)`,
          }}>
            {p.plague.emoji}
          </div>
        ))}

        {/* Back button */}
        <a href="/" style={{
          alignSelf: 'flex-end', margin: '16px 16px 0',
          color: 'rgba(212,168,67,0.7)', fontSize: '0.85rem', fontWeight: 700,
          textDecoration: 'none', zIndex: 10, position: 'relative',
        }}>← חזרה לדף הבית</a>

        {/* Header */}
        <header style={{ textAlign: 'center', padding: '8px 24px 12px', position: 'relative', zIndex: 5 }}>
          <div style={{ fontSize: '5rem', lineHeight: 1, marginBottom: 8, filter: 'drop-shadow(0 0 30px rgba(212,168,67,0.5))' }}>🔟</div>
          <h1 style={{
            fontSize: 'clamp(2rem, 8vw, 3.2rem)', fontWeight: 900,
            background: 'linear-gradient(135deg, #F0C96A 0%, #D4A843 50%, #8B2635 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            margin: '0 0 6px', lineHeight: 1.1,
          }}>
            עשר המכות
          </h1>
          <p style={{ color: 'rgba(212,168,67,0.65)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
            חווית מציאות רבודה · קיבוץ גת תשפ"ו
          </p>
        </header>

        {/* Plague scroll strip */}
        <div style={{ width: '100%', overflowX: 'auto', padding: '8px 0 4px', scrollbarWidth: 'none', position: 'relative', zIndex: 5 }}>
          <div style={{ display: 'flex', gap: 10, padding: '0 16px', width: 'max-content', margin: '0 auto' }}>
            {PLAGUES.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPlagueIdx(i)}
                style={{
                  minWidth: 72, padding: '10px 6px', borderRadius: '1rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  cursor: 'pointer',
                  background: plagueIdx === i ? `${p.color}25` : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${plagueIdx === i ? p.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: plagueIdx === i ? `0 0 20px ${p.color}55, 0 4px 12px ${p.color}33` : 'none',
                  transform: plagueIdx === i ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '2rem', filter: plagueIdx === i ? `drop-shadow(0 0 8px ${p.color})` : 'none' }}>{p.emoji}</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: plagueIdx === i ? p.color : 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.2 }}>
                  {p.name}
                </span>
                <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div style={{ width: '100%', maxWidth: 400, padding: '0 16px', position: 'relative', zIndex: 5, marginTop: 8 }} key={current.id}>
          <div style={{
            borderRadius: '1.25rem', padding: '18px 20px',
            background: `linear-gradient(135deg, ${current.bg}cc, rgba(0,0,0,0.7))`,
            border: `1.5px solid ${current.color}55`,
            boxShadow: `0 8px 32px ${current.color}33, inset 0 1px 0 ${current.color}22`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '0.75rem', flexShrink: 0,
                background: `${current.color}22`,
                border: `2px solid ${current.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.2rem',
                boxShadow: `0 4px 16px ${current.color}44`,
              }}>{current.emoji}</div>
              <div>
                <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white', margin: 0, lineHeight: 1.2 }}>מכת {current.name}</p>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: current.color, margin: '3px 0 0' }}>מכה {plagueIdx + 1} מתוך 10</p>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 10px' }}>{current.longDesc}</p>
            <p style={{
              color: current.color, fontSize: '0.78rem', fontStyle: 'italic', fontWeight: 700,
              borderTop: `1px solid ${current.color}33`, paddingTop: 8, margin: 0, lineHeight: 1.5,
            }}>{current.verse}</p>

            {/* Dots */}
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              {PLAGUES.map((p, i) => (
                <button key={p.id} onClick={() => setPlagueIdx(i)} style={{
                  width: plagueIdx === i ? 20 : 8, height: 8, borderRadius: 9999,
                  background: plagueIdx === i ? current.color : 'rgba(255,255,255,0.15)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.25s ease',
                }} />
              ))}
            </div>
          </div>
        </div>

        {permError && (
          <div style={{
            margin: '12px 16px 0', padding: '10px 16px', borderRadius: '0.75rem',
            background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)',
            color: '#f87171', fontSize: '0.85rem', textAlign: 'center', zIndex: 5, position: 'relative',
          }}>
            ❌ אין גישה למצלמה — אפשר הרשאות ורענן את הדף
          </div>
        )}

        {/* Start button */}
        <div style={{ width: '100%', maxWidth: 400, padding: '16px 16px 32px', position: 'relative', zIndex: 5 }}>
          <button
            onClick={startAR}
            style={{
              width: '100%', padding: '16px', borderRadius: '1rem', border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${current.color} 0%, ${current.bg} 100%)`,
              color: 'white', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.02em',
              boxShadow: `0 6px 28px ${current.color}55, 0 2px 0 ${current.color}33 inset`,
              transition: 'all 0.2s ease',
            }}
          >
            {current.emoji} הפעל מציאות רבודה
          </button>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', textAlign: 'center', margin: '8px 0 0' }}>
            נדרשת גישה למצלמה האחורית
          </p>
        </div>
      </main>
    )
  }

  /* ── AR Live View ─────────────────────────────────────── */
  const particles = buildParticles(current.particles)

  return (
    <div
      style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden', background: '#000', touchAction: 'none' }}
      onTouchStart={e => setSwipeStart(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (swipeStart === null) return
        const dx = e.changedTouches[0].clientX - swipeStart
        if (Math.abs(dx) > 50) changePlague(plagueIdx + (dx > 0 ? 1 : -1))
        setSwipeStart(null)
      }}
    >
      {/* Camera */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Atmospheric color overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, ${current.color}20 0%, ${current.color}45 100%)`,
        transition: 'background 0.5s ease',
      }} />

      {/* Flash overlay on plague change */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: current.color,
          opacity: 0.5,
          transition: 'opacity 0.35s ease-out',
        }} />
      )}

      {/* Particle swarm */}
      {particles.map((p, i) => (
        <div key={`${current.id}-${i}`} style={{
          position: 'absolute',
          left: `${p.left}%`, top: `${p.top}%`,
          fontSize: p.size, lineHeight: 1,
          pointerEvents: 'none',
          opacity: p.opacity,
          animation: `${p.anim} ${p.dur}s ease-in-out ${p.delay}s infinite`,
          filter: `drop-shadow(0 0 10px ${current.color}aa) ${p.blur}`,
        }}>
          {current.emoji}
        </div>
      ))}

      {/* Center badge */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        pointerEvents: 'none',
      }}>
        {/* Pulse rings */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 180, height: 180, borderRadius: '50%',
          border: `2px solid ${current.color}`,
          animation: 'arRingPulse 2.2s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 280, height: 280, borderRadius: '50%',
          border: `1.5px solid ${current.color}55`,
          animation: 'arRingPulse2 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 380, height: 380, borderRadius: '50%',
          border: `1px solid ${current.color}28`,
          animation: 'arRingPulse2 4s ease-in-out 0.5s infinite',
        }} />

        {/* Center emoji */}
        <div style={{ animation: 'arBob 2.2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 'clamp(5rem, 20vw, 9rem)',
            filter: `drop-shadow(0 0 30px ${current.color}) drop-shadow(0 0 70px ${current.color}88)`,
          }}>
            {current.emoji}
          </div>
          <div style={{
            background: `${current.bg}ee`,
            backdropFilter: 'blur(16px)',
            borderRadius: 12, padding: '7px 20px',
            color: 'white', fontWeight: 900, fontSize: 18,
            border: `1.5px solid ${current.color}`,
            boxShadow: `0 4px 24px ${current.color}66`,
          }}>
            מכת {current.name}
          </div>
        </div>
      </div>

      {/* Verse bottom strip */}
      <div style={{
        position: 'absolute', bottom: 110, left: '50%',
        transform: 'translateX(-50%)',
        width: '90%', maxWidth: 380,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
        borderRadius: '0.75rem', padding: '8px 14px',
        border: `1px solid ${current.color}44`,
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <p style={{ color: current.color, fontSize: '0.75rem', fontStyle: 'italic', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
          {current.verse}
        </p>
      </div>

      {/* HUD – Back button */}
      <button onClick={() => { setArStarted(false); streamRef.current?.getTracks().forEach(t => t.stop()) }} style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(0,0,0,0.6)', color: 'white',
        border: '1px solid rgba(255,255,255,0.25)', borderRadius: 9999,
        padding: '7px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}>
        ← חזרה
      </button>

      {/* HUD – counter badge */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        background: `${current.bg}cc`, backdropFilter: 'blur(10px)',
        border: `1px solid ${current.color}55`, borderRadius: 9999,
        padding: '5px 12px', color: current.color, fontWeight: 800, fontSize: 12,
      }}>
        {plagueIdx + 1} / 10
      </div>

      {/* HUD – nav buttons */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 14, alignItems: 'center',
      }}>
        <button onClick={() => changePlague(plagueIdx - 1)} style={{
          background: 'rgba(0,0,0,0.6)', color: 'white',
          border: `1px solid ${current.color}55`, borderRadius: 9999,
          width: 52, height: 52, fontSize: 24, cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 16px ${current.color}44`,
        }}>›</button>

        <div style={{ display: 'flex', gap: 5 }}>
          {PLAGUES.map((p, i) => (
            <button key={p.id} onClick={() => changePlague(i)} style={{
              width: plagueIdx === i ? 20 : 8, height: 8, borderRadius: 9999,
              background: plagueIdx === i ? current.color : 'rgba(255,255,255,0.25)',
              border: 'none', cursor: 'pointer', transition: 'all 0.25s ease',
              boxShadow: plagueIdx === i ? `0 0 8px ${current.color}` : 'none',
            }} />
          ))}
        </div>

        <button onClick={() => changePlague(plagueIdx + 1)} style={{
          background: 'rgba(0,0,0,0.6)', color: 'white',
          border: `1px solid ${current.color}55`, borderRadius: 9999,
          width: 52, height: 52, fontSize: 24, cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 16px ${current.color}44`,
        }}>‹</button>
      </div>

      {/* Swipe hint */}
      <p style={{
        position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 600,
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        ← החלק בין המכות →
      </p>
    </div>
  )
}
