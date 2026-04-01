'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from 'react'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

export interface Waypoint {
  name: string
  pos: [number, number]
}

// קיבוץ גת — נקודות אמיתיות שסופקו על ידי המשתמש
export const WAYPOINTS: Waypoint[] = [
  { name: 'חדר אוכל',       pos: [31.62849, 34.79397] },
  { name: 'מועדון',          pos: [31.62880, 34.79237] },
  { name: 'בריכת שחיה',     pos: [31.62521, 34.79177] },
  { name: 'פאב המנוף',      pos: [31.62785, 34.79453] },
  { name: 'מזכירות',        pos: [31.62987, 34.79518] },
  { name: 'רפת',             pos: [31.62712, 34.79564] },
  { name: 'בית',             pos: [31.62967, 34.79317] },
  { name: 'בית',             pos: [31.62785, 34.79294] },
  { name: 'גן ילדים',       pos: [31.62761, 34.79376] },
  { name: 'חברת ילדים',     pos: [31.62710, 34.79348] },
  { name: 'בית ספר',        pos: [31.62601, 34.79359] },
  { name: 'בית',             pos: [31.63223, 34.79442] },
  { name: 'בית',             pos: [31.63079, 34.79425] },
  { name: 'בית',             pos: [31.62933, 34.79117] },
  { name: 'בית',             pos: [31.62908, 34.79299] },
  { name: 'בית',             pos: [31.62723, 34.79147] },
  { name: 'בית',             pos: [31.62669, 34.79086] },
  { name: 'אולם ספורט',     pos: [31.62584, 34.79211] },
  { name: 'מגרש כדורגל',   pos: [31.62572, 34.79088] },
]

const MESSAGES = [
  'שלום לכם, בני קיבוץ גת! הגעתי עם ברכות לליל הסדר! 🍷',
  'חג פסח שמח! יצאנו ממצרים — ועכשיו אני יוצא מהמטבח! 😄',
  'שמעתי שיש פה קניידלך מצוינות — בשבילן שווה לצאת מהגלות!',
  'הנה! שתיתי את כוסי! נשמה טובה ביתכם ❤️',
  'בקיבוץ גת יש נשמות יפות — ראיתי את זה כבר כמה אלפי שנים...',
  'מי שמסתיר את האפיקומן — אני יודע איפה הוא! 👀',
  'לשנה הבאה בירושלים! אבל השנה — ממש שמח שאני כאן בגת! 🎉',
  'שמעו בני ישראל — שירו, שמחו, ואכלו היטב! 🎶',
  'עברתי כמה בתים — בכולם ריח טוב מהמטבח! 🍖',
  'הכוס שלי מתמלאת לאט לאט... מישהו שם לב? 😏',
]

const MOVE_MS   = 8_000    // every 8s move to next house — always in motion
const MSG_EVERY = 4        // show message every 4 stops

export default function ElijahMap() {
  const [wpIdx, setWpIdx]           = useState(0)
  const [message, setMessage]       = useState<string | null>(null)
  const [msgVisible, setMsgVisible] = useState(false)
  const stopCount = useRef(0)
  const usedMsgs  = useRef<Set<number>>(new Set())

  useEffect(() => {
    const move = setInterval(() => {
      setWpIdx(prev => {
        const next = (prev + 1) % WAYPOINTS.length
        stopCount.current += 1

        if (stopCount.current % MSG_EVERY === 0) {
          // Pick a message not recently used
          let idx: number
          do { idx = Math.floor(Math.random() * MESSAGES.length) }
          while (usedMsgs.current.has(idx) && usedMsgs.current.size < MESSAGES.length)
          usedMsgs.current.add(idx)
          if (usedMsgs.current.size >= MESSAGES.length) usedMsgs.current.clear()

          setMessage(MESSAGES[idx])
          setMsgVisible(true)
          setTimeout(() => {
            setMsgVisible(false)
            setTimeout(() => setMessage(null), 400)
          }, 5000)
        }

        return next
      })
    }, MOVE_MS)

    return () => clearInterval(move)
  }, [])

  const current = WAYPOINTS[wpIdx]
  const next    = WAYPOINTS[(wpIdx + 1) % WAYPOINTS.length]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 16, overflow: 'hidden' }}>
      {/* Map */}
      <div style={{ height: 420, width: '100%', position: 'relative' }}>
        <MapComponent
          waypoints={WAYPOINTS}
          currentIdx={wpIdx}
          message={msgVisible ? message : null}
        />
      </div>

      {/* Wolt-style status card */}
      <div style={{
        background: 'var(--glass-bg)',
        borderTop: '1px solid var(--glass-border)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--wine), var(--wine-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', flexShrink: 0,
          boxShadow: '0 2px 12px rgba(139,38,53,0.3)',
        }}>
          🧙‍♂️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem', color: 'var(--gold)' }}>
            אליהו הנביא
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            מחלק ברכות לליל הסדר
          </p>
        </div>
        <div style={{ textAlign: 'left', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22c55e', display: 'inline-block',
              animation: 'liveDotPulse 1.5s ease-out infinite',
            }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a' }}>בדרך</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            → {next.name}
          </p>
        </div>
      </div>
    </div>
  )
}
