'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from 'react'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

export interface Waypoint {
  name: string
  pos: [number, number]
}

// Kibbutz Gat — מועצה אזורית יואב (31.70°N, 34.85°E)
export const WAYPOINTS: Waypoint[] = [
  { name: 'חדר אוכל',         pos: [31.7015, 34.8500] },
  { name: 'בית ילדים א׳',     pos: [31.7021, 34.8508] },
  { name: 'בית ילדים ב׳',     pos: [31.7026, 34.8494] },
  { name: 'מגרש ספורט',       pos: [31.7007, 34.8513] },
  { name: 'גן הקיבוץ',        pos: [31.7031, 34.8503] },
  { name: 'ספרייה',            pos: [31.7011, 34.8489] },
  { name: 'בריכה',             pos: [31.6999, 34.8505] },
  { name: 'בית תרבות',        pos: [31.7018, 34.8494] },
  { name: 'שיכון א׳',         pos: [31.7023, 34.8512] },
  { name: 'שיכון ב׳',         pos: [31.7004, 34.8497] },
  { name: 'לול',               pos: [31.6995, 34.8516] },
  { name: 'מחסן',              pos: [31.7029, 34.8481] },
  { name: 'בוסתן',             pos: [31.7036, 34.8511] },
  { name: 'מרפאה',             pos: [31.7009, 34.8521] },
  { name: 'שער הכניסה',       pos: [31.6991, 34.8487] },
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
