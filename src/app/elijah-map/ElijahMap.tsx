'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from 'react'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

export interface Waypoint {
  name: string
  pos: [number, number]
}

export const WAYPOINTS: Waypoint[] = [
  { name: 'חדר אוכל',     pos: [31.6145, 34.7748] },
  { name: 'בית ילדים',    pos: [31.6138, 34.7758] },
  { name: 'מגרש ספורט',  pos: [31.6128, 34.7764] },
  { name: 'גן הקיבוץ',   pos: [31.6153, 34.7738] },
  { name: 'ספרייה',       pos: [31.6162, 34.7746] },
  { name: 'בריכה',        pos: [31.6123, 34.7752] },
  { name: 'בית תרבות',   pos: [31.6140, 34.7736] },
  { name: 'שיכון א׳',    pos: [31.6156, 34.7762] },
  { name: 'שיכון ב׳',    pos: [31.6118, 34.7740] },
  { name: 'מחסן',         pos: [31.6131, 34.7770] },
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

const MOVE_MS   = 18_000   // every 18s move to next house
const MSG_EVERY = 3        // show message every 3 stops

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
